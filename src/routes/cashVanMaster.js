const router = require('express').Router();
const controller = require('../controllers/cashVanMasterController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const {
  createVehicleRules,
  createAssignmentRules,
} = require('../validations/cashVanMasterValidation');

const ALLOWED = ['factory_owner', 'inventory_manager', 'sales_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post('/vehicles', authorize(...ALLOWED), createVehicleRules, validate, controller.createVehicle);
router.get('/vehicles', authorize(...ALLOWED), controller.listVehicles);
router.post('/assignments', authorize(...ALLOWED), createAssignmentRules, validate, controller.createAssignment);
router.get('/assignments', authorize(...ALLOWED), controller.listAssignments);

module.exports = router;
