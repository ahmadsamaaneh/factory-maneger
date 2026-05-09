const { DataTypes } = require('sequelize');

const UNIT_TYPES = ['kg', 'g', 'liter', 'ml', 'unit', 'carton', 'box', 'meter', 'piece'];

module.exports = (sequelize) => {
  const RawMaterial = sequelize.define(
    'RawMaterial',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      unit_type: {
        type: DataTypes.ENUM(...UNIT_TYPES),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      quality: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      supplier: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reorder_level: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: 'raw_materials',
      indexes: [{ unique: true, fields: ['name', 'factory_id'] }],
    }
  );

  RawMaterial.UNIT_TYPES = UNIT_TYPES;

  return RawMaterial;
};
