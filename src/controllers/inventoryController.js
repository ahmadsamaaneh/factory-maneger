const inventoryService = require('../services/inventoryService');

async function createMaterial(req, res, next) {
  try {
    const material = await inventoryService.createMaterial(req.body, req.factoryId);
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
}

async function listMaterials(req, res, next) {
  try {
    const materials = await inventoryService.listMaterials(req.query, req.factoryId);
    res.json({ success: true, data: materials });
  } catch (err) {
    next(err);
  }
}

async function getMaterialById(req, res, next) {
  try {
    const material = await inventoryService.getMaterialById(req.params.id, req.factoryId);
    res.json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
}

async function updateMaterial(req, res, next) {
  try {
    const material = await inventoryService.updateMaterial(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
}

async function deleteMaterial(req, res, next) {
  try {
    await inventoryService.deleteMaterial(req.params.id, req.factoryId);
    res.json({ success: true, message: 'Raw material deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function adjustQuantity(req, res, next) {
  try {
    const { delta, operation } = req.body;
    const material = await inventoryService.adjustQuantity(req.params.id, delta, operation, req.factoryId);
    res.json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
}

module.exports = { createMaterial, listMaterials, getMaterialById, updateMaterial, deleteMaterial, adjustQuantity };
