const { body } = require('express-validator');

const createProductRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('selling_price').isFloat({ min: 0 }).withMessage('selling_price must be a non-negative number.'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('cost must be a non-negative number.'),
  body('stock_quantity').optional().isFloat({ min: 0 }).withMessage('stock_quantity must be a non-negative number.'),
  body('sku').optional().trim(),
  body('description').optional().trim(),
];

const updateProductRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('selling_price').optional().isFloat({ min: 0 }).withMessage('selling_price must be a non-negative number.'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('cost must be a non-negative number.'),
  body('stock_quantity').optional().isFloat({ min: 0 }).withMessage('stock_quantity must be a non-negative number.'),
  body('sku').optional().trim(),
  body('description').optional().trim(),
];

module.exports = { createProductRules, updateProductRules };
