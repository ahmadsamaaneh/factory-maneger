const router = require('express').Router();
const inventoryController = require('../controllers/inventoryController');
const purchaseController = require('../controllers/purchaseController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createMaterialRules, updateMaterialRules, createPurchaseRules } = require('../validations/inventoryValidation');
const { body } = require('express-validator');

const ALLOWED = ['admin', 'factory_owner', 'inventory_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

router.post(
  '/',
  authorize(...ALLOWED),
  createMaterialRules,
  validate,
  inventoryController.createMaterial
);

router.get('/', authorize(...ALLOWED, 'production_manager'), inventoryController.listMaterials);

router.get('/:id', authorize(...ALLOWED, 'production_manager'), inventoryController.getMaterialById);

router.put(
  '/:id',
  authorize(...ALLOWED),
  updateMaterialRules,
  validate,
  inventoryController.updateMaterial
);

router.delete('/:id', authorize('admin', 'factory_owner'), inventoryController.deleteMaterial);

router.patch(
  '/:id/adjust',
  authorize(...ALLOWED),
  [
    body('delta').isFloat({ gt: 0 }).withMessage('delta must be greater than 0.'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('operation must be add, subtract, or set.'),
  ],
  validate,
  inventoryController.adjustQuantity
);

// ── Purchases ─────────────────────────────────────────────────────
// NOTE: static paths must be declared BEFORE '/:id' patterns
router.get('/purchases/all', authorize(...ALLOWED), purchaseController.listAllPurchases);
router.post('/purchases/preview', authorize(...ALLOWED), purchaseController.previewPurchase);

router.get('/:id/purchases', authorize(...ALLOWED), purchaseController.listPurchasesForMaterial);
router.post(
  '/:id/purchases',
  authorize(...ALLOWED),
  createPurchaseRules,
  validate,
  purchaseController.createPurchase
);

module.exports = router;
