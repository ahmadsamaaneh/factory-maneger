const router = require('express').Router();
const controller = require('../controllers/cashVanLoadingController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createLoadRules, createUnloadRules } = require('../validations/cashVanLoadingValidation');

const ALLOWED = ['factory_owner', 'inventory_manager', 'sales_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post('/loads', authorize(...ALLOWED), createLoadRules, validate, controller.createLoad);
router.get('/loads', authorize(...ALLOWED), controller.listLoads);
router.get('/loads/:id', authorize(...ALLOWED), controller.getLoadById);

router.post('/unloads', authorize(...ALLOWED), createUnloadRules, validate, controller.createUnload);
router.get('/unloads', authorize(...ALLOWED), controller.listUnloads);
router.get('/unloads/:id', authorize(...ALLOWED), controller.getUnloadById);

router.get('/vehicles/:vehicleId/stock', authorize(...ALLOWED), controller.getVehicleStock);

module.exports = router;
