const { body } = require('express-validator');

const createLoadRules = [
  body('vehicle_id').isUUID().withMessage('vehicle_id is required (UUID).'),
  body('loaded_at').optional().isISO8601().withMessage('loaded_at must be valid datetime.'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one load item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have valid product_id.'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Item quantity must be greater than 0.'),
];

const createUnloadRules = [
  body('vehicle_id').isUUID().withMessage('vehicle_id is required (UUID).'),
  body('unloaded_at').optional().isISO8601().withMessage('unloaded_at must be valid datetime.'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one unload item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have valid product_id.'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Item quantity must be greater than 0.'),
];

module.exports = { createLoadRules, createUnloadRules };
