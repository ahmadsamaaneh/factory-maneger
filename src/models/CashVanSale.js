const { DataTypes } = require('sequelize');

const SALE_TYPE = ['cash', 'credit'];
const SYNC_STATUS = ['synced', 'pending', 'failed'];

module.exports = (sequelize) => {
  const CashVanSale = sequelize.define(
    'CashVanSale',
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
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sale_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      sale_type: {
        type: DataTypes.ENUM(...SALE_TYPE),
        allowNull: false,
        defaultValue: 'cash',
      },
      subtotal: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      sync_status: {
        type: DataTypes.ENUM(...SYNC_STATUS),
        allowNull: false,
        defaultValue: 'synced',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'cash_van_sales',
    }
  );

  CashVanSale.SALE_TYPE = SALE_TYPE;
  CashVanSale.SYNC_STATUS = SYNC_STATUS;
  return CashVanSale;
};
