import api from './axios';

export const contactsApi = {
  list:   (params) => api.get('/contacts', { params }),
  get:    (id)     => api.get(`/contacts/${id}`),
  create: (data)   => api.post('/contacts', data),
  update: (id, d)  => api.patch(`/contacts/${id}`, d),
  remove: (id)     => api.delete(`/contacts/${id}`),

  merge:      (id, data) => api.post(`/contacts/${id}/merge`, data),
  timeline:   (id)       => api.get(`/contacts/${id}/timeline`),
  financials: (id)       => api.get(`/contacts/${id}/financials`),

  duplicates:    ()              => api.get('/contacts/duplicates'),
  conflictCheck: (name, email)   => api.get('/contacts/conflict-check', { params: { name, email } }),

  exportCSV: () => api.get('/contacts/export', { responseType: 'blob' }),
  importCSV: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
