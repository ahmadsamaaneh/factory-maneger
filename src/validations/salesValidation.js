const { body } = require('express-validator');

const createCustomerRules = [
  body('name').trim().notEmpty().withMessage('Customer name is required.'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('is_active').optional().isBoolean(),
];

const createOrderRules = [
  body('customer_id').isUUID().withMessage('Valid customer_id (UUID) is required.'),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have a valid product_id (UUID).'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0.'),
  body('items.*.unit_price').optional().isFloat({ min: 0 }).withMessage('unit_price must be non-negative.'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be non-negative.'),
  body('notes').optional().trim(),
];

const updateOrderStatusRules = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status.'),
];

module.exports = { createCustomerRules, updateCustomerRules, createOrderRules, updateOrderStatusRules };
