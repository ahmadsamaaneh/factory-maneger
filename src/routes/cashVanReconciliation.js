const router = require('express').Router();
const controller = require('../controllers/cashVanReconciliationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const {
  openReconciliationRules,
  closeReconciliationRules,
} = require('../validations/cashVanReconciliationValidation');

const ALLOWED = ['factory_owner', 'sales_manager', 'inventory_manager', 'hr_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post('/reconciliations/open', authorize(...ALLOWED), openReconciliationRules, validate, controller.openReconciliation);
router.post(
  '/reconciliations/:id/close',
  authorize(...ALLOWED),
  closeReconciliationRules,
  validate,
  controller.closeReconciliation
);
router.get('/reconciliations', authorize(...ALLOWED), controller.listReconciliations);
router.get('/reconciliations/:id', authorize(...ALLOWED), controller.getReconciliationById);

module.exports = router;
