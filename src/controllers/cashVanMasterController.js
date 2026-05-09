const service = require('../services/cashVanMasterService');

async function createVehicle(req, res, next) {
  try {
    const row = await service.createVehicle(req.body, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listVehicles(req, res, next) {
  try {
    const rows = await service.listVehicles(req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createAssignment(req, res, next) {
  try {
    const row = await service.createAssignment(req.body, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const rows = await service.listAssignments(req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVehicle,
  listVehicles,
  createAssignment,
  listAssignments,
};
