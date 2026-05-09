const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      factory_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      code: { type: DataTypes.STRING(40), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'departments',
      indexes: [{ unique: true, fields: ['factory_id', 'name'] }],
    }
  );
  return Department;
};
