const reportService = require('../services/reportService');

async function inventoryReport(req, res, next) {
  try {
    const report = await reportService.inventoryReport(req.factoryId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function productionReport(req, res, next) {
  try {
    const report = await reportService.productionReport(req.query, req.factoryId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function salesReport(req, res, next) {
  try {
    const report = await reportService.salesReport(req.query, req.factoryId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function profitReport(req, res, next) {
  try {
    const report = await reportService.profitReport(req.query, req.factoryId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function financeReport(req, res, next) {
  try {
    const report = await reportService.financeReport(req.query, req.factoryId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function updateFactoryCapital(req, res, next) {
  try {
    const data = await reportService.updateFactoryCapital(req.factoryId, req.body.capital_amount);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  inventoryReport,
  productionReport,
  salesReport,
  profitReport,
  financeReport,
  updateFactoryCapital,
};
