import api from './axios';

export const firmApi = {
  getSettings:    ()      => api.get('/firm'),
  updateSettings: (data)  => api.put('/firm', data),
  updateBilling:  (data)  => api.put('/firm/billing', data),
  updateNotifications: (data) => api.put('/firm/notifications', data),
  updateSecurity: (data)  => api.put('/firm/security', data),
  updatePracticeAreas: (data) => api.put('/firm/practice-areas', data),

  listTeam:       ()              => api.get('/firm/team'),
  inviteMember:   (data)          => api.post('/firm/team/invite', data),
  updateMember:   (memberId, d)   => api.put(`/firm/team/${memberId}`, d),
  toggleMember:   (memberId)      => api.patch(`/firm/team/${memberId}/toggle-status`),
  removeMember:   (memberId)      => api.delete(`/firm/team/${memberId}`),

  listRoles:    ()        => api.get('/firm/roles'),
  createRole:   (data)    => api.post('/firm/roles', data),
  updateRole:   (id, d)   => api.put(`/firm/roles/${id}`, d),
  deleteRole:   (id)      => api.delete(`/firm/roles/${id}`),

  disconnectIntegration: (name)  => api.delete(`/firm/integrations/${name}`),
  getStripeStatus:       ()      => api.get('/firm/stripe/account'),

  getAuditLog: () => api.get('/firm/audit-log'),
  exportData:  () => api.get('/firm/export'),
};
