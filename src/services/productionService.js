const { sequelize, Recipe, RecipeMaterial, RecipeOutput, RawMaterial, Product, ProductionBatch } = require('../models');

async function createRecipe(data, factoryId) {
  const { name, description, production_cost, materials, outputs } = data;

  return sequelize.transaction(async (t) => {
    const recipe = await Recipe.create({ name, description, production_cost, factory_id: factoryId }, { transaction: t });

    if (materials && materials.length > 0) {
      const materialRows = materials.map((m) => ({
        recipe_id: recipe.id,
        raw_material_id: m.raw_material_id,
        quantity_required: m.quantity_required,
      }));
      await RecipeMaterial.bulkCreate(materialRows, { transaction: t });
    }

    if (outputs && outputs.length > 0) {
      const outputRows = outputs.map((o) => ({
        recipe_id: recipe.id,
        product_id: o.product_id,
        quantity_produced: o.quantity_produced,
      }));
      await RecipeOutput.bulkCreate(outputRows, { transaction: t });
    }

    return getRecipeById(recipe.id, t, factoryId);
  });
}

async function listRecipes(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return Recipe.findAll({
    where,
    include: [
      { association: 'recipeMaterials', include: [{ association: 'rawMaterial' }] },
      { association: 'outputs', include: [{ association: 'product' }] },
    ],
    order: [['name', 'ASC']],
  });
}

async function getRecipeById(id, transaction = null, factoryId) {
  const options = {
    where: factoryId ? { id, factory_id: factoryId } : { id },
    include: [
      { association: 'recipeMaterials', include: [{ association: 'rawMaterial' }] },
      { association: 'outputs', include: [{ association: 'product' }] },
    ],
  };
  if (transaction) options.transaction = transaction;

  const recipe = await Recipe.findOne(options);
  if (!recipe) {
    const err = new Error('Recipe not found.');
    err.statusCode = 404;
    throw err;
  }
  return recipe;
}

async function updateRecipe(id, data, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const recipe = await Recipe.findOne({ where });
  if (!recipe) {
    const err = new Error('Recipe not found.');
    err.statusCode = 404;
    throw err;
  }
  await recipe.update(data);
  return getRecipeById(id, null, factoryId);
}

async function deleteRecipe(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const recipe = await Recipe.findOne({ where });
  if (!recipe) {
    const err = new Error('Recipe not found.');
    err.statusCode = 404;
    throw err;
  }
  await recipe.destroy();
}

async function runProductionBatch(data, userId, factoryId) {
  const { recipe_id, quantity_multiplier = 1, notes } = data;

  return sequelize.transaction(async (t) => {
    const recipeWhere = factoryId ? { id: recipe_id, factory_id: factoryId } : { id: recipe_id };
    const recipe = await Recipe.findOne({
      where: recipeWhere,
      include: [
        { association: 'recipeMaterials', include: [{ association: 'rawMaterial' }] },
        { association: 'outputs', include: [{ association: 'product' }] },
      ],
      transaction: t,
    });

    if (!recipe) {
      const err = new Error('Recipe not found.');
      err.statusCode = 404;
      throw err;
    }

    // ── Deduct raw materials ──────────────────────────────────────────────────
    let rawMaterialsCost = 0;
    for (const rm of recipe.recipeMaterials) {
      const required = parseFloat(rm.quantity_required) * parseFloat(quantity_multiplier);
      const available = parseFloat(rm.rawMaterial.quantity);

      if (available < required) {
        const err = new Error(
          `Insufficient stock for "${rm.rawMaterial.name}". Available: ${available}, Required: ${required}`
        );
        err.statusCode = 400;
        throw err;
      }

      rawMaterialsCost += required * parseFloat(rm.rawMaterial.cost_per_unit);

      await rm.rawMaterial.update(
        { quantity: available - required },
        { transaction: t }
      );
    }

    // ── Calculate costs ───────────────────────────────────────────────────────
    const productionCost = parseFloat(recipe.production_cost) * parseFloat(quantity_multiplier);
    const totalCost = rawMaterialsCost + productionCost;

    // Total units produced across all outputs
    const totalUnitsProduced = recipe.outputs.reduce(
      (sum, o) => sum + parseFloat(o.quantity_produced) * parseFloat(quantity_multiplier),
      0
    );

    const costPerUnit = totalUnitsProduced > 0 ? totalCost / totalUnitsProduced : 0;

    // ── Add to product stock ──────────────────────────────────────────────────
    for (const output of recipe.outputs) {
      const produced = parseFloat(output.quantity_produced) * parseFloat(quantity_multiplier);
      const product = await Product.findByPk(output.product_id, { transaction: t });

      if (!product) {
        const err = new Error(`Product ID "${output.product_id}" not found.`);
        err.statusCode = 404;
        throw err;
      }

      await product.update(
        {
          stock_quantity: parseFloat(product.stock_quantity) + produced,
          cost: costPerUnit,
        },
        { transaction: t }
      );
    }

    // ── Create batch record ───────────────────────────────────────────────────
    const batchNumber = `BATCH-${Date.now()}`;
    const batch = await ProductionBatch.create(
      {
        recipe_id,
        factory_id: factoryId,
        batch_number: batchNumber,
        quantity_multiplier,
        raw_materials_cost: rawMaterialsCost,
        production_cost: productionCost,
        total_cost: totalCost,
        cost_per_unit: costPerUnit,
        status: 'completed',
        notes,
        created_by: userId,
      },
      { transaction: t }
    );

    return batch;
  });
}

async function listBatches(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return ProductionBatch.findAll({
    where,
    include: [{ association: 'recipe' }, { association: 'creator', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });
}

async function getBatchById(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const batch = await ProductionBatch.findOne({
    where,
    include: [{ association: 'recipe' }, { association: 'creator', attributes: ['id', 'name'] }],
  });
  if (!batch) {
    const err = new Error('Production batch not found.');
    err.statusCode = 404;
    throw err;
  }
  return batch;
}

module.exports = {
  createRecipe,
  listRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  runProductionBatch,
  listBatches,
  getBatchById,
};
