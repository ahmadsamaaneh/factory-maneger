const { body } = require('express-validator');

const UNIT_TYPES = ['kg', 'g', 'liter', 'ml', 'unit', 'carton', 'box', 'meter', 'piece'];

const createMaterialRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('unit_type').isIn(UNIT_TYPES).withMessage(`unit_type must be one of: ${UNIT_TYPES.join(', ')}.`),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number.'),
  body('cost_per_unit').optional().isFloat({ min: 0 }).withMessage('cost_per_unit must be a non-negative number.'),
  body('quality').optional().trim(),
  body('reorder_level').optional().isFloat({ min: 0 }).withMessage('reorder_level must be a non-negative number.'),
];

const updateMaterialRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('unit_type').optional().isIn(UNIT_TYPES).withMessage(`unit_type must be one of: ${UNIT_TYPES.join(', ')}.`),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number.'),
  body('cost_per_unit').optional().isFloat({ min: 0 }).withMessage('cost_per_unit must be a non-negative number.'),
  body('quality').optional().trim(),
  body('reorder_level').optional().isFloat({ min: 0 }).withMessage('reorder_level must be a non-negative number.'),
];

const createPurchaseRules = [
  body('levels').isArray({ min: 1 }).withMessage('At least one unit level is required.'),
  body('levels.*.label').trim().notEmpty().withMessage('Each level must have a label.'),
  body('levels.*.quantity').isFloat({ gt: 0 }).withMessage('Each level quantity must be greater than 0.'),
  body('total_cost').isFloat({ gt: 0 }).withMessage('total_cost must be greater than 0.'),
  body('supplier').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body('note').optional({ nullable: true, checkFalsy: true }).trim(),
];

module.exports = { createMaterialRules, updateMaterialRules, createPurchaseRules };
