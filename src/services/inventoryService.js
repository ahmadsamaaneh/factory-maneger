const { RawMaterial } = require('../models');
const { Op } = require('sequelize');

async function createMaterial(data, factoryId) {
  const where = { name: data.name };
  if (factoryId) where.factory_id = factoryId;

  const existing = await RawMaterial.findOne({ where });
  if (existing) {
    const err = new Error('A material with this name already exists in this factory.');
    err.statusCode = 409;
    throw err;
  }
  return RawMaterial.create({
    ...data,
    quantity: data.quantity ?? 0,
    cost_per_unit: data.cost_per_unit ?? 0,
    factory_id: factoryId,
  });
}

async function listMaterials({ search, unit_type, low_stock } = {}, factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  if (unit_type) {
    where.unit_type = unit_type;
  }
  if (low_stock === 'true') {
    where[Op.and] = [
      ...(where[Op.and] || []),
      { reorder_level: { [Op.gt]: 0 } },
      { quantity: { [Op.lte]: RawMaterial.sequelize.col('reorder_level') } },
    ];
  }

  return RawMaterial.findAll({ where, order: [['name', 'ASC']] });
}

async function getMaterialById(id, factoryId) {
  const where = { id };
  if (factoryId) where.factory_id = factoryId;

  const material = await RawMaterial.findOne({ where });
  if (!material) {
    const err = new Error('Raw material not found.');
    err.statusCode = 404;
    throw err;
  }
  return material;
}

async function updateMaterial(id, data, factoryId) {
  const material = await getMaterialById(id, factoryId);
  await material.update(data);
  return material;
}

async function deleteMaterial(id, factoryId) {
  const material = await getMaterialById(id, factoryId);
  await material.destroy();
}

async function adjustQuantity(id, delta, operation = 'add', factoryId) {
  const material = await getMaterialById(id, factoryId);
  const current = parseFloat(material.quantity);
  const change = parseFloat(delta);

  let newQty;
  if (operation === 'add') {
    newQty = current + change;
  } else if (operation === 'subtract') {
    newQty = current - change;
    if (newQty < 0) {
      const err = new Error(`Insufficient stock for material "${material.name}". Available: ${current}, Requested: ${change}`);
      err.statusCode = 400;
      throw err;
    }
  } else {
    newQty = change;
  }

  await material.update({ quantity: newQty });
  return material;
}

module.exports = {
  createMaterial,
  listMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  adjustQuantity,
};
