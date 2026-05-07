const router = require('express').Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');

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

module.exports = router;
