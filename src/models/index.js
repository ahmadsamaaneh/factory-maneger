const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const Factory = require('./Factory')(sequelize);
const User = require('./User')(sequelize);
const RawMaterial = require('./RawMaterial')(sequelize);
const Recipe = require('./Recipe')(sequelize);
const RecipeMaterial = require('./RecipeMaterial')(sequelize);
const RecipeOutput = require('./RecipeOutput')(sequelize);
const Product = require('./Product')(sequelize);
const ProductionBatch = require('./ProductionBatch')(sequelize);
const Customer = require('./Customer')(sequelize);
const SalesOrder = require('./SalesOrder')(sequelize);
const SalesOrderItem = require('./SalesOrderItem')(sequelize);
const MaterialPurchase = require('./MaterialPurchase')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────

// Factory <-> User
Factory.hasMany(User, { foreignKey: 'factory_id', as: 'users' });
User.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });

// Factory has one owner (owner_id -> users.id)
Factory.belongsTo(User, { foreignKey: 'owner_id', as: 'owner', constraints: false });
User.hasMany(Factory, { foreignKey: 'owner_id', as: 'ownedFactories', constraints: false });

// Factory -> business entities
Factory.hasMany(RawMaterial, { foreignKey: 'factory_id' });
RawMaterial.belongsTo(Factory, { foreignKey: 'factory_id' });

Factory.hasMany(Product, { foreignKey: 'factory_id' });
Product.belongsTo(Factory, { foreignKey: 'factory_id' });

Factory.hasMany(Recipe, { foreignKey: 'factory_id' });
Recipe.belongsTo(Factory, { foreignKey: 'factory_id' });

Factory.hasMany(Customer, { foreignKey: 'factory_id' });
Customer.belongsTo(Factory, { foreignKey: 'factory_id' });

Factory.hasMany(SalesOrder, { foreignKey: 'factory_id' });
SalesOrder.belongsTo(Factory, { foreignKey: 'factory_id' });

Factory.hasMany(ProductionBatch, { foreignKey: 'factory_id' });
ProductionBatch.belongsTo(Factory, { foreignKey: 'factory_id' });

// User: self-referential (factory_owner creates staff)
User.hasMany(User, { foreignKey: 'created_by', as: 'staff' });
User.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Recipe <-> RawMaterial (many-to-many through RecipeMaterial)
Recipe.belongsToMany(RawMaterial, {
  through: RecipeMaterial,
  foreignKey: 'recipe_id',
  otherKey: 'raw_material_id',
  as: 'materials',
});
RawMaterial.belongsToMany(Recipe, {
  through: RecipeMaterial,
  foreignKey: 'raw_material_id',
  otherKey: 'recipe_id',
  as: 'recipes',
});
Recipe.hasMany(RecipeMaterial, { foreignKey: 'recipe_id', as: 'recipeMaterials' });
RecipeMaterial.belongsTo(Recipe, { foreignKey: 'recipe_id' });
RecipeMaterial.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });

// Recipe -> RecipeOutput (one-to-many)
Recipe.hasMany(RecipeOutput, { foreignKey: 'recipe_id', as: 'outputs' });
RecipeOutput.belongsTo(Recipe, { foreignKey: 'recipe_id' });
RecipeOutput.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(RecipeOutput, { foreignKey: 'product_id' });

// ProductionBatch -> Recipe
ProductionBatch.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'recipe' });
Recipe.hasMany(ProductionBatch, { foreignKey: 'recipe_id', as: 'batches' });
ProductionBatch.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// SalesOrder -> Customer
SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(SalesOrder, { foreignKey: 'customer_id', as: 'orders' });
SalesOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// SalesOrder <-> Product (many-to-many through SalesOrderItem)
SalesOrder.belongsToMany(Product, {
  through: SalesOrderItem,
  foreignKey: 'sales_order_id',
  otherKey: 'product_id',
  as: 'products',
});
Product.belongsToMany(SalesOrder, {
  through: SalesOrderItem,
  foreignKey: 'product_id',
  otherKey: 'sales_order_id',
  as: 'salesOrders',
});
SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id', as: 'items' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// MaterialPurchase -> RawMaterial / Factory / User
RawMaterial.hasMany(MaterialPurchase, { foreignKey: 'material_id', as: 'purchases' });
MaterialPurchase.belongsTo(RawMaterial, { foreignKey: 'material_id', as: 'material' });
Factory.hasMany(MaterialPurchase, { foreignKey: 'factory_id' });
MaterialPurchase.belongsTo(Factory, { foreignKey: 'factory_id' });
MaterialPurchase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  Sequelize,
  Factory,
  User,
  RawMaterial,
  Recipe,
  RecipeMaterial,
  RecipeOutput,
  Product,
  ProductionBatch,
  Customer,
  SalesOrder,
  SalesOrderItem,
  MaterialPurchase,
};
