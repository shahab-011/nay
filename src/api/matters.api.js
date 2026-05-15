import api from './axios';

export const mattersApi = {
  list:   (params) => api.get('/matters', { params }),
  get:    (id)     => api.get(`/matters/${id}`),
  create: (data)   => api.post('/matters', data),
  update: (id, data) => api.patch(`/matters/${id}`, data),
  remove: (id)     => api.delete(`/matters/${id}`),

  // Sub-resources
  notes:      (id) => api.get(`/matters/${id}/notes`),
  addNote:    (id, data) => api.post(`/matters/${id}/notes`, data),
  deleteNote: (id, noteId) => api.delete(`/matters/${id}/notes/${noteId}`),

  stages: () => api.get('/matters/matter-stages'),
  practiceAreas: () => api.get('/matters/practice-areas'),
  taskTemplates: () => api.get('/matters/task-templates'),
  applyTemplate: (id, data) => api.post(`/matters/${id}/apply-template`, data),
};
