const salesService = require('../services/cashVanSalesService');

async function createSale(req, res, next) {
  try {
    const row = await salesService.createSale(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listSales(req, res, next) {
  try {
    const rows = await salesService.listSales(req.query, req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getSaleById(req, res, next) {
  try {
    const row = await salesService.getSaleById(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSale,
  listSales,
  getSaleById,
};
