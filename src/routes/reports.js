const router = require('express').Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.get(
  '/inventory',
  authorize('admin', 'factory_owner', 'inventory_manager'),
  reportController.inventoryReport
);

router.get(
  '/production',
  authorize('admin', 'factory_owner', 'production_manager'),
  reportController.productionReport
);

router.get(
  '/sales',
  authorize('admin', 'factory_owner', 'sales_manager'),
  reportController.salesReport
);

router.get(
  '/profit',
  authorize('admin', 'factory_owner'),
  reportController.profitReport
);

router.get(
  '/finance',
  authorize('admin', 'factory_owner', 'hr_manager'),
  reportController.financeReport
);

router.put(
  '/finance/capital',
  authorize('factory_owner'),
  body('capital_amount').isFloat({ min: 0 }).withMessage('capital_amount must be a positive number.'),
  validate,
  reportController.updateFactoryCapital
);

module.exports = router;
