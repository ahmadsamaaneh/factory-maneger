const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RecipeOutput = sequelize.define(
    'RecipeOutput',
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
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity_produced: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0.0001 },
        comment: 'Units of this product produced per batch run',
      },
    },
    {
      tableName: 'recipe_outputs',
    }
  );

  return RecipeOutput;
};
