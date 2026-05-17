import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';

const fmtAgo = d => {
  if (!d) return '';
  const sec = Math.floor((Date.now() - new Date(d)) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

const TYPE_LABELS = {
  task_assigned:     'Task Assigned',
  task_due:          'Task Due',
  invoice_paid:      'Invoice Paid',
  message_received:  'Message Received',
  document_uploaded: 'Document Uploaded',
  matter_assigned:   'Matter Assigned',
  lead_converted:    'Lead Converted',
  system_alert:      'System Alert',
  ai_suggestion:     'AI Suggestion',
};

function FilterBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600,
      background: active ? '#7C3AED' : '#F3F4F6',
      color: active ? '#fff' : '#6B7280',
      transition: 'all 0.15s',
    }}>{label}</button>
  );
}

function TypeChip({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: `${color}18`, color,
    }}>{label}</span>
  );
}

const TYPE_COLORS = {
  task_assigned: '#3B82F6', task_due: '#F59E0B', invoice_paid: '#10B981',
  message_received: '#7C3AED', document_uploaded: '#6B7280',
  matter_assigned: '#4F46E5', lead_converted: '#EC4899',
  system_alert: '#EF4444', ai_suggestion: '#8B5CF6',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead, removeNotification } = useNotifications();

  const [filter,  setFilter]  = useState('all');  // all | unread | read
  const [typeFilter, setType] = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const list = await fetchNotifications(p);
    if (list.length < 20) setHasMore(false);
    setLoading(false);
  }, [fetchNotifications]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        load(nextPage);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loading, hasMore, page, load]);

  const filtered = notifications.filter(n => {
    if (filter === 'unread' && n.isRead)    return false;
    if (filter === 'read'   && !n.isRead)   return false;
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };

  const allTypes = [...new Set(notifications.map(n => n.type))];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Notifications</h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB',
            background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#7C3AED',
          }}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', 'unread', 'read'].map(f => (
          <FilterBtn key={f} label={f.charAt(0).toUpperCase() + f.slice(1)}
            active={filter === f} onClick={() => setFilter(f)} />
        ))}
        <div style={{ width: 1, background: '#E5E7EB', margin: '0 4px' }} />
        <FilterBtn label="All types" active={!typeFilter} onClick={() => setType('')} />
        {allTypes.map(t => (
          <FilterBtn key={t} label={TYPE_LABELS[t] || t} active={typeFilter === t} onClick={() => setType(t)} />
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {filtered.map(n => (
            <motion.div
              key={n._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '16px 20px', borderRadius: 14,
                background: n.isRead ? '#fff' : '#F5F3FF',
                border: '1.5px solid ' + (n.isRead ? '#E5E7EB' : '#DDD6FE'),
                cursor: n.link ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onClick={() => handleClick(n)}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${n.color || '#7C3AED'}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {n.icon || '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <TypeChip label={TYPE_LABELS[n.type] || n.type} color={TYPE_COLORS[n.type] || '#7C3AED'} />
                  {!n.isRead && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: n.isRead ? 500 : 700, color: '#111827', marginBottom: 4 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{n.body}</div>
                )}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{fmtAgo(n.createdAt)}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)}
                    title="Mark as read"
                    style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                    ✓
                  </button>
                )}
                <button onClick={() => removeNotification(n._id)}
                  title="Delete"
                  style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#9CA3AF' }}>
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No notifications</div>
            <div style={{ fontSize: 13 }}>
              {filter === 'unread' ? "You're all caught up!" : "No notifications match this filter."}
            </div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 1 }} />
        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 13 }}>Loading…</div>
        )}
        {!loading && !hasMore && filtered.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 12 }}>— End of notifications —</div>
        )}
      </div>
    </div>
  );
}
