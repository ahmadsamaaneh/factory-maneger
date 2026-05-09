const { DataTypes } = require('sequelize');

const VEHICLE_STATUS = ['active', 'maintenance', 'out_of_service'];

module.exports = (sequelize) => {
  const CashVanVehicle = sequelize.define(
    'CashVanVehicle',
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
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      plate_number: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...VEHICLE_STATUS),
        allowNull: false,
        defaultValue: 'active',
      },
      assigned_driver_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      assigned_rep_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'cash_van_vehicles',
      indexes: [
        { unique: true, fields: ['factory_id', 'code'] },
        { unique: true, fields: ['factory_id', 'plate_number'] },
      ],
    }
  );

  CashVanVehicle.STATUS = VEHICLE_STATUS;
  return CashVanVehicle;
};
