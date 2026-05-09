const {
  sequelize,
  Product,
  CashVanVehicle,
  CashVanLoad,
  CashVanLoadItem,
  CashVanUnload,
  CashVanUnloadItem,
  CashVanStock,
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

async function upsertVanStock({ factoryId, vehicleId, productId, quantityDelta, transaction }) {
  const [stock] = await CashVanStock.findOrCreate({
    where: { factory_id: factoryId, vehicle_id: vehicleId, product_id: productId },
    defaults: { factory_id: factoryId, vehicle_id: vehicleId, product_id: productId, quantity: 0 },
    transaction,
  });
  const nextQty = parseFloat(stock.quantity || 0) + parseFloat(quantityDelta || 0);
  await stock.update({ quantity: nextQty }, { transaction });
}

async function createLoad(data, userId, factoryId) {
  const { vehicle_id, loaded_at, notes, items } = data;
  return sequelize.transaction(async (t) => {
    const vehicle = await getVehicleOrFail(vehicle_id, factoryId, t);
    const businessDate = businessDateFromTimestamp(loaded_at);
    await assertOpenDailySession({
      vehicleId: vehicle.id,
      factoryId: vehicle.factory_id,
      businessDate,
      transaction: t,
    });

    let idx = 0;
    for (const item of items) {
      idx += 1;
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({
        where: productWhere,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) {
        const err = new Error(`Product not found for item #${idx}.`);
        err.statusCode = 404;
        throw err;
      }
      const qty = parseFloat(item.quantity || 0);
      if (parseFloat(product.stock_quantity || 0) < qty) {
        const err = new Error(`Insufficient main stock for "${product.name}".`);
        err.statusCode = 400;
        throw err;
      }
    }

    const load = await CashVanLoad.create(
      {
        factory_id: vehicle.factory_id,
        vehicle_id,
        load_number: `LOAD-${Date.now()}`,
        loaded_at: loaded_at || new Date(),
        status: 'confirmed',
        notes: notes || null,
        created_by: userId,
      },
      { transaction: t }
    );

    for (const item of items) {
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({
        where: productWhere,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const qty = parseFloat(item.quantity || 0);
      await CashVanLoadItem.create(
        {
          load_id: load.id,
          product_id: product.id,
          quantity: qty,
          unit_cost: parseFloat(product.cost || 0),
        },
        { transaction: t }
      );
      await product.update(
        { stock_quantity: parseFloat(product.stock_quantity || 0) - qty },
        { transaction: t }
      );
      await upsertVanStock({
        factoryId: vehicle.factory_id,
        vehicleId: vehicle.id,
        productId: product.id,
        quantityDelta: qty,
        transaction: t,
      });
    }

    return getLoadById(load.id, factoryId, t);
  });
}

async function createUnload(data, userId, factoryId) {
  const { vehicle_id, unloaded_at, notes, items } = data;
  const mergedQty = new Map();
  for (const item of items || []) {
    const pid = item.product_id;
    mergedQty.set(pid, (mergedQty.get(pid) || 0) + parseFloat(item.quantity || 0));
  }
  const mergedItems = [...mergedQty.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));

  return sequelize.transaction(async (t) => {
    const vehicle = await getVehicleOrFail(vehicle_id, factoryId, t);
    const businessDate = businessDateFromTimestamp(unloaded_at);
    await assertOpenDailySession({
      vehicleId: vehicle.id,
      factoryId: vehicle.factory_id,
      businessDate,
      transaction: t,
    });

    const normalized = [];
    let idx = 0;
    for (const item of mergedItems) {
      idx += 1;
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({
        where: productWhere,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) {
        const err = new Error(`Product not found for item #${idx}.`);
        err.statusCode = 404;
        throw err;
      }
      const qty = parseFloat(item.quantity || 0);
      const stockRow = await CashVanStock.findOne({
        where: {
          factory_id: vehicle.factory_id,
          vehicle_id: vehicle.id,
          product_id: product.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const available = parseFloat(stockRow?.quantity || 0);
      if (available < qty) {
        const err = new Error(`Insufficient stock on van for "${product.name}". Available: ${available}, requested: ${qty}.`);
        err.statusCode = 400;
        throw err;
      }
      normalized.push({ product, qty });
    }

    const unload = await CashVanUnload.create(
      {
        factory_id: vehicle.factory_id,
        vehicle_id,
        unload_number: `UNLOAD-${Date.now()}`,
        unloaded_at: unloaded_at || new Date(),
        status: 'confirmed',
        notes: notes || null,
        created_by: userId,
      },
      { transaction: t }
    );

    for (const row of normalized) {
      await CashVanUnloadItem.create(
        {
          unload_id: unload.id,
          product_id: row.product.id,
          quantity: row.qty,
          unit_cost: parseFloat(row.product.cost || 0),
        },
        { transaction: t }
      );
      await row.product.update(
        { stock_quantity: parseFloat(row.product.stock_quantity || 0) + row.qty },
        { transaction: t }
      );
      await upsertVanStock({
        factoryId: vehicle.factory_id,
        vehicleId: vehicle.id,
        productId: row.product.id,
        quantityDelta: -row.qty,
        transaction: t,
      });
    }

    return getUnloadById(unload.id, factoryId, t);
  });
}

async function listLoads(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return CashVanLoad.findAll({
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function listUnloads(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return CashVanUnload.findAll({
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function getLoadById(id, factoryId, transaction = null) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const options = {
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
  };
  if (transaction) options.transaction = transaction;
  const load = await CashVanLoad.findOne(options);
  if (!load) {
    const err = new Error('Load not found.');
    err.statusCode = 404;
    throw err;
  }
  return load;
}

async function getUnloadById(id, factoryId, transaction = null) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const options = {
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'creator', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
  };
  if (transaction) options.transaction = transaction;
  const row = await CashVanUnload.findOne(options);
  if (!row) {
    const err = new Error('Unload not found.');
    err.statusCode = 404;
    throw err;
  }
  return row;
}

async function getVehicleStock(vehicleId, factoryId) {
  await getVehicleOrFail(vehicleId, factoryId, null);
  const where = { vehicle_id: vehicleId };
  if (factoryId) where.factory_id = factoryId;
  return CashVanStock.findAll({
    where,
    include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'cost', 'selling_price'] }],
    order: [[{ model: Product, as: 'product' }, 'name', 'ASC']],
  });
}

module.exports = {
  createLoad,
  createUnload,
  listLoads,
  listUnloads,
  getLoadById,
  getUnloadById,
  getVehicleStock,
};
