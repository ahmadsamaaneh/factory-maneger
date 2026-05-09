-- Cash Van MySQL DDL (Enterprise-ready baseline)
-- Engine: MySQL 8+

CREATE TABLE IF NOT EXISTS cash_van_vehicles (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  plate_number VARCHAR(30) NOT NULL,
  model VARCHAR(120) NULL,
  status ENUM('active', 'maintenance', 'out_of_service') NOT NULL DEFAULT 'active',
  assigned_driver_id CHAR(36) NULL,
  assigned_rep_id CHAR(36) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_vehicles_factory_code (factory_id, code),
  UNIQUE KEY uq_cash_van_vehicles_factory_plate (factory_id, plate_number),
  KEY idx_cash_van_vehicles_factory (factory_id),
  KEY idx_cash_van_vehicles_driver (assigned_driver_id),
  KEY idx_cash_van_vehicles_rep (assigned_rep_id)
);

CREATE TABLE IF NOT EXISTS cash_van_assignments (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  driver_id CHAR(36) NULL,
  rep_id CHAR(36) NOT NULL,
  start_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at DATETIME NULL,
  status ENUM('active', 'ended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_assignments_factory (factory_id),
  KEY idx_cash_van_assignments_vehicle (vehicle_id),
  KEY idx_cash_van_assignments_rep (rep_id)
);

CREATE TABLE IF NOT EXISTS cash_van_loads (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  load_number VARCHAR(100) NOT NULL,
  loaded_at DATETIME NOT NULL,
  status ENUM('draft', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_loads_number (load_number),
  KEY idx_cash_van_loads_factory (factory_id),
  KEY idx_cash_van_loads_vehicle (vehicle_id),
  KEY idx_cash_van_loads_loaded_at (loaded_at)
);

CREATE TABLE IF NOT EXISTS cash_van_load_items (
  id CHAR(36) PRIMARY KEY,
  load_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_load_items_load (load_id),
  KEY idx_cash_van_load_items_product (product_id)
);

CREATE TABLE IF NOT EXISTS cash_van_unloads (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  unload_number VARCHAR(100) NOT NULL,
  unloaded_at DATETIME NOT NULL,
  status ENUM('draft', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_unloads_number (unload_number),
  KEY idx_cash_van_unloads_factory (factory_id),
  KEY idx_cash_van_unloads_vehicle (vehicle_id),
  KEY idx_cash_van_unloads_unloaded_at (unloaded_at)
);

CREATE TABLE IF NOT EXISTS cash_van_unload_items (
  id CHAR(36) PRIMARY KEY,
  unload_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_unload_items_unload (unload_id),
  KEY idx_cash_van_unload_items_product (product_id)
);

CREATE TABLE IF NOT EXISTS cash_van_stocks (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(12,4) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_stocks_unique (factory_id, vehicle_id, product_id),
  KEY idx_cash_van_stocks_vehicle (vehicle_id),
  KEY idx_cash_van_stocks_product (product_id)
);

CREATE TABLE IF NOT EXISTS cash_van_sales (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NULL,
  sale_number VARCHAR(100) NOT NULL,
  sale_type ENUM('cash', 'credit') NOT NULL DEFAULT 'cash',
  subtotal DECIMAL(14,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,4) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14,4) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,4) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  issued_at DATETIME NOT NULL,
  sync_status ENUM('synced', 'pending', 'failed') NOT NULL DEFAULT 'synced',
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_sales_number (sale_number),
  KEY idx_cash_van_sales_factory (factory_id),
  KEY idx_cash_van_sales_vehicle (vehicle_id),
  KEY idx_cash_van_sales_customer (customer_id),
  KEY idx_cash_van_sales_issued_at (issued_at)
);

CREATE TABLE IF NOT EXISTS cash_van_sale_items (
  id CHAR(36) PRIMARY KEY,
  sale_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  discount_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
  line_total DECIMAL(14,4) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_sale_items_sale (sale_id),
  KEY idx_cash_van_sale_items_product (product_id)
);

CREATE TABLE IF NOT EXISTS cash_van_payments (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  sale_id CHAR(36) NOT NULL,
  method ENUM('cash', 'transfer', 'card') NOT NULL DEFAULT 'cash',
  amount DECIMAL(14,4) NOT NULL,
  paid_at DATETIME NOT NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_payments_sale (sale_id),
  KEY idx_cash_van_payments_factory (factory_id),
  KEY idx_cash_van_payments_paid_at (paid_at)
);

CREATE TABLE IF NOT EXISTS cash_van_reconciliations (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  business_date DATE NOT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  cash_collected DECIMAL(14,4) NOT NULL DEFAULT 0,
  variance_value DECIMAL(14,4) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  opened_by CHAR(36) NULL,
  closed_by CHAR(36) NULL,
  opened_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cash_van_reconciliations_day (factory_id, vehicle_id, business_date),
  KEY idx_cash_van_reconciliations_factory (factory_id),
  KEY idx_cash_van_reconciliations_vehicle (vehicle_id),
  KEY idx_cash_van_reconciliations_status (status)
);

CREATE TABLE IF NOT EXISTS cash_van_reconciliation_items (
  id CHAR(36) PRIMARY KEY,
  reconciliation_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  system_qty DECIMAL(12,4) NOT NULL DEFAULT 0,
  physical_qty DECIMAL(12,4) NOT NULL DEFAULT 0,
  variance_qty DECIMAL(12,4) NOT NULL DEFAULT 0,
  variance_value DECIMAL(14,4) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_van_reconciliation_items_reconciliation (reconciliation_id),
  KEY idx_cash_van_reconciliation_items_product (product_id)
);

-- Optional FK section (enable after confirming exact referenced table names in your schema)
-- ALTER TABLE cash_van_vehicles ADD CONSTRAINT fk_cash_van_vehicles_factory
--   FOREIGN KEY (factory_id) REFERENCES factories(id);
