const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashVanSaleItem = sequelize.define(
    'CashVanSaleItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sale_id: {
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
      unit_price: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      line_total: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
    },
    {
      tableName: 'cash_van_sale_items',
    }
  );

  return CashVanSaleItem;
};
