import api from './axios';

export const leadsApi = {
  list:   (params) => api.get('/leads', { params }),
  get:    (id)     => api.get(`/leads/${id}`),
  create: (data)   => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  remove: (id)     => api.delete(`/leads/${id}`),
  updateStage:      (id, stage) => api.patch(`/leads/${id}/stage`, { stage }),
  convert:          (id, data)  => api.post(`/leads/${id}/convert`, data),
  bookConsultation: (id, data)  => api.post(`/leads/${id}/book-consultation`, data),
  stages:  () => api.get('/leads/stages'),
  sources: () => api.get('/leads/sources'),
  analytics: {
    pipeline: () => api.get('/leads/analytics/pipeline'),
    sources:  () => api.get('/leads/analytics/sources'),
  },
  forms: {
    list:      ()           => api.get('/intake-forms'),
    get:       (id)         => api.get(`/intake-forms/${id}`),
    create:    (data)       => api.post('/intake-forms', data),
    update:    (id, data)   => api.put(`/intake-forms/${id}`, data),
    remove:    (id)         => api.delete(`/intake-forms/${id}`),
    responses: (id)         => api.get(`/intake-forms/${id}/responses`),
    getPublic: (slug)       => api.get(`/intake-forms/public/${slug}`),
    submit:    (slug, data) => api.post(`/intake-forms/public/${slug}/submit`, data),
  },
  pipelines: {
    list:   ()       => api.get('/pipelines'),
    create: (data)   => api.post('/pipelines', data),
    update: (id, d)  => api.put(`/pipelines/${id}`, d),
  },
  workflows: {
    list:   ()       => api.get('/workflows'),
    create: (data)   => api.post('/workflows', data),
    update: (id, d)  => api.put(`/workflows/${id}`, d),
    toggle: (id)     => api.patch(`/workflows/${id}/toggle`),
  },
};
