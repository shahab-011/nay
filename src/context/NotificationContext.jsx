import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationsApi } from '../api/notifications.api';

const NotificationContext = createContext(null);

/* ── Toast component (self-contained here to avoid circular imports) ── */
function ToastItem({ notif, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '14px 18px', background: '#fff',
        borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: `2px solid ${notif.color || '#7C3AED'}20`,
        maxWidth: 340, cursor: 'pointer',
        animation: 'slideIn 0.3s ease',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{notif.icon || '🔔'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
          {notif.title}
        </div>
        {notif.body && (
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notif.body}
          </div>
        )}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
    </div>
  );
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [toasts,        setToasts]        = useState([]);
  const toastId = useRef(0);

  /* ── Fetch unread count ──────────────────────────────────────────── */
  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const r = await notificationsApi.unreadCount();
      setUnreadCount(r.data.data?.count || 0);
    } catch {}
  }, [user]);

  /* ── Fetch notifications list ────────────────────────────────────── */
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user) return [];
    try {
      const r = await notificationsApi.list({ page, limit: 20 });
      const list = r.data.data?.notifications || [];
      if (page === 1) {
        setNotifications(list);
      } else {
        setNotifications(prev => [...prev, ...list]);
      }
      return list;
    } catch { return []; }
  }, [user]);

  /* ── Mark one as read ────────────────────────────────────────────── */
  const markRead = useCallback(async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  }, []);

  /* ── Mark all as read ────────────────────────────────────────────── */
  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  /* ── Remove ──────────────────────────────────────────────────────── */
  const removeNotification = useCallback(async (id) => {
    try {
      await notificationsApi.remove(id);
      setNotifications(prev => {
        const removed = prev.find(n => n._id === id);
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n._id !== id);
      });
    } catch {}
  }, []);

  /* ── Add toast ───────────────────────────────────────────────────── */
  const addToast = useCallback((notif) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev.slice(-3), { id, notif }]); // max 4 toasts
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* ── Init: fetch count on login ──────────────────────────────────── */
  useEffect(() => {
    if (user) {
      refreshCount();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Socket listeners ────────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const onNew = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(c => c + 1);
      addToast(notif);
    };

    const onRead = ({ notificationId }) => {
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    };

    const onReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on('notification:new',      onNew);
    socket.on('notification:read',     onRead);
    socket.on('notification:read-all', onReadAll);

    return () => {
      socket.off('notification:new',      onNew);
      socket.off('notification:read',     onRead);
      socket.off('notification:read-all', onReadAll);
    };
  }, [socket, addToast]);

  return (
    <NotificationContext.Provider value={{
      unreadCount, notifications,
      fetchNotifications, refreshCount,
      markRead, markAllRead, removeNotification,
    }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
        {toasts.map(t => (
          <ToastItem key={t.id} notif={t.notif} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
