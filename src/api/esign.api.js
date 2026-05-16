import api from './axios';

export const esignApi = {
  // Firm-side (authenticated)
  list:       (params)   => api.get('/esign-requests', { params }),
  get:        (id)       => api.get(`/esign-requests/${id}`),
  create:     (data)     => api.post('/esign-requests', data),
  update:     (id, d)    => api.put(`/esign-requests/${id}`, d),
  remove:     (id)       => api.delete(`/esign-requests/${id}`),
  send:       (id)       => api.post(`/esign-requests/${id}/send`),
  void:       (id, data) => api.post(`/esign-requests/${id}/void`, data),
  resend:     (id)       => api.post(`/esign-requests/${id}/resend`),
  auditTrail: (id)       => api.get(`/esign-requests/${id}/audit-trail`),
  download:   (id)       => api.get(`/esign-requests/${id}/download`),

  // Public (token-based — no auth needed)
  getDocToSign:      (token)       => api.get(`/esign/sign/${token}`),
  submitSignature:   (token, data) => api.post(`/esign/sign/${token}`, data),
  declineSignature:  (token, data) => api.post(`/esign/sign/${token}/decline`, data),
};
