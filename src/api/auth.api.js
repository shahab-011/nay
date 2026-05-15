import api from './axios';

export const loginUser        = (email, password, rememberMe = false, totpCode) =>
  api.post('/auth/login', { email, password, rememberMe, totpCode });

export const registerUser     = (data) =>
  api.post('/auth/register', data);

export const verifyEmail      = (email, otp) =>
  api.post('/auth/verify-email', { email, otp });

export const resendOTP        = (email) =>
  api.post('/auth/resend-otp', { email });

export const refreshToken     = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken });

export const logoutUser       = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const forgotPassword   = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword    = (token, password) =>
  api.post('/auth/reset-password', { token, password });

export const getMe            = () =>
  api.get('/auth/me');

export const updatePassword   = (currentPassword, newPassword) =>
  api.put('/auth/update-password', { currentPassword, newPassword });

export const updateProfile    = (updates) =>
  api.put('/auth/update-profile', updates);

export const setup2FA         = () =>
  api.post('/auth/2fa/setup');

export const verify2FA        = (totpCode) =>
  api.post('/auth/2fa/verify', { totpCode });

export const disable2FA       = (password) =>
  api.post('/auth/2fa/disable', { password });

export const completeOnboarding = (data) =>
  api.post('/auth/onboarding/complete', data);

export const getUserStats     = () =>
  api.get('/auth/stats');

export const deleteAccount    = () =>
  api.delete('/auth/delete-account');
