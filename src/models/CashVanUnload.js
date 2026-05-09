const { DataTypes } = require('sequelize');

const UNLOAD_STATUS = ['draft', 'confirmed', 'cancelled'];

module.exports = (sequelize) => {
  const CashVanUnload = sequelize.define(
    'CashVanUnload',
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
      unload_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      unloaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM(...UNLOAD_STATUS),
        allowNull: false,
        defaultValue: 'confirmed',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'cash_van_unloads',
    }
  );

  CashVanUnload.STATUS = UNLOAD_STATUS;
  return CashVanUnload;
};
