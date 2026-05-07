const productService = require('../services/productService');

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body, req.factoryId);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await productService.listProducts(req.query, req.factoryId);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id, req.factoryId);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id, req.factoryId);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
