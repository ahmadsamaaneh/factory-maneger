const purchaseService = require('../services/purchaseService');

async function createPurchase(req, res, next) {
  try {
    const result = await purchaseService.createPurchase(
      req.params.id,
      req.body,
      req.user?.id,
      req.factoryId
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function listPurchasesForMaterial(req, res, next) {
  try {
    const purchases = await purchaseService.listPurchases(
      { material_id: req.params.id, limit: req.query.limit },
      req.factoryId
    );
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
}

async function listAllPurchases(req, res, next) {
  try {
    const purchases = await purchaseService.listPurchases(req.query, req.factoryId);
    res.json({ success: true, data: purchases });
  } catch (err) { next(err); }
}

async function previewPurchase(req, res, next) {
  try {
    const preview = purchaseService.previewPurchase(req.body);
    res.json({ success: true, data: preview });
  } catch (err) { next(err); }
}

module.exports = { createPurchase, listPurchasesForMaterial, listAllPurchases, previewPurchase };
