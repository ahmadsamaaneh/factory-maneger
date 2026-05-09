const router = require('express').Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  loginRules,
  changePasswordRules,
  updateProfileRules,
  updateMyFactoryRules,
} = require('../validations/authValidation');

router.post('/login', loginRules, validate, authController.login);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, changePasswordRules, validate, authController.changePassword);
router.patch('/profile', authenticate, updateProfileRules, validate, authController.updateProfile);
router.patch(
  '/my-factory',
  authenticate,
  authorize('factory_owner'),
  updateMyFactoryRules,
  validate,
  authController.updateMyFactory
);

module.exports = router;
