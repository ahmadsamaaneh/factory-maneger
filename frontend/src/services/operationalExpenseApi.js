import api from './api';

export const getOpExpenseDashboard = (params) =>
  api.get('/operational-expenses/dashboard/summary', { params }).then((r) => r.data.data);

export const getOpExpenseAlerts = () =>
  api.get('/operational-expenses/alerts').then((r) => r.data.data);

export const getOpExpenseReport = (params) =>
  api.get('/operational-expenses/reports/aggregate', { params }).then((r) => r.data.data);

export const listOpExpenses = (params) =>
  api.get('/operational-expenses', { params }).then((r) => r.data.data);

export const createOpExpense = (data) =>
  api.post('/operational-expenses', data).then((r) => r.data.data);

export const updateOpExpense = (id, data) =>
  api.put(`/operational-expenses/${id}`, data).then((r) => r.data.data);

export const deleteOpExpense = (id) =>
  api.delete(`/operational-expenses/${id}`).then((r) => r.data.data);

export const getOpExpenseLookupDepartments = () =>
  api.get('/operational-expenses/lookup/departments').then((r) => r.data.data);

export const getOpExpenseLookupEmployees = () =>
  api.get('/operational-expenses/lookup/employees').then((r) => r.data.data);

export const listOpExpenseBudgets = (params) =>
  api.get('/operational-expenses/budgets', { params }).then((r) => r.data.data);

export const upsertOpExpenseBudget = (data) =>
  api.post('/operational-expenses/budgets', data).then((r) => r.data.data);

/** تنزيل CSV — استخدم نفس الفلاتر */
export async function downloadOpExpenseCsv(params) {
  const res = await api.get('/operational-expenses/export/csv', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
