import api from './axios';

export const leadsApi = {
  list:    (params) => api.get('/leads', { params }),
  get:     (id)     => api.get(`/leads/${id}`),
  create:  (data)   => api.post('/leads', data),
  update:  (id, d)  => api.put(`/leads/${id}`, d),
  remove:  (id)     => api.delete(`/leads/${id}`),

  updateStage: (id, stage) => api.patch(`/leads/${id}/stage`, { stage }),
  convert:     (id, data)  => api.post(`/leads/${id}/convert`, data),

  stages:  () => api.get('/leads/stages'),
  sources: () => api.get('/leads/sources'),
};
