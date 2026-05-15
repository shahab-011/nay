import api from './axios';

export const timeApi = {
  list:   (params) => api.get('/time-entries', { params }),
  get:    (id)     => api.get(`/time-entries/${id}`),
  create: (data)   => api.post('/time-entries', data),
  update: (id, data) => api.patch(`/time-entries/${id}`, data),
  remove: (id)     => api.delete(`/time-entries/${id}`),

  // Active timer
  startTimer:  (data) => api.post('/timers', data),
  stopTimer:   (id, data) => api.patch(`/timers/${id}/stop`, data),
  activeTimer: () => api.get('/timers/active'),
};
