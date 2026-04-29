import api from './axios';

export const getLawyerDashboard = () => api.get('/lawyer/dashboard');

export const getClients = () => api.get('/lawyer/clients');

export const getCases  = (status) =>
  api.get('/lawyer/cases', { params: status ? { status } : {} });

export const getCase   = (id)      => api.get(`/lawyer/cases/${id}`);
export const createCase = (data)   => api.post('/lawyer/cases', data);
export const updateCase = (id, data) => api.put(`/lawyer/cases/${id}`, data);
export const deleteCase = (id)     => api.delete(`/lawyer/cases/${id}`);
