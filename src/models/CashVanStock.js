const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashVanStock = sequelize.define(
    'CashVanStock',
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
      vehicle_id: {
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
        defaultValue: 0,
      },
    },
    {
      tableName: 'cash_van_stocks',
      indexes: [{ unique: true, fields: ['factory_id', 'vehicle_id', 'product_id'] }],
    }
  );

  return CashVanStock;
};
