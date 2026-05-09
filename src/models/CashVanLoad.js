const { DataTypes } = require('sequelize');

const LOAD_STATUS = ['draft', 'confirmed', 'cancelled'];

module.exports = (sequelize) => {
  const CashVanLoad = sequelize.define(
    'CashVanLoad',
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
      load_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      loaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM(...LOAD_STATUS),
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
      tableName: 'cash_van_loads',
    }
  );

  CashVanLoad.STATUS = LOAD_STATUS;
  return CashVanLoad;
};
