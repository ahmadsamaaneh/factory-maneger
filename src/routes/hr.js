const router = require('express').Router();
const hrController = require('../controllers/hrController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const {
  createDepartmentRules,
  updateDepartmentRules,
  createEmployeeRules,
  updateEmployeeRules,
  upsertAttendanceRules,
  attendanceLockRules,
  employeeMonthlyPayrollDetailRules,
} = require('../validations/hrValidation');

/** صاحب المصنع فقط في المرحلة الأولى (يمكن توسيع الأدوار لاحقاً: hr_manager, …) */
const HR = ['factory_owner', 'hr_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.get('/stats', authorize(...HR), hrController.getStats);
router.get('/attendance/daily', authorize(...HR), hrController.getDailyAttendance);
router.post('/attendance/lock', authorize(...HR), attendanceLockRules, validate, hrController.lockAttendance);
router.post('/attendance/unlock', authorize(...HR), attendanceLockRules, validate, hrController.unlockAttendance);
router.get('/payroll/monthly', authorize(...HR), hrController.getMonthlyPayrollReport);
router.get(
  '/payroll/monthly/:employeeId',
  authorize(...HR),
  employeeMonthlyPayrollDetailRules,
  validate,
  hrController.getEmployeeMonthlyPayrollDetail
);

router.get('/departments', authorize(...HR), hrController.listDepartments);
router.post('/departments', authorize(...HR), createDepartmentRules, validate, hrController.createDepartment);
router.put('/departments/:id', authorize(...HR), updateDepartmentRules, validate, hrController.updateDepartment);
router.delete('/departments/:id', authorize(...HR), hrController.deleteDepartment);

router.get('/employees', authorize(...HR), hrController.listEmployees);
router.post('/employees', authorize(...HR), createEmployeeRules, validate, hrController.createEmployee);
router.get('/employees/:id', authorize(...HR), hrController.getEmployee);
router.put('/employees/:id', authorize(...HR), updateEmployeeRules, validate, hrController.updateEmployee);
router.delete('/employees/:id', authorize(...HR), hrController.terminateEmployee);
router.post(
  '/employees/:employeeId/attendance',
  authorize(...HR),
  upsertAttendanceRules,
  validate,
  hrController.upsertAttendance
);

module.exports = router;
