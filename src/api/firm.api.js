import api from './axios';

export const firmApi = {
  getSettings:    ()      => api.get('/firm'),
  updateSettings: (data)  => api.put('/firm', data),
  updateBilling:  (data)  => api.put('/firm/billing', data),
  updateNotifications: (data) => api.put('/firm/notifications', data),

  // Team
  listTeam:       ()              => api.get('/firm/team'),
  inviteMember:   (data)          => api.post('/firm/team/invite', data),
  updateMember:   (memberId, d)   => api.put(`/firm/team/${memberId}`, d),
  toggleMember:   (memberId)      => api.patch(`/firm/team/${memberId}/toggle`),
  removeMember:   (memberId)      => api.delete(`/firm/team/${memberId}`),
};
