const router = require('express').Router();
const productionController = require('../controllers/productionController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkSubscription = require('../middleware/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { createRecipeRules, runBatchRules, updateBatchRules } = require('../validations/productionValidation');

const MANAGE = ['admin', 'factory_owner', 'production_manager'];

router.use(authenticate);
router.use(tenantScope);
router.use(checkSubscription);

// ── Recipes ───────────────────────────────────────────────────────────────────
router.post('/recipes', authorize(...MANAGE), createRecipeRules, validate, productionController.createRecipe);

router.get('/recipes', authorize(...MANAGE), productionController.listRecipes);

router.get('/recipes/:id', authorize(...MANAGE), productionController.getRecipeById);

router.put('/recipes/:id', authorize(...MANAGE), productionController.updateRecipe);

router.delete('/recipes/:id', authorize('admin', 'factory_owner'), productionController.deleteRecipe);

// ── Production Batches ────────────────────────────────────────────────────────
router.post('/batches', authorize(...MANAGE), runBatchRules, validate, productionController.runBatch);

router.get('/batches', authorize(...MANAGE), productionController.listBatches);

router.get('/batches/:id', authorize(...MANAGE), productionController.getBatchById);

router.patch('/batches/:id', authorize(...MANAGE), updateBatchRules, validate, productionController.updateBatch);

module.exports = router;
