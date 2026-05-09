import api from './axios';

export const analyzeDocument = (docId, rerun = false) =>
  api.post(`/analysis/${docId}/analyze${rerun ? '?rerun=true' : ''}`);

export const getAnalysis = (docId) =>
  api.get(`/analysis/${docId}`);

export const askAI = (docId, question) =>
  api.post(`/analysis/${docId}/chat`, { question });

export const getChatHistory = (docId) =>
  api.get(`/analysis/${docId}/chat-history`);

export const clearChatHistory = (docId) =>
  api.delete(`/analysis/${docId}/chat-history`);

export const runSilenceDetector = (docId) =>
  api.post(`/analysis/${docId}/silence`);
