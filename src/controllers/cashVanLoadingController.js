const loadingService = require('../services/cashVanLoadingService');

async function createLoad(req, res, next) {
  try {
    const row = await loadingService.createLoad(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listLoads(req, res, next) {
  try {
    const rows = await loadingService.listLoads(req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getLoadById(req, res, next) {
  try {
    const row = await loadingService.getLoadById(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function getVehicleStock(req, res, next) {
  try {
    const rows = await loadingService.getVehicleStock(req.params.vehicleId, req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createUnload(req, res, next) {
  try {
    const row = await loadingService.createUnload(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listUnloads(req, res, next) {
  try {
    const rows = await loadingService.listUnloads(req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getUnloadById(req, res, next) {
  try {
    const row = await loadingService.getUnloadById(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
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
