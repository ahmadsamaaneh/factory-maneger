const { body } = require('express-validator');

const createSaleRules = [
  body('vehicle_id').isUUID().withMessage('vehicle_id is required (UUID).'),
  body('customer_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('customer_id must be UUID.'),
  body('sale_type').optional().isIn(['cash', 'credit']).withMessage('sale_type must be cash or credit.'),
  body('discount_amount').optional().isFloat({ min: 0 }).withMessage('discount_amount must be non-negative.'),
  body('tax_amount').optional().isFloat({ min: 0 }).withMessage('tax_amount must be non-negative.'),
  body('paid_amount').optional().isFloat({ min: 0 }).withMessage('paid_amount must be non-negative.'),
  body('payment_method').optional().isIn(['cash', 'transfer', 'card']).withMessage('Invalid payment_method.'),
  body('issued_at').optional().isISO8601().withMessage('issued_at must be valid datetime.'),
  body('items').isArray({ min: 1 }).withMessage('At least one sale item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have valid product_id.'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Item quantity must be greater than 0.'),
  body('items.*.unit_price').optional().isFloat({ min: 0 }).withMessage('unit_price must be non-negative.'),
  body('items.*.discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('item discount_amount must be non-negative.'),
  body('items.*.tax_amount').optional().isFloat({ min: 0 }).withMessage('item tax_amount must be non-negative.'),
];

module.exports = { createSaleRules };
