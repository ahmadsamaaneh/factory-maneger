const { DataTypes } = require('sequelize');

const ATT_STATUS = ['present', 'absent', 'late', 'half_day', 'leave', 'sick_leave'];

module.exports = (sequelize) => {
  const EmployeeAttendance = sequelize.define(
    'EmployeeAttendance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employee_id: { type: DataTypes.UUID, allowNull: false },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      work_date: { type: DataTypes.DATEONLY, allowNull: false },
      check_in_at: { type: DataTypes.DATE, allowNull: true },
      check_out_at: { type: DataTypes.DATE, allowNull: true },
      late_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      overtime_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      paid_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      deduction_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      overtime_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      friday_bonus_amount: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      special_case: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: {
        type: DataTypes.ENUM(...ATT_STATUS),
        allowNull: false,
        defaultValue: 'present',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'employee_attendance',
      indexes: [{ unique: true, fields: ['employee_id', 'work_date'] }],
    }
  );

  EmployeeAttendance.STATUS = ATT_STATUS;
  return EmployeeAttendance;
};
