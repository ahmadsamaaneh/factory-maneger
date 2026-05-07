const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      selling_price: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      stock_quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'products',
      indexes: [
        { unique: true, fields: ['name', 'factory_id'] },
        { unique: true, fields: ['sku', 'factory_id'], where: { sku: { [require('sequelize').Op.ne]: null } } },
      ],
    }
  );

  return Product;
};
