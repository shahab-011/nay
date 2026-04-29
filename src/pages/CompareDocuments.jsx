import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { compareDocuments, getComparisons } from '../api/comparisons.api';
import { getDocuments, getTextPreview } from '../api/documents.api';
import ConsentPanel from '../components/ConsentPanel';

const FILTER_TABS = ['All', 'Additions', 'Removals', 'Modifications'];

const severityColor = (severity) => {
  if (!severity) return 'text-on-surface-variant';
  const s = severity.toLowerCase();
  if (s === 'high' || s === 'critical') return 'text-error';
  if (s === 'medium') return 'text-secondary';
  return 'text-primary';
};

const severityBg = (severity) => {
  if (!severity) return 'bg-surface-container-high';
  const s = severity.toLowerCase();
  if (s === 'high' || s === 'critical') return 'bg-error/10 border border-error/20';
  if (s === 'medium') return 'bg-secondary/10 border border-secondary/20';
  return 'bg-primary/10 border border-primary/20';
};

const riskChangeBadge = (riskChange) => {
  if (!riskChange) return null;
  const rc = riskChange.toLowerCase();
  if (rc === 'improved')  return { label: 'Improved ↑', cls: 'bg-primary/10 text-primary border-primary/20',   icon: 'trending_up'   };
  if (rc === 'worsened')  return { label: 'Worsened ↓', cls: 'bg-error/10 text-error border-error/20',         icon: 'trending_down' };
  return                         { label: 'Neutral →',  cls: 'bg-surface-container text-on-surface-variant border-white/10', icon: 'trending_flat' };
};

export default function CompareDocuments() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const [docAId, setDocAId] = useState('');
  const [docBId, setDocBId] = useState('');

  const [result, setResult] = useState(null);   // comparison result object
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('All');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  /* consent */
  const [consentOpen,    setConsentOpen]    = useState(false);
  const [consentPreview, setConsentPreview] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMeta,    setConsentMeta]    = useState({ wordCount: 0, charCount: 0 });

  /* ── fetch user's documents ──────────────────────────────────── */
  useEffect(() => {
    getDocuments()
      .then((res) => setDocs(res.data.data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));

    getComparisons()
      .then((res) => setHistory(res.data.data.comparisons || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  /* ── open consent before comparing ──────────────────────────── */
  const handleCompare = async () => {
    if (!docAId || !docBId) return;
    if (docAId === docBId) return setError('Please select two different documents.');
    setError('');
    setConsentOpen(true);
    setConsentLoading(true);
    try {
      const res = await getTextPreview(docAId);
      setConsentPreview(res.data.data.preview);
      setConsentMeta({ wordCount: res.data.data.wordCount, charCount: res.data.data.charCount });
    } catch {
      setConsentPreview(null);
    } finally {
      setConsentLoading(false);
    }
  };

  /* ── run comparison after consent ────────────────────────────── */
  const runComparison = async () => {
    setConsentOpen(false);
    setResult(null);
    setComparing(true);
    try {
      const res = await compareDocuments(docAId, docBId);
      setResult(res.data.data.comparison);
      setHistory((prev) => [res.data.data.comparison, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed. Please try again.');
    } finally {
      setComparing(false);
    }
  };

  /* ── derived diff items ──────────────────────────────────────── */
  const additions     = result?.additions     || [];
  const removals      = result?.removals      || [];
  const modifications = result?.modifications || [];

  const allItems = [
    ...additions.map((a, i) => ({ ...a, _kind: 'addition', _key: `add-${i}` })),
    ...removals.map((r, i)  => ({ ...r, _kind: 'removal',  _key: `rem-${i}` })),
    ...modifications.map((m, i) => ({ ...m, _kind: 'modification', _key: `mod-${i}` })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (filter === 'All')          return true;
    if (filter === 'Additions')    return item._kind === 'addition';
    if (filter === 'Removals')     return item._kind === 'removal';
    if (filter === 'Modifications') return item._kind === 'modification';
    return true;
  });

  const docA = docs.find((d) => d._id === docAId);
  const docB = docs.find((d) => d._id === docBId);

  const canCompare = docAId && docBId && docAId !== docBId && !comparing;

  return (
    <>
      <Header title="Compare Documents" />

      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* ── Document Selector ───────────────────────────────────── */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-white/5">
          <h2 className="text-sm font-label uppercase tracking-wider text-on-surface-variant mb-5">
            Select Documents to Compare
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Doc A */}
            <div className="lg:col-span-5 space-y-2">
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                Base Document (A)
              </label>
              <div className="relative">
                <select
                  value={docAId}
                  onChange={(e) => { setDocAId(e.target.value); setResult(null); setError(''); }}
                  disabled={docsLoading}
                  className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary text-on-surface py-3 pl-4 pr-10 rounded-xl appearance-none cursor-pointer outline-none"
                >
                  <option value="">— Select base document —</option>
                  {docs.map((d) => (
                    <option key={d._id} value={d._id}>{d.originalName}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>

            {/* VS badge */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center">
                <span className="text-xs font-label font-extrabold text-on-surface-variant tracking-wider">VS</span>
              </div>
            </div>

            {/* Doc B */}
            <div className="lg:col-span-5 space-y-2">
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                Compare Document (B)
              </label>
              <div className="relative">
                <select
                  value={docBId}
                  onChange={(e) => { setDocBId(e.target.value); setResult(null); setError(''); }}
                  disabled={docsLoading}
                  className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary text-on-surface py-3 pl-4 pr-10 rounded-xl appearance-none cursor-pointer outline-none"
                >
                  <option value="">— Select comparison document —</option>
                  {docs.map((d) => (
                    <option key={d._id} value={d._id}>{d.originalName}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              {error}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className={`mt-5 w-full h-14 font-headline font-extrabold text-base rounded-xl flex items-center justify-center gap-3 transition-all ${
              canCompare
                ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            }`}
          >
            {comparing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                Analyzing with AI…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  compare_arrows
                </span>
                Run Comparison
              </>
            )}
          </button>
        </div>

        {/* ── Stats + Filter ──────────────────────────────────────── */}
        {result && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Changes', value: allItems.length, color: 'text-white', bg: 'bg-surface-container' },
                { label: 'Additions',     value: additions.length,    color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Removals',      value: removals.length,     color: 'text-error',   bg: 'bg-error/10'   },
                { label: 'Modifications', value: modifications.length, color: 'text-secondary', bg: 'bg-secondary/10' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center gap-1`}>
                  <span className={`text-3xl font-headline font-extrabold ${color}`}>{value}</span>
                  <span className="text-[11px] font-label text-on-surface-variant uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>

            {/* Document name bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-surface-container-low rounded-xl px-5 py-3 border border-error/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                <div>
                  <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Base (A)</p>
                  <p className="text-sm font-semibold text-white truncate">{docA?.originalName || '—'}</p>
                </div>
              </div>
              <div className="lg:col-span-2 flex justify-center items-center">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">compare_arrows</span>
              </div>
              <div className="lg:col-span-5 bg-surface-container-low rounded-xl px-5 py-3 border border-primary/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                <div>
                  <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Compare (B)</p>
                  <p className="text-sm font-semibold text-white truncate">{docB?.originalName || '—'}</p>
                </div>
              </div>
            </div>

            {/* ── AI Summary + Risk Change + Recommendation row ────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Summary */}
              {result.summary && (
                <div className="lg:col-span-2 bg-surface-container-low rounded-xl px-5 py-4 border border-white/5 flex flex-col gap-1">
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">AI Summary</p>
                  <p className="text-sm text-on-surface leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* Risk Change badge */}
              {(() => {
                const badge = riskChangeBadge(result.riskChange);
                if (!badge) return null;
                return (
                  <div className={`flex flex-col items-center justify-center gap-2 rounded-xl px-5 py-4 border ${badge.cls}`}>
                    <span
                      className="material-symbols-outlined text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {badge.icon}
                    </span>
                    <p className="text-[10px] font-label uppercase tracking-wider opacity-70">Risk Change</p>
                    <p className="font-headline font-extrabold text-xl">{badge.label}</p>
                  </div>
                );
              })()}
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
                <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                  tips_and_updates
                </span>
                <div>
                  <p className="text-[10px] font-label text-primary uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-sm text-on-surface leading-relaxed">{result.recommendation}</p>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold font-headline transition-all ${
                    filter === tab
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-white border border-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Diff Viewer ───────────────────────────────────────── */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block">check_circle</span>
                No {filter.toLowerCase()} found between these documents.
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                {filteredItems.map((item, idx) => (
                  <DiffItem key={item._key} item={item} index={idx} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── No result yet ───────────────────────────────────────── */}
        {!result && !comparing && (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">compare</span>
            <p className="text-lg font-headline font-bold text-white/30 mb-1">No comparison yet</p>
            <p className="text-sm">Select two documents above and click Run Comparison</p>
          </div>
        )}

        {/* ── Recent Comparisons ──────────────────────────────────── */}
        {history.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-label uppercase tracking-wider text-on-surface-variant">
              Recent Comparisons
            </h3>
            <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant">
                    <th className="text-left px-5 py-3 font-normal">Document A (Base)</th>
                    <th className="text-left px-5 py-3 font-normal">Document B (Compare)</th>
                    <th className="text-center px-4 py-3 font-normal">Changes</th>
                    <th className="text-center px-4 py-3 font-normal">Risk Change</th>
                    <th className="text-right px-5 py-3 font-normal">Date</th>
                    <th className="text-center px-4 py-3 font-normal">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.slice(0, 8).map((h, i) => {
                    const dA = docs.find((d) => d._id === (h.docAId?._id || h.docAId));
                    const dB = docs.find((d) => d._id === (h.docBId?._id || h.docBId));
                    const total = (h.additions?.length || 0) + (h.removals?.length || 0) + (h.modifications?.length || 0);
                    const badge = riskChangeBadge(h.riskChange);
                    const dateStr = h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr key={h._id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-white font-semibold truncate block max-w-[200px]" title={dA?.originalName}>
                            {dA?.originalName || 'Doc A'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-white font-semibold truncate block max-w-[200px]" title={dB?.originalName}>
                            {dB?.originalName || 'Doc B'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs font-label">
                            <span className="text-primary">+{h.additions?.length || 0}</span>
                            <span className="text-error">−{h.removals?.length || 0}</span>
                            <span className="text-amber-400">~{h.modifications?.length || 0}</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">{total} total</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {badge ? (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-on-surface-variant text-xs">{dateStr}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setResult(h);
                              setDocAId(h.docAId?._id || h.docAId);
                              setDocBId(h.docBId?._id || h.docBId);
                              setFilter('All');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs text-primary hover:text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary transition-all font-semibold"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConsentPanel
        isOpen={consentOpen}
        onConfirm={runComparison}
        onCancel={() => setConsentOpen(false)}
        title="Compare Documents with AI"
        confirmLabel="Confirm & Compare"
        preview={consentPreview}
        previewLoading={consentLoading}
        wordCount={consentMeta.wordCount}
        charCount={consentMeta.charCount}
        details={[
          'First ~3000 chars of Document A text',
          'First ~3000 chars of Document B text',
          'Document types for clause context',
          'No personal or account data included',
        ]}
      />
    </>
  );
}

/* ── DiffItem ──────────────────────────────────────────────────────── */
function DiffItem({ item, index }) {
  const { _kind } = item;

  const badgeStyles = {
    addition:    'bg-primary/10 text-primary',
    removal:     'bg-error/10 text-error',
    modification:'bg-amber-500/10 text-amber-400',
  };
  const badgeLabel = {
    addition:    '+ Added',
    removal:     '− Removed',
    modification:'~ Modified',
  };

  // Modification cards get an amber left border to visually distinguish them
  const containerBorder = _kind === 'modification' ? 'border-l-4 border-amber-400/50' : '';

  const title    = item.clauseName || item.clause || item.title || `Change ${index + 1}`;
  const before   = item.before   || item.original || '';
  const after    = item.after    || item.updated  || item.text || item.description || '';
  const severity = item.severity || '';
  const impact   = item.impact   || '';

  return (
    <div className={`p-6 hover:bg-white/[0.02] transition-colors ${containerBorder}`}>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-label font-bold text-on-surface-variant w-6">{index + 1}.</span>
          <h4 className="font-headline font-bold text-on-surface">{title}</h4>
          {severity && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${severityBg(severity)} ${severityColor(severity)}`}>
              {severity} Risk
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${badgeStyles[_kind]}`}>
          {badgeLabel[_kind]}
        </span>
      </div>

      <div className="space-y-2 text-sm leading-relaxed">
        {/* Removal / before */}
        {(_kind === 'removal' || (_kind === 'modification' && before)) && (
          <div className="flex gap-3">
            <span className="text-error font-bold text-base flex-shrink-0 mt-0.5 w-5 text-center">−</span>
            <div className="flex-1 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl">
              <p className={_kind === 'removal' ? 'line-through opacity-60' : 'opacity-80'}>{before || after}</p>
            </div>
          </div>
        )}

        {/* Addition / after */}
        {(_kind === 'addition' || (_kind === 'modification' && after)) && (
          <div className="flex gap-3">
            <span className="text-primary font-bold text-base flex-shrink-0 mt-0.5 w-5 text-center">+</span>
            <div className="flex-1 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl">
              <p>{after || before}</p>
            </div>
          </div>
        )}
      </div>

      {impact && (
        <div className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant border-l-2 border-amber-400/40 pl-3">
          <span className="material-symbols-outlined text-amber-400 text-sm flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <span><span className="font-semibold text-on-surface">Impact: </span>{impact}</span>
        </div>
      )}
    </div>
  );
}

