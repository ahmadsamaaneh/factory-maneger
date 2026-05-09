const {
  sequelize,
  Product,
  Customer,
  CashVanVehicle,
  CashVanStock,
  CashVanSale,
  CashVanSaleItem,
  CashVanPayment,
} = require('../models');
const { assertOpenDailySession, businessDateFromTimestamp } = require('./cashVanReconciliationService');

async function getVehicleOrFail(vehicleId, factoryId, transaction) {
  const where = { id: vehicleId };
  if (factoryId) where.factory_id = factoryId;
  const vehicle = await CashVanVehicle.findOne({ where, transaction });
  if (!vehicle) {
    const err = new Error('Cash van vehicle not found.');
    err.statusCode = 404;
    throw err;
  }
  return vehicle;
}

async function createSale(data, userId, factoryId) {
  const {
    vehicle_id,
    customer_id,
    sale_type = 'cash',
    discount_amount = 0,
    tax_amount = 0,
    paid_amount = 0,
    payment_method = 'cash',
    issued_at,
    notes,
    items,
  } = data;

  return sequelize.transaction(async (t) => {
    const vehicle = await getVehicleOrFail(vehicle_id, factoryId, t);
    const businessDate = businessDateFromTimestamp(issued_at);
    await assertOpenDailySession({
      vehicleId: vehicle.id,
      factoryId: vehicle.factory_id,
      businessDate,
      transaction: t,
    });

    if (customer_id) {
      const customerWhere = { id: customer_id };
      if (factoryId) customerWhere.factory_id = factoryId;
      const customer = await Customer.findOne({ where: customerWhere, transaction: t });
      if (!customer || !customer.is_active) {
        const err = new Error('Customer not found or inactive.');
        err.statusCode = 404;
        throw err;
      }
    }

    const normalizedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({ where: productWhere, transaction: t });
      if (!product) {
        const err = new Error(`Product ID "${item.product_id}" not found.`);
        err.statusCode = 404;
        throw err;
      }

      const [vanStock] = await CashVanStock.findOrCreate({
        where: {
          factory_id: vehicle.factory_id,
          vehicle_id: vehicle.id,
          product_id: product.id,
        },
        defaults: {
          factory_id: vehicle.factory_id,
          vehicle_id: vehicle.id,
          product_id: product.id,
          quantity: 0,
        },
        transaction: t,
      });

      const qty = parseFloat(item.quantity || 0);
      const available = parseFloat(vanStock.quantity || 0);
      if (available < qty) {
        const err = new Error(`Insufficient van stock for "${product.name}".`);
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = item.unit_price != null ? parseFloat(item.unit_price) : parseFloat(product.selling_price || 0);
      const lineDiscount = parseFloat(item.discount_amount || 0);
      const lineTax = parseFloat(item.tax_amount || 0);
      const lineSubtotal = unitPrice * qty;
      const lineTotal = lineSubtotal - lineDiscount + lineTax;
      subtotal += lineSubtotal;

      normalizedItems.push({
        product_id: product.id,
        quantity: qty,
        unit_price: unitPrice,
        discount_amount: lineDiscount,
        tax_amount: lineTax,
        line_total: lineTotal,
        current_stock: available,
      });
    }

    const totalAmount = subtotal - parseFloat(discount_amount || 0) + parseFloat(tax_amount || 0);
    const sale = await CashVanSale.create(
      {
        factory_id: vehicle.factory_id,
        vehicle_id: vehicle.id,
        customer_id: customer_id || null,
        sale_number: `CVS-${Date.now()}`,
        sale_type,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount: totalAmount,
        issued_at: issued_at || new Date(),
        notes: notes || null,
        created_by: userId,
      },
      { transaction: t }
    );

    for (const row of normalizedItems) {
      await CashVanSaleItem.create(
        {
          sale_id: sale.id,
          product_id: row.product_id,
          quantity: row.quantity,
          unit_price: row.unit_price,
          discount_amount: row.discount_amount,
          tax_amount: row.tax_amount,
          line_total: row.line_total,
        },
        { transaction: t }
      );

      await CashVanStock.update(
        { quantity: row.current_stock - row.quantity },
        {
          where: {
            factory_id: vehicle.factory_id,
            vehicle_id: vehicle.id,
            product_id: row.product_id,
          },
          transaction: t,
        }
      );
    }

    const paid = Math.max(0, parseFloat(paid_amount || 0));
    if (paid > 0) {
      await CashVanPayment.create(
        {
          factory_id: vehicle.factory_id,
          sale_id: sale.id,
          method: payment_method,
          amount: paid,
          paid_at: issued_at || new Date(),
          created_by: userId,
        },
        { transaction: t }
      );
    }

    return getSaleById(sale.id, factoryId, t);
  });
}

async function listSales(query = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (query.vehicle_id) where.vehicle_id = query.vehicle_id;
  if (query.sale_type) where.sale_type = query.sale_type;
  return CashVanSale.findAll({
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'customer', attributes: ['id', 'name', 'phone'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
      { association: 'payments' },
    ],
    order: [['issued_at', 'DESC']],
  });
}

async function getSaleById(id, factoryId, transaction = null) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const options = {
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'customer', attributes: ['id', 'name', 'phone'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
      { association: 'payments' },
    ],
  };
  if (transaction) options.transaction = transaction;
  const sale = await CashVanSale.findOne(options);
  if (!sale) {
    const err = new Error('Cash van sale not found.');
    err.statusCode = 404;
    throw err;
  }
  return sale;
}

module.exports = {
  createSale,
  listSales,
  getSaleById,
};
