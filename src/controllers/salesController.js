const salesService = require('../services/salesService');

// ── Customers ─────────────────────────────────────────────────────────────────

async function createCustomer(req, res, next) {
  try {
    const customer = await salesService.createCustomer(req.body, req.factoryId);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

async function listCustomers(req, res, next) {
  try {
    const customers = await salesService.listCustomers(req.query, req.factoryId);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const customer = await salesService.getCustomerById(req.params.id, req.factoryId);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const customer = await salesService.updateCustomer(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    await salesService.deleteCustomer(req.params.id, req.factoryId);
    res.json({ success: true, message: 'Customer deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

async function createOrder(req, res, next) {
  try {
    const order = await salesService.createOrder(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await salesService.listOrders(req.query, req.factoryId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await salesService.getOrderById(req.params.id, null, req.factoryId);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order = await salesService.updateOrderStatus(req.params.id, req.body.status, req.factoryId);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCustomer, listCustomers, getCustomerById, updateCustomer, deleteCustomer,
  createOrder, listOrders, getOrderById, updateOrderStatus,
};
