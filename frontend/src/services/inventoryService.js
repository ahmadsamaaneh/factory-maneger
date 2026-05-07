import api from './api';

export const getMaterials  = (params) => api.get('/inventory', { params }).then((r) => r.data.data);
export const getMaterial   = (id)     => api.get(`/inventory/${id}`).then((r) => r.data.data);
export const createMaterial= (data)   => api.post('/inventory', data).then((r) => r.data.data);
export const updateMaterial= (id, d)  => api.put(`/inventory/${id}`, d).then((r) => r.data.data);
export const deleteMaterial= (id)     => api.delete(`/inventory/${id}`).then((r) => r.data);
export const adjustQty     = (id, d)  => api.patch(`/inventory/${id}/adjust`, d).then((r) => r.data.data);

// Purchases (bulk inputs with unit conversion)
export const createPurchase       = (materialId, data) => api.post(`/inventory/${materialId}/purchases`, data).then((r) => r.data.data);
export const listPurchasesForItem = (materialId)       => api.get(`/inventory/${materialId}/purchases`).then((r) => r.data.data);
export const listAllPurchases     = (params)           => api.get('/inventory/purchases/all', { params }).then((r) => r.data.data);
