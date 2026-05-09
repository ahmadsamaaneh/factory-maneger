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
const Department = require('./Department')(sequelize);
const Employee = require('./Employee')(sequelize);
const EmployeeAttendance = require('./EmployeeAttendance')(sequelize);
const AttendanceLock = require('./AttendanceLock')(sequelize);
const CashVanVehicle = require('./CashVanVehicle')(sequelize);
const CashVanAssignment = require('./CashVanAssignment')(sequelize);
const CashVanLoad = require('./CashVanLoad')(sequelize);
const CashVanLoadItem = require('./CashVanLoadItem')(sequelize);
const CashVanUnload = require('./CashVanUnload')(sequelize);
const CashVanUnloadItem = require('./CashVanUnloadItem')(sequelize);
const CashVanStock = require('./CashVanStock')(sequelize);
const CashVanSale = require('./CashVanSale')(sequelize);
const CashVanSaleItem = require('./CashVanSaleItem')(sequelize);
const CashVanPayment = require('./CashVanPayment')(sequelize);
const CashVanReconciliation = require('./CashVanReconciliation')(sequelize);
const CashVanReconciliationItem = require('./CashVanReconciliationItem')(sequelize);
const OperationalExpense = require('./OperationalExpense')(sequelize);
const ExpenseBudget = require('./ExpenseBudget')(sequelize);

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
RecipeMaterial.belongsTo(Product, { foreignKey: 'product_id', as: 'inputProduct' });

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

// ── HR: Departments & Employees ─────────────────────────────────────────────
Factory.hasMany(Department, { foreignKey: 'factory_id', as: 'departments' });
Department.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });

Factory.hasMany(Employee, { foreignKey: 'factory_id', as: 'employees' });
Employee.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'linkedUser' });
User.hasOne(Employee, { foreignKey: 'user_id', as: 'employeeProfile' });

Factory.hasMany(EmployeeAttendance, { foreignKey: 'factory_id', as: 'attendanceRecords' });
EmployeeAttendance.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
Employee.hasMany(EmployeeAttendance, { foreignKey: 'employee_id', as: 'attendance' });
EmployeeAttendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Factory.hasMany(AttendanceLock, { foreignKey: 'factory_id', as: 'attendanceLocks' });
AttendanceLock.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
AttendanceLock.belongsTo(User, { foreignKey: 'locked_by', as: 'locker' });

// ── Cash Van ──────────────────────────────────────────────────────────────────
Factory.hasMany(CashVanVehicle, { foreignKey: 'factory_id', as: 'cashVanVehicles' });
CashVanVehicle.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.belongsTo(User, { foreignKey: 'assigned_driver_id', as: 'driver' });
CashVanVehicle.belongsTo(User, { foreignKey: 'assigned_rep_id', as: 'salesRep' });

Factory.hasMany(CashVanAssignment, { foreignKey: 'factory_id', as: 'cashVanAssignments' });
CashVanAssignment.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanAssignment, { foreignKey: 'vehicle_id', as: 'assignments' });
CashVanAssignment.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanAssignment.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
CashVanAssignment.belongsTo(User, { foreignKey: 'rep_id', as: 'rep' });

Factory.hasMany(CashVanLoad, { foreignKey: 'factory_id', as: 'cashVanLoads' });
CashVanLoad.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanLoad, { foreignKey: 'vehicle_id', as: 'loads' });
CashVanLoad.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanLoad.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
CashVanLoad.hasMany(CashVanLoadItem, { foreignKey: 'load_id', as: 'items' });
CashVanLoadItem.belongsTo(CashVanLoad, { foreignKey: 'load_id', as: 'load' });
CashVanLoadItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Factory.hasMany(CashVanUnload, { foreignKey: 'factory_id', as: 'cashVanUnloads' });
CashVanUnload.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanUnload, { foreignKey: 'vehicle_id', as: 'unloads' });
CashVanUnload.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanUnload.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
CashVanUnload.hasMany(CashVanUnloadItem, { foreignKey: 'unload_id', as: 'items' });
CashVanUnloadItem.belongsTo(CashVanUnload, { foreignKey: 'unload_id', as: 'unload' });
CashVanUnloadItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Factory.hasMany(CashVanStock, { foreignKey: 'factory_id', as: 'cashVanStocks' });
CashVanStock.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanStock, { foreignKey: 'vehicle_id', as: 'stocks' });
CashVanStock.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanStock.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Factory.hasMany(CashVanSale, { foreignKey: 'factory_id', as: 'cashVanSales' });
CashVanSale.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanSale, { foreignKey: 'vehicle_id', as: 'sales' });
CashVanSale.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanSale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
CashVanSale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
CashVanSale.hasMany(CashVanSaleItem, { foreignKey: 'sale_id', as: 'items' });
CashVanSaleItem.belongsTo(CashVanSale, { foreignKey: 'sale_id', as: 'sale' });
CashVanSaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
CashVanSale.hasMany(CashVanPayment, { foreignKey: 'sale_id', as: 'payments' });
CashVanPayment.belongsTo(CashVanSale, { foreignKey: 'sale_id', as: 'sale' });
CashVanPayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Factory.hasMany(CashVanReconciliation, { foreignKey: 'factory_id', as: 'cashVanReconciliations' });
CashVanReconciliation.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
CashVanVehicle.hasMany(CashVanReconciliation, { foreignKey: 'vehicle_id', as: 'reconciliations' });
CashVanReconciliation.belongsTo(CashVanVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
CashVanReconciliation.belongsTo(User, { foreignKey: 'opened_by', as: 'openedByUser' });
CashVanReconciliation.belongsTo(User, { foreignKey: 'closed_by', as: 'closedByUser' });
CashVanReconciliation.hasMany(CashVanReconciliationItem, {
  foreignKey: 'reconciliation_id',
  as: 'items',
});
CashVanReconciliationItem.belongsTo(CashVanReconciliation, {
  foreignKey: 'reconciliation_id',
  as: 'reconciliation',
});
CashVanReconciliationItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Factory.hasMany(OperationalExpense, { foreignKey: 'factory_id', as: 'operationalExpenses' });
OperationalExpense.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
OperationalExpense.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(OperationalExpense, { foreignKey: 'department_id', as: 'operationalExpenses' });
OperationalExpense.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(OperationalExpense, { foreignKey: 'employee_id', as: 'operationalExpenses' });
OperationalExpense.belongsTo(User, { foreignKey: 'created_by', as: 'creator', constraints: false });

Factory.hasMany(ExpenseBudget, { foreignKey: 'factory_id', as: 'expenseBudgets' });
ExpenseBudget.belongsTo(Factory, { foreignKey: 'factory_id', as: 'factory' });
ExpenseBudget.belongsTo(User, { foreignKey: 'created_by', as: 'creator', constraints: false });

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
  Department,
  Employee,
  EmployeeAttendance,
  AttendanceLock,
  CashVanVehicle,
  CashVanAssignment,
  CashVanLoad,
  CashVanLoadItem,
  CashVanUnload,
  CashVanUnloadItem,
  CashVanStock,
  CashVanSale,
  CashVanSaleItem,
  CashVanPayment,
  CashVanReconciliation,
  CashVanReconciliationItem,
  OperationalExpense,
  ExpenseBudget,
};
