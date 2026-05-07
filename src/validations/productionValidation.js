const { body } = require('express-validator');

const createRecipeRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('production_cost').isFloat({ min: 0 }).withMessage('production_cost must be a non-negative number.'),
  body('description').optional().trim(),
  body('materials').isArray({ min: 1 }).withMessage('At least one material is required.'),
  body('materials.*.raw_material_id').isUUID().withMessage('Each material must have a valid raw_material_id (UUID).'),
  body('materials.*.quantity_required').isFloat({ gt: 0 }).withMessage('quantity_required must be greater than 0.'),
  body('outputs').isArray({ min: 1 }).withMessage('At least one output product is required.'),
  body('outputs.*.product_id').isUUID().withMessage('Each output must have a valid product_id (UUID).'),
  body('outputs.*.quantity_produced').isFloat({ gt: 0 }).withMessage('quantity_produced must be greater than 0.'),
];

const runBatchRules = [
  body('recipe_id').isUUID().withMessage('Valid recipe_id (UUID) is required.'),
  body('quantity_multiplier').optional().isFloat({ gt: 0 }).withMessage('quantity_multiplier must be greater than 0.'),
  body('notes').optional().trim(),
];

module.exports = { createRecipeRules, runBatchRules };
