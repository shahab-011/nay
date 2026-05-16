import api from './axios';

export const communicationsApi = {
  list:   (params) => api.get('/communications', { params }),
  get:    (id)     => api.get(`/communications/${id}`),
  create: (data)   => api.post('/communications', data),
  update: (id, d)  => api.put(`/communications/${id}`, d),
  remove: (id)     => api.delete(`/communications/${id}`),
  types:  ()       => api.get('/communications/types'),

  createTimeEntry: (id, data) => api.post(`/communications/${id}/time-entry`, data),

  fileFromGmail:   (data) => api.post('/communications/gmail/file', data),
  fileFromOutlook: (data) => api.post('/communications/outlook/file', data),

  contactTimeline: (contactId, params) => api.get(`/communications/timeline/${contactId}`, { params }),
  exportTimeline:  (matterId,  params) => api.get(`/communications/export/${matterId}`,    { params }),

  templates: {
    list:   ()       => api.get('/communications/email-templates'),
    create: (data)   => api.post('/communications/email-templates', data),
    update: (id, d)  => api.put(`/communications/email-templates/${id}`, d),
    remove: (id)     => api.delete(`/communications/email-templates/${id}`),
  },
};
