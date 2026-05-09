const router = require('express').Router();
const controller = require('../controllers/cashVanSalesController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createSaleRules } = require('../validations/cashVanSalesValidation');

const ALLOWED = ['factory_owner', 'sales_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post('/sales', authorize(...ALLOWED), createSaleRules, validate, controller.createSale);
router.get('/sales', authorize(...ALLOWED), controller.listSales);
router.get('/sales/:id', authorize(...ALLOWED), controller.getSaleById);

module.exports = router;
