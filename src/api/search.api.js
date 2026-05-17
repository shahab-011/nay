import api from './axios';

export const searchApi = {
  global:   (q, params) => api.get('/search', { params: { q, ...params } }),
  auditLog: (params)    => api.get('/search/audit', { params }),
};
