import api from './axios';

export const aiApi = {
  // Document intelligence
  analyzeDocument:  (data) => api.post('/ai/analyze-document',  data),
  extractDeadlines: (data) => api.post('/ai/extract-deadlines', data),

  // Invoice review & document drafting
  suggestInvoice: (matterId) => api.post('/ai/suggest-invoice', { matterId }),
  draftDocument:  (data)     => api.post('/ai/draft-document',  data),

  // Conversational AI
  chat: (data) => api.post('/ai/chat', data),

  // Report narration
  narrateReport: (data) => api.post('/ai/narrate-report', data),

  // Suggestions
  suggestions: {
    list:    (params) => api.get('/ai/suggestions', { params }),
    accept:  (id)     => api.patch(`/ai/suggestions/${id}/accept`),
    dismiss: (id)     => api.patch(`/ai/suggestions/${id}/dismiss`),
  },

  // Conversation history
  conversations: {
    list: (params) => api.get('/ai/conversations', { params }),
    get:  (id)     => api.get(`/ai/conversations/${id}`),
  },

  // Audit log (admin)
  auditLog: (params) => api.get('/ai/audit-log', { params }),
};
