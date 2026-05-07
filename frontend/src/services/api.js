import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('factory-auth');
  if (raw) {
    const { state } = JSON.parse(raw);
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('factory-auth');
      window.location.href = '/login';
    }
    const code = err.response?.data?.code;
    if (
      err.response?.status === 403 &&
      (code === 'SUBSCRIPTION_EXPIRED' || code === 'FACTORY_INACTIVE')
    ) {
      window.location.href = '/subscription-expired';
    }
    return Promise.reject(err);
  }
);

export default api;
