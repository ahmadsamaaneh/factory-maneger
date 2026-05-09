const { body, param, query } = require('express-validator');

const EXPENSE_TYPES = ['fuel', 'electricity', 'petty_meals', 'other'];
const ACCOUNTING = ['operational', 'administrative', 'petty'];
const PAYMENT = ['cash', 'card', 'transfer', 'check'];
const STATUSES = ['draft', 'complete'];

const dateOk = (field) =>
  body(field)
    .notEmpty()
    .custom((v) => {
      const d = Date.parse(v);
      return !Number.isNaN(d);
    })
    .withMessage('invalid date');

const createRules = [
  dateOk('expense_date'),
  body('expense_type').isIn(EXPENSE_TYPES).withMessage('expense_type'),
  body('accounting_class').optional().isIn(ACCOUNTING),
  body('accounting_label').optional().trim(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('department_id').optional({ nullable: true }).isUUID(),
  body('employee_id').optional({ nullable: true }).isUUID(),
  body('employee_name').optional({ nullable: true }).trim(),
  body('payment_method').optional().isIn(PAYMENT),
  body('status').optional().isIn(STATUSES),
  body('meta').optional().isObject(),
];

const updateRules = [
  param('id').isUUID(),
  body('expense_date')
    .optional()
    .custom((v) => v == null || !Number.isNaN(Date.parse(v)))
    .withMessage('expense_date'),
  body('expense_type').optional().isIn(EXPENSE_TYPES),
  body('accounting_class').optional().isIn(ACCOUNTING),
  body('accounting_label').optional().trim(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('department_id').optional({ nullable: true }).isUUID(),
  body('employee_id').optional({ nullable: true }).isUUID(),
  body('employee_name').optional({ nullable: true }).trim(),
  body('payment_method').optional().isIn(PAYMENT),
  body('status').optional().isIn(STATUSES),
  body('meta').optional().isObject(),
];

const idParam = [param('id').isUUID()];

const budgetRules = [
  dateOk('period_month'),
  body('scope').optional().isIn(['all', 'expense_type', 'accounting_class']),
  body('scope_value').optional({ nullable: true }).trim(),
  body('limit_amount').isFloat({ gt: 0 }),
  body('warn_percent').optional().isInt({ min: 1, max: 100 }),
  body('notes').optional().trim(),
];

module.exports = {
  createRules,
  updateRules,
  idParam,
  budgetRules,
};
