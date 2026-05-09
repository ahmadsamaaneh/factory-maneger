import api from './api';

export const getHrStats = () => api.get('/hr/stats').then((r) => r.data.data);

export const getDepartments = () => api.get('/hr/departments').then((r) => r.data.data);
export const createDepartment = (data) => api.post('/hr/departments', data).then((r) => r.data.data);
export const updateDepartment = (id, data) => api.put(`/hr/departments/${id}`, data).then((r) => r.data.data);
export const deleteDepartment = (id) => api.delete(`/hr/departments/${id}`).then((r) => r.data);

export const getEmployees = (params) =>
  api.get('/hr/employees', { params }).then((r) => r.data.data);
export const getEmployee = (id) => api.get(`/hr/employees/${id}`).then((r) => r.data.data);
export const createEmployee = (data) => api.post('/hr/employees', data).then((r) => r.data.data);
export const updateEmployee = (id, data) => api.put(`/hr/employees/${id}`, data).then((r) => r.data.data);
export const terminateEmployee = (id) => api.delete(`/hr/employees/${id}`).then((r) => r.data.data);
export const upsertEmployeeAttendance = (employeeId, data) =>
  api.post(`/hr/employees/${employeeId}/attendance`, data).then((r) => r.data.data);
export const getDailyAttendance = (work_date) =>
  api.get('/hr/attendance/daily', { params: { work_date } }).then((r) => r.data.data);
export const lockAttendanceDay = (work_date) =>
  api.post('/hr/attendance/lock', { work_date }).then((r) => r.data.data);
export const unlockAttendanceDay = (work_date) =>
  api.post('/hr/attendance/unlock', { work_date }).then((r) => r.data.data);
export const getMonthlyPayrollReport = (month) =>
  api.get('/hr/payroll/monthly', { params: { month } }).then((r) => r.data.data);
export const getEmployeeMonthlyPayrollDetail = (employeeId, month) =>
  api.get(`/hr/payroll/monthly/${employeeId}`, { params: { month } }).then((r) => r.data.data);
