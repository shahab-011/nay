import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nyaya_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/me');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('nyaya_token');
      localStorage.removeItem('nyaya_user');
    }
    return Promise.reject(error);
  }
);

export default api;
