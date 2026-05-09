const { DataTypes } = require('sequelize');

const ASSIGNMENT_STATUS = ['active', 'ended'];

module.exports = (sequelize) => {
  const CashVanAssignment = sequelize.define(
    'CashVanAssignment',
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
      driver_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      rep_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      end_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...ASSIGNMENT_STATUS),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'cash_van_assignments',
    }
  );

  CashVanAssignment.STATUS = ASSIGNMENT_STATUS;
  return CashVanAssignment;
};
