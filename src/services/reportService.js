const { sequelize, RawMaterial, Product, ProductionBatch, SalesOrder, SalesOrderItem } = require('../models');
const { Op } = require('sequelize');

async function inventoryReport(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  const materials = await RawMaterial.findAll({ where, order: [['name', 'ASC']] });

  const totalValue = materials.reduce(
    (sum, m) => sum + parseFloat(m.quantity) * parseFloat(m.cost_per_unit),
    0
  );

  const lowStock = materials.filter(
    (m) => m.reorder_level > 0 && parseFloat(m.quantity) <= parseFloat(m.reorder_level)
  );

  return {
    total_materials: materials.length,
    total_inventory_value: totalValue,
    low_stock_count: lowStock.length,
    materials,
    low_stock_items: lowStock,
  };
}

async function productionReport({ from, to } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) where.created_at[Op.lte] = new Date(to);
  }

  const batches = await ProductionBatch.findAll({
    where,
    include: [{ association: 'recipe' }],
    order: [['created_at', 'DESC']],
  });

  const totalBatches = batches.length;
  const totalCost = batches.reduce((sum, b) => sum + parseFloat(b.total_cost), 0);
  const totalRawCost = batches.reduce((sum, b) => sum + parseFloat(b.raw_materials_cost), 0);
  const totalProdCost = batches.reduce((sum, b) => sum + parseFloat(b.production_cost), 0);

  return {
    total_batches: totalBatches,
    total_cost: totalCost,
    total_raw_materials_cost: totalRawCost,
    total_production_cost: totalProdCost,
    batches,
  };
}

async function salesReport({ from, to } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) where.created_at[Op.lte] = new Date(to);
  }

  const orders = await SalesOrder.findAll({
    where,
    include: [
      { association: 'customer' },
      { association: 'items', include: [{ association: 'product' }] },
    ],
    order: [['created_at', 'DESC']],
  });

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  return {
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    orders,
  };
}

async function profitReport({ from, to } = {}, factoryId) {
  const dateFilter = {};
  if (factoryId) dateFilter.factory_id = factoryId;
  if (from || to) {
    dateFilter.created_at = {};
    if (from) dateFilter.created_at[Op.gte] = new Date(from);
    if (to) dateFilter.created_at[Op.lte] = new Date(to);
  }

  const [salesOrders, productionBatches] = await Promise.all([
    SalesOrder.findAll({
      where: { ...dateFilter, status: { [Op.notIn]: ['cancelled'] } },
      include: [{ association: 'items', include: [{ association: 'product' }] }],
    }),
    ProductionBatch.findAll({ where: dateFilter }),
  ]);

  const totalRevenue = salesOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  // COGS: sum of (cost * quantity) per sold item
  const totalCOGS = salesOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        const cost = parseFloat(item.product?.cost || 0);
        return itemSum + cost * parseFloat(item.quantity);
      }, 0)
    );
  }, 0);

  const totalProductionCost = productionBatches.reduce(
    (sum, b) => sum + parseFloat(b.total_cost),
    0
  );

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    total_revenue: totalRevenue,
    total_cogs: totalCOGS,
    gross_profit: grossProfit,
    gross_margin_percent: grossMargin.toFixed(2),
    total_production_cost: totalProductionCost,
    net_profit: grossProfit - totalProductionCost,
  };
}

module.exports = { inventoryReport, productionReport, salesReport, profitReport };
