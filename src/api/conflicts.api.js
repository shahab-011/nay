import api from './axios';

export const conflictsApi = {
  run:     (data)   => api.post('/conflicts/check', data),
  history: (params) => api.get('/conflicts/history', { params }),
  get:     (id)     => api.get(`/conflicts/${id}`),
  resolve: (id, d)  => api.patch(`/conflicts/${id}/resolve`, d),
  waiver:  (id, d)  => api.post(`/conflicts/${id}/waiver`, d),
};
