const {
  sequelize,
  Product,
  CashVanVehicle,
  CashVanStock,
  CashVanSale,
  CashVanPayment,
  CashVanReconciliation,
  CashVanReconciliationItem,
} = require('../models');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function businessDateFromTimestamp(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * التحميل والبيع مسموحان فقط عند وجود يومية (تسوية) مفتوحة لنفس السيارة ونفس تاريخ العمل.
 */
async function assertOpenDailySession({ vehicleId, factoryId, businessDate, transaction }) {
  const openRow = await CashVanReconciliation.findOne({
    where: {
      factory_id: factoryId,
      vehicle_id: vehicleId,
      business_date: businessDate,
      status: 'open',
    },
    transaction,
  });
  if (openRow) return openRow;

  const exists = await CashVanReconciliation.findOne({
    where: {
      factory_id: factoryId,
      vehicle_id: vehicleId,
      business_date: businessDate,
    },
    transaction,
  });
  const err = new Error(
    exists
      ? 'اليومية مقفلة لهذه السيارة في هذا التاريخ. لا يمكن تنفيذ تحميل أو بيع قبل فتح يومية جديدة.'
      : 'يجب فتح يومية لهذه السيارة لهذا اليوم من «جرد وإقفال الكاش فان» قبل التحميل أو البيع.'
  );
  err.statusCode = 403;
  err.code = exists ? 'DAILY_SESSION_CLOSED' : 'DAILY_SESSION_REQUIRED';
  throw err;
}

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

async function openReconciliation(data, userId, factoryId) {
  const { vehicle_id, business_date } = data;
  const date = business_date || todayStr();
  return sequelize.transaction(async (t) => {
    const vehicle = await getVehicleOrFail(vehicle_id, factoryId, t);
    const existing = await CashVanReconciliation.findOne({
      where: { factory_id: vehicle.factory_id, vehicle_id: vehicle.id, business_date: date },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existing) return existing;
    return CashVanReconciliation.create(
      {
        factory_id: vehicle.factory_id,
        vehicle_id: vehicle.id,
        business_date: date,
        status: 'open',
        opened_by: userId,
        opened_at: new Date(),
      },
      { transaction: t }
    );
  });
}

async function closeReconciliation(id, data, userId, factoryId) {
  const { cash_collected = 0, notes, items = [] } = data;
  return sequelize.transaction(async (t) => {
    const where = { id };
    if (factoryId) where.factory_id = factoryId;
    const reconciliation = await CashVanReconciliation.findOne({
      where,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!reconciliation) {
      const err = new Error('Reconciliation record not found.');
      err.statusCode = 404;
      throw err;
    }
    if (reconciliation.status === 'closed') {
      const err = new Error('Reconciliation already closed.');
      err.statusCode = 409;
      throw err;
    }

    await CashVanReconciliationItem.destroy({ where: { reconciliation_id: reconciliation.id }, transaction: t });

    let varianceValue = 0;
    for (const item of items) {
      const productWhere = { id: item.product_id };
      if (factoryId) productWhere.factory_id = factoryId;
      const product = await Product.findOne({ where: productWhere, transaction: t });
      if (!product) {
        const err = new Error(`Product ID "${item.product_id}" not found.`);
        err.statusCode = 404;
        throw err;
      }

      const stock = await CashVanStock.findOne({
        where: {
          factory_id: reconciliation.factory_id,
          vehicle_id: reconciliation.vehicle_id,
          product_id: product.id,
        },
        transaction: t,
      });
      const systemQty = parseFloat(stock?.quantity || 0);
      const physicalQty = parseFloat(item.physical_qty || 0);
      const varianceQty = physicalQty - systemQty;
      const itemVarianceValue = varianceQty * parseFloat(product.cost || 0);
      varianceValue += itemVarianceValue;

      await CashVanReconciliationItem.create(
        {
          reconciliation_id: reconciliation.id,
          product_id: product.id,
          system_qty: systemQty,
          physical_qty: physicalQty,
          variance_qty: varianceQty,
          variance_value: itemVarianceValue,
        },
        { transaction: t }
      );
    }

    const paymentsAgg = await CashVanPayment.sum('amount', {
      where: {
        factory_id: reconciliation.factory_id,
        paid_at: sequelize.where(
          sequelize.fn('date', sequelize.col('paid_at')),
          reconciliation.business_date
        ),
      },
      transaction: t,
    });

    const salesAgg = await CashVanSale.sum('total_amount', {
      where: {
        factory_id: reconciliation.factory_id,
        vehicle_id: reconciliation.vehicle_id,
        issued_at: sequelize.where(
          sequelize.fn('date', sequelize.col('issued_at')),
          reconciliation.business_date
        ),
      },
      transaction: t,
    });

    await reconciliation.update(
      {
        status: 'closed',
        cash_collected: parseFloat(cash_collected || 0),
        variance_value: varianceValue,
        notes: notes || null,
        closed_by: userId,
        closed_at: new Date(),
      },
      { transaction: t }
    );

    return {
      ...(await getReconciliationById(reconciliation.id, factoryId, t)).toJSON(),
      summary: {
        expected_cash_from_sales: parseFloat(salesAgg || 0),
        posted_collections: parseFloat(paymentsAgg || 0),
      },
    };
  });
}

async function getReconciliationById(id, factoryId, transaction = null) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const options = {
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'openedByUser', attributes: ['id', 'name'] },
      { association: 'closedByUser', attributes: ['id', 'name'] },
      { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
    ],
  };
  if (transaction) options.transaction = transaction;
  const row = await CashVanReconciliation.findOne(options);
  if (!row) {
    const err = new Error('Reconciliation not found.');
    err.statusCode = 404;
    throw err;
  }
  return row;
}

async function listReconciliations(query = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (query.vehicle_id) where.vehicle_id = query.vehicle_id;
  if (query.business_date) where.business_date = query.business_date;
  if (query.status) where.status = query.status;

  return CashVanReconciliation.findAll({
    where,
    include: [{ association: 'vehicle', attributes: ['id', 'code', 'plate_number'] }],
    order: [['business_date', 'DESC']],
  });
}

module.exports = {
  openReconciliation,
  closeReconciliation,
  getReconciliationById,
  listReconciliations,
  assertOpenDailySession,
  businessDateFromTimestamp,
};
