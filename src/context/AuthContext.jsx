import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMe,
  loginUser,
  registerUser,
  verifyEmail as verifyEmailApi,
  resendOTP as resendOTPApi,
  logoutUser,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  refreshToken as refreshTokenApi,
  completeOnboarding as completeOnboardingApi,
} from '../api/auth.api';

export const AuthContext = createContext(null);

const TOKEN_KEY   = 'nyaya_token';
const REFRESH_KEY = 'nyaya_refresh';

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const storeSession = useCallback((accessToken, userData, refresh) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    setToken(accessToken);
    setUser(userData);
  }, []);

  /* ─── Restore session on mount ───────────────────────────────── */
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) { setLoading(false); return; }
      try {
        const { data } = await getMe();
        setUser(data.data.user);
        setToken(stored);
      } catch {
        // Try refreshing with stored refresh token
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
          try {
            const { data } = await refreshTokenApi(refresh);
            localStorage.setItem(TOKEN_KEY, data.data.token);
            setToken(data.data.token);
            const { data: me } = await getMe();
            setUser(me.data.user);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [clearSession]);

  /* ─── login ──────────────────────────────────────────────────── */
  const login = async (email, password, rememberMe = false, totpCode) => {
    const { data } = await loginUser(email, password, rememberMe, totpCode);
    if (data.data?.requires2FA) return { requires2FA: true };
    storeSession(data.data.token, data.data.user, data.data.refreshToken);
    return data;
  };

  /* ─── register ───────────────────────────────────────────────── */
  const register = async (formData) => {
    const { data } = await registerUser(formData);
    // Returns pendingEmail — no token yet, redirect to verify-email
    return data;
  };

  /* ─── verifyEmail ────────────────────────────────────────────── */
  const verifyEmail = async (email, otp) => {
    const { data } = await verifyEmailApi(email, otp);
    storeSession(data.data.token, data.data.user, data.data.refreshToken);
    return data;
  };

  /* ─── resendOTP ──────────────────────────────────────────────── */
  const resendOTP = async (email) => {
    const { data } = await resendOTPApi(email);
    return data;
  };

  /* ─── forgotPassword ─────────────────────────────────────────── */
  const forgotPassword = async (email) => {
    const { data } = await forgotPasswordApi(email);
    return data;
  };

  /* ─── resetPassword ──────────────────────────────────────────── */
  const resetPassword = async (token, password) => {
    const { data } = await resetPasswordApi(token, password);
    return data;
  };

  /* ─── completeOnboarding ─────────────────────────────────────── */
  const completeOnboarding = async (onboardingData) => {
    const { data } = await completeOnboardingApi(onboardingData);
    return data;
  };

  /* ─── logout ─────────────────────────────────────────────────── */
  const logout = async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    try { await logoutUser(refresh); } catch {}
    clearSession();
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, verifyEmail, resendOTP,
      forgotPassword, resetPassword,
      completeOnboarding,
      logout, updateUser,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
