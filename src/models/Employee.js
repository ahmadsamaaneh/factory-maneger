const { DataTypes } = require('sequelize');

const EMPLOYEE_STATUS = ['active', 'on_leave', 'terminated'];

module.exports = (sequelize) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      department_id: { type: DataTypes.UUID, allowNull: true },
      user_id: { type: DataTypes.UUID, allowNull: true },
      employee_code: { type: DataTypes.STRING(40), allowNull: false },
      full_name: { type: DataTypes.STRING(200), allowNull: false },
      job_title: { type: DataTypes.STRING(120), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(40), allowNull: true },
      national_id: { type: DataTypes.STRING(50), allowNull: true },
      hire_date: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM(...EMPLOYEE_STATUS),
        allowNull: false,
        defaultValue: 'active',
      },
      salary_base: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: true,
        defaultValue: null,
        validate: { min: 0 },
      },
      daily_work_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 8,
        validate: { min: 1, max: 24 },
      },
      late_deduction_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      overtime_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      absent_deduction_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sick_leave_deductible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      avatar_url: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: 'employees',
      indexes: [{ unique: true, fields: ['factory_id', 'employee_code'] }],
    }
  );

  Employee.STATUS = EMPLOYEE_STATUS;
  return Employee;
};
