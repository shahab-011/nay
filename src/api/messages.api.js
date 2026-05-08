import api from './axios';

export const getMessages = (linkId, params = {}) =>
  api.get(`/messages/${linkId}`, { params });

export const sendMessage = (linkId, text) =>
  api.post(`/messages/${linkId}`, { text });
