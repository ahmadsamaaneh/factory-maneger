const { sequelize, Customer, SalesOrder, SalesOrderItem, Product } = require('../models');
const { Op } = require('sequelize');

/** الطلب يخصم المخزون لكل حالة ما عدا «ملغي». الانتقال بين حالتين غير ملغيتين لا يغيّر المخزون. */
function orderHoldsStock(status) {
  return status !== 'cancelled';
}

/**
 * @param {Array} items — صفوف SalesOrderItem (product_id, quantity)
 * @param {boolean} deduct — true: خصم من المخزون، false: إرجاع للمخزون
 */
async function adjustStockForOrderItems(items, factoryId, transaction, deduct) {
  for (const item of items) {
    const productWhere = { id: item.product_id };
    if (factoryId) productWhere.factory_id = factoryId;
    const product = await Product.findOne({
      where: productWhere,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!product) {
      const err = new Error(`Product ID "${item.product_id}" not found.`);
      err.statusCode = 404;
      throw err;
    }
    const qty = parseFloat(item.quantity);
    let stock = parseFloat(product.stock_quantity);
    if (deduct) {
      if (stock < qty) {
        const err = new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Required: ${item.quantity}`
        );
        err.statusCode = 400;
        throw err;
      }
      stock -= qty;
    } else {
      stock += qty;
    }
    await product.update({ stock_quantity: stock }, { transaction });
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────

function normalizeCustomerFields(data) {
  const out = { ...data };
  if (Object.prototype.hasOwnProperty.call(data, 'email')) {
    out.email =
      data.email != null && String(data.email).trim() !== '' ? String(data.email).trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'is_active') && data.is_active !== undefined) {
    out.is_active = data.is_active === true || data.is_active === 'true';
  }
  return out;
}

async function createCustomer(data, factoryId) {
  return Customer.create({ ...normalizeCustomerFields(data), factory_id: factoryId });
}

async function listCustomers({ search, active_only } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  const onlyActive =
    active_only === true || active_only === 'true' || active_only === '1' || active_only === 1;
  if (onlyActive) where.is_active = true;
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  return Customer.findAll({ where, order: [['name', 'ASC']] });
}

async function getCustomerById(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const customer = await Customer.findOne({ where });
  if (!customer) {
    const err = new Error('Customer not found.');
    err.statusCode = 404;
    throw err;
  }
  return customer;
}

async function updateCustomer(id, data, factoryId) {
  const customer = await getCustomerById(id, factoryId);
  await customer.update(normalizeCustomerFields({ ...data }));
  return customer;
}

async function deleteCustomer(id, factoryId) {
  const customer = await getCustomerById(id, factoryId);
  await customer.update({ is_active: false });
}

// ── Orders ────────────────────────────────────────────────────────────────────

async function createOrder(data, userId, factoryId) {
  const { customer_id, items, discount = 0, notes, status = 'pending' } = data;
  const orderStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)
    ? status
    : 'pending';

  return sequelize.transaction(async (t) => {
    const customerWhere = { id: customer_id };
    if (factoryId) customerWhere.factory_id = factoryId;
    const customer = await Customer.findOne({ where: customerWhere, transaction: t });
    if (!customer || !customer.is_active) {
      const err = new Error('Customer not found or inactive.');
      err.statusCode = 404;
      throw err;
    }

    let totalAmount = 0;
    const enrichedItems = [];
    const shouldHoldStock = orderHoldsStock(orderStatus);

    for (const item of items) {
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({ where: productWhere, transaction: t });
      if (!product) {
        const err = new Error(`Product ID "${item.product_id}" not found.`);
        err.statusCode = 404;
        throw err;
      }

      if (shouldHoldStock) {
        if (parseFloat(product.stock_quantity) < parseFloat(item.quantity)) {
          const err = new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`
          );
          err.statusCode = 400;
          throw err;
        }
      }

      const unitPrice = item.unit_price !== undefined ? item.unit_price : parseFloat(product.selling_price);
      const subtotal = unitPrice * parseFloat(item.quantity);
      totalAmount += subtotal;

      enrichedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });

      if (shouldHoldStock) {
        await product.update(
          { stock_quantity: parseFloat(product.stock_quantity) - parseFloat(item.quantity) },
          { transaction: t }
        );
      }
    }

    const orderNumber = `ORD-${Date.now()}`;
    const order = await SalesOrder.create(
      {
        order_number: orderNumber,
        customer_id,
        factory_id: factoryId,
        total_amount: totalAmount - parseFloat(discount),
        discount,
        status: orderStatus,
        notes,
        created_by: userId,
      },
      { transaction: t }
    );

    const itemRows = enrichedItems.map((i) => ({ ...i, sales_order_id: order.id }));
    await SalesOrderItem.bulkCreate(itemRows, { transaction: t });

    return getOrderById(order.id, t, factoryId);
  });
}

async function listOrders({ status, customer_id } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (status) where.status = status;
  if (customer_id) where.customer_id = customer_id;

  return SalesOrder.findAll({
    where,
    include: [
      { association: 'customer' },
      { association: 'items', include: [{ association: 'product' }] },
      { association: 'creator', attributes: ['id', 'name'] },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function getOrderById(id, transaction = null, factoryId) {
  const options = {
    where: factoryId ? { id, factory_id: factoryId } : { id },
    include: [
      { association: 'customer' },
      { association: 'items', include: [{ association: 'product' }] },
      { association: 'creator', attributes: ['id', 'name'] },
    ],
  };
  if (transaction) options.transaction = transaction;

  const order = await SalesOrder.findOne(options);
  if (!order) {
    const err = new Error('Sales order not found.');
    err.statusCode = 404;
    throw err;
  }
  return order;
}

async function updateOrderStatus(id, status, factoryId) {
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    const err = new Error('Invalid order status.');
    err.statusCode = 400;
    throw err;
  }

  const where = { id };
  if (factoryId) where.factory_id = factoryId;

  return sequelize.transaction(async (t) => {
    const order = await SalesOrder.findOne({
      where,
      include: [{ association: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) {
      const err = new Error('Sales order not found.');
      err.statusCode = 404;
      throw err;
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      return getOrderById(id, t, factoryId);
    }

    const wasHolding = orderHoldsStock(oldStatus);
    const willHold = orderHoldsStock(status);

    if (!wasHolding && willHold) {
      await adjustStockForOrderItems(order.items, factoryId, t, true);
    } else if (wasHolding && !willHold) {
      await adjustStockForOrderItems(order.items, factoryId, t, false);
    }

    await order.update({ status }, { transaction: t });
    return getOrderById(id, t, factoryId);
  });
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
};
