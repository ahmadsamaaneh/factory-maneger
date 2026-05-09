const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Current password is required.'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.'),
];

const updateProfileRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];

const updateMyFactoryRules = [
  body('name').trim().notEmpty().withMessage('Factory name is required.').isLength({ max: 200 }),
];

module.exports = { loginRules, changePasswordRules, updateProfileRules, updateMyFactoryRules };
