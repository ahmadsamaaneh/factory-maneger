const { body } = require('express-validator');

const openReconciliationRules = [
  body('vehicle_id').isUUID().withMessage('vehicle_id is required (UUID).'),
  body('business_date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('business_date must be YYYY-MM-DD.'),
];

const closeReconciliationRules = [
  body('cash_collected')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('cash_collected must be non-negative.'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one reconciliation item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have valid product_id.'),
  body('items.*.physical_qty').isFloat({ min: 0 }).withMessage('physical_qty must be non-negative.'),
];

module.exports = {
  openReconciliationRules,
  closeReconciliationRules,
};
