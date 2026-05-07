const { body } = require('express-validator');

// factory_owner is intentionally excluded — owners are created only via POST /admin/factories
const STAFF_ROLES = ['inventory_manager', 'production_manager', 'sales_manager'];

const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('role').isIn(STAFF_ROLES).withMessage(`Role must be one of: ${STAFF_ROLES.join(', ')}.`),
];

const updateUserRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean.'),
];

module.exports = { createUserRules, updateUserRules };
