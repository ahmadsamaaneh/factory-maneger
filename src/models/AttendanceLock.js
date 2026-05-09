const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'AttendanceLock',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      work_date: { type: DataTypes.DATEONLY, allowNull: false },
      is_locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      locked_by: { type: DataTypes.UUID, allowNull: true },
      locked_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'attendance_locks',
      indexes: [{ unique: true, fields: ['factory_id', 'work_date'] }],
    }
  );
};
