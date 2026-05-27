import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAlerts, markAsRead, markAllRead, deleteAlert } from '../api/alerts.api';
import { useAlertCount } from '../context/AlertContext';
import { I } from '../components/Icons';

/* ── Design tokens ──────────────────────────────────────────────── */
const BG     = '#07091f';
const SUR    = 'rgba(255,255,255,0.04)';
const ELE    = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(255,255,255,0.08)';
const T      = '#f0f0ff';
const TM     = 'rgba(240,240,255,0.5)';
const INDIGO = '#6366f1';
const CYAN   = '#22d3ee';
const ERR    = '#f43f5e';

const FILTER_TABS = ['All', 'Unread', 'Expiry', 'Renewal', 'Compliance', 'Risk'];

const TYPE_META = {
  expiry:     { Ic: I.Clock,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Contract Expiry'  },
  renewal:    { Ic: I.Activity, color: INDIGO,    bg: 'rgba(99,102,241,0.12)',  label: 'Renewal Due'      },
  compliance: { Ic: I.Shield,   color: ERR,       bg: 'rgba(244,63,94,0.12)',   label: 'Compliance Alert' },
  risk:       { Ic: I.Alert,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Risk Detected'    },
  info:       { Ic: I.Info,     color: TM,        bg: ELE,                      label: 'Notification'     },
};

const SEVERITY_STYLE = {
  high:   { color: ERR,       bg: 'rgba(244,63,94,0.15)'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  low:    { color: '#eab308', bg: 'rgba(234,179,8,0.1)'    },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

/* ── AlertCard ──────────────────────────────────────────────────── */
function AlertCard({ alert, onMarkRead, onDelete, onViewDoc }) {
  const meta     = TYPE_META[alert.alertType] || TYPE_META.info;
  const docId    = alert.documentId?._id || alert.documentId;
  const docName  = alert.documentId?.originalName || null;
  const severity = alert.severity || 'low';
  const sevStyle = SEVERITY_STYLE[severity] || SEVERITY_STYLE.low;
  const Ic       = meta.Ic;

  return (
    <motion.div
      onClick={() => { if (!alert.isRead) onMarkRead(alert._id); }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      style={{
        borderRadius: 14, padding: '20px 22px', cursor: 'pointer',
        background: alert.isRead ? SUR : `linear-gradient(135deg, ${meta.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${alert.isRead ? BORDER : meta.color + '33'}`,
        borderLeft: `3px solid ${alert.isRead ? 'transparent' : meta.color}`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {!alert.isRead && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${meta.color}66, transparent)` }} />
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Icon */}
        <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: alert.isRead ? ELE : meta.bg, border: `1px solid ${alert.isRead ? BORDER : meta.color + '33'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic size={20} style={{ color: alert.isRead ? TM : meta.color }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: alert.isRead ? TM : T }}>{alert.title || meta.label}</h3>
              {!alert.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: INDIGO, flexShrink: 0, display: 'inline-block' }} />}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em', background: sevStyle.bg, color: sevStyle.color }}>
                {severity}
              </span>
            </div>
            <span style={{ fontSize: 11, color: alert.isRead ? TM : meta.color, flexShrink: 0 }}>{timeAgo(alert.createdAt)}</span>
          </div>

          <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: alert.isRead ? TM : 'rgba(240,240,255,0.8)' }}>
            {alert.message}
            {docName && <> — <span style={{ fontWeight: 600, color: meta.color }}>{docName}</span></>}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
            {docId && (
              <button
                onClick={() => onViewDoc(docId)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: alert.isRead ? ELE : `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
                  color: alert.isRead ? TM : '#fff',
                }}
              >
                View Document
              </button>
            )}
            {!alert.isRead && (
              <button
                onClick={() => onMarkRead(alert._id)}
                style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 8, background: ELE, border: 'none', cursor: 'pointer', color: TM }}
              >
                Mark read
              </button>
            )}
            <button
              onClick={() => onDelete(alert._id)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: TM, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 7 }}
              onMouseEnter={e => { e.currentTarget.style.color = ERR; }}
              onMouseLeave={e => { e.currentTarget.style.color = TM; }}
            >
              <I.X size={13} /> Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function Alerts() {
  const navigate = useNavigate();
  const { refreshAlerts } = useAlertCount();

  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('All');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAlerts();
      setAlerts(res.data.data.alerts || []);
    } catch { setError('Failed to load alerts. Please retry.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    try { await markAsRead(id); refreshAlerts(); }
    catch { setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: false } : a)); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const prev = alerts;
    setAlerts(all => all.map(a => ({ ...a, isRead: true })));
    try { await markAllRead(); refreshAlerts(); }
    catch { setAlerts(prev); }
    finally { setMarkingAll(false); }
  };

  const handleDelete = async (id) => {
    const prev = alerts;
    setAlerts(all => all.filter(a => a._id !== id));
    try { await deleteAlert(id); refreshAlerts(); }
    catch { setAlerts(prev); }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'Unread')     return !a.isRead;
    if (filter === 'Expiry')     return a.alertType === 'expiry';
    if (filter === 'Renewal')    return a.alertType === 'renewal';
    if (filter === 'Compliance') return a.alertType === 'compliance';
    if (filter === 'Risk')       return a.alertType === 'risk';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const tabCount = (tab) => {
    if (tab === 'All')        return alerts.length;
    if (tab === 'Unread')     return alerts.filter(a => !a.isRead).length;
    if (tab === 'Expiry')     return alerts.filter(a => a.alertType === 'expiry').length;
    if (tab === 'Renewal')    return alerts.filter(a => a.alertType === 'renewal').length;
    if (tab === 'Compliance') return alerts.filter(a => a.alertType === 'compliance').length;
    if (tab === 'Risk')       return alerts.filter(a => a.alertType === 'risk').length;
    return 0;
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '36px 24px 64px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate('/studio')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TM, fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 14 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = TM; }}
          >
            <I.ArrowLeft size={14} /> Back to Studio
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 900, color: T, letterSpacing: '-0.02em' }}>
                <span style={{ background: `linear-gradient(135deg, ${INDIGO}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Alert</span> Center
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {loading ? (
                  <span style={{ fontSize: 13, color: TM }}>Loading…</span>
                ) : (
                  <>
                    {unreadCount > 0 ? (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{ fontSize: 12, fontWeight: 800, padding: '3px 12px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                      >
                        {unreadCount} UNREAD
                      </motion.span>
                    ) : (
                      <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 100, background: ELE, color: TM }}>ALL CAUGHT UP</span>
                    )}
                    <span style={{ fontSize: 13, color: TM }}>{alerts.length} total alert{alerts.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}`, color: TM, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <I.Check size={14} />
                {markingAll ? 'Marking…' : 'Mark all read'}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Filter tabs ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}
        >
          {FILTER_TABS.map(tab => {
            const count = tabCount(tab);
            const isActive = filter === tab;
            return (
              <motion.button
                key={tab}
                onClick={() => setFilter(tab)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: isActive ? `linear-gradient(135deg, ${INDIGO}, #4f46e5)` : ELE,
                  color: isActive ? '#fff' : TM,
                  boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {tab}
                {count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 100, background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: isActive ? '#fff' : TM }}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Loading skeleton ─────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ borderRadius: 14, padding: '20px 22px', background: SUR, border: `1px solid ${BORDER}`, display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: ELE, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '33%', borderRadius: 7, background: ELE, marginBottom: 10 }} />
                  <div style={{ height: 11, width: '66%', borderRadius: 7, background: ELE }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error state ─────────────────────────────────────────── */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '72px 24px' }}>
            <I.Alert size={48} style={{ color: ERR, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: TM, margin: '0 0 16px' }}>{error}</p>
            <button onClick={fetchAlerts} style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Retry</button>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 24px' }}>
            <I.Bell size={56} style={{ color: TM, display: 'block', margin: '0 auto 14px', opacity: 0.2 }} />
            <p style={{ color: T, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>No alerts here</p>
            <p style={{ color: TM, fontSize: 13, margin: 0 }}>
              {filter === 'All' ? "You're all caught up. Upload a document to get started." : `No ${filter.toLowerCase()} alerts at the moment.`}
            </p>
          </div>
        )}

        {/* ── Alert cards ─────────────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden" animate="show"
          >
            <AnimatePresence>
              {filtered.map(alert => (
                <motion.div
                  key={alert._id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } } }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                >
                  <AlertCard
                    alert={alert}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    onViewDoc={docId => navigate(`/analysis/${docId}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Footer ───────────────────────────────────────────────── */}
        {!loading && !error && alerts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BORDER}`, fontSize: 12, color: TM }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.Sparkle size={15} style={{ color: CYAN }} />
              <span>Alerts are generated automatically from your document analysis results.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>Live</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
