import api from './axios';

export const esignApi = {
  list:   (params) => api.get('/esign-requests', { params }),
  get:    (id)     => api.get(`/esign-requests/${id}`),
  create: (data)   => api.post('/esign-requests', data),
  update: (id, d)  => api.put(`/esign-requests/${id}`, d),
  remove: (id)     => api.delete(`/esign-requests/${id}`),

  send:       (id)     => api.post(`/esign-requests/${id}/send`),
  void:       (id)     => api.post(`/esign-requests/${id}/void`),
  resend:     (id)     => api.post(`/esign-requests/${id}/resend`),
  auditTrail: (id)     => api.get(`/esign-requests/${id}/audit-trail`),
  download:   (id)     => api.get(`/esign-requests/${id}/download`),
};
