import api from './axios';

export const reportsApi = {
  dashboard:  (params) => api.get('/reports/dashboard',           { params }),
  summary:    (params) => api.get('/reports/summary',             { params }),

  revenue:    (params) => api.get('/reports/revenue',             { params }),
  arAging:    (params) => api.get('/reports/accounts-receivable', { params }),
  collections:(params) => api.get('/reports/collections',         { params }),
  trust:      (params) => api.get('/reports/trust',               { params }),

  time:        (params) => api.get('/reports/time',               { params }),
  utilization: (params) => api.get('/reports/utilization',        { params }),
  wip:         (params) => api.get('/reports/wip',                { params }),

  matters:     (params) => api.get('/reports/matters',            { params }),
  pipeline:    (params) => api.get('/reports/pipeline',           { params }),
  leadSources: (params) => api.get('/reports/lead-sources',       { params }),

  custom: {
    list:     ()        => api.get('/reports/custom'),
    create:   (data)    => api.post('/reports/custom', data),
    run:      (id)      => api.get(`/reports/custom/${id}`),
    update:   (id, d)   => api.put(`/reports/custom/${id}`, d),
    remove:   (id)      => api.delete(`/reports/custom/${id}`),
    schedule: (id, d)   => api.post(`/reports/custom/${id}/schedule`, d),
  },
};
