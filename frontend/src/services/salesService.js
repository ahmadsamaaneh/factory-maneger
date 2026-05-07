import api from './api';

export const getCustomers   = (params) => api.get('/sales/customers', { params }).then((r) => r.data.data);
export const getCustomer    = (id)     => api.get(`/sales/customers/${id}`).then((r) => r.data.data);
export const createCustomer = (data)   => api.post('/sales/customers', data).then((r) => r.data.data);
export const updateCustomer = (id, d)  => api.put(`/sales/customers/${id}`, d).then((r) => r.data.data);
export const deleteCustomer = (id)     => api.delete(`/sales/customers/${id}`).then((r) => r.data);

export const getOrders      = (params) => api.get('/sales/orders', { params }).then((r) => r.data.data);
export const getOrder       = (id)     => api.get(`/sales/orders/${id}`).then((r) => r.data.data);
export const getOrderById   = (id)     => api.get(`/sales/orders/${id}`).then((r) => r.data.data);
export const createOrder    = (data)   => api.post('/sales/orders', data).then((r) => r.data.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/sales/orders/${id}/status`, { status }).then((r) => r.data.data);
