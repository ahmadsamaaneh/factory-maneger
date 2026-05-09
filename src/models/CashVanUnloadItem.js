const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashVanUnloadItem = sequelize.define(
    'CashVanUnloadItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      unload_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      unit_cost: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'cash_van_unload_items',
    }
  );

  return CashVanUnloadItem;
};
