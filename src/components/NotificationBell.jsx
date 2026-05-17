import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const fmtAgo = d => {
  if (!d) return '';
  const sec = Math.floor((Date.now() - new Date(d)) / 1000);
  if (sec < 60)   return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

export default function NotificationBell({ light = false }) {
  const { unreadCount, notifications, markRead, markAllRead, fetchNotifications } = useNotifications();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function toggleOpen() {
    if (!open) {
      setLoading(true);
      await fetchNotifications(1);
      setLoading(false);
    }
    setOpen(o => !o);
  }

  async function handleItemClick(n) {
    if (!n.isRead) await markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  const iconColor = light ? 'rgba(255,255,255,0.85)' : '#6B7280';
  const recentNotifs = notifications.slice(0, 20);

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        title="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: 6, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={iconColor} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
            border: '2px solid ' + (light ? '#7C3AED' : '#F8F9FC'),
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, background: '#fff', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1.5px solid #E5E7EB',
          zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderBottom: '1.5px solid #F3F4F6',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => { setOpen(false); navigate('/notifications'); }}
                style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                View all
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
            )}
            {!loading && recentNotifs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13 }}>No notifications yet</div>
              </div>
            )}
            {!loading && recentNotifs.map(n => (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 16px', cursor: n.link ? 'pointer' : 'default',
                  background: n.isRead ? '#fff' : '#F5F3FF',
                  borderBottom: '1px solid #F3F4F6',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? '#fff' : '#F5F3FF'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${n.color || '#7C3AED'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {n.icon || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#111827', marginBottom: 2 }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    {fmtAgo(n.createdAt)}
                  </div>
                </div>
                {!n.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1.5px solid #F3F4F6', textAlign: 'center' }}>
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
