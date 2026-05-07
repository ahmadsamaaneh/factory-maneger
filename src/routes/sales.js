const router = require('express').Router();
const salesController = require('../controllers/salesController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const {
  createCustomerRules,
  updateCustomerRules,
  createOrderRules,
  updateOrderStatusRules,
} = require('../validations/salesValidation');

const SALES = ['admin', 'factory_owner', 'sales_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

// ── Customers ─────────────────────────────────────────────────────────────────
router.post('/customers', authorize(...SALES), createCustomerRules, validate, salesController.createCustomer);

router.get('/customers', authorize(...SALES), salesController.listCustomers);

router.get('/customers/:id', authorize(...SALES), salesController.getCustomerById);

router.put('/customers/:id', authorize(...SALES), updateCustomerRules, validate, salesController.updateCustomer);

router.delete('/customers/:id', authorize('admin', 'factory_owner'), salesController.deleteCustomer);

// ── Orders ────────────────────────────────────────────────────────────────────
router.post('/orders', authorize(...SALES), createOrderRules, validate, salesController.createOrder);

router.get('/orders', authorize(...SALES), salesController.listOrders);

router.get('/orders/:id', authorize(...SALES), salesController.getOrderById);

router.patch(
  '/orders/:id/status',
  authorize(...SALES),
  updateOrderStatusRules,
  validate,
  salesController.updateOrderStatus
);

module.exports = router;
