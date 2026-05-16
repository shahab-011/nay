import api from './axios';

export const templatesApi = {
  list:           (params)       => api.get('/doc-templates', { params }),
  get:            (id)           => api.get(`/doc-templates/${id}`),
  create:         (data)         => api.post('/doc-templates', data),
  update:         (id, d)        => api.put(`/doc-templates/${id}`, d),
  remove:         (id)           => api.delete(`/doc-templates/${id}`),
  generate:       (id, body)     => api.post(`/doc-templates/${id}/generate`, body),
  categories:     ()             => api.get('/doc-templates/categories'),
  toggleFavorite: (id)           => api.patch(`/doc-templates/${id}/favorite`),
  listVersions:   (id)           => api.get(`/doc-templates/${id}/versions`),
  restoreVersion: (id, vId)      => api.post(`/doc-templates/${id}/restore/${vId}`),
  aiConvert:      (data)         => api.post('/doc-templates/ai-convert', data),
  listGenerated:  (params)       => api.get('/doc-templates/generated', { params }),
  listCourtForms: (params)       => api.get('/court-forms', { params }),
  fillCourtForm:  (id, params)   => api.get(`/court-forms/${id}/fill`, { params }),
};
