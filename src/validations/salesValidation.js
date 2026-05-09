const { body } = require('express-validator');

/** إن وُجد رقم هاتف يجب أن يحتوي على 10 أرقام على الأقل (يُحسب الأرقام فقط). */
function phoneMinTenDigits(field = 'phone') {
  return body(field)
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      const digits = String(value).replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('رقم الهاتف يجب أن يحتوي على 10 أرقام على الأقل.');
      }
      return true;
    });
}

const createCustomerRules = [
  body('name').trim().notEmpty().withMessage('Customer name is required.'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required.'),
  phoneMinTenDigits('phone'),
  body('address').optional({ checkFalsy: true }).trim(),
  body('is_active')
    .optional()
    .custom((v) => v === true || v === false || v === 'true' || v === 'false')
    .withMessage('قيمة الحالة غير صالحة.'),
];

const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required.'),
  phoneMinTenDigits('phone'),
  body('address').optional({ checkFalsy: true }).trim(),
  body('is_active')
    .optional()
    .custom((v) => v === true || v === false || v === 'true' || v === 'false')
    .withMessage('قيمة الحالة غير صالحة.'),
];

const createOrderRules = [
  body('customer_id').isUUID().withMessage('Valid customer_id (UUID) is required.'),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required.'),
  body('items.*.product_id').isUUID().withMessage('Each item must have a valid product_id (UUID).'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0.'),
  body('items.*.unit_price').optional().isFloat({ min: 0 }).withMessage('unit_price must be non-negative.'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be non-negative.'),
  body('notes').optional().trim(),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status.'),
];

const updateOrderStatusRules = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status.'),
];

module.exports = { createCustomerRules, updateCustomerRules, createOrderRules, updateOrderStatusRules };
