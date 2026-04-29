import api from './axios';

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerUser = (name, email, password, role = 'user') =>
  api.post('/auth/register', { name, email, password, role });

export const getMe = () =>
  api.get('/auth/me');

export const updatePassword = (currentPassword, newPassword) =>
  api.put('/auth/update-password', { currentPassword, newPassword });
