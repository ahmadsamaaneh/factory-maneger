const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const INPUT_TYPE = ['raw_material', 'product'];
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
        allowNull: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      input_type: {
        type: DataTypes.ENUM(...INPUT_TYPE),
        allowNull: false,
        defaultValue: 'raw_material',
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

  RecipeMaterial.INPUT_TYPE = INPUT_TYPE;
  return RecipeMaterial;
};
