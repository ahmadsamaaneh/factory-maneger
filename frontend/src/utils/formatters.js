export const fmt = {
  currency: (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v ?? 0),

  number: (v, decimals = 2) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(v ?? 0),

  date: (v) =>
    v ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(v)) : '—',

  dateTime: (v) =>
    v
      ? new Intl.DateTimeFormat('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }).format(new Date(v))
      : '—',

  percent: (v) => `${Number(v ?? 0).toFixed(1)}%`,

  role: (r) =>
    ({
      admin: 'Admin',
      factory_owner: 'Factory Owner',
      inventory_manager: 'Inventory Manager',
      production_manager: 'Production Manager',
      sales_manager: 'Sales Manager',
    }[r] ?? r),
};

export const errMsg = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong.';
