import api from './axios';

export const communicationsApi = {
  list:   (params) => api.get('/communications', { params }),
  get:    (id)     => api.get(`/communications/${id}`),
  create: (data)   => api.post('/communications', data),
  update: (id, d)  => api.put(`/communications/${id}`, d),
  remove: (id)     => api.delete(`/communications/${id}`),
  types:  ()       => api.get('/communications/types'),
};
