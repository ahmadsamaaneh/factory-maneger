import api from './api';

export const getProducts  = (params) => api.get('/products', { params }).then((r) => r.data.data);
export const getProduct   = (id)     => api.get(`/products/${id}`).then((r) => r.data.data);
export const createProduct= (data)   => api.post('/products', data).then((r) => r.data.data);
export const updateProduct= (id, d)  => api.put(`/products/${id}`, d).then((r) => r.data.data);
export const deleteProduct= (id)     => api.delete(`/products/${id}`).then((r) => r.data);
