const { DataTypes } = require('sequelize');

const STATUS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

module.exports = (sequelize) => {
  const SalesOrder = sequelize.define(
    'SalesOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      discount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(...STATUS),
        defaultValue: 'pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'sales_orders',
    }
  );

  SalesOrder.STATUS = STATUS;

  return SalesOrder;
};
