import api from './api';

export const getInventoryReport  = (params) => api.get('/reports/inventory', { params }).then((r) => r.data.data);
export const getProductionReport = (params) => api.get('/reports/production', { params }).then((r) => r.data.data);
export const getSalesReport      = (params) => api.get('/reports/sales', { params }).then((r) => r.data.data);
export const getProfitReport     = (params) => api.get('/reports/profit', { params }).then((r) => r.data.data);
export const getFinanceReport    = (params) => api.get('/reports/finance', { params }).then((r) => r.data.data);
export const updateCapital       = (capital_amount) => api.put('/reports/finance/capital', { capital_amount }).then((r) => r.data.data);
export const getEmployeeAttendanceReport = (work_date) =>
  api.get('/hr/attendance/daily', { params: { work_date } }).then((r) => r.data.data);
export const getEmployeePayrollReport = (month) =>
  api.get('/hr/payroll/monthly', { params: { month } }).then((r) => r.data.data);
