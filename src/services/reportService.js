const {
  sequelize,
  RawMaterial,
  Product,
  ProductionBatch,
  SalesOrder,
  SalesOrderItem,
  Factory,
  EmployeeAttendance,
} = require('../models');
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

async function financeReport({ from, to } = {}, factoryId) {
  const attendanceWhere = {};
  if (factoryId) attendanceWhere.factory_id = factoryId;
  if (from || to) {
    attendanceWhere.work_date = {};
    if (from) attendanceWhere.work_date[Op.gte] = from;
    if (to) attendanceWhere.work_date[Op.lte] = to;
  }

  const [inventory, production, sales, profit, factory] = await Promise.all([
    inventoryReport(factoryId),
    productionReport({ from, to }, factoryId),
    salesReport({ from, to }, factoryId),
    profitReport({ from, to }, factoryId),
    factoryId ? Factory.findByPk(factoryId) : null,
  ]);

  const attendanceRows = await EmployeeAttendance.findAll({
    where: attendanceWhere,
    include: [{ association: 'employee', attributes: ['salary_base', 'daily_work_hours'] }],
  });

  const capitalAmount = parseFloat(factory?.capital_amount || 0);
  const laborDailyWagesCost = attendanceRows.reduce((sum, row) => {
    const salaryBase = parseFloat(row.employee?.salary_base || 0);
    const dailyHours = Math.max(1, parseFloat(row.employee?.daily_work_hours || 8));
    const perMinute = salaryBase / 30 / (dailyHours * 60);
    const paidMinutes = Math.max(0, parseInt(row.paid_minutes || 0, 10));
    const overtimeAmount = parseFloat(row.overtime_amount || 0);
    return sum + paidMinutes * perMinute + overtimeAmount;
  }, 0);

  const totalCosts =
    parseFloat(profit.total_cogs || 0) +
    parseFloat(production.total_cost || 0) +
    laborDailyWagesCost;
  const adjustedNetProfit = parseFloat(profit.net_profit || 0) - laborDailyWagesCost;
  const adjustedGrossProfit = parseFloat(profit.gross_profit || 0) - laborDailyWagesCost;
  const adjustedRoiPercent = capitalAmount > 0 ? (adjustedNetProfit / capitalAmount) * 100 : null;

  return {
    capital_amount: capitalAmount,
    total_revenue: parseFloat(sales.total_revenue || 0),
    total_inventory_value: parseFloat(inventory.total_inventory_value || 0),
    total_production_cost: parseFloat(production.total_cost || 0),
    total_cogs: parseFloat(profit.total_cogs || 0),
    labor_daily_wages_cost: laborDailyWagesCost,
    total_costs: totalCosts,
    gross_profit: adjustedGrossProfit,
    net_profit: adjustedNetProfit,
    roi_percent: adjustedRoiPercent,
    capital_after_profit: capitalAmount + adjustedNetProfit,
    period: { from: from || null, to: to || null },
  };
}

async function updateFactoryCapital(factoryId, capitalAmount) {
  if (!factoryId) {
    const err = new Error('Factory context is required.');
    err.statusCode = 403;
    throw err;
  }
  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }
  await factory.update({ capital_amount: capitalAmount });
  return {
    id: factory.id,
    name: factory.name,
    capital_amount: parseFloat(factory.capital_amount || 0),
  };
}

module.exports = {
  inventoryReport,
  productionReport,
  salesReport,
  profitReport,
  financeReport,
  updateFactoryCapital,
};
