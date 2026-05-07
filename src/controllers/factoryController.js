const factoryService = require('../services/factoryService');

async function createFactory(req, res, next) {
  try {
    const result = await factoryService.createFactory(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function listFactories(req, res, next) {
  try {
    const factories = await factoryService.listFactories(req.query);
    res.json({ success: true, data: factories });
  } catch (err) { next(err); }
}

async function getFactory(req, res, next) {
  try {
    const factory = await factoryService.getFactoryById(req.params.id);
    res.json({ success: true, data: factory });
  } catch (err) { next(err); }
}

async function updateSubscription(req, res, next) {
  try {
    const factory = await factoryService.updateSubscription(req.params.id, req.body);
    res.json({ success: true, data: factory });
  } catch (err) { next(err); }
}

async function deleteFactory(req, res, next) {
  try {
    await factoryService.deleteFactory(req.params.id);
    res.json({ success: true, message: 'Factory deactivated successfully.' });
  } catch (err) { next(err); }
}

async function getAdminStats(req, res, next) {
  try {
    const stats = await factoryService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}

async function getFactoryUsers(req, res, next) {
  try {
    const users = await factoryService.getFactoryUsers(req.params.id);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
}

module.exports = { createFactory, listFactories, getFactory, updateSubscription, deleteFactory, getAdminStats, getFactoryUsers };
