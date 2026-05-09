const { body, param, query } = require('express-validator');

const createDepartmentRules = [
  body('name').trim().notEmpty().withMessage('Department name is required.'),
  body('code').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
];

const updateDepartmentRules = [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('code').optional({ checkFalsy: true }).trim(),
  body('description').optional({ checkFalsy: true }).trim(),
];

const createEmployeeRules = [
  body('employee_code').trim().notEmpty().withMessage('employee_code is required.'),
  body('full_name').trim().notEmpty().withMessage('full_name is required.'),
  body('department_id').optional({ checkFalsy: true }).isUUID(),
  body('user_id').optional({ checkFalsy: true }).isUUID(),
  body('job_title').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('national_id').optional({ checkFalsy: true }).trim(),
  body('hire_date').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('status').optional().isIn(['active', 'on_leave', 'terminated']),
  body('salary_base').optional().isFloat({ min: 0 }),
  body('daily_work_hours').optional().isFloat({ min: 1, max: 24 }),
  body('late_deduction_enabled').optional().isBoolean(),
  body('overtime_enabled').optional().isBoolean(),
  body('absent_deduction_enabled').optional().isBoolean(),
  body('sick_leave_deductible').optional().isBoolean(),
  body('avatar_url').optional({ checkFalsy: true }).trim(),
  body('notes').optional({ checkFalsy: true }).trim(),
];

const updateEmployeeRules = [
  param('id').isUUID(),
  body('employee_code').optional().trim().notEmpty(),
  body('full_name').optional().trim().notEmpty(),
  body('department_id').optional({ nullable: true }).isUUID(),
  body('user_id').optional({ nullable: true }).isUUID(),
  body('job_title').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('national_id').optional({ checkFalsy: true }).trim(),
  body('hire_date').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('status').optional().isIn(['active', 'on_leave', 'terminated']),
  body('salary_base').optional().isFloat({ min: 0 }),
  body('daily_work_hours').optional().isFloat({ min: 1, max: 24 }),
  body('late_deduction_enabled').optional().isBoolean(),
  body('overtime_enabled').optional().isBoolean(),
  body('absent_deduction_enabled').optional().isBoolean(),
  body('sick_leave_deductible').optional().isBoolean(),
  body('avatar_url').optional({ checkFalsy: true }).trim(),
  body('notes').optional({ checkFalsy: true }).trim(),
];

const upsertAttendanceRules = [
  param('employeeId').isUUID(),
  body('work_date').optional({ checkFalsy: true }).isISO8601(),
  body('status').optional().isIn(['present', 'absent', 'late', 'half_day', 'leave', 'sick_leave']),
  body('check_in_at').optional({ checkFalsy: true }).isISO8601(),
  body('check_out_at').optional({ checkFalsy: true }).isISO8601(),
  body('late_minutes').optional().isInt({ min: 0 }),
  body('overtime_minutes').optional().isInt({ min: 0 }),
  body('special_case').optional().isBoolean(),
  body('notes').optional({ checkFalsy: true }).trim(),
];

const attendanceLockRules = [
  body('work_date').optional({ checkFalsy: true }).isISO8601(),
];

const employeeMonthlyPayrollDetailRules = [
  param('employeeId').isUUID(),
  query('month').optional({ checkFalsy: true }).matches(/^\d{4}-\d{2}$/),
];

module.exports = {
  createDepartmentRules,
  updateDepartmentRules,
  createEmployeeRules,
  updateEmployeeRules,
  upsertAttendanceRules,
  attendanceLockRules,
  employeeMonthlyPayrollDetailRules,
};
