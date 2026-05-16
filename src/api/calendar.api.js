import api from './axios';

export const calendarApi = {
  list:   (params) => api.get('/calendar-events', { params }),
  get:    (id)     => api.get(`/calendar-events/${id}`),
  create: (data)   => api.post('/calendar-events', data),
  update: (id, data) => api.patch(`/calendar-events/${id}`, data),
  remove: (id)     => api.delete(`/calendar-events/${id}`),
  eventTypes: ()   => api.get('/calendar-events/event-types'),

  generateDeadlines: (data) => api.post('/calendar-events/from-rules', data),
  confirmDeadlines:  (data) => api.post('/calendar-events/confirm-deadlines', data),

  listJurisdictions: ()       => api.get('/court-rules/jurisdictions'),
  searchRules:       (params) => api.get('/court-rules', { params }),

  getAvailability:    ()     => api.get('/availability'),
  updateAvailability: (data) => api.put('/availability', data),

  getBookingPage: (slug)       => api.get(`/booking/${slug}`),
  createBooking:  (slug, data) => api.post(`/booking/${slug}/book`, data),
};
