import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getAlerts, markAsRead, markAllRead, deleteAlert } from '../api/alerts.api';
import { useAlertCount } from '../context/AlertContext';

const FILTER_TABS = ['All', 'Unread', 'Expiry', 'Renewal', 'Compliance', 'Risk'];

const TYPE_META = {
  expiry:     { icon: 'schedule',     color: 'text-amber-400',          bg: 'bg-amber-400/10',     border: 'border-amber-400',     label: 'Contract Expiry'   },
  renewal:    { icon: 'autorenew',    color: 'text-primary',            bg: 'bg-primary/10',       border: 'border-primary',       label: 'Renewal Due'       },
  compliance: { icon: 'gavel',        color: 'text-error',              bg: 'bg-error/10',         border: 'border-error',         label: 'Compliance Alert'  },
  risk:       { icon: 'warning',      color: 'text-secondary',          bg: 'bg-secondary/10',     border: 'border-secondary',     label: 'Risk Detected'     },
  info:       { icon: 'info',         color: 'text-on-surface-variant', bg: 'bg-surface-container', border: 'border-outline-variant', label: 'Notification'    },
};

const TYPE_META_FALLBACK = TYPE_META.info;

const SEVERITY_BADGE = {
  high:   'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low:    'bg-yellow-500/15 text-yellow-400',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Alerts() {
  const navigate = useNavigate();
  const { refreshAlerts } = useAlertCount();

  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('All');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAlerts();
      setAlerts(res.data.data.alerts || []);
    } catch {
      setError('Failed to load alerts. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  /* ── mark single read ────────────────────────────────────────── */
  const handleMarkRead = async (id) => {
    setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, isRead: true } : a));
    try {
      await markAsRead(id);
      refreshAlerts();
    } catch {
      setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, isRead: false } : a));
    }
  };

  /* ── mark all read ───────────────────────────────────────────── */
  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const prev = alerts;
    setAlerts((all) => all.map((a) => ({ ...a, isRead: true })));
    try {
      await markAllRead();
      refreshAlerts();
    } catch {
      setAlerts(prev);
    } finally {
      setMarkingAll(false);
    }
  };

  /* ── delete ──────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    const prev = alerts;
    setAlerts((all) => all.filter((a) => a._id !== id));
    try {
      await deleteAlert(id);
      refreshAlerts();
    } catch {
      setAlerts(prev);
    }
  };

  /* ── filtered list ───────────────────────────────────────────── */
  const filtered = alerts.filter((a) => {
    if (filter === 'Unread')     return !a.isRead;
    if (filter === 'Expiry')     return a.alertType === 'expiry';
    if (filter === 'Renewal')    return a.alertType === 'renewal';
    if (filter === 'Compliance') return a.alertType === 'compliance';
    if (filter === 'Risk')       return a.alertType === 'risk';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const hasUnread   = unreadCount > 0;

  return (
    <>
      <Header title="Alerts Center">
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </Header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">

        {/* ── Page heading ──────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-2">
              <span className="gradient-text">Notifications</span>
            </h1>
            <div className="flex items-center gap-3">
              {loading ? (
                <span className="text-sm text-on-surface-variant">Loading…</span>
              ) : (
                <>
                  {unreadCount > 0 ? (
                    <motion.span initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:400, damping:20 }}
                      className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full font-bold font-label">
                      {unreadCount} UNREAD
                    </motion.span>
                  ) : (
                    <span className="bg-surface-container text-on-surface-variant text-sm px-3 py-1 rounded-full font-label">
                      ALL CAUGHT UP
                    </span>
                  )}
                  <span className="text-sm text-on-surface-variant">
                    {alerts.length} total alert{alerts.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Filter tabs ───────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.1 }}
          className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const count =
              tab === 'Unread'     ? alerts.filter((a) => !a.isRead).length :
              tab === 'Expiry'     ? alerts.filter((a) => a.alertType === 'expiry').length :
              tab === 'Renewal'    ? alerts.filter((a) => a.alertType === 'renewal').length :
              tab === 'Compliance' ? alerts.filter((a) => a.alertType === 'compliance').length :
              tab === 'Risk'       ? alerts.filter((a) => a.alertType === 'risk').length :
              alerts.length;

            return (
              <motion.button key={tab} onClick={() => setFilter(tab)}
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-headline transition-colors flex items-center gap-2 relative ${
                  filter === tab ? 'text-[#001a12]' : 'text-on-surface-variant hover:text-white border border-white/5'
                }`}
                style={filter === tab ? { background:'linear-gradient(135deg,#44e5c2,#38bfa1)', boxShadow:'0 4px 16px rgba(68,229,194,0.3)' } : { background:'rgba(12,28,73,0.5)' }}
              >
                {tab}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    filter === tab ? 'bg-[#001a12]/20 text-[#001a12]' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── States ───────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface-container-low rounded-xl p-6 animate-pulse">
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-surface-container rounded w-1/3" />
                    <div className="h-3 bg-surface-container rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 space-y-4">
            <span className="material-symbols-outlined text-error text-5xl block">error_outline</span>
            <p className="text-on-surface-variant">{error}</p>
            <button
              onClick={fetchAlerts}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <span className="material-symbols-outlined text-5xl block opacity-20">notifications_off</span>
            <p className="text-white/30 font-headline font-bold text-lg">No alerts here</p>
            <p className="text-sm text-on-surface-variant">
              {filter === 'All'
                ? "You're all caught up. Upload a document to get started."
                : `No ${filter.toLowerCase()} alerts at the moment.`}
            </p>
          </div>
        )}

        {/* ── Alert cards ───────────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div className="space-y-3"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden" animate="show">
            <AnimatePresence>
            {filtered.map((alert) => (
              <motion.div key={alert._id}
                variants={{ hidden:{ opacity:0, y:16, scale:0.97 }, show:{ opacity:1, y:0, scale:1, transition:{ duration:0.35, ease:[0.22,1,0.36,1] } } }}
                exit={{ opacity:0, x:20, scale:0.97, transition:{ duration:0.25 } }}>
                <AlertCard
                  alert={alert}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onViewDoc={(docId) => navigate(`/analysis/${docId}`)}
                />
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        {!loading && !error && alerts.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/5 text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>Alerts are generated automatically from your document analysis results.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-label">Live</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── AlertCard ─────────────────────────────────────────────────────── */
function AlertCard({ alert, onMarkRead, onDelete, onViewDoc }) {
  const meta     = TYPE_META[alert.alertType] || TYPE_META_FALLBACK;
  const docId    = alert.documentId?._id || alert.documentId;
  const docName  = alert.documentId?.originalName || null;
  const severity = alert.severity || 'low';

  const handleClick = () => {
    if (!alert.isRead) onMarkRead(alert._id);
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ x: 4, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative overflow-hidden rounded-xl p-6 cursor-pointer border-l-4 ${
        alert.isRead ? 'border-transparent' : meta.border
      }`}
      style={{ background: alert.isRead ? 'rgba(12,28,73,0.35)' : undefined, backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.05)', borderLeftWidth:'4px', borderLeftColor: alert.isRead ? 'transparent' : undefined }}
    >
      <div className="flex gap-5">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          alert.isRead ? 'bg-surface-container-high' : meta.bg
        }`}>
          <span
            className={`material-symbols-outlined text-2xl ${alert.isRead ? 'text-on-surface-variant' : meta.color}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {meta.icon}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-bold font-headline ${alert.isRead ? 'text-on-surface' : 'text-white'}`}>
                {alert.title || meta.label}
              </h3>
              {!alert.isRead && (
                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${SEVERITY_BADGE[severity] || SEVERITY_BADGE.low}`}>
                {severity}
              </span>
            </div>
            <span className={`text-xs font-label flex-shrink-0 ${alert.isRead ? 'text-on-surface-variant' : meta.color}`}>
              {timeAgo(alert.createdAt)}
            </span>
          </div>

          <p className={`text-sm leading-relaxed mb-3 ${alert.isRead ? 'text-on-surface-variant' : 'text-on-surface'}`}>
            {alert.message}
            {docName && (
              <> — <span className={`font-semibold ${meta.color}`}>{docName}</span></>
            )}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {docId && (
              <button
                onClick={() => onViewDoc(docId)}
                className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all ${
                  alert.isRead
                    ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    : `bg-primary text-on-primary hover:opacity-90`
                }`}
              >
                View Document
              </button>
            )}
            {!alert.isRead && (
              <button
                onClick={() => onMarkRead(alert._id)}
                className="text-xs px-4 py-1.5 rounded-lg font-bold bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors"
              >
                Mark read
              </button>
            )}
            <button
              onClick={() => onDelete(alert._id)}
              className="ml-auto text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
