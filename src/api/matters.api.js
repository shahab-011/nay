import api from './axios';

export const mattersApi = {
  list:   (params) => api.get('/matters', { params }),
  get:    (id)     => api.get(`/matters/${id}`),
  create: (data)   => api.post('/matters', data),
  update: (id, data) => api.patch(`/matters/${id}`, data),
  remove: (id)     => api.delete(`/matters/${id}`),

  close:   (id, data) => api.post(`/matters/${id}/close`, data),
  archive: (id)       => api.post(`/matters/${id}/archive`),
  reopen:  (id)       => api.post(`/matters/${id}/reopen`),

  notes:      (id)               => api.get(`/matters/${id}/notes`),
  addNote:    (id, data)         => api.post(`/matters/${id}/notes`, data),
  updateNote: (id, noteId, data) => api.patch(`/matters/${id}/notes/${noteId}`, data),
  pinNote:    (id, noteId)       => api.post(`/matters/${id}/notes/${noteId}/pin`),
  deleteNote: (id, noteId)       => api.delete(`/matters/${id}/notes/${noteId}`),

  linkContact:   (id, data)      => api.post(`/matters/${id}/contacts/link`, data),
  unlinkContact: (id, contactId) => api.delete(`/matters/${id}/contacts/${contactId}`),

  stages:        () => api.get('/matters/matter-stages'),
  practiceAreas: () => api.get('/matters/practice-areas'),
  taskTemplates: () => api.get('/matters/task-templates'),
  applyTemplate: (id, data) => api.post(`/matters/${id}/apply-template`, data),

  customFields:      (params)      => api.get('/matters/custom-fields', { params }),
  createCustomField: (data)        => api.post('/matters/custom-fields', data),
  updateCustomField: (fieldId, d)  => api.patch(`/matters/custom-fields/${fieldId}`, d),
  deleteCustomField: (fieldId)     => api.delete(`/matters/custom-fields/${fieldId}`),
};
