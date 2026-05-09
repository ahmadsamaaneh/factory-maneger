const { DataTypes } = require('sequelize');

const BUDGET_SCOPES = ['all', 'expense_type', 'accounting_class'];

module.exports = (sequelize) => {
  const ExpenseBudget = sequelize.define(
    'ExpenseBudget',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      /** أول يوم في الشهر المحدد */
      period_month: { type: DataTypes.DATEONLY, allowNull: false },
      scope: {
        type: DataTypes.ENUM(...BUDGET_SCOPES),
        allowNull: false,
        defaultValue: 'all',
      },
      /** عند scope = expense_type أو accounting_class يُخزن القيمة مثل fuel أو operational */
      scope_value: { type: DataTypes.STRING(80), allowNull: true },
      limit_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
      /** نسبة تنبيه مسبق (مثلاً 80 يعني تنبيه عند بلوغ 80% من الميزانية) */
      warn_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 80,
        validate: { min: 1, max: 100 },
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: 'expense_budgets',
      indexes: [{ unique: true, fields: ['factory_id', 'period_month', 'scope', 'scope_value'] }],
    }
  );

  ExpenseBudget.SCOPES = BUDGET_SCOPES;
  return ExpenseBudget;
};
