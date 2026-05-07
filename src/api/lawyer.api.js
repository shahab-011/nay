import api from './axios';

/* ── Lawyer dashboard ───────────────────────────────────────────────── */
export const getLawyerDashboard = () => api.get('/lawyer/dashboard');

/* ── Client linking — lawyer side ──────────────────────────────────── */
export const sendLinkRequest      = (clientEmail, message) =>
  api.post('/lawyer/link-request', { clientEmail, message });
export const getLinkedClients     = ()         => api.get('/lawyer/linked-clients');
export const getClientDocuments   = (clientId) => api.get(`/lawyer/clients/${clientId}/documents`);
export const unlinkClient         = (linkId)   => api.patch(`/lawyer/links/${linkId}/unlink`);

/* ── Client list (linked + standalone) ─────────────────────────────── */
export const getClients = () => api.get('/lawyer/clients');

/* ── Client linking — client (user) side ───────────────────────────── */
export const getLinkRequests    = ()        => api.get('/lawyer/link-requests');
export const getMyLinks         = ()        => api.get('/lawyer/my-links');
export const acceptLinkRequest  = (linkId)  => api.patch(`/lawyer/link-requests/${linkId}/accept`);
export const rejectLinkRequest  = (linkId)  => api.patch(`/lawyer/link-requests/${linkId}/reject`);
export const clientUnlink       = (linkId)  => api.patch(`/lawyer/my-links/${linkId}/unlink`);
export const shareDocument      = (linkId, documentId) =>
  api.post('/lawyer/share-document',   { linkId, documentId });
export const unshareDocument    = (linkId, documentId) =>
  api.post('/lawyer/unshare-document', { linkId, documentId });

/* ── Cases CRUD ─────────────────────────────────────────────────────── */
export const getCases   = (status)     =>
  api.get('/lawyer/cases', { params: status ? { status } : {} });
export const getCase    = (id)         => api.get(`/lawyer/cases/${id}`);
export const createCase = (data)       => api.post('/lawyer/cases', data);
export const updateCase = (id, data)   => api.put(`/lawyer/cases/${id}`, data);
export const deleteCase = (id)         => api.delete(`/lawyer/cases/${id}`);
