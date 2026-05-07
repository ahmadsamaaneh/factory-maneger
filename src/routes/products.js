const router = require('express').Router();
const productController = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createProductRules, updateProductRules } = require('../validations/productValidation');

const MANAGE = ['admin', 'factory_owner', 'production_manager'];
const VIEW = ['admin', 'factory_owner', 'production_manager', 'sales_manager', 'inventory_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post('/', authorize(...MANAGE), createProductRules, validate, productController.createProduct);

router.get('/', authorize(...VIEW), productController.listProducts);

router.get('/:id', authorize(...VIEW), productController.getProductById);

router.put('/:id', authorize(...MANAGE), updateProductRules, validate, productController.updateProduct);

router.delete('/:id', authorize('admin', 'factory_owner'), productController.deleteProduct);

module.exports = router;
