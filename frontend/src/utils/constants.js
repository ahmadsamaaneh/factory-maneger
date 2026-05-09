export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'factory_owner',
  HR: 'hr_manager',
  INVENTORY: 'inventory_manager',
  PRODUCTION: 'production_manager',
  SALES: 'sales_manager',
};

export const UNIT_TYPES = ['kg', 'g', 'liter', 'ml', 'unit', 'carton', 'box', 'meter', 'piece'];

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
};
