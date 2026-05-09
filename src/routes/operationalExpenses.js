const router = require('express').Router();
const controller = require('../controllers/operationalExpenseController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createRules, updateRules, idParam, budgetRules } = require('../validations/operationalExpenseValidation');

/** كل مستخدمي المصنع يمكنهم إدخال وعرض المصاريف؛ الحذف والميزانيات لمدير المصنع والموارد البشرية */
const ALL = ['factory_owner', 'hr_manager', 'inventory_manager', 'production_manager', 'sales_manager'];
const MANAGE = ['factory_owner', 'hr_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.get('/dashboard/summary', authorize(...ALL), controller.dashboard);
router.get('/alerts', authorize(...ALL), controller.alerts);
router.get('/reports/aggregate', authorize(...ALL), controller.reportAggregate);
router.get('/export/csv', authorize(...ALL), controller.exportCsv);
router.get('/lookup/departments', authorize(...ALL), controller.listDepartments);
router.get('/lookup/employees', authorize(...ALL), controller.listEmployees);
router.get('/budgets', authorize(...MANAGE), controller.listBudgets);
router.post('/budgets', authorize(...MANAGE), budgetRules, validate, controller.upsertBudget);

router.get('/', authorize(...ALL), controller.list);
router.post('/', authorize(...ALL), createRules, validate, controller.create);

router.get('/:id', authorize(...ALL), idParam, validate, controller.getOne);
router.put('/:id', authorize(...ALL), updateRules, validate, controller.update);
router.delete('/:id', authorize(...MANAGE), idParam, validate, controller.remove);

module.exports = router;
