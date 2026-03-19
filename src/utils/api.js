import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 with explicit token expiry/invalid messages
    // Don't logout on network errors, timeouts, or other failures
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      const detail = error.response?.data?.detail || '';
      if (detail === 'Token expired' || detail === 'Invalid token' || detail === 'Missing or invalid Authorization header') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
