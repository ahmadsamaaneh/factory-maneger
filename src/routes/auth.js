const router = require('express').Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginRules, changePasswordRules } = require('../validations/authValidation');

router.post('/login', loginRules, validate, authController.login);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, changePasswordRules, validate, authController.changePassword);

module.exports = router;
