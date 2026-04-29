import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAlerts } from '../api/alerts.api';
import { useAuth } from './AuthContext';

const AlertContext = createContext({ unreadCount: 0, refreshAlerts: () => {} });

export function AlertProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshAlerts = useCallback(() => {
    if (!user) { setUnreadCount(0); return; }
    getAlerts()
      .then((res) => setUnreadCount(res.data.data.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  // Fetch on mount and whenever auth state changes
  useEffect(() => { refreshAlerts(); }, [refreshAlerts]);

  return (
    <AlertContext.Provider value={{ unreadCount, refreshAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlertCount = () => useContext(AlertContext);
