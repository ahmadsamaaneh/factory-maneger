const reconciliationService = require('../services/cashVanReconciliationService');

async function openReconciliation(req, res, next) {
  try {
    const row = await reconciliationService.openReconciliation(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function closeReconciliation(req, res, next) {
  try {
    const row = await reconciliationService.closeReconciliation(
      req.params.id,
      req.body,
      req.user.id,
      req.factoryId
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function listReconciliations(req, res, next) {
  try {
    const rows = await reconciliationService.listReconciliations(req.query, req.factoryId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getReconciliationById(req, res, next) {
  try {
    const row = await reconciliationService.getReconciliationById(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  openReconciliation,
  closeReconciliation,
  listReconciliations,
  getReconciliationById,
};
