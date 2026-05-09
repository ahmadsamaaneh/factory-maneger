import axios from 'axios';

/** Dev: relative path uses Vite proxy. Set `VITE_API_BASE_URL` (e.g. http://192.168.x.x:3000/api/v1) if the app is opened from another device on the LAN. */
const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('factory-auth');
    if (raw) {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    }
  } catch {
    /* ignore corrupt persistence */
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
