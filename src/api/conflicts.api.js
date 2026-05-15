import api from './axios';

export const conflictsApi = {
  check: (params) => api.get('/conflicts/check', { params }),
};
