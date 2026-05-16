import api from './axios';

// Returns the Authorization header for portal token
const portalHeader = () => {
  const token = localStorage.getItem('portalToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const portalApi = {
  // Public auth
  magicLink:  (token)        => api.get(`/portal/magic/${token}`),
  requestOTP: (email)        => api.post('/portal/auth/request-otp', { email }),
  verifyOTP:  (email, otp)   => api.post('/portal/auth/verify-otp', { email, otp }),

  // Firm-side (regular auth — uses axios default auth header)
  invite:         (data)     => api.post('/portal/invite', data),
  listAccesses:   ()         => api.get('/portal/accesses'),
  revokeAccess:   (id)       => api.patch(`/portal/accesses/${id}/revoke`),
  firmSendMessage:(data)     => api.post('/portal/firm/messages', data),

  // Client-side portal (uses portalToken from localStorage)
  getMe:           ()        => api.get('/portal/me',           { headers: portalHeader() }),
  getMatter:       ()        => api.get('/portal/matter',       { headers: portalHeader() }),
  getDocuments:    ()        => api.get('/portal/documents',    { headers: portalHeader() }),
  uploadDocument:  (fd)      => api.post('/portal/documents/upload', fd, { headers: { ...portalHeader(), 'Content-Type': 'multipart/form-data' } }),
  getInvoices:     ()        => api.get('/portal/invoices',     { headers: portalHeader() }),
  getAppointments: ()        => api.get('/portal/appointments', { headers: portalHeader() }),
  getMessages:     ()        => api.get('/portal/messages',     { headers: portalHeader() }),
  sendMessage:     (data)    => api.post('/portal/messages', data,       { headers: portalHeader() }),
  markRead:        (id)      => api.patch(`/portal/messages/${id}/read`, {}, { headers: portalHeader() }),
  getForms:        ()        => api.get('/portal/forms',        { headers: portalHeader() }),
};
