import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser } from '../api/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nyaya_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const stored = localStorage.getItem('nyaya_token');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getMe();
        setUser(data.data.user);
        setToken(stored);
      } catch {
        localStorage.removeItem('nyaya_token');
        localStorage.removeItem('nyaya_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem('nyaya_token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data;
  };

  const register = async (name, email, password, role = 'user') => {
    const { data } = await registerUser(name, email, password, role);
    localStorage.setItem('nyaya_token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('nyaya_token');
    localStorage.removeItem('nyaya_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
