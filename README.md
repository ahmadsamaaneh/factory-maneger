# Factory Management System (ERP)

A full-featured ERP backend built with **Node.js**, **Express**, and **PostgreSQL** (Sequelize ORM).

---

## Table of Contents

- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Setup](#setup)
- [API Reference](#api-reference)
- [Role Permissions](#role-permissions)

---

## Project Structure

```
src/
├── config/
│   ├── database.js         # Sequelize DB config
│   └── jwt.js              # JWT secret & expiry
├── controllers/            # Request handlers (thin layer)
├── middleware/
│   ├── authenticate.js     # JWT verification
│   ├── authorize.js        # RBAC guard
│   ├── validate.js         # express-validator error formatter
│   ├── errorHandler.js     # Global error handler
│   └── notFound.js         # 404 handler
├── models/                 # Sequelize models + associations
├── routes/                 # Express routers
├── seeders/                # DB seed data
├── services/               # Business logic
├── validations/            # express-validator rule sets
├── app.js                  # Express app setup
└── server.js               # DB connect + HTTP listen
```

---

## Database Schema

```
users               – all system users (self-referential via created_by)
raw_materials       – inventory items with quantity & cost
recipes             – production blueprints
recipe_materials    – raw materials needed per recipe (join table)
recipe_outputs      – products produced per recipe (join table)
products            – finished goods with stock & pricing
production_batches  – executed production runs
customers           – buyer records
sales_orders        – customer orders
sales_order_items   – line items per order (join table)
```

---

## Setup

### 1. Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 4. Create the database

```sql
CREATE DATABASE factory_management;
```

### 5. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The server runs `sequelize.sync({ alter: true })` on startup — tables are created/updated automatically.

### 6. Seed admin user (optional)

```bash
npm run db:seed
```

Default admin credentials:
- **Email:** `admin@factory.com`
- **Password:** `Admin@123456`

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/change-password` | Change own password |

**Login example:**
```json
POST /api/v1/auth/login
{
  "email": "admin@factory.com",
  "password": "Admin@123456"
}
```

---

### Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/users` | Create a user | admin, factory_owner |
| GET | `/users` | List users | admin, factory_owner |
| GET | `/users/:id` | Get user by ID | admin, factory_owner |
| PUT | `/users/:id` | Update user | admin, factory_owner |
| DELETE | `/users/:id` | Delete user | admin |

**Create factory owner (admin only):**
```json
POST /api/v1/users
{
  "name": "John Owner",
  "email": "owner@factory.com",
  "password": "Password123",
  "role": "factory_owner"
}
```

**Create staff (factory_owner only):**
```json
POST /api/v1/users
{
  "name": "Sara Manager",
  "email": "sara@factory.com",
  "password": "Password123",
  "role": "inventory_manager"
}
```

---

### Inventory (Raw Materials)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/inventory` | Create material | admin, factory_owner, inventory_manager |
| GET | `/inventory` | List materials | + production_manager |
| GET | `/inventory/:id` | Get material | + production_manager |
| PUT | `/inventory/:id` | Update material | admin, factory_owner, inventory_manager |
| DELETE | `/inventory/:id` | Delete material | admin, factory_owner |
| PATCH | `/inventory/:id/adjust` | Adjust quantity | admin, factory_owner, inventory_manager |

**Create material:**
```json
POST /api/v1/inventory
{
  "name": "Steel Rod",
  "unit_type": "kg",
  "quantity": 500,
  "cost_per_unit": 2.5,
  "quality": "Grade A",
  "reorder_level": 50
}
```

**Adjust quantity:**
```json
PATCH /api/v1/inventory/:id/adjust
{
  "delta": 100,
  "operation": "add"
}
```
> `operation` values: `add` | `subtract` | `set`

**Query filters:** `?search=steel&unit_type=kg&low_stock=true`

---

### Products

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/products` | Create product | admin, factory_owner, production_manager |
| GET | `/products` | List products | all roles |
| GET | `/products/:id` | Get product | all roles |
| PUT | `/products/:id` | Update product | admin, factory_owner, production_manager |
| DELETE | `/products/:id` | Delete product | admin, factory_owner |

**Create product:**
```json
POST /api/v1/products
{
  "name": "Steel Beam 2m",
  "sku": "SB-2M-001",
  "selling_price": 45.00,
  "cost": 28.00,
  "stock_quantity": 0
}
```

---

### Production

#### Recipes

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/production/recipes` | Create recipe | admin, factory_owner, production_manager |
| GET | `/production/recipes` | List recipes | admin, factory_owner, production_manager |
| GET | `/production/recipes/:id` | Get recipe | admin, factory_owner, production_manager |
| PUT | `/production/recipes/:id` | Update recipe | admin, factory_owner, production_manager |
| DELETE | `/production/recipes/:id` | Delete recipe | admin, factory_owner |

**Create recipe:**
```json
POST /api/v1/production/recipes
{
  "name": "Steel Beam Production",
  "description": "2m steel beam from rods",
  "production_cost": 50.00,
  "materials": [
    { "raw_material_id": "<uuid>", "quantity_required": 10 },
    { "raw_material_id": "<uuid>", "quantity_required": 2 }
  ],
  "outputs": [
    { "product_id": "<uuid>", "quantity_produced": 5 }
  ]
}
```

#### Production Batches

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/production/batches` | Run a production batch | admin, factory_owner, production_manager |
| GET | `/production/batches` | List batches | admin, factory_owner, production_manager |
| GET | `/production/batches/:id` | Get batch | admin, factory_owner, production_manager |

**Run batch:**
```json
POST /api/v1/production/batches
{
  "recipe_id": "<uuid>",
  "quantity_multiplier": 2,
  "notes": "Urgent order batch"
}
```

> Running a batch **automatically deducts** raw materials from inventory and **adds** finished products to stock. It also calculates `total_cost` and `cost_per_unit`.

---

### Sales

#### Customers

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/sales/customers` | Create customer | admin, factory_owner, sales_manager |
| GET | `/sales/customers` | List customers | admin, factory_owner, sales_manager |
| GET | `/sales/customers/:id` | Get customer | admin, factory_owner, sales_manager |
| PUT | `/sales/customers/:id` | Update customer | admin, factory_owner, sales_manager |
| DELETE | `/sales/customers/:id` | Deactivate customer | admin, factory_owner |

#### Orders

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/sales/orders` | Create order | admin, factory_owner, sales_manager |
| GET | `/sales/orders` | List orders | admin, factory_owner, sales_manager |
| GET | `/sales/orders/:id` | Get order | admin, factory_owner, sales_manager |
| PATCH | `/sales/orders/:id/status` | Update order status | admin, factory_owner, sales_manager |

**Create order:**
```json
POST /api/v1/sales/orders
{
  "customer_id": "<uuid>",
  "discount": 10.00,
  "notes": "Rush delivery",
  "items": [
    { "product_id": "<uuid>", "quantity": 3, "unit_price": 45.00 },
    { "product_id": "<uuid>", "quantity": 1 }
  ]
}
```

> Creating an order **automatically deducts** stock from products. If `unit_price` is omitted, the product's `selling_price` is used.

**Update order status:**
```json
PATCH /api/v1/sales/orders/:id/status
{
  "status": "shipped"
}
```
> Status flow: `pending` → `confirmed` → `shipped` → `delivered` | `cancelled`

**Query filters:** `?status=confirmed&customer_id=<uuid>`

---

### Reports

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/reports/inventory` | Inventory report | admin, factory_owner, inventory_manager |
| GET | `/reports/production` | Production report | admin, factory_owner, production_manager |
| GET | `/reports/sales` | Sales report | admin, factory_owner, sales_manager |
| GET | `/reports/profit` | Profit report | admin, factory_owner |

**Date filters (all reports):** `?from=2024-01-01&to=2024-12-31`

**Profit report response:**
```json
{
  "total_revenue": 15000,
  "total_cogs": 8400,
  "gross_profit": 6600,
  "gross_margin_percent": "44.00",
  "total_production_cost": 1200,
  "net_profit": 5400
}
```

---

## Role Permissions

| Feature | admin | factory_owner | inventory_manager | production_manager | sales_manager |
|---------|:-----:|:-------------:|:-----------------:|:-----------------:|:-------------:|
| Create factory owner | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create staff | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage inventory | ✅ | ✅ | ✅ | 👁 | ❌ |
| Manage products | ✅ | ✅ | ❌ | ✅ | 👁 |
| Manage recipes | ✅ | ✅ | ❌ | ✅ | ❌ |
| Run production batches | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage customers | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create sales orders | ✅ | ✅ | ❌ | ❌ | ✅ |
| View all reports | ✅ | ✅ | 📦 | 🏭 | 💰 |
| View profit report | ✅ | ✅ | ❌ | ❌ | ❌ |

> 👁 = read-only &nbsp;&nbsp; 📦 = inventory only &nbsp;&nbsp; 🏭 = production only &nbsp;&nbsp; 💰 = sales only
