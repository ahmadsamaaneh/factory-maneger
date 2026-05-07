const { RawMaterial, MaterialPurchase, User, sequelize } = require('../models');

/**
 * Compute total quantity in BASE units from a levels array.
 * Example: [{quantity:10},{quantity:25}] => 250
 */
function computeTotalBaseQuantity(levels) {
  return levels.reduce((acc, lvl) => acc * Number(lvl.quantity), 1);
}

/**
 * Create a material purchase, update inventory qty, and recalculate
 * the weighted-average cost_per_base_unit (stored in RawMaterial.cost_per_unit).
 *
 * All work is wrapped in a DB transaction to guarantee consistency.
 */
async function createPurchase(materialId, body, userId, factoryId) {
  const { levels, total_cost, supplier, note } = body;

  // ── Validate ──
  if (!Array.isArray(levels) || levels.length === 0) {
    const err = new Error('At least one unit level is required.');
    err.statusCode = 400;
    throw err;
  }
  for (const [i, lvl] of levels.entries()) {
    if (!lvl || !lvl.label || !String(lvl.label).trim()) {
      const err = new Error(`Level ${i + 1}: label is required.`);
      err.statusCode = 400;
      throw err;
    }
    const q = Number(lvl.quantity);
    if (!Number.isFinite(q) || q <= 0) {
      const err = new Error(`Level ${i + 1} ("${lvl.label}"): quantity must be greater than 0.`);
      err.statusCode = 400;
      throw err;
    }
  }
  const totalCost = Number(total_cost);
  if (!Number.isFinite(totalCost) || totalCost <= 0) {
    const err = new Error('total_cost must be greater than 0.');
    err.statusCode = 400;
    throw err;
  }

  const totalBaseQty = computeTotalBaseQuantity(levels);
  if (totalBaseQty <= 0) {
    const err = new Error('Total base quantity must be greater than 0.');
    err.statusCode = 400;
    throw err;
  }

  const purchaseUnitCost = totalCost / totalBaseQty;

  return sequelize.transaction(async (t) => {
    const where = { id: materialId };
    if (factoryId) where.factory_id = factoryId;

    const material = await RawMaterial.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
    if (!material) {
      const err = new Error('Raw material not found.');
      err.statusCode = 404;
      throw err;
    }

    const existingQty  = Number(material.quantity)      || 0;
    const existingCost = Number(material.cost_per_unit) || 0;

    // Weighted-average:
    //   new_cost = (existing_qty * existing_cost + purchase_total_cost) / (existing_qty + purchase_qty)
    const newTotalQty  = existingQty + totalBaseQty;
    const existingValue = existingQty * existingCost;
    const newCostPerBaseUnit = newTotalQty > 0
      ? (existingValue + totalCost) / newTotalQty
      : purchaseUnitCost;

    await material.update(
      { quantity: newTotalQty, cost_per_unit: newCostPerBaseUnit },
      { transaction: t }
    );

    // created_by must reference a real user; system-admin isn't in DB
    const isDbUser = userId && userId !== 'system-admin';

    const purchase = await MaterialPurchase.create(
      {
        material_id: material.id,
        factory_id: material.factory_id,
        levels,
        total_cost: totalCost,
        total_base_quantity: totalBaseQty,
        purchase_unit_cost: purchaseUnitCost,
        resulting_cost_per_base_unit: newCostPerBaseUnit,
        supplier: supplier?.trim() || null,
        note: note?.trim() || null,
        created_by: isDbUser ? userId : null,
      },
      { transaction: t }
    );

    return { purchase, material };
  });
}

async function listPurchases({ material_id, limit = 50 } = {}, factoryId) {
  const where = {};
  if (factoryId)    where.factory_id  = factoryId;
  if (material_id)  where.material_id = material_id;

  return MaterialPurchase.findAll({
    where,
    include: [
      { model: RawMaterial, as: 'material', attributes: ['id', 'name', 'unit_type'] },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'], required: false },
    ],
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 50, 200),
  });
}

/**
 * Preview calculations without persisting — used by the frontend form.
 */
function previewPurchase({ levels, total_cost, existing_quantity = 0, existing_cost_per_base_unit = 0 }) {
  if (!Array.isArray(levels) || levels.length === 0) return null;

  const qtys = levels.map((l) => Number(l.quantity));
  if (qtys.some((q) => !Number.isFinite(q) || q <= 0)) return null;

  const totalCost = Number(total_cost);
  if (!Number.isFinite(totalCost) || totalCost <= 0) return null;

  const totalBase = qtys.reduce((a, b) => a * b, 1);
  const unitCost = totalCost / totalBase;

  const eQty  = Number(existing_quantity)            || 0;
  const eCost = Number(existing_cost_per_base_unit)  || 0;
  const newTotalQty = eQty + totalBase;
  const newCost = newTotalQty > 0 ? (eQty * eCost + totalCost) / newTotalQty : unitCost;

  return {
    total_base_quantity: totalBase,
    purchase_unit_cost: unitCost,
    new_total_quantity: newTotalQty,
    new_cost_per_base_unit: newCost,
  };
}

module.exports = { createPurchase, listPurchases, previewPurchase, computeTotalBaseQuantity };
