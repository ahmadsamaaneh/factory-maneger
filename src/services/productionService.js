const { sequelize, Recipe, RecipeMaterial, RecipeOutput, RawMaterial, Product, ProductionBatch } = require('../models');

function parseHHmmToMinutes(s) {
  if (!s || typeof s !== 'string') return null;
  const m = String(s).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutesToHHmm(total) {
  const m = Math.max(0, Math.min(24 * 60 - 1, total));
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

function normalizeHHmm(s) {
  if (!s || typeof s !== 'string') return null;
  const mins = parseHHmmToMinutes(s);
  if (mins == null) return null;
  return minutesToHHmm(mins);
}

function defaultEndFromStart(startNorm) {
  const sm = parseHHmmToMinutes(startNorm);
  if (sm == null) return null;
  return minutesToHHmm(Math.min(sm + 60, 24 * 60 - 1));
}

async function createRecipe(data, factoryId) {
  const { name, description, production_cost, materials, outputs } = data;

  return sequelize.transaction(async (t) => {
    if (materials?.length) {
      const rawIds = materials
        .filter((m) => (m.input_type || 'raw_material') === 'raw_material')
        .map((m) => m.raw_material_id);
      const inputProductIds = materials
        .filter((m) => (m.input_type || 'raw_material') === 'product')
        .map((m) => m.product_id);

      if (rawIds.length) {
        const rawCount = await RawMaterial.count({
          where: { id: rawIds, ...(factoryId ? { factory_id: factoryId } : {}) },
          transaction: t,
        });
        if (rawCount !== rawIds.length) {
          const err = new Error('One or more raw material inputs are invalid for this factory.');
          err.statusCode = 400;
          throw err;
        }
      }

      if (inputProductIds.length) {
        const prodCount = await Product.count({
          where: { id: inputProductIds, ...(factoryId ? { factory_id: factoryId } : {}) },
          transaction: t,
        });
        if (prodCount !== inputProductIds.length) {
          const err = new Error('One or more product inputs are invalid for this factory.');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    const recipe = await Recipe.create({ name, description, production_cost, factory_id: factoryId }, { transaction: t });

    if (materials && materials.length > 0) {
      const materialRows = materials.map((m) => ({
        recipe_id: recipe.id,
        input_type: m.input_type || 'raw_material',
        raw_material_id: (m.input_type || 'raw_material') === 'raw_material' ? m.raw_material_id : null,
        product_id: (m.input_type || 'raw_material') === 'product' ? m.product_id : null,
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
      {
        association: 'recipeMaterials',
        include: [{ association: 'rawMaterial' }, { association: 'inputProduct' }],
      },
      { association: 'outputs', include: [{ association: 'product' }] },
    ],
    order: [['name', 'ASC']],
  });
}

async function getRecipeById(id, transaction = null, factoryId) {
  const options = {
    where: factoryId ? { id, factory_id: factoryId } : { id },
    include: [
      {
        association: 'recipeMaterials',
        include: [{ association: 'rawMaterial' }, { association: 'inputProduct' }],
      },
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
  const {
    recipe_id,
    quantity_multiplier = 1,
    notes,
    schedule_date,
    start_time,
    end_time,
    status,
  } = data;

  const batchStatus = ['pending', 'in_progress', 'completed', 'cancelled'].includes(status)
    ? status
    : 'completed';

  const schedDate =
    schedule_date && /^\d{4}-\d{2}-\d{2}$/.test(String(schedule_date))
      ? String(schedule_date).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  let st = normalizeHHmm(start_time);
  let en = normalizeHHmm(end_time);
  if (st && en && parseHHmmToMinutes(en) <= parseHHmmToMinutes(st)) {
    en = defaultEndFromStart(st);
  } else if (st && !en) {
    en = defaultEndFromStart(st);
  }

  return sequelize.transaction(async (t) => {
    const recipeWhere = factoryId ? { id: recipe_id, factory_id: factoryId } : { id: recipe_id };
    const recipe = await Recipe.findOne({
      where: recipeWhere,
      include: [
        {
          association: 'recipeMaterials',
          include: [{ association: 'rawMaterial' }, { association: 'inputProduct' }],
        },
        { association: 'outputs', include: [{ association: 'product' }] },
      ],
      transaction: t,
    });

    if (!recipe) {
      const err = new Error('Recipe not found.');
      err.statusCode = 404;
      throw err;
    }

    // ── Deduct recipe inputs (raw materials or products) ─────────────────────
    let rawMaterialsCost = 0;
    for (const rm of recipe.recipeMaterials) {
      const required = parseFloat(rm.quantity_required) * parseFloat(quantity_multiplier);
      const inputType = rm.input_type || (rm.product_id ? 'product' : 'raw_material');

      if (inputType === 'product') {
        const inputProduct = rm.inputProduct || (await Product.findByPk(rm.product_id, { transaction: t }));
        if (!inputProduct) {
          const err = new Error(`Input product ID "${rm.product_id}" not found.`);
          err.statusCode = 404;
          throw err;
        }
        const available = parseFloat(inputProduct.stock_quantity || 0);
        if (available < required) {
          const err = new Error(
            `Insufficient product stock for "${inputProduct.name}". Available: ${available}, Required: ${required}`
          );
          err.statusCode = 400;
          throw err;
        }
        rawMaterialsCost += required * parseFloat(inputProduct.cost || 0);
        await inputProduct.update({ stock_quantity: available - required }, { transaction: t });
      } else {
        const raw = rm.rawMaterial;
        if (!raw) {
          const err = new Error(`Raw material ID "${rm.raw_material_id}" not found.`);
          err.statusCode = 404;
          throw err;
        }
        const available = parseFloat(raw.quantity || 0);
        if (available < required) {
          const err = new Error(
            `Insufficient stock for "${raw.name}". Available: ${available}, Required: ${required}`
          );
          err.statusCode = 400;
          throw err;
        }
        rawMaterialsCost += required * parseFloat(raw.cost_per_unit || 0);
        await raw.update({ quantity: available - required }, { transaction: t });
      }
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
        status: batchStatus,
        schedule_date: schedDate,
        start_time: st,
        end_time: en,
        notes,
        created_by: userId,
      },
      { transaction: t }
    );

    return getBatchById(batch.id, factoryId, t);
  });
}

async function listBatches(query = {}, factoryId) {
  const { date } = query;
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  const rows = await ProductionBatch.findAll({
    where,
    include: [{ association: 'recipe' }, { association: 'creator', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });

  if (!date) return rows;

  return rows.filter((b) => {
    const j = typeof b.toJSON === 'function' ? b.toJSON() : b;
    const created = j.created_at ? new Date(j.created_at).toISOString().slice(0, 10) : '';
    const d = (j.schedule_date && String(j.schedule_date).slice(0, 10)) || created;
    return d === String(date).slice(0, 10);
  });
}

async function getBatchById(id, factoryId, transaction = null) {
  const options = {
    where: factoryId ? { id, factory_id: factoryId } : { id },
    include: [{ association: 'recipe' }, { association: 'creator', attributes: ['id', 'name'] }],
  };
  if (transaction) options.transaction = transaction;
  const batch = await ProductionBatch.findOne(options);
  if (!batch) {
    const err = new Error('Production batch not found.');
    err.statusCode = 404;
    throw err;
  }
  return batch;
}

async function updateBatch(id, data, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const batch = await ProductionBatch.findOne({ where });
  if (!batch) {
    const err = new Error('Production batch not found.');
    err.statusCode = 404;
    throw err;
  }

  const payload = {};
  if (Object.prototype.hasOwnProperty.call(data, 'schedule_date')) {
    payload.schedule_date = data.schedule_date || null;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'status')) {
    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(data.status)) {
      const err = new Error('Invalid batch status.');
      err.statusCode = 400;
      throw err;
    }
    payload.status = data.status;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'start_time')) {
    payload.start_time = data.start_time ? normalizeHHmm(data.start_time) : null;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'end_time')) {
    payload.end_time = data.end_time ? normalizeHHmm(data.end_time) : null;
  }

  const st = payload.start_time !== undefined ? payload.start_time : batch.start_time;
  const en = payload.end_time !== undefined ? payload.end_time : batch.end_time;
  if (st && en) {
    const sm = parseHHmmToMinutes(st);
    const em = parseHHmmToMinutes(en);
    if (sm != null && em != null && em <= sm) {
      const err = new Error('end_time must be after start_time.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (Object.keys(payload).length === 0) {
    return getBatchById(id, factoryId);
  }

  await batch.update(payload);
  return getBatchById(id, factoryId);
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
  updateBatch,
};
