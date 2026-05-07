import api from './api';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data.data);

export const changePassword = (current_password, new_password) =>
  api.put('/auth/change-password', { current_password, new_password }).then((r) => r.data);
