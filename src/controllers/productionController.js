const productionService = require('../services/productionService');

async function createRecipe(req, res, next) {
  try {
    const recipe = await productionService.createRecipe(req.body, req.factoryId);
    res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    next(err);
  }
}

async function listRecipes(req, res, next) {
  try {
    const recipes = await productionService.listRecipes(req.factoryId);
    res.json({ success: true, data: recipes });
  } catch (err) {
    next(err);
  }
}

async function getRecipeById(req, res, next) {
  try {
    const recipe = await productionService.getRecipeById(req.params.id, null, req.factoryId);
    res.json({ success: true, data: recipe });
  } catch (err) {
    next(err);
  }
}

async function updateRecipe(req, res, next) {
  try {
    const recipe = await productionService.updateRecipe(req.params.id, req.body, req.factoryId);
    res.json({ success: true, data: recipe });
  } catch (err) {
    next(err);
  }
}

async function deleteRecipe(req, res, next) {
  try {
    await productionService.deleteRecipe(req.params.id, req.factoryId);
    res.json({ success: true, message: 'Recipe deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function runBatch(req, res, next) {
  try {
    const batch = await productionService.runProductionBatch(req.body, req.user.id, req.factoryId);
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

async function listBatches(req, res, next) {
  try {
    const batches = await productionService.listBatches(req.factoryId);
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
}

async function getBatchById(req, res, next) {
  try {
    const batch = await productionService.getBatchById(req.params.id, req.factoryId);
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRecipe, listRecipes, getRecipeById, updateRecipe, deleteRecipe, runBatch, listBatches, getBatchById };
