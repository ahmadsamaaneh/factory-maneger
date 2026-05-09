const { Product, Recipe } = require('../models');
const { Op } = require('sequelize');

/** نفس منطق runProductionBatch مع multiplier = 1: (مواد + تكلفة إنتاج ثابتة) / مجموع وحدات المخرجات */
function costPerUnitFromRecipe(recipe) {
  let rawMaterialsCost = 0;
  for (const rm of recipe.recipeMaterials || []) {
    rawMaterialsCost +=
      parseFloat(rm.quantity_required || 0) * parseFloat(rm.rawMaterial?.cost_per_unit || 0);
  }
  const productionCost = parseFloat(recipe.production_cost || 0);
  const totalCost = rawMaterialsCost + productionCost;
  const totalUnitsProduced = (recipe.outputs || []).reduce(
    (sum, o) => sum + parseFloat(o.quantity_produced || 0),
    0
  );
  if (totalUnitsProduced <= 0) return null;
  return totalCost / totalUnitsProduced;
}

/**
 * لكل منتج يظهر في مخرجات وصفة: متوسط تكلفة الوحدة المشتقة من تلك الوصفات (أسعار مواد حالية).
 */
async function getRecipeCostPerUnitByProductId(factoryId) {
  const recipeWhere = factoryId != null && factoryId !== undefined ? { factory_id: factoryId } : {};
  const recipes = await Recipe.findAll({
    where: recipeWhere,
    include: [
      { association: 'recipeMaterials', include: [{ association: 'rawMaterial' }] },
      { association: 'outputs' },
    ],
  });

  const sums = new Map();
  for (const r of recipes) {
    const cpu = costPerUnitFromRecipe(r);
    if (cpu == null || !Number.isFinite(cpu)) continue;
    const seen = new Set();
    for (const out of r.outputs || []) {
      const pid = out.product_id;
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      const agg = sums.get(pid) || { total: 0, n: 0 };
      agg.total += cpu;
      agg.n += 1;
      sums.set(pid, agg);
    }
  }

  const averages = new Map();
  for (const [pid, agg] of sums) {
    if (agg.n > 0) averages.set(pid, agg.total / agg.n);
  }
  return averages;
}

function applyRecipeCostToProductJson(json, averages) {
  const v = averages.get(json.id);
  if (v != null && Number.isFinite(v)) json.cost = v;
  return json;
}

async function createProduct(data, factoryId) {
  const where = { name: data.name };
  if (factoryId) where.factory_id = factoryId;

  const existing = await Product.findOne({ where });
  if (existing) {
    const err = new Error('A product with this name already exists in this factory.');
    err.statusCode = 409;
    throw err;
  }
  return Product.create({ ...data, factory_id: factoryId });
}

async function listProducts({ search } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { sku: { [Op.iLike]: `%${search}%` } },
    ];
  }
  const products = await Product.findAll({ where, order: [['name', 'ASC']] });
  const averages = await getRecipeCostPerUnitByProductId(factoryId);
  return products.map((p) => applyRecipeCostToProductJson(p.toJSON(), averages));
}

async function getProductById(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;

  const product = await Product.findOne({ where });
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  const averages = await getRecipeCostPerUnitByProductId(factoryId);
  return applyRecipeCostToProductJson(product.toJSON(), averages);
}

async function updateProduct(id, data, factoryId) {
  const existing = await Product.findOne({ where: factoryId ? { id, factory_id: factoryId } : { id } });
  if (!existing) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  await existing.update(data);
  const averages = await getRecipeCostPerUnitByProductId(factoryId);
  return applyRecipeCostToProductJson(existing.toJSON(), averages);
}

async function deleteProduct(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;
  const product = await Product.findOne({ where });
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  await product.destroy();
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
