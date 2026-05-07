const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RecipeMaterial = sequelize.define(
    'RecipeMaterial',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      recipe_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      raw_material_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity_required: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0.0001 },
      },
    },
    {
      tableName: 'recipe_materials',
    }
  );

  return RecipeMaterial;
};
