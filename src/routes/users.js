const router = require('express').Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const tenantScope = require('../middleware/tenantMiddleware');
const checkUserLimit = require('../middleware/userLimitMiddleware');
const validate = require('../middleware/validate');
const { createUserRules, updateUserRules } = require('../validations/userValidation');

router.use(authenticate);
router.use(tenantScope);

router.post(
  '/',
  authorize('admin', 'factory_owner'),
  checkUserLimit,
  createUserRules,
  validate,
  userController.createUser
);

router.get(
  '/',
  authorize('admin', 'factory_owner', 'hr_manager'),
  userController.listUsers
);

router.get(
  '/:id',
  authorize('admin', 'factory_owner', 'hr_manager'),
  userController.getUserById
);

router.put(
  '/:id',
  authorize('admin', 'factory_owner'),
  updateUserRules,
  validate,
  userController.updateUser
);

router.delete(
  '/:id',
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;
