import api from './axios';

export const reportsApi = {
  summary:      (params) => api.get('/reports/summary', { params }),
  revenue:      (params) => api.get('/reports/revenue', { params }),
  utilization:  (params) => api.get('/reports/utilization', { params }),
};
