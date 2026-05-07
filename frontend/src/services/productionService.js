import api from './api';

export const getRecipes   = ()       => api.get('/production/recipes').then((r) => r.data.data);
export const getRecipe    = (id)     => api.get(`/production/recipes/${id}`).then((r) => r.data.data);
export const createRecipe = (data)   => api.post('/production/recipes', data).then((r) => r.data.data);
export const updateRecipe = (id, d)  => api.put(`/production/recipes/${id}`, d).then((r) => r.data.data);
export const deleteRecipe = (id)     => api.delete(`/production/recipes/${id}`).then((r) => r.data);

export const getBatches   = ()       => api.get('/production/batches').then((r) => r.data.data);
export const getBatch     = (id)     => api.get(`/production/batches/${id}`).then((r) => r.data.data);
export const runBatch     = (data)   => api.post('/production/batches', data).then((r) => r.data.data);
