const hrService = require('../services/hrService');

async function listDepartments(req, res, next) {
  try {
    const data = await hrService.listDepartments(req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function createDepartment(req, res, next) {
  try {
    const row = await hrService.createDepartment(req.body, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const row = await hrService.updateDepartment(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    await hrService.deleteDepartment(req.params.id, req.factoryId);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (e) {
    next(e);
  }
}

async function listEmployees(req, res, next) {
  try {
    const data = await hrService.listEmployees(req.query, req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function getEmployee(req, res, next) {
  try {
    const data = await hrService.getEmployeeById(req.params.id, req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function createEmployee(req, res, next) {
  try {
    const row = await hrService.createEmployee(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const row = await hrService.updateEmployee(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function terminateEmployee(req, res, next) {
  try {
    const row = await hrService.terminateEmployee(req.params.id, req.factoryId);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function getStats(req, res, next) {
  try {
    const data = await hrService.getHrStats(req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsertAttendance(req, res, next) {
  try {
    const data = await hrService.upsertAttendance(req.params.employeeId, req.body, req.factoryId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function getDailyAttendance(req, res, next) {
  try {
    const data = await hrService.getDailyAttendance(req.factoryId, req.query.work_date);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function getMonthlyPayrollReport(req, res, next) {
  try {
    const data = await hrService.getMonthlyPayrollReport(req.factoryId, req.query.month);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function getEmployeeMonthlyPayrollDetail(req, res, next) {
  try {
    const data = await hrService.getEmployeeMonthlyPayrollDetail(
      req.factoryId,
      req.params.employeeId,
      req.query.month
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function lockAttendance(req, res, next) {
  try {
    const data = await hrService.setAttendanceLock(req.factoryId, req.body.work_date, true, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function unlockAttendance(req, res, next) {
  try {
    const data = await hrService.setAttendanceLock(req.factoryId, req.body.work_date, false, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  upsertAttendance,
  getDailyAttendance,
  getMonthlyPayrollReport,
  getEmployeeMonthlyPayrollDetail,
  lockAttendance,
  unlockAttendance,
  getStats,
};
