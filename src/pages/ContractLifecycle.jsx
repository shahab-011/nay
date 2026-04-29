import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getDocuments, updateDocument } from '../api/documents.api';
import { getContractStatus, daysUntilExpiry, CONTRACT_STATUS, ContractStatusBadge } from '../utils/contractStatus';

/* ── helpers ──────────────────────────────────────────────────────── */
function daysUntil(dateStr) {
  return Math.floor((new Date(dateStr) - Date.now()) / 86400000);
}

function healthColor(score) {
  if (!score) return 'text-on-surface-variant';
  if (score >= 75) return 'text-primary';
  if (score >= 50) return 'text-amber-400';
  return 'text-error';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

/* ── Timeline helpers ─────────────────────────────────────────────── */
const EVENT_STYLE = {
  Expiry:  { bg: 'bg-error/10',       text: 'text-error',      border: 'border-error/20',       icon: 'event_busy',  label: 'Expiry'  },
  Renewal: { bg: 'bg-primary/10',     text: 'text-primary',    border: 'border-primary/20',     icon: 'autorenew',   label: 'Renewal' },
  Review:  { bg: 'bg-purple-500/10',  text: 'text-purple-400', border: 'border-purple-400/20',  icon: 'rate_review', label: 'Review'  },
};

function dotColor(days) {
  if (days === null)  return 'bg-purple-400 shadow-purple-400/40';
  if (days < 0)       return 'bg-error shadow-error/40';
  if (days <= 7)      return 'bg-error shadow-error/40';
  if (days <= 30)     return 'bg-amber-400 shadow-amber-400/40';
  return 'bg-primary shadow-primary/40';
}

function daysLabel(days) {
  if (days === null) return { text: 'Needs Review',             color: 'text-purple-400' };
  if (days === 0)    return { text: 'Today',                    color: 'text-error'      };
  if (days < 0)      return { text: `${Math.abs(days)}d ago`,   color: 'text-error'      };
  if (days <= 7)     return { text: `in ${days}d`,              color: 'text-error'      };
  if (days <= 30)    return { text: `in ${days}d`,              color: 'text-amber-400'  };
  return               { text: `in ${days}d`,              color: 'text-primary'    };
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

  // Undated Review entries for high-risk analyzed docs with no expiry date
  for (const doc of enrichedDocs) {
    if (doc.status === 'analyzed' && doc.riskLevel === 'high' && !doc.expiryDate) {
      events.push({
        _key: `rev-${doc._id}`, docId: doc._id,
        docName: doc.originalName, docType: doc.docType,
        date: null, type: 'Review', days: null,
      });
    }
  }

  // Sort: upcoming (soonest first) → past (most recent first) → undated
  return events.sort((a, b) => {
    if (a.days === null && b.days === null) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    if (a.days >= 0 && b.days >= 0) return a.days - b.days;
    if (a.days < 0  && b.days < 0)  return b.days - a.days;
    return a.days >= 0 ? -1 : 1;
  });
}

/* ── DateEditor — inline date picker cell ─────────────────────────── */
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
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="bg-surface-container border border-primary/40 text-on-surface rounded-lg px-2 py-1 text-xs outline-none w-[130px]"
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
          title="Save"
        >
          <span className="material-symbols-outlined text-sm">{saving ? 'progress_activity' : 'check'}</span>
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Cancel"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 group/date cursor-pointer"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title={currentValue ? 'Click to change date' : 'Click to set date'}
    >
      {currentValue ? (
        <span className="text-xs text-on-surface-variant">{formatDate(currentValue)}</span>
      ) : (
        <span className="text-xs text-on-surface-variant/40 italic">Not set</span>
      )}
      <span className="material-symbols-outlined text-sm text-on-surface-variant/0 group-hover/date:text-on-surface-variant/60 transition-colors">
        edit
      </span>
    </div>
  );
}

export default function ContractLifecycle() {
  const navigate = useNavigate();

  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterLC, setFilterLC] = useState('all');
  const [sortBy,   setSortBy]   = useState('uploadedAt'); // uploadedAt | expiryDate | healthScore

  useEffect(() => {
    getDocuments()
      .then((res) => setDocs(res.data.data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* live-patch a doc after inline date save */
  const handleDocSaved = (docId, updated) => {
    setDocs((prev) => prev.map((d) => (d._id === docId ? { ...d, ...updated } : d)));
  };

  /* ── derived ────────────────────────────────────────────────── */
  const enriched = docs.map((d) => ({ ...d, _status: getContractStatus(d) }));

  const counts = {
    active:   enriched.filter((d) => d._status === 'active').length,
    expiring: enriched.filter((d) => d._status === 'expiring').length,
    expired:  enriched.filter((d) => d._status === 'expired').length,
    pending:  enriched.filter((d) => d._status === 'pending' || d._status === 'error').length,
  };

  /* urgent = expiring within 7 days */
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
      return new Date(b.uploadedAt) - new Date(a.uploadedAt); // default: newest first
    });

  /* ── pipeline stages ─────────────────────────────────────────── */
  const pipeline = [
    { label: 'Uploaded',          count: docs.length,                                             done: docs.length > 0,              color: 'bg-primary',   icon: 'upload_file'   },
    { label: 'Analysis Complete', count: enriched.filter((d) => d.status === 'analyzed').length,  done: enriched.some((d) => d.status === 'analyzed'), color: 'bg-primary', icon: 'psychology' },
    { label: 'Active Contracts',  count: counts.active,                                           done: counts.active > 0,            color: 'bg-primary',   icon: 'verified_user' },
    { label: 'Expiring Soon',     count: counts.expiring,                                         done: false,                        color: 'bg-amber-500', icon: 'schedule'      },
    { label: 'Expired',           count: counts.expired,                                          done: false,                        color: 'bg-error',     icon: 'event_busy'    },
  ];

  return (
    <>
      <Header title="Contract Lifecycle" />

      <div className="p-8 bg-surface min-h-[calc(100vh-64px)] space-y-8">

        {/* ── Urgent expiry banner ─────────────────────────────── */}
        {!loading && urgentDocs.length > 0 && (
          <div className="bg-error/10 border border-error/30 rounded-2xl px-6 py-4 flex items-start gap-4">
            <span
              className="material-symbols-outlined text-error text-2xl flex-shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              alarm
            </span>
            <div className="flex-1">
              <p className="font-headline font-bold text-error mb-1">
                {urgentDocs.length} contract{urgentDocs.length !== 1 ? 's' : ''} expiring within 7 days
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {urgentDocs.map((d) => {
                  const days = daysUntil(d.expiryDate);
                  return (
                    <button
                      key={d._id}
                      onClick={() => navigate(`/analysis/${d._id}`)}
                      className="flex items-center gap-1.5 bg-error/10 hover:bg-error/20 border border-error/30 rounded-lg px-3 py-1.5 text-xs text-error font-semibold transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      {d.originalName}
                      <span className="font-bold">— {days}d left</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Contracts', value: counts.active,   color: 'text-primary',    icon: 'verified_user',   filter: 'active'   },
            { label: 'Expiring Soon',    value: counts.expiring, color: 'text-amber-400',  icon: 'schedule',        filter: 'expiring' },
            { label: 'Expired',          value: counts.expired,  color: 'text-error',      icon: 'event_busy',      filter: 'expired'  },
            { label: 'Pending Review',   value: counts.pending,  color: 'text-purple-400', icon: 'pending_actions', filter: 'pending'  },
          ].map(({ label, value, color, icon, filter }) => (
            <button
              key={label}
              onClick={() => setFilterLC((f) => f === filter ? 'all' : filter)}
              className={`bg-surface-container-low p-6 rounded-xl hover:bg-surface-container transition-all group text-left border ${
                filterLC === filter ? 'border-primary/30' : 'border-white/5'
              }`}
            >
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
              <div className="flex items-end justify-between">
                <h3 className={`text-3xl font-bold font-headline tracking-tight ${loading ? 'text-on-surface-variant animate-pulse' : color}`}>
                  {loading ? '—' : String(value).padStart(2, '0')}
                </h3>
                <span className={`material-symbols-outlined ${color} group-hover:scale-110 transition-transform`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left: Pipeline sidebar ───────────────────────── */}
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-xl p-8">
              <h4 className="font-headline text-lg font-semibold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">timeline</span>
                Lifecycle Pipeline
              </h4>

              {loading ? (
                <div className="space-y-8">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex gap-4 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-surface-container flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-3 bg-surface-container rounded w-2/3" />
                        <div className="h-2 bg-surface-container rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/30">
                  {pipeline.map(({ label, count, done, color, icon }) => (
                    <div key={label} className={`relative pl-10 ${!done && count === 0 ? 'opacity-40' : ''}`}>
                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${done ? color : 'bg-surface-container-high border border-outline-variant'} flex items-center justify-center z-10 ${done ? 'shadow-[0_0_12px_rgba(68,229,194,0.25)]' : ''}`}>
                        {done ? (
                          <span className="material-symbols-outlined text-[13px] text-on-primary font-bold">check</span>
                        ) : (
                          <span className={`material-symbols-outlined text-[13px] ${count > 0 ? 'text-secondary' : 'text-on-surface-variant'}`}>{icon}</span>
                        )}
                      </div>
                      <h5 className="font-headline font-bold text-on-surface text-sm">{label}</h5>
                      <p className="text-xs text-on-surface-variant mt-0.5">
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
                <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">Portfolio Health</span>
                    <span className={`text-sm font-bold ${healthColor(avg)}`}>{avg || '—'}/100</span>
                  </div>
                  {avg > 0 && (
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${avg >= 75 ? 'bg-primary' : avg >= 50 ? 'bg-amber-400' : 'bg-error'}`}
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-on-surface-variant mt-3">
                    Monitoring {docs.length} document{docs.length !== 1 ? 's' : ''} — {analyzed.length} analyzed.
                  </p>
                </div>
              );
            })()}

            {/* Expiry detection info card */}
            <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_detect_voice</span>
                <p className="text-xs font-label font-bold text-on-surface uppercase tracking-wider">Auto-Detection</p>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                NyayaAI reads expiry dates from your document text during analysis — phrases like "expires on", "valid for 12 months", or "commencement date plus 2 years" are automatically detected.
              </p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Click any date cell in the table to set or override it manually.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-primary font-semibold">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Nightly alerts active
              </div>
            </div>
          </section>

          {/* ── Right: Document table ────────────────────────── */}
          <section className="lg:col-span-8 space-y-4">

            {/* Search + filter + sort bar */}
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[180px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or type…"
                  className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface-container border border-outline-variant/20 text-on-surface-variant text-xs rounded-xl pl-3 pr-8 py-2.5 appearance-none outline-none cursor-pointer"
                >
                  <option value="uploadedAt">Sort: Newest</option>
                  <option value="expiryDate">Sort: Expiry Date</option>
                  <option value="healthScore">Sort: Health</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'expiring', 'expired', 'pending'].map((lc) => {
                const cs = CONTRACT_STATUS[lc];
                return (
                  <button
                    key={lc}
                    onClick={() => setFilterLC(lc)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-headline transition-all ${
                      filterLC === lc
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:text-white border border-white/5'
                    }`}
                  >
                    {lc === 'all' ? `All (${enriched.length})` : `${cs?.label} (${counts[lc] ?? 0})`}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                  <thead className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Document</th>
                      <th className="px-4 py-4 font-medium">Type</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Health</th>
                      <th className="px-4 py-4 font-medium">Expiry Date</th>
                      <th className="px-4 py-4 font-medium">Renewal Date</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                            <td key={c} className="px-6 py-5">
                              <div className="h-3 bg-surface-container rounded animate-pulse w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-on-surface-variant">
                          {docs.length === 0 ? (
                            <div className="space-y-3">
                              <span className="material-symbols-outlined text-4xl block opacity-20">folder_open</span>
                              <p>No documents yet.</p>
                              <button
                                onClick={() => navigate('/upload')}
                                className="text-primary font-semibold text-sm hover:underline"
                              >
                                Upload your first document →
                              </button>
                            </div>
                          ) : (
                            <span>No documents match your filter.</span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((doc) => {
                        const lc  = CONTRACT_STATUS[doc._status] || CONTRACT_STATUS.active;
                        const exp = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                        const isUrgent = exp !== null && exp >= 0 && exp <= 7;
                        return (
                          <tr
                            key={doc._id}
                            className={`hover:bg-white/[0.03] transition-colors group cursor-pointer ${isUrgent ? 'bg-error/[0.03]' : ''}`}
                            onClick={() => navigate(`/analysis/${doc._id}`)}
                          >
                            {/* Document name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {isUrgent && (
                                  <span
                                    className="material-symbols-outlined text-error text-base flex-shrink-0"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                    title="Expiring within 7 days"
                                  >
                                    alarm
                                  </span>
                                )}
                                <div>
                                  <p className="font-medium text-on-surface truncate max-w-[160px]">{doc.originalName}</p>
                                  <p className="text-[10px] text-on-surface-variant mt-0.5 font-label">
                                    {doc._id.slice(-6).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-4 py-4 text-on-surface-variant text-xs">{doc.docType || '—'}</td>

                            {/* Status badge */}
                            <td className="px-4 py-4">
                              <ContractStatusBadge doc={doc} size="xs" />
                            </td>

                            {/* Health */}
                            <td className="px-4 py-4">
                              {doc.healthScore > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className={`font-headline font-bold text-sm ${healthColor(doc.healthScore)}`}>
                                    {doc.healthScore}
                                  </span>
                                  <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${doc.healthScore >= 75 ? 'bg-primary' : doc.healthScore >= 50 ? 'bg-amber-400' : 'bg-error'}`}
                                      style={{ width: `${doc.healthScore}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-on-surface-variant text-xs">—</span>
                              )}
                            </td>

                            {/* Expiry date — inline editable */}
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-0.5">
                                <DateEditor
                                  docId={doc._id}
                                  field="expiryDate"
                                  currentValue={doc.expiryDate}
                                  onSaved={handleDocSaved}
                                />
                                {exp !== null && exp >= 0 && exp <= 30 && (
                                  <p className={`text-[10px] font-semibold ${exp <= 7 ? 'text-error' : 'text-amber-400'}`}>
                                    {exp === 0 ? 'Expires today' : `${exp}d left`}
                                  </p>
                                )}
                                {exp !== null && exp < 0 && (
                                  <p className="text-[10px] text-error font-semibold">{Math.abs(exp)}d ago</p>
                                )}
                              </div>
                            </td>

                            {/* Renewal date — inline editable */}
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <DateEditor
                                docId={doc._id}
                                field="renewalDate"
                                currentValue={doc.renewalDate}
                                onSaved={handleDocSaved}
                              />
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => navigate(`/analysis/${doc._id}`)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                                  title="View Analysis"
                                >
                                  <span className="material-symbols-outlined text-lg">analytics</span>
                                </button>
                                <button
                                  onClick={() => navigate(`/ask?docId=${doc._id}`)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                                  title="Ask AI"
                                >
                                  <span className="material-symbols-outlined text-lg">psychology</span>
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
                <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>
                    {filtered.length} document{filtered.length !== 1 ? 's' : ''}
                    {filterLC !== 'all' ? ` (filtered)` : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] opacity-60">Click date cells to edit</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <span className="font-label">Live</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Lifecycle Timeline ───────────────────────────────── */}
        {!loading && (
          <LifecycleTimeline
            events={buildTimelineEvents(enriched)}
            onNavigate={(docId) => navigate(`/analysis/${docId}`)}
          />
        )}

      </div>
    </>
  );
}

/* ── LifecycleTimeline ─────────────────────────────────────────────── */
const SHOW_LIMIT = 8;

function LifecycleTimeline({ events, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const visible = expanded ? events : events.slice(0, SHOW_LIMIT);
  const hasMore = events.length > SHOW_LIMIT;

  // Group visible events into "Upcoming", "Past", and "Review" buckets
  // so we can render a year/month separator when the date changes
  const upcoming = visible.filter((e) => e.days === null || e.days >= 0);
  const past     = visible.filter((e) => e.days !== null && e.days < 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            timeline
          </span>
          <h3 className="text-sm font-label font-bold uppercase tracking-wider text-on-surface-variant">
            Lifecycle Timeline
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 text-[10px] text-on-surface-variant font-label">
          {[
            { dot: 'bg-error',   label: '≤7 days / Expired' },
            { dot: 'bg-amber-400', label: '8–30 days'       },
            { dot: 'bg-primary',   label: '>30 days'        },
            { dot: 'bg-purple-400',label: 'Review needed'   },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline body */}
      <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <>
            <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5">
              <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
                Upcoming &amp; Active
              </p>
            </div>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[39px] top-0 bottom-0 w-px bg-white/5 pointer-events-none" />

              {upcoming.map((event, idx) => {
                const es  = EVENT_STYLE[event.type] || EVENT_STYLE.Expiry;
                const dc  = dotColor(event.days);
                const dl  = daysLabel(event.days);
                const isLast = idx === upcoming.length - 1;

                return (
                  <button
                    key={event._key}
                    onClick={() => onNavigate(event.docId)}
                    className={`w-full flex items-start gap-5 px-6 py-5 hover:bg-white/[0.03] transition-colors text-left group ${
                      !isLast ? 'border-b border-white/5' : ''
                    }`}
                  >
                    {/* Dot */}
                    <div className="flex-shrink-0 mt-0.5 z-10">
                      <div className={`w-4 h-4 rounded-full ${dc} shadow-lg ring-2 ring-surface-container-low`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          {/* Doc name */}
                          <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate max-w-xs">
                            {event.docName}
                          </p>
                          {/* Doc type */}
                          {event.docType && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{event.docType}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Event type badge */}
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${es.bg} ${es.text} ${es.border} flex items-center gap-1.5`}>
                            <span
                              className="material-symbols-outlined text-sm leading-none"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {es.icon}
                            </span>
                            {es.label}
                          </span>

                          {/* Days remaining — bold, colored */}
                          <span className={`font-headline font-extrabold text-base ${dl.color}`}>
                            {dl.text}
                          </span>
                        </div>
                      </div>

                      {/* Date line */}
                      {event.date && (
                        <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Past / Expired events */}
        {past.length > 0 && (
          <>
            <div className="px-6 py-2.5 bg-error/[0.04] border-b border-white/5 border-t border-t-error/10">
              <p className="text-[10px] font-label font-bold uppercase tracking-widest text-error/70">
                Expired
              </p>
            </div>
            <div className="relative opacity-80">
              <div className="absolute left-[39px] top-0 bottom-0 w-px bg-white/5 pointer-events-none" />

              {past.map((event, idx) => {
                const es = EVENT_STYLE[event.type] || EVENT_STYLE.Expiry;
                const dc = dotColor(event.days);
                const dl = daysLabel(event.days);
                const isLast = idx === past.length - 1;

                return (
                  <button
                    key={event._key}
                    onClick={() => onNavigate(event.docId)}
                    className={`w-full flex items-start gap-5 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left group ${
                      !isLast ? 'border-b border-white/5' : ''
                    }`}
                  >
                    {/* Dot — hollow ring for past events */}
                    <div className="flex-shrink-0 mt-0.5 z-10">
                      <div className="w-4 h-4 rounded-full border-2 border-error/50 bg-error/10 ring-2 ring-surface-container-low" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-on-surface/70 group-hover:text-on-surface transition-colors truncate max-w-xs line-through decoration-error/40">
                            {event.docName}
                          </p>
                          {event.docType && (
                            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{event.docType}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${es.bg} ${es.text} ${es.border} flex items-center gap-1.5`}>
                            <span
                              className="material-symbols-outlined text-sm leading-none"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {es.icon}
                            </span>
                            {es.label}
                          </span>
                          <span className={`font-headline font-extrabold text-base ${dl.color}`}>
                            {dl.text}
                          </span>
                        </div>
                      </div>
                      {event.date && (
                        <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-on-surface-variant/60 transition-colors flex-shrink-0 mt-1">
                      chevron_right
                    </span>
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
            className="w-full py-4 border-t border-white/5 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
            {expanded
              ? 'Show less'
              : `Show ${events.length - SHOW_LIMIT} more event${events.length - SHOW_LIMIT !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
}
