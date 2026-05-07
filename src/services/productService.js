const { Product } = require('../models');
const { Op } = require('sequelize');

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
  return Product.findAll({ where, order: [['name', 'ASC']] });
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
  return product;
}

async function updateProduct(id, data, factoryId) {
  const product = await getProductById(id, factoryId);
  await product.update(data);
  return product;
}

async function deleteProduct(id, factoryId) {
  const product = await getProductById(id, factoryId);
  await product.destroy();
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
