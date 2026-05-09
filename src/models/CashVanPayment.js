const { DataTypes } = require('sequelize');

const PAYMENT_METHOD = ['cash', 'transfer', 'card'];

module.exports = (sequelize) => {
  const CashVanPayment = sequelize.define(
    'CashVanPayment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sale_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM(...PAYMENT_METHOD),
        allowNull: false,
        defaultValue: 'cash',
      },
      amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'cash_van_payments',
    }
  );

  CashVanPayment.PAYMENT_METHOD = PAYMENT_METHOD;
  return CashVanPayment;
};
