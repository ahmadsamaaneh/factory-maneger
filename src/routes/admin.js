const router = require('express').Router();
const factoryController = require('../controllers/factoryController');
const adminUserController = require('../controllers/adminUserController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticate);
router.use(authorize('admin'));

const createFactoryRules = [
  body('name').trim().notEmpty().withMessage('Factory name is required.'),
  body('owner_name').trim().notEmpty().withMessage('Owner name is required.'),
  body('owner_email').isEmail().withMessage('Valid owner email is required.'),
  body('owner_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('email_limit').optional().isInt({ min: 1, max: 500 }).withMessage('Email limit must be between 1 and 500.'),
  body('subscription_status').optional().isIn(['trial', 'active', 'expired', 'suspended']),
  body('subscription_end_date').optional().isDate().withMessage('Invalid date format.'),
];

const updateSubscriptionRules = [
  param('id').isUUID().withMessage('Invalid factory ID.'),
  body('name').optional().trim().notEmpty(),
  body('email_limit').optional().isInt({ min: 1, max: 500 }).withMessage('Email limit must be between 1 and 500.'),
  body('subscription_status').optional().isIn(['trial', 'active', 'expired', 'suspended']),
  body('subscription_end_date').optional({ nullable: true }).isDate().withMessage('Invalid date format.'),
  body('is_active').optional().isBoolean(),
];

router.get('/stats', factoryController.getAdminStats);

router.get('/factories', factoryController.listFactories);

router.post('/factories', createFactoryRules, validate, factoryController.createFactory);

router.get('/factories/:id', factoryController.getFactory);

router.get('/factories/:id/users', factoryController.getFactoryUsers);

router.patch('/factories/:id', updateSubscriptionRules, validate, factoryController.updateSubscription);

router.delete('/factories/:id', factoryController.deleteFactory);

// ── Admin User Management ──────────────────────────────────────────
router.get('/users', adminUserController.listAllUsers);

router.patch(
  '/users/:id/status',
  [param('id').isUUID().withMessage('Invalid user ID.')],
  validate,
  adminUserController.toggleUserStatus
);

router.patch(
  '/users/:id/reset-password',
  [
    param('id').isUUID().withMessage('Invalid user ID.'),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  adminUserController.resetUserPassword
);

module.exports = router;
