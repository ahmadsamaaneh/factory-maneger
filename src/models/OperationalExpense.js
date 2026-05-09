const { DataTypes } = require('sequelize');

const EXPENSE_TYPES = ['fuel', 'electricity', 'petty_meals', 'other'];
const ACCOUNTING_CLASSES = ['operational', 'administrative', 'petty'];
const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'check'];
const EXPENSE_STATUSES = ['draft', 'complete'];

module.exports = (sequelize) => {
  const OperationalExpense = sequelize.define(
    'OperationalExpense',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      expense_date: { type: DataTypes.DATEONLY, allowNull: false },
      expense_type: {
        type: DataTypes.ENUM(...EXPENSE_TYPES),
        allowNull: false,
      },
      accounting_class: {
        type: DataTypes.ENUM(...ACCOUNTING_CLASSES),
        allowNull: false,
        defaultValue: 'operational',
      },
      accounting_label: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'التصنيف المحاسبي النصي، مثال: مصاريف تشغيلية / حساب معين',
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      department_id: { type: DataTypes.UUID, allowNull: true },
      employee_id: { type: DataTypes.UUID, allowNull: true },
      employee_name: { type: DataTypes.STRING(200), allowNull: true },
      payment_method: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        defaultValue: 'cash',
      },
      status: {
        type: DataTypes.ENUM(...EXPENSE_STATUSES),
        allowNull: false,
        defaultValue: 'complete',
      },
      /** تفاصيل البنزين / الكهرباء — يُحسب المبلغ منها عند الحفظ */
      meta: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_by: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: 'operational_expenses',
      indexes: [
        { fields: ['factory_id', 'expense_date'] },
        { fields: ['factory_id', 'expense_type'] },
        { fields: ['factory_id', 'accounting_class'] },
      ],
    }
  );

  OperationalExpense.EXPENSE_TYPES = EXPENSE_TYPES;
  OperationalExpense.ACCOUNTING_CLASSES = ACCOUNTING_CLASSES;
  OperationalExpense.PAYMENT_METHODS = PAYMENT_METHODS;
  OperationalExpense.STATUSES = EXPENSE_STATUSES;
  return OperationalExpense;
};
