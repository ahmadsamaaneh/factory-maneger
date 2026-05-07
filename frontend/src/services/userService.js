import api from './api';

export const getUsers   = ()       => api.get('/users').then((r) => r.data.data);
export const createUser = (data)   => api.post('/users', data).then((r) => r.data.data);
export const updateUser = (id, d)  => api.put(`/users/${id}`, d).then((r) => r.data.data);
export const deleteUser = (id)     => api.delete(`/users/${id}`).then((r) => r.data);
