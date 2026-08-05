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
    let mounted = true;

    const restore = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        if (mounted) setLoading(false);
        return;
      }

      // Add a 3-second safety timeout cap so backend cold-starts don't hang UI forever
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000, 'TIMEOUT'));

      try {
        const result = await Promise.race([getMe(), timeoutPromise]);
        if (!mounted) return;

        if (result === 'TIMEOUT') {
          console.warn('Auth check timed out, proceeding as guest');
          setLoading(false);
          return;
        }

        setUser(result.data.data.user);
        setToken(stored);
      } catch {
        if (!mounted) return;
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
          try {
            const refreshRes = await Promise.race([refreshTokenApi(refresh), timeoutPromise]);
            if (refreshRes && refreshRes !== 'TIMEOUT') {
              localStorage.setItem(TOKEN_KEY, refreshRes.data.data.token);
              setToken(refreshRes.data.data.token);
              const meRes = await Promise.race([getMe(), timeoutPromise]);
              if (meRes && meRes !== 'TIMEOUT') {
                setUser(meRes.data.data.user);
              }
            } else {
              clearSession();
            }
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restore();
    return () => { mounted = false; };
  }, [clearSession]);

  /* ─── loginWithToken (Google OAuth callback) ─────────────────── */
  const loginWithToken = useCallback(async (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    setToken(accessToken);
    const { data } = await getMe();
    setUser(data.data.user);
  }, []);

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
    if (data.data?.token) {
      storeSession(data.data.token, data.data.user, data.data.refreshToken);
    }
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
      login, loginWithToken, register, verifyEmail, resendOTP,
      forgotPassword, resetPassword,
      completeOnboarding,
      logout, updateUser,
    }}>
      {loading ? (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#070514', color: '#f0eeff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, zIndex: 99999
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(167, 139, 250, 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 3l11 5.5v7c0 7-4.5 12.5-11 14.5C9.5 28 5 22.5 5 15.5v-7L16 3z" stroke="#c084fc" strokeWidth="2"/>
              <path d="M12 14h8M12 18h5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
            Nyaya<span style={{ color: '#c084fc' }}>AI</span>
          </div>
          <div style={{ width: 28, height: 28, border: '3px solid rgba(192, 132, 252, 0.2)', borderTopColor: '#c084fc', borderRadius: '50%', animation: 'nyaya-auth-spin 0.75s linear infinite' }} />
          <style>{`@keyframes nyaya-auth-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
