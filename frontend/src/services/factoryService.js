import api from './api';

export const getAdminStats      = ()         => api.get('/admin/stats');
export const listFactories      = (params)   => api.get('/admin/factories', { params });
export const getFactory         = (id)       => api.get(`/admin/factories/${id}`);
export const getFactoryUsers    = (id)       => api.get(`/admin/factories/${id}/users`);
export const createFactory      = (data)     => api.post('/admin/factories', data);
export const updateFactory      = (id, data) => api.patch(`/admin/factories/${id}`, data);
export const deleteFactory      = (id)       => api.delete(`/admin/factories/${id}`);

// Admin user management
export const listAllUsers         = (params)       => api.get('/admin/users', { params });
export const toggleUserStatus     = (id)           => api.patch(`/admin/users/${id}/status`);
export const resetUserPassword    = (id, password) => api.patch(`/admin/users/${id}/reset-password`, { new_password: password });
