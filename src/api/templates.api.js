import api from './axios';

export const templatesApi = {
  list:       (params) => api.get('/doc-templates', { params }),
  get:        (id)     => api.get(`/doc-templates/${id}`),
  create:     (data)   => api.post('/doc-templates', data),
  update:     (id, d)  => api.put(`/doc-templates/${id}`, d),
  remove:     (id)     => api.delete(`/doc-templates/${id}`),
  generate:   (id, fieldValues) => api.post(`/doc-templates/${id}/generate`, { fieldValues }),
  categories: ()       => api.get('/doc-templates/categories'),
};
