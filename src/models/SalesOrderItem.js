const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalesOrderItem = sequelize.define(
    'SalesOrderItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sales_order_id: {
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
        validate: { min: 0.0001 },
      },
      unit_price: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      subtotal: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'sales_order_items',
    }
  );

  return SalesOrderItem;
};
