import api from './axios';

export const timeApi = {
  // Time entries
  list:        (params)        => api.get('/time-entries', { params }),
  get:         (id)            => api.get(`/time-entries/${id}`),
  create:      (data)          => api.post('/time-entries', data),
  update:      (id, data)      => api.patch(`/time-entries/${id}`, data),
  remove:      (id)            => api.delete(`/time-entries/${id}`),
  bulkUpdate:  (ids, update)   => api.patch('/time-entries/bulk', { ids, update }),

  // Timers
  listTimers:  ()              => api.get('/timers'),
  startTimer:  (data)          => api.post('/timers', data),
  pauseTimer:  (id)            => api.post(`/timers/${id}/pause`),
  resumeTimer: (id)            => api.post(`/timers/${id}/resume`),
  stopTimer:   (id, data)      => api.post(`/timers/${id}/stop`, data),

  // Expenses
  listExpenses:   (params)     => api.get('/expenses', { params }),
  createExpense:  (data)       => api.post('/expenses', data),
  updateExpense:  (id, data)   => api.patch(`/expenses/${id}`, data),
  deleteExpense:  (id)         => api.delete(`/expenses/${id}`),
  approveExpense: (id, status) => api.post(`/expenses/${id}/approve`, { status }),
};
