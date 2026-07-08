import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getDocuments, updateDocument } from '../api/documents.api';
import { getContractStatus, daysUntilExpiry, CONTRACT_STATUS, ContractStatusBadge } from '../utils/contractStatus';

/* ── design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:       '#07091f',
  sur:      '#0e1033',
  bdr:      'rgba(255, 255, 255, 0.08)',
  indigo:   '#6366f1',
  indigoS:  'rgba(99, 102, 241, 0.15)',
  indigoBdr:'rgba(99, 102, 241, 0.3)',
  ink:      '#f0f0ff',
  muted:    'rgba(240, 240, 255, 0.5)',
  subtle:   'rgba(255, 255, 255, 0.05)',
  ele:      'rgba(255, 255, 255, 0.08)',
  amber:    '#f59e0b',
  amberS:   'rgba(245, 158, 11, 0.15)',
  amberBdr: 'rgba(245, 158, 11, 0.3)',
  red:      '#ef4444',
  redS:     'rgba(239, 68, 68, 0.15)',
  redBdr:   'rgba(239, 68, 68, 0.3)',
  green:    '#10b981',
  greenS:   'rgba(16, 185, 129, 0.15)',
  purple:   '#a855f7',
  purpleS:  'rgba(168, 85, 247, 0.15)',
  purpleBdr:'rgba(168, 85, 247, 0.3)',
};

/* ── helpers ──────────────────────────────────────────────────────── */
function daysUntil(dateStr) {
  return Math.floor((new Date(dateStr) - Date.now()) / 86400000);
}

function healthHex(score) {
  if (!score) return T.muted;
  if (score >= 75) return T.indigo;
  if (score >= 50) return T.amber;
  return T.red;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

/* ── Timeline helpers ─────────────────────────────────────────────── */
const EVENT_STYLE = {
  Expiry:  { bg: T.redS,    text: T.red,    bdr: 'rgba(239,68,68,0.22)',    icon: 'event_busy',  label: 'Expiry'  },
  Renewal: { bg: T.indigoS, text: T.indigo, bdr: 'rgba(99,102,241,0.22)',   icon: 'autorenew',   label: 'Renewal' },
  Review:  { bg: T.purpleS, text: T.purple, bdr: 'rgba(168,85,247,0.22)',   icon: 'rate_review', label: 'Review'  },
};

function dotHex(days) {
  if (days === null) return T.purple;
  if (days < 0)      return T.red;
  if (days <= 7)     return T.red;
  if (days <= 30)    return T.amber;
  return T.indigo;
}

function daysLabel(days) {
  if (days === null) return { text: 'Needs Review',             color: T.purple };
  if (days === 0)    return { text: 'Today',                    color: T.red    };
  if (days < 0)      return { text: `${Math.abs(days)}d ago`,   color: T.red    };
  if (days <= 7)     return { text: `in ${days}d`,              color: T.red    };
  if (days <= 30)    return { text: `in ${days}d`,              color: T.amber  };
  return               { text: `in ${days}d`,              color: T.indigo };
}

function buildTimelineEvents(enrichedDocs) {
  const events = [];

  for (const doc of enrichedDocs) {
    if (doc.expiryDate) {
      events.push({
        _key: `exp-${doc._id}`, docId: doc._id,
        docName: doc.originalName, docType: doc.docType,
        date: doc.expiryDate, type: 'Expiry',
        days: daysUntil(doc.expiryDate),
      });
    }
    if (doc.renewalDate) {
      events.push({
        _key: `ren-${doc._id}`, docId: doc._id,
        docName: doc.originalName, docType: doc.docType,
        date: doc.renewalDate, type: 'Renewal',
        days: daysUntil(doc.renewalDate),
      });
    }
  }

  for (const doc of enrichedDocs) {
    if (doc.status === 'analyzed' && doc.riskLevel === 'high' && !doc.expiryDate) {
      events.push({
        _key: `rev-${doc._id}`, docId: doc._id,
        docName: doc.originalName, docType: doc.docType,
        date: null, type: 'Review', days: null,
      });
    }
  }

  return events.sort((a, b) => {
    if (a.days === null && b.days === null) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    if (a.days >= 0 && b.days >= 0) return a.days - b.days;
    if (a.days < 0  && b.days < 0)  return b.days - a.days;
    return a.days >= 0 ? -1 : 1;
  });
}

/* ── DateEditor — inline date picker ─────────────────────────────── */
function DateEditor({ docId, field, currentValue, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(toInputDate(currentValue));
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = async () => {
    if (!value) return setEditing(false);
    setSaving(true);
    try {
      const res = await updateDocument(docId, { [field]: value });
      onSaved(docId, res.data.data.document);
    } catch { /* ignore */ }
    finally { setSaving(false); setEditing(false); }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          style={{ background: T.subtle, border: `1.5px solid ${T.indigoBdr}`, color: T.ink, borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', width: 136, fontFamily: 'inherit' }}
        />
        <button
          onClick={save}
          disabled={saving}
          style={{ padding: 5, borderRadius: 6, background: T.indigoS, border: `1px solid ${T.indigoBdr}`, color: T.indigo, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'progress_activity' : 'check'}</span>
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ padding: 5, borderRadius: 6, background: T.subtle, border: `1px solid ${T.bdr}`, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title={currentValue ? 'Click to change date' : 'Click to set date'}
    >
      {currentValue
        ? <span style={{ fontSize: 12, color: T.muted }}>{formatDate(currentValue)}</span>
        : <span style={{ fontSize: 12, color: `${T.muted}66`, fontStyle: 'italic' }}>Not set</span>
      }
      <span className="material-symbols-outlined" style={{ fontSize: 13, color: `${T.muted}77` }}>edit</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function ContractLifecycle() {
  const navigate = useNavigate();

  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterLC, setFilterLC] = useState('all');
  const [sortBy,   setSortBy]   = useState('uploadedAt');

  useEffect(() => {
    getDocuments()
      .then((res) => setDocs(res.data.data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDocSaved = (docId, updated) =>
    setDocs((prev) => prev.map((d) => (d._id === docId ? { ...d, ...updated } : d)));

  /* ── derived ─────────────────────────────────────────────────── */
  const enriched = docs.map((d) => ({ ...d, _status: getContractStatus(d) }));

  const counts = {
    active:   enriched.filter((d) => d._status === 'active').length,
    expiring: enriched.filter((d) => d._status === 'expiring').length,
    expired:  enriched.filter((d) => d._status === 'expired').length,
    pending:  enriched.filter((d) => d._status === 'pending' || d._status === 'error').length,
  };

  const urgentDocs = enriched.filter((d) => {
    if (!d.expiryDate) return false;
    const days = daysUntil(d.expiryDate);
    return days >= 0 && days <= 7;
  });

  const filtered = enriched
    .filter((d) => {
      const name = d.originalName || '';
      const matchSearch = !search
        || name.toLowerCase().includes(search.toLowerCase())
        || d.docType?.toLowerCase().includes(search.toLowerCase());
      const matchLC = filterLC === 'all' || d._status === filterLC;
      return matchSearch && matchLC;
    })
    .sort((a, b) => {
      if (sortBy === 'expiryDate') {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (sortBy === 'healthScore') return (b.healthScore || 0) - (a.healthScore || 0);
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });

  const pipeline = [
    { label: 'Uploaded',          count: docs.length,                                            done: docs.length > 0,              color: T.indigo,  icon: 'upload_file'   },
    { label: 'Analysis Complete', count: enriched.filter((d) => d.status === 'analyzed').length, done: enriched.some((d) => d.status === 'analyzed'), color: T.indigo, icon: 'psychology' },
    { label: 'Active Contracts',  count: counts.active,                                          done: counts.active > 0,            color: T.green,   icon: 'verified_user' },
    { label: 'Expiring Soon',     count: counts.expiring,                                        done: false,                        color: T.amber,   icon: 'schedule'      },
    { label: 'Expired',           count: counts.expired,                                         done: false,                        color: T.red,     icon: 'event_busy'    },
  ];

  const statCards = [
    { label: 'Active Contracts', value: counts.active,   color: T.indigo, bg: T.indigoS, bdr: T.indigoBdr, icon: 'verified_user',   filter: 'active'   },
    { label: 'Expiring Soon',    value: counts.expiring, color: T.amber,  bg: T.amberS,  bdr: T.amberBdr,  icon: 'schedule',        filter: 'expiring' },
    { label: 'Expired',          value: counts.expired,  color: T.red,    bg: T.redS,    bdr: T.redBdr,    icon: 'event_busy',      filter: 'expired'  },
    { label: 'Pending Review',   value: counts.pending,  color: T.purple, bg: T.purpleS, bdr: T.purpleBdr, icon: 'pending_actions', filter: 'pending'  },
  ];

  return (
    <div className="dark-studio" style={{ background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(14, 16, 51, 0.93)', backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${T.bdr}`, padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 1px 16px rgba(99,102,241,0.07)',
      }}>
        <button
          onClick={() => navigate('/studio')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: T.subtle, border: `1px solid ${T.bdr}`, borderRadius: 8, color: T.muted, cursor: 'pointer', transition: 'all 0.15s' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>timeline</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.ink, letterSpacing: '-0.01em' }}>Contract Lifecycle</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Monitor expiry, renewal, and risk across your portfolio</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Nightly alerts active</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e66' }} />
        </div>
      </header>

      <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Urgent expiry banner ─────────────────────────────── */}
        <AnimatePresence>
          {!loading && urgentDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: T.redS, border: `1.5px solid ${T.redBdr}`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: T.red, flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>alarm</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 14, color: T.red }}>
                  {urgentDocs.length} contract{urgentDocs.length !== 1 ? 's' : ''} expiring within 7 days
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {urgentDocs.map((d) => {
                    const days = daysUntil(d.expiryDate);
                    return (
                      <button
                        key={d._id}
                        onClick={() => navigate(`/analysis/${d._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: `1px solid ${T.redBdr}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: T.red, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span>
                        {d.originalName}
                        <span style={{ fontWeight: 800 }}>— {days}d left</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats row ────────────────────────────────────────── */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show"
        >
          {statCards.map(({ label, value, color, bg, bdr, icon, filter }) => (
            <motion.button
              key={label}
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }}
              whileHover={{ y: -4, boxShadow: `0 12px 32px ${bg}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterLC((f) => f === filter ? 'all' : filter)}
              style={{
                padding: '22px 20px', borderRadius: 18, textAlign: 'left', border: `1.5px solid ${filterLC === filter ? color : T.bdr}`,
                background: filterLC === filter ? bg : T.sur, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: filterLC === filter ? `0 6px 24px ${bg}` : '0 2px 8px rgba(99,102,241,0.05)',
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 34, fontWeight: 800, color: loading ? `${T.muted}66` : color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {loading ? '—' : String(value).padStart(2, '0')}
                </h3>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>

          {/* ── Pipeline sidebar ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pipeline card */}
            <div style={{ background: T.sur, borderRadius: 18, padding: 24, border: `1px solid ${T.bdr}`, boxShadow: '0 2px 12px rgba(99,102,241,0.05)' }}>
              <h4 style={{ margin: '0 0 24px', fontSize: 15, fontWeight: 700, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.indigo }}>timeline</span>
                Lifecycle Pipeline
              </h4>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.ele, flexShrink: 0 }} className="animate-pulse" />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 12, background: T.ele, borderRadius: 6, width: '65%', marginBottom: 6 }} className="animate-pulse" />
                        <div style={{ height: 10, background: T.ele, borderRadius: 6, width: '40%' }} className="animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {/* Connector line */}
                  <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 1, background: T.bdr, zIndex: 0 }} />
                  {pipeline.map(({ label, count, done, color, icon }) => (
                    <div key={label} style={{ position: 'relative', paddingLeft: 38, opacity: !done && count === 0 ? 0.4 : 1 }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 4, width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                        background: done ? color : T.ele,
                        border: done ? 'none' : `1.5px solid ${T.bdr}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: done ? `0 0 12px ${color}44` : 'none',
                      }}>
                        {done
                          ? <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>check</span>
                          : <span className="material-symbols-outlined" style={{ fontSize: 14, color: count > 0 ? color : T.muted }}>{icon}</span>
                        }
                      </div>
                      <h5 style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: T.ink }}>{label}</h5>
                      <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
                        {count > 0 ? `${count} document${count !== 1 ? 's' : ''}` : 'None yet'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio Health */}
            {!loading && docs.length > 0 && (() => {
              const analyzed = enriched.filter((d) => d.healthScore > 0);
              const avg = analyzed.length
                ? Math.round(analyzed.reduce((s, d) => s + d.healthScore, 0) / analyzed.length)
                : 0;
              return (
                <div style={{ background: T.sur, borderRadius: 18, padding: 20, border: `1px solid ${T.bdr}`, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>Portfolio Health</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: healthHex(avg) }}>{avg || '—'}/100</span>
                  </div>
                  {avg > 0 && (
                    <div style={{ height: 6, width: '100%', background: T.ele, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: healthHex(avg), width: `${avg}%`, transition: 'width 0.7s' }} />
                    </div>
                  )}
                  <p style={{ margin: '12px 0 0', fontSize: 11, color: T.muted }}>
                    Monitoring {docs.length} document{docs.length !== 1 ? 's' : ''} — {analyzed.length} analysed.
                  </p>
                </div>
              );
            })()}

            {/* Auto-detection info */}
            <div style={{ background: T.indigoS, borderRadius: 18, padding: 18, border: `1px solid ${T.indigoBdr}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>auto_detect_voice</span>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.ink }}>Auto-Detection</p>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: T.muted, lineHeight: 1.65 }}>
                NyayaAI reads expiry dates from your document text during analysis — phrases like "expires on", "valid for 12 months", or "commencement date plus 2 years" are automatically detected.
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: T.muted, lineHeight: 1.65 }}>
                Click any date cell in the table to set or override it manually.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.indigo, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.indigo, display: 'inline-block' }} className="animate-pulse" />
                Nightly alerts active
              </div>
            </div>
          </div>

          {/* ── Document table ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Search + sort bar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: T.muted, pointerEvents: 'none' }}>search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or type…"
                  style={{ width: '100%', background: T.sur, border: `1.5px solid ${T.bdr}`, borderRadius: 12, padding: '10px 14px 10px 40px', fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ background: T.sur, border: `1.5px solid ${T.bdr}`, color: T.muted, fontSize: 12, borderRadius: 12, padding: '10px 32px 10px 14px', appearance: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <option value="uploadedAt">Sort: Newest</option>
                  <option value="expiryDate">Sort: Expiry Date</option>
                  <option value="healthScore">Sort: Health</option>
                </select>
                <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none', fontSize: 16 }}>expand_more</span>
              </div>
            </div>

            {/* Status filter chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'active', 'expiring', 'expired', 'pending'].map((lc) => {
                const cs     = CONTRACT_STATUS[lc];
                const active = filterLC === lc;
                return (
                  <button
                    key={lc}
                    onClick={() => setFilterLC(lc)}
                    style={{
                      padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${active ? T.indigo : T.bdr}`,
                      background: active ? T.indigo : T.sur,
                      color: active ? '#fff' : T.muted,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {lc === 'all' ? `All (${enriched.length})` : `${cs?.label} (${counts[lc] ?? 0})`}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ background: T.sur, borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.bdr}`, boxShadow: '0 2px 12px rgba(99,102,241,0.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', whiteSpace: 'nowrap', minWidth: 700, borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.bdr}`, background: T.subtle }}>
                      {['Document', 'Type', 'Status', 'Health', 'Expiry Date', 'Renewal Date', 'Actions'].map((h, i) => (
                        <th key={h} style={{ padding: '13px 18px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.bdr}` }}>
                          {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                            <td key={c} style={{ padding: '18px' }}>
                              <div style={{ height: 12, background: T.ele, borderRadius: 6, width: '75%' }} className="animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '64px 24px', textAlign: 'center', color: T.muted }}>
                          {docs.length === 0 ? (
                            <div>
                              <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 12, opacity: 0.22, color: T.muted }}>folder_open</span>
                              <p style={{ margin: '0 0 12px', fontSize: 14 }}>No documents yet.</p>
                              <button
                                onClick={() => navigate('/upload')}
                                style={{ color: T.indigo, fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Upload your first document →
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 14 }}>No documents match your filter.</span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((doc) => {
                        const exp      = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                        const isUrgent = exp !== null && exp >= 0 && exp <= 7;
                        return (
                          <tr
                            key={doc._id}
                            style={{ borderBottom: `1px solid ${T.bdr}`, background: isUrgent ? 'rgba(239,68,68,0.025)' : 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
                            onClick={() => navigate(`/analysis/${doc._id}`)}
                            onMouseEnter={(e) => e.currentTarget.style.background = T.subtle}
                            onMouseLeave={(e) => e.currentTarget.style.background = isUrgent ? 'rgba(239,68,68,0.025)' : 'transparent'}
                          >
                            {/* Name */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isUrgent && (
                                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.red, flexShrink: 0, fontVariationSettings: "'FILL' 1" }} title="Expiring within 7 days">alarm</span>
                                )}
                                <div>
                                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{doc.originalName}</p>
                                  <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{doc._id.slice(-6).toUpperCase()}</p>
                                </div>
                              </div>
                            </td>
                            {/* Type */}
                            <td style={{ padding: '14px 18px', color: T.muted, fontSize: 12 }}>{doc.docType || '—'}</td>
                            {/* Status */}
                            <td style={{ padding: '14px 18px' }}>
                              <ContractStatusBadge doc={doc} size="xs" />
                            </td>
                            {/* Health */}
                            <td style={{ padding: '14px 18px' }}>
                              {doc.healthScore > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 800, fontSize: 13, color: healthHex(doc.healthScore) }}>{doc.healthScore}</span>
                                  <div style={{ width: 44, height: 4, background: T.ele, borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 999, background: healthHex(doc.healthScore), width: `${doc.healthScore}%` }} />
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                              )}
                            </td>
                            {/* Expiry */}
                            <td style={{ padding: '14px 18px' }} onClick={(e) => e.stopPropagation()}>
                              <div>
                                <DateEditor docId={doc._id} field="expiryDate" currentValue={doc.expiryDate} onSaved={handleDocSaved} />
                                {exp !== null && exp >= 0 && exp <= 30 && (
                                  <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: exp <= 7 ? T.red : T.amber }}>
                                    {exp === 0 ? 'Expires today' : `${exp}d left`}
                                  </p>
                                )}
                                {exp !== null && exp < 0 && (
                                  <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: T.red }}>{Math.abs(exp)}d ago</p>
                                )}
                              </div>
                            </td>
                            {/* Renewal */}
                            <td style={{ padding: '14px 18px' }} onClick={(e) => e.stopPropagation()}>
                              <DateEditor docId={doc._id} field="renewalDate" currentValue={doc.renewalDate} onSaved={handleDocSaved} />
                            </td>
                            {/* Actions */}
                            <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => navigate(`/analysis/${doc._id}`)}
                                  style={{ padding: 6, borderRadius: 8, background: 'none', border: `1px solid ${T.bdr}`, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}
                                  title="View Analysis"
                                  onMouseEnter={(e) => { e.currentTarget.style.background = T.indigoS; e.currentTarget.style.color = T.indigo; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.muted; }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>analytics</span>
                                </button>
                                <button
                                  onClick={() => navigate(`/ask?docId=${doc._id}`)}
                                  style={{ padding: 6, borderRadius: 8, background: 'none', border: `1px solid ${T.bdr}`, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}
                                  title="Ask AI"
                                  onMouseEnter={(e) => { e.currentTarget.style.background = T.indigoS; e.currentTarget.style.color = T.indigo; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.muted; }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>psychology</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              {!loading && filtered.length > 0 && (
                <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.muted }}>
                  <span>{filtered.length} document{filtered.length !== 1 ? 's' : ''}{filterLC !== 'all' ? ' (filtered)' : ''}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Click date cells to edit</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.indigo, display: 'inline-block' }} className="animate-pulse" />
                      <span style={{ fontWeight: 600 }}>Live</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Lifecycle Timeline ───────────────────────────────── */}
        {!loading && (
          <LifecycleTimeline
            events={buildTimelineEvents(enriched)}
            onNavigate={(docId) => navigate(`/analysis/${docId}`)}
          />
        )}
      </div>
    </div>
  );
}

/* ── LifecycleTimeline ─────────────────────────────────────────────── */
const SHOW_LIMIT = 8;

function LifecycleTimeline({ events, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const visible  = expanded ? events : events.slice(0, SHOW_LIMIT);
  const hasMore  = events.length > SHOW_LIMIT;
  const upcoming = visible.filter((e) => e.days === null || e.days >= 0);
  const past     = visible.filter((e) => e.days !== null && e.days < 0);

  return (
    <div style={{ marginTop: 32, paddingBottom: 40 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>timeline</span>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>Lifecycle Timeline</h3>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: T.indigoS, color: T.indigo }}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: T.muted }}>
          {[
            { dot: T.red,    label: '≤7 days / Expired' },
            { dot: T.amber,  label: '8–30 days'         },
            { dot: T.indigo, label: '>30 days'          },
            { dot: T.purple, label: 'Review needed'     },
          ].map(({ dot, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline body */}
      <div style={{ background: T.sur, borderRadius: 20, border: `1px solid ${T.bdr}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(99,102,241,0.06)' }}>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <>
            <div style={{ padding: '10px 20px', background: T.subtle, borderBottom: `1px solid ${T.bdr}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>Upcoming &amp; Active</p>
            </div>
            <div style={{ position: 'relative' }}>
              {/* Connector line */}
              <div style={{ position: 'absolute', left: 35, top: 0, bottom: 0, width: 1, background: T.bdr, pointerEvents: 'none', zIndex: 0 }} />

              {upcoming.map((event, idx) => {
                const es   = EVENT_STYLE[event.type] || EVENT_STYLE.Expiry;
                const dc   = dotHex(event.days);
                const dl   = daysLabel(event.days);
                const isLast = idx === upcoming.length - 1;

                return (
                  <button
                    key={event._key}
                    onClick={() => onNavigate(event.docId)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'flex-start', gap: 20,
                      padding: '18px 20px', border: 'none', background: 'transparent',
                      borderBottom: !isLast ? `1px solid ${T.bdr}` : 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.subtle}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Dot */}
                    <div style={{ flexShrink: 0, marginTop: 3, zIndex: 1 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: dc, boxShadow: `0 0 8px ${dc}66`, border: `2px solid ${T.sur}` }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                            {event.docName}
                          </p>
                          {event.docType && (
                            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{event.docType}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: es.bg, color: es.text, border: `1px solid ${es.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{es.icon}</span>
                            {es.label}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: dl.color }}>{dl.text}</span>
                        </div>
                      </div>
                      {event.date && (
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: `${T.muted}aa` }}>
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: `${T.muted}55`, flexShrink: 0, marginTop: 2 }}>chevron_right</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <>
            <div style={{ padding: '10px 20px', background: T.redS, borderBottom: `1px solid ${T.redBdr}`, borderTop: `1px solid ${T.redBdr}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: `${T.red}bb` }}>Expired</p>
            </div>
            <div style={{ position: 'relative', opacity: 0.8 }}>
              <div style={{ position: 'absolute', left: 35, top: 0, bottom: 0, width: 1, background: T.bdr, pointerEvents: 'none', zIndex: 0 }} />

              {past.map((event, idx) => {
                const es   = EVENT_STYLE[event.type] || EVENT_STYLE.Expiry;
                const dl   = daysLabel(event.days);
                const isLast = idx === past.length - 1;

                return (
                  <button
                    key={event._key}
                    onClick={() => onNavigate(event.docId)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'flex-start', gap: 20,
                      padding: '14px 20px', border: 'none', background: 'transparent',
                      borderBottom: !isLast ? `1px solid ${T.bdr}` : 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.subtle}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ flexShrink: 0, marginTop: 3, zIndex: 1 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${T.red}88`, background: T.redS }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: `${T.ink}88`, textDecoration: 'line-through', textDecorationColor: `${T.red}66`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                            {event.docName}
                          </p>
                          {event.docType && <p style={{ margin: 0, fontSize: 11, color: `${T.muted}88` }}>{event.docType}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: es.bg, color: es.text, border: `1px solid ${es.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{es.icon}</span>
                            {es.label}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: dl.color }}>{dl.text}</span>
                        </div>
                      </div>
                      {event.date && (
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: `${T.muted}77` }}>
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: `${T.muted}44`, flexShrink: 0, marginTop: 2 }}>chevron_right</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Show more / less */}
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ width: '100%', padding: '14px 0', borderTop: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 600, color: T.muted, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.subtle; e.currentTarget.style.color = T.indigo; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{expanded ? 'expand_less' : 'expand_more'}</span>
            {expanded
              ? 'Show less'
              : `Show ${events.length - SHOW_LIMIT} more event${events.length - SHOW_LIMIT !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
}
