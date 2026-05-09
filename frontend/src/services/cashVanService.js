import api from './api';

export const getCashVanVehicles = () =>
  api.get('/cash-van/vehicles').then((r) => r.data.data);

export const createCashVanVehicle = (data) =>
  api.post('/cash-van/vehicles', data).then((r) => r.data.data);

export const getCashVanAssignments = () =>
  api.get('/cash-van/assignments').then((r) => r.data.data);

export const createCashVanAssignment = (data) =>
  api.post('/cash-van/assignments', data).then((r) => r.data.data);

export const createCashVanLoad = (data) =>
  api.post('/cash-van/loads', data).then((r) => r.data.data);

export const getCashVanLoads = () =>
  api.get('/cash-van/loads').then((r) => r.data.data);

export const createCashVanUnload = (data) =>
  api.post('/cash-van/unloads', data).then((r) => r.data.data);

export const getCashVanUnloads = () =>
  api.get('/cash-van/unloads').then((r) => r.data.data);

export const getCashVanVehicleStock = (vehicleId) =>
  api.get(`/cash-van/vehicles/${vehicleId}/stock`).then((r) => r.data.data);

export const createCashVanSale = (data) =>
  api.post('/cash-van/sales', data).then((r) => r.data.data);

export const getCashVanSales = (params) =>
  api.get('/cash-van/sales', { params }).then((r) => r.data.data);

export const getCashVanSaleById = (id) =>
  api.get(`/cash-van/sales/${id}`).then((r) => r.data.data);

export const openCashVanReconciliation = (data) =>
  api.post('/cash-van/reconciliations/open', data).then((r) => r.data.data);

export const closeCashVanReconciliation = (id, data) =>
  api.post(`/cash-van/reconciliations/${id}/close`, data).then((r) => r.data.data);

export const getCashVanReconciliations = (params) =>
  api.get('/cash-van/reconciliations', { params }).then((r) => r.data.data);

export const getCashVanReconciliationById = (id) =>
  api.get(`/cash-van/reconciliations/${id}`).then((r) => r.data.data);
