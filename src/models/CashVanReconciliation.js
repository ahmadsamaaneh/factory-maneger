const { DataTypes } = require('sequelize');

const RECON_STATUS = ['open', 'closed'];

module.exports = (sequelize) => {
  const CashVanReconciliation = sequelize.define(
    'CashVanReconciliation',
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
      business_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...RECON_STATUS),
        allowNull: false,
        defaultValue: 'open',
      },
      cash_collected: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      variance_value: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      opened_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      closed_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      opened_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'cash_van_reconciliations',
      indexes: [{ unique: true, fields: ['factory_id', 'vehicle_id', 'business_date'] }],
    }
  );

  CashVanReconciliation.STATUS = RECON_STATUS;
  return CashVanReconciliation;
};
