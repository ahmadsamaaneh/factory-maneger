const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashVanReconciliationItem = sequelize.define(
    'CashVanReconciliationItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reconciliation_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      system_qty: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      physical_qty: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      variance_qty: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      variance_value: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'cash_van_reconciliation_items',
    }
  );

  return CashVanReconciliationItem;
};
