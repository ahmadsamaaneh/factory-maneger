const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashVanLoadItem = sequelize.define(
    'CashVanLoadItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      load_id: {
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
      tableName: 'cash_van_load_items',
    }
  );

  return CashVanLoadItem;
};
