const svc = require('../services/operationalExpenseService');

async function create(req, res, next) {
  try {
    const row = await svc.createExpense(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const row = await svc.updateExpense(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const out = await svc.deleteExpense(req.params.id, req.factoryId);
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

async function getOne(req, res, next) {
  try {
    const row = await svc.getExpenseById(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const rows = await svc.listExpenses(req.query, req.factoryId);
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
}

async function dashboard(req, res, next) {
  try {
    const d = req.query.month ? new Date(req.query.month) : new Date();
    const data = await svc.getDashboardSummary(req.factoryId, d);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function alerts(req, res, next) {
  try {
    const data = await svc.getAlerts(req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function reportAggregate(req, res, next) {
  try {
    const data = await svc.reportAggregate(req.factoryId, req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function exportCsv(req, res, next) {
  try {
    const csv = await svc.exportCsvRows(req.factoryId, req.query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=operational-expenses.csv');
    res.send(csv);
  } catch (e) {
    next(e);
  }
}

async function listDepartments(req, res, next) {
  try {
    const data = await svc.listDepartments(req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function listEmployees(req, res, next) {
  try {
    const data = await svc.listEmployeesLite(req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsertBudget(req, res, next) {
  try {
    const row = await svc.upsertBudget(req.body, req.user.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function listBudgets(req, res, next) {
  try {
    const data = await svc.listBudgets(req.factoryId, req.query.period_month);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  create,
  update,
  remove,
  getOne,
  list,
  dashboard,
  alerts,
  reportAggregate,
  exportCsv,
  listDepartments,
  listEmployees,
  upsertBudget,
  listBudgets,
};
