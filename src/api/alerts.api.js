import api from './axios';

export const getAlerts = () =>
  api.get('/alerts');

export const markAsRead = (id) =>
  api.patch(`/alerts/${id}/read`);

export const markAllRead = () =>
  api.patch('/alerts/read-all');

export const deleteAlert = (id) =>
  api.delete(`/alerts/${id}`);
