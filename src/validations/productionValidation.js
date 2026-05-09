const { body } = require('express-validator');

const createRecipeRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('production_cost').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('production_cost must be a non-negative number.'),
  body('description').optional().trim(),
  body('materials').isArray({ min: 1 }).withMessage('At least one material is required.'),
  body('materials.*.input_type')
    .optional()
    .isIn(['raw_material', 'product'])
    .withMessage('input_type must be raw_material or product.'),
  body('materials.*').custom((m) => {
    const type = m?.input_type || 'raw_material';
    if (type === 'raw_material' && !m?.raw_material_id) {
      throw new Error('raw_material_id is required when input_type is raw_material.');
    }
    if (type === 'product' && !m?.product_id) {
      throw new Error('product_id is required when input_type is product.');
    }
    return true;
  }),
  body('materials.*.raw_material_id').optional().isUUID().withMessage('raw_material_id must be a valid UUID.'),
  body('materials.*.product_id').optional().isUUID().withMessage('product_id must be a valid UUID.'),
  body('materials.*.quantity_required').isFloat({ gt: 0 }).withMessage('quantity_required must be greater than 0.'),
  body('outputs').isArray({ min: 1 }).withMessage('At least one output product is required.'),
  body('outputs.*.product_id').isUUID().withMessage('Each output must have a valid product_id (UUID).'),
  body('outputs.*.quantity_produced').isFloat({ gt: 0 }).withMessage('quantity_produced must be greater than 0.'),
];

const runBatchRules = [
  body('recipe_id').isUUID().withMessage('Valid recipe_id (UUID) is required.'),
  body('quantity_multiplier').optional().isFloat({ gt: 0 }).withMessage('quantity_multiplier must be greater than 0.'),
  body('notes').optional().trim(),
  body('schedule_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('schedule_date must be YYYY-MM-DD.'),
  body('start_time')
    .optional({ checkFalsy: true })
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .withMessage('start_time must be HH:mm (24h).'),
  body('end_time')
    .optional({ checkFalsy: true })
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .withMessage('end_time must be HH:mm (24h).'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid batch status.'),
];

const updateBatchRules = [
  body('schedule_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('schedule_date must be YYYY-MM-DD.'),
  body('start_time')
    .optional({ checkFalsy: true })
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .withMessage('start_time must be HH:mm (24h).'),
  body('end_time')
    .optional({ checkFalsy: true })
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .withMessage('end_time must be HH:mm (24h).'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid batch status.'),
];

module.exports = { createRecipeRules, runBatchRules, updateBatchRules };
