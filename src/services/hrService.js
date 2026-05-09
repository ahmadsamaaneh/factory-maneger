const { Op } = require('sequelize');
const { Department, Employee, EmployeeAttendance, AttendanceLock, User } = require('../models');

function assertFactory(factoryId) {
  if (!factoryId) {
    const err = new Error('Factory context is required for HR operations.');
    err.statusCode = 403;
    throw err;
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(workDate) {
  return String(workDate) > todayStr();
}

function isFriday(workDate) {
  const [y, m, d] = String(workDate).split('-').map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  return date.getDay() === 5;
}

// ── Departments ─────────────────────────────────────────────────────────────

async function listDepartments(factoryId) {
  assertFactory(factoryId);
  return Department.findAll({ where: { factory_id: factoryId }, order: [['name', 'ASC']] });
}

async function createDepartment(data, factoryId) {
  assertFactory(factoryId);
  return Department.create({ ...data, factory_id: factoryId });
}

async function updateDepartment(id, data, factoryId) {
  assertFactory(factoryId);
  const where = { id, factory_id: factoryId };
  const row = await Department.findOne({ where });
  if (!row) {
    const err = new Error('Department not found.');
    err.statusCode = 404;
    throw err;
  }
  await row.update(data);
  return row;
}

async function deleteDepartment(id, factoryId) {
  assertFactory(factoryId);
  const where = { id, factory_id: factoryId };
  const row = await Department.findOne({ where });
  if (!row) {
    const err = new Error('Department not found.');
    err.statusCode = 404;
    throw err;
  }
  const cnt = await Employee.count({ where: { department_id: id, factory_id: factoryId } });
  if (cnt > 0) {
    const err = new Error('Cannot delete department with assigned employees.');
    err.statusCode = 400;
    throw err;
  }
  await row.destroy();
}

// ── Employees ───────────────────────────────────────────────────────────────

async function listEmployees({ search, department_id, status } = {}, factoryId) {
  assertFactory(factoryId);
  const where = { factory_id: factoryId };
  if (department_id) where.department_id = department_id;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { employee_code: { [Op.iLike]: `%${search}%` } },
      { job_title: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return Employee.findAll({
    where,
    include: [{ association: 'department', attributes: ['id', 'name'] }],
    order: [['full_name', 'ASC']],
  });
}

async function getEmployeeById(id, factoryId) {
  assertFactory(factoryId);
  const where = { id, factory_id: factoryId };
  const row = await Employee.findOne({
    where,
    include: [
      { association: 'department', attributes: ['id', 'name', 'code'] },
      { association: 'linkedUser', attributes: ['id', 'name', 'email', 'role'] },
    ],
  });
  if (!row) {
    const err = new Error('Employee not found.');
    err.statusCode = 404;
    throw err;
  }
  return row;
}

async function createEmployee(data, userId, factoryId) {
  assertFactory(factoryId);
  if (data.department_id) {
    const dep = await Department.findOne({ where: { id: data.department_id, factory_id: factoryId } });
    if (!dep) {
      const err = new Error('Department not found in this factory.');
      err.statusCode = 400;
      throw err;
    }
  }
  const where = { factory_id: factoryId, employee_code: data.employee_code };
  const exists = await Employee.findOne({ where });
  if (exists) {
    const err = new Error('Employee code already exists in this factory.');
    err.statusCode = 409;
    throw err;
  }
  if (data.user_id) {
    const linkedUser = await User.findOne({ where: { id: data.user_id, factory_id: factoryId } });
    if (!linkedUser) {
      const err = new Error('Linked user not found in this factory.');
      err.statusCode = 400;
      throw err;
    }
    const alreadyLinked = await Employee.findOne({ where: { factory_id: factoryId, user_id: data.user_id } });
    if (alreadyLinked) {
      const err = new Error('This user is already linked to another employee.');
      err.statusCode = 409;
      throw err;
    }
  }
  return Employee.create({
    ...data,
    factory_id: factoryId,
    created_by: userId,
  });
}

async function updateEmployee(id, data, factoryId) {
  assertFactory(factoryId);
  const deptId = data.department_id;
  if (deptId != null && deptId !== '') {
    const dep = await Department.findOne({ where: { id: deptId, factory_id: factoryId } });
    if (!dep) {
      const err = new Error('Department not found in this factory.');
      err.statusCode = 400;
      throw err;
    }
  }
  const row = await getEmployeeById(id, factoryId);
  if (data.user_id != null && data.user_id !== '') {
    const linkedUser = await User.findOne({ where: { id: data.user_id, factory_id: factoryId } });
    if (!linkedUser) {
      const err = new Error('Linked user not found in this factory.');
      err.statusCode = 400;
      throw err;
    }
    const alreadyLinked = await Employee.findOne({
      where: { factory_id: factoryId, user_id: data.user_id, id: { [Op.ne]: id } },
    });
    if (alreadyLinked) {
      const err = new Error('This user is already linked to another employee.');
      err.statusCode = 409;
      throw err;
    }
  }
  if (data.employee_code && data.employee_code !== row.employee_code) {
    const exists = await Employee.findOne({
      where: { factory_id: factoryId, employee_code: data.employee_code, id: { [Op.ne]: id } },
    });
    if (exists) {
      const err = new Error('Employee code already exists in this factory.');
      err.statusCode = 409;
      throw err;
    }
  }
  await row.update(data);
  return getEmployeeById(id, factoryId);
}

async function terminateEmployee(id, factoryId) {
  const row = await getEmployeeById(id, factoryId);
  await row.update({ status: 'terminated' });
  return row;
}

function calcPerMinute(baseSalary, dailyHours) {
  const salary = parseFloat(baseSalary || 0);
  const hours = Math.max(1, parseFloat(dailyHours || 8));
  return salary / 30 / (hours * 60);
}

function calcDailyWage(baseSalary) {
  const salary = parseFloat(baseSalary || 0);
  return salary / 30;
}

async function upsertAttendance(employeeId, data, factoryId) {
  assertFactory(factoryId);
  const employee = await getEmployeeById(employeeId, factoryId);
  const workDate = data.work_date || todayStr();
  if (isFutureDate(workDate)) {
    const err = new Error('Cannot edit attendance for future dates.');
    err.statusCode = 400;
    err.code = 'FUTURE_DATE_NOT_ALLOWED';
    throw err;
  }
  const lock = await AttendanceLock.findOne({ where: { factory_id: factoryId, work_date: workDate } });
  if (lock?.is_locked) {
    const err = new Error('Attendance for this date is locked.');
    err.statusCode = 409;
    err.code = 'ATTENDANCE_LOCKED';
    throw err;
  }
  const status = data.status || 'present';
  const specialCase = Boolean(data.special_case);
  if (isFriday(workDate) && !specialCase && ['present', 'late', 'half_day'].includes(status)) {
    const err = new Error('Friday is a holiday. Mark as special case for attendance.');
    err.statusCode = 400;
    err.code = 'FRIDAY_HOLIDAY';
    throw err;
  }
  const lateMinutes = Math.max(0, parseInt(data.late_minutes || 0, 10));
  const overtimeMinutes = Math.max(0, parseInt(data.overtime_minutes || 0, 10));

  const dailyMinutes = Math.round(parseFloat(employee.daily_work_hours || 8) * 60);
  let paidMinutes = dailyMinutes;

  if (status === 'absent') paidMinutes = 0;
  if (status === 'half_day') paidMinutes = Math.round(dailyMinutes / 2);
  if (status === 'leave') paidMinutes = dailyMinutes;
  if (status === 'sick_leave') {
    paidMinutes = employee.sick_leave_deductible ? 0 : dailyMinutes;
  }

  if (employee.late_deduction_enabled && ['present', 'late', 'half_day'].includes(status)) {
    paidMinutes = Math.max(0, paidMinutes - lateMinutes);
  }

  const perMinute = calcPerMinute(employee.salary_base, employee.daily_work_hours);
  const dailyWage = calcDailyWage(employee.salary_base);
  const fridaySpecial = isFriday(workDate) && specialCase;
  const fridayFullShiftBonus = fridaySpecial && status === 'present' ? dailyWage : 0;

  // Friday special attendance should not apply any deduction rules.
  const disableDeductions = fridaySpecial;
  const absentMinutes = Math.max(0, dailyMinutes - paidMinutes);
  const deductionAmount = (
    disableDeductions ? 0 : (employee.absent_deduction_enabled ? absentMinutes : 0) * perMinute
  ).toFixed(4);
  const overtimeAmount = (
    (employee.overtime_enabled ? overtimeMinutes : 0) * perMinute + fridayFullShiftBonus
  ).toFixed(4);

  const payload = {
    factory_id: factoryId,
    employee_id: employee.id,
    work_date: workDate,
    check_in_at: data.check_in_at || null,
    check_out_at: data.check_out_at || null,
    late_minutes: lateMinutes,
    overtime_minutes: overtimeMinutes,
    paid_minutes: paidMinutes,
    deduction_amount: deductionAmount,
    overtime_amount: overtimeAmount,
    friday_bonus_amount: fridayFullShiftBonus.toFixed(4),
    special_case: specialCase,
    status,
    notes: data.notes || null,
  };

  const existing = await EmployeeAttendance.findOne({
    where: { employee_id: employee.id, work_date: workDate },
  });

  if (existing) {
    await existing.update(payload);
    return existing;
  }
  return EmployeeAttendance.create(payload);
}

async function getDailyAttendance(factoryId, workDate = todayStr()) {
  assertFactory(factoryId);
  const employees = await Employee.findAll({
    where: {
      factory_id: factoryId,
      status: { [Op.in]: ['active', 'on_leave'] },
    },
    include: [{ association: 'department', attributes: ['id', 'name'] }],
    order: [['full_name', 'ASC']],
  });

  const rows = await EmployeeAttendance.findAll({
    where: { factory_id: factoryId, work_date: workDate },
  });
  const lock = await AttendanceLock.findOne({ where: { factory_id: factoryId, work_date: workDate } });
  const byEmployee = new Map(rows.map((r) => [r.employee_id, r]));

  const items = employees.map((emp) => {
    const row = byEmployee.get(emp.id);
    const fridayDefaultStatus = isFriday(workDate) ? 'leave' : 'present';
    return {
      employee_id: emp.id,
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      department: emp.department ? { id: emp.department.id, name: emp.department.name } : null,
      daily_work_hours: emp.daily_work_hours,
      status: row?.status || fridayDefaultStatus,
      late_minutes: row?.late_minutes || 0,
      overtime_minutes: row?.overtime_minutes || 0,
      deduction_amount: row?.deduction_amount || 0,
      overtime_amount: row?.overtime_amount || 0,
      friday_bonus_amount: row?.friday_bonus_amount || 0,
      special_case: Boolean(row?.special_case),
      paid_minutes: row?.paid_minutes ?? Math.round((parseFloat(emp.daily_work_hours || 8)) * 60),
      notes: row?.notes || '',
    };
  });
  return {
    work_date: workDate,
    is_locked: Boolean(lock?.is_locked),
    locked_at: lock?.locked_at || null,
    locked_by: lock?.locked_by || null,
    items,
  };
}

async function setAttendanceLock(factoryId, workDate, isLocked, userId) {
  assertFactory(factoryId);
  const day = workDate || todayStr();
  if (isFutureDate(day)) {
    const err = new Error('Cannot lock or unlock future attendance dates.');
    err.statusCode = 400;
    err.code = 'FUTURE_DATE_NOT_ALLOWED';
    throw err;
  }
  const [lock] = await AttendanceLock.findOrCreate({
    where: { factory_id: factoryId, work_date: day },
    defaults: {
      factory_id: factoryId,
      work_date: day,
      is_locked: false,
    },
  });
  await lock.update({
    is_locked: Boolean(isLocked),
    locked_by: isLocked ? userId : null,
    locked_at: isLocked ? new Date() : null,
  });
  return lock;
}

function monthRange(month) {
  const input = month || todayStr().slice(0, 7);
  const [y, m] = input.split('-').map((x) => parseInt(x, 10));
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(y, m, 0));
  const end = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { month: input, start, end };
}

async function getMonthlyPayrollReport(factoryId, month) {
  assertFactory(factoryId);
  const { month: selectedMonth, start, end } = monthRange(month);
  const employees = await Employee.findAll({
    where: {
      factory_id: factoryId,
      status: { [Op.in]: ['active', 'on_leave'] },
    },
    include: [{ association: 'department', attributes: ['id', 'name'] }],
    order: [['full_name', 'ASC']],
  });

  const attendanceRows = await EmployeeAttendance.findAll({
    where: {
      factory_id: factoryId,
      work_date: { [Op.between]: [start, end] },
    },
  });

  const byEmployee = new Map();
  for (const row of attendanceRows) {
    const key = row.employee_id;
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        attendance_days: 0,
        absent_days: 0,
        sick_leave_days: 0,
        late_minutes: 0,
        overtime_minutes: 0,
        deductions: 0,
        overtime_pay: 0,
        friday_bonus: 0,
      });
    }
    const acc = byEmployee.get(key);
    acc.attendance_days += 1;
    if (row.status === 'absent') acc.absent_days += 1;
    if (row.status === 'sick_leave') acc.sick_leave_days += 1;
    acc.late_minutes += parseInt(row.late_minutes || 0, 10);
    acc.overtime_minutes += parseInt(row.overtime_minutes || 0, 10);
    acc.deductions += parseFloat(row.deduction_amount || 0);
    const fridayBonus = parseFloat(row.friday_bonus_amount || 0);
    acc.friday_bonus += fridayBonus;
    acc.overtime_pay += Math.max(0, parseFloat(row.overtime_amount || 0) - fridayBonus);
  }

  const items = employees.map((emp) => {
    const acc = byEmployee.get(emp.id) || {
      attendance_days: 0,
      absent_days: 0,
      sick_leave_days: 0,
      late_minutes: 0,
      overtime_minutes: 0,
      deductions: 0,
      overtime_pay: 0,
      friday_bonus: 0,
    };
    const baseSalary = parseFloat(emp.salary_base || 0);
    const netSalary = baseSalary - acc.deductions + acc.overtime_pay + acc.friday_bonus;
    return {
      employee_id: emp.id,
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      department: emp.department ? { id: emp.department.id, name: emp.department.name } : null,
      base_salary: baseSalary,
      ...acc,
      net_salary: netSalary,
    };
  });

  const totals = items.reduce(
    (s, r) => ({
      base_salary: s.base_salary + r.base_salary,
      deductions: s.deductions + r.deductions,
      overtime_pay: s.overtime_pay + r.overtime_pay,
      friday_bonus: s.friday_bonus + r.friday_bonus,
      net_salary: s.net_salary + r.net_salary,
    }),
    { base_salary: 0, deductions: 0, overtime_pay: 0, friday_bonus: 0, net_salary: 0 }
  );

  return { month: selectedMonth, period: { start, end }, totals, items };
}

async function getEmployeeMonthlyPayrollDetail(factoryId, employeeId, month) {
  assertFactory(factoryId);
  const employee = await getEmployeeById(employeeId, factoryId);
  const { month: selectedMonth, start, end } = monthRange(month);

  const rows = await EmployeeAttendance.findAll({
    where: {
      factory_id: factoryId,
      employee_id: employee.id,
      work_date: { [Op.between]: [start, end] },
    },
    order: [['work_date', 'ASC']],
  });

  const summary = rows.reduce(
    (s, r) => {
      s.attendance_days += 1;
      if (r.status === 'absent') s.absent_days += 1;
      if (r.status === 'sick_leave') s.sick_leave_days += 1;
      s.late_minutes += parseInt(r.late_minutes || 0, 10);
      s.overtime_minutes += parseInt(r.overtime_minutes || 0, 10);
      s.deductions += parseFloat(r.deduction_amount || 0);
      s.friday_bonus += parseFloat(r.friday_bonus_amount || 0);
      s.overtime_pay += Math.max(
        0,
        parseFloat(r.overtime_amount || 0) - parseFloat(r.friday_bonus_amount || 0)
      );
      return s;
    },
    {
      attendance_days: 0,
      absent_days: 0,
      sick_leave_days: 0,
      late_minutes: 0,
      overtime_minutes: 0,
      deductions: 0,
      overtime_pay: 0,
      friday_bonus: 0,
    }
  );

  const baseSalary = parseFloat(employee.salary_base || 0);
  const netSalary = baseSalary - summary.deductions + summary.overtime_pay + summary.friday_bonus;

  return {
    month: selectedMonth,
    period: { start, end },
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      job_title: employee.job_title,
      department: employee.department ? { id: employee.department.id, name: employee.department.name } : null,
      daily_work_hours: employee.daily_work_hours,
      salary_base: baseSalary,
    },
    summary: { ...summary, net_salary: netSalary },
    days: rows.map((r) => ({
      work_date: r.work_date,
      status: r.status,
      late_minutes: parseInt(r.late_minutes || 0, 10),
      overtime_minutes: parseInt(r.overtime_minutes || 0, 10),
      deduction_amount: parseFloat(r.deduction_amount || 0),
      overtime_amount: parseFloat(r.overtime_amount || 0),
      friday_bonus_amount: parseFloat(r.friday_bonus_amount || 0),
      special_case: Boolean(r.special_case),
      notes: r.notes || '',
    })),
  };
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

async function getHrStats(factoryId) {
  assertFactory(factoryId);
  const day = todayStr();
  const base = { factory_id: factoryId };

  const total_employees = await Employee.count({ where: base });
  const active_employees = await Employee.count({ where: { ...base, status: 'active' } });

  const presentRows = await EmployeeAttendance.count({
    where: {
      ...base,
      work_date: day,
      status: { [Op.in]: ['present', 'late', 'half_day'] },
    },
  });

  const late_today = await EmployeeAttendance.count({
    where: { ...base, work_date: day, late_minutes: { [Op.gt]: 0 } },
  });

  const absent_today = Math.max(0, active_employees - presentRows);

  const salaryRows = await Employee.findAll({
    where: { ...base, status: { [Op.in]: ['active', 'on_leave'] } },
    attributes: ['salary_base'],
  });
  const salary_due_estimate = salaryRows.reduce((s, e) => s + parseFloat(e.salary_base || 0), 0);

  return {
    total_employees,
    active_employees,
    present_today: presentRows,
    absent_today,
    late_today,
    salary_due_estimate,
    notifications: 0,
    date: day,
  };
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  upsertAttendance,
  getDailyAttendance,
  setAttendanceLock,
  getMonthlyPayrollReport,
  getEmployeeMonthlyPayrollDetail,
  getHrStats,
};
