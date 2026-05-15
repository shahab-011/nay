import api from './axios';

export const calendarApi = {
  list:   (params) => api.get('/calendar-events', { params }),
  get:    (id)     => api.get(`/calendar-events/${id}`),
  create: (data)   => api.post('/calendar-events', data),
  update: (id, data) => api.patch(`/calendar-events/${id}`, data),
  remove: (id)     => api.delete(`/calendar-events/${id}`),

  eventTypes: () => api.get('/calendar-event-types'),
};
