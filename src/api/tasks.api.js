import api from './axios';

export const tasksApi = {
  list:   (params) => api.get('/tasks', { params }),
  get:    (id)     => api.get(`/tasks/${id}`),
  create: (data)   => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  remove: (id)     => api.delete(`/tasks/${id}`),

  templates:       () => api.get('/task-templates'),
  applyTemplate:   (matterId, templateId) => api.post(`/matters/${matterId}/apply-template`, { templateId }),
};
