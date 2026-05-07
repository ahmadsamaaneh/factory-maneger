const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MaterialPurchase = sequelize.define(
    'MaterialPurchase',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      material_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      // Array of { label: string, quantity: number }
      // First level = outer container (e.g. "Sack": 10)
      // Subsequent levels = per-parent ratio (e.g. "KG per Sack": 25)
      // total_base_quantity = product of all level quantities
      levels: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      total_cost: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      // Total quantity in material's base unit
      total_base_quantity: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      // Snapshot: purchase_unit_cost = total_cost / total_base_quantity
      purchase_unit_cost: {
        type: DataTypes.DECIMAL(14, 6),
        allowNull: false,
        validate: { min: 0 },
      },
      // Weighted-avg cost_per_base_unit AFTER this purchase was applied
      resulting_cost_per_base_unit: {
        type: DataTypes.DECIMAL(14, 6),
        allowNull: false,
        validate: { min: 0 },
      },
      supplier: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'material_purchases',
      indexes: [
        { fields: ['material_id'] },
        { fields: ['factory_id'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return MaterialPurchase;
};
