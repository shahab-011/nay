import api from './axios';

export const contactsApi = {
  list:   (params) => api.get('/contacts', { params }),
  get:    (id)     => api.get(`/contacts/${id}`),
  create: (data)   => api.post('/contacts', data),
  update: (id, data) => api.patch(`/contacts/${id}`, data),
  remove: (id)     => api.delete(`/contacts/${id}`),

  // Conflict check
  conflictCheck: (name, email) => api.get('/contacts/conflict-check', { params: { name, email } }),
};
