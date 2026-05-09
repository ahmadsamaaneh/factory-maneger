const { DataTypes } = require('sequelize');

const STATUS = ['pending', 'in_progress', 'completed', 'cancelled'];

module.exports = (sequelize) => {
  const ProductionBatch = sequelize.define(
    'ProductionBatch',
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
      batch_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      quantity_multiplier: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 1,
        comment: 'How many times the recipe is multiplied for this batch',
      },
      raw_materials_cost: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total cost of raw materials consumed',
      },
      production_cost: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Overhead / labour cost for this batch',
      },
      total_cost: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'raw_materials_cost + production_cost',
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: true,
        comment: 'total_cost / total units produced',
      },
      status: {
        type: DataTypes.ENUM(...STATUS),
        defaultValue: 'completed',
      },
      /** يوم الجدولة على المخطط الزمني (YYYY-MM-DD) */
      schedule_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      /** بداية الدفعة على مدار 24 ساعة (HH:mm) */
      start_time: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      /** نهاية الدفعة (HH:mm) */
      end_time: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'production_batches',
    }
  );

  ProductionBatch.STATUS = STATUS;

  return ProductionBatch;
};
