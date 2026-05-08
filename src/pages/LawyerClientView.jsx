import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HealthScoreRing from '../components/HealthScoreRing';
import { getClientLink, getLinkDocuments, getClientDocAnalysis } from '../api/lawyer.api';

/* ── Style helpers (mirrors Analysis.jsx) ──────────────────────────── */

const RISK_COLOR = {
  high:   { text: 'text-error',              border: 'border-error/30',              bg: 'bg-error/5'              },
  medium: { text: 'text-tertiary-container', border: 'border-tertiary-container/30', bg: 'bg-tertiary-container/5' },
  low:    { text: 'text-primary',            border: 'border-primary/30',            bg: 'bg-primary/5'            },
};
const rc         = (level) => RISK_COLOR[level] || RISK_COLOR.low;
const ScoreColor = (s) => s >= 80 ? 'text-primary' : s >= 50 ? 'text-tertiary-container' : 'text-error';
const BorderColor= (s) => s >= 80 ? 'border-primary' : s >= 50 ? 'border-tertiary-container' : 'border-error';
const confText   = (c) => c >= 85 ? 'text-primary' : c >= 60 ? 'text-tertiary-container' : 'text-yellow-400';

const ANALYSIS_TABS = ['Summary', 'Clauses', 'Risks', 'Compliance'];

function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function LawyerClientView() {
  const { linkId }  = useParams();
  const navigate    = useNavigate();

  const [link,          setLink]          = useState(null);
  const [docs,          setDocs]          = useState([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [pageError,     setPageError]     = useState('');

  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [analysis,      setAnalysis]      = useState(null);
  const [aLoading,      setALoading]      = useState(false);
  const [aError,        setAError]        = useState('');
  const [tab,           setTab]           = useState('Summary');
  const [showOriginal,  setShowOriginal]  = useState(new Set());

  const load = useCallback(async () => {
    setPageLoading(true); setPageError('');
    try {
      const [linkRes, docsRes] = await Promise.all([
        getClientLink(linkId),
        getLinkDocuments(linkId),
      ]);
      setLink(linkRes.data.data.link);
      setDocs(docsRes.data.data.documents || []);
    } catch {
      setPageError('Failed to load client data. Please go back and try again.');
    } finally {
      setPageLoading(false);
    }
  }, [linkId]);

  useEffect(() => { load(); }, [load]);

  const handleSelectDoc = async (doc) => {
    if (selectedDoc?._id === doc._id) {
      setSelectedDoc(null); setAnalysis(null);
      return;
    }
    setSelectedDoc(doc);
    setAnalysis(null);
    setAError('');
    setALoading(true);
    setTab('Summary');
    setShowOriginal(new Set());
    try {
      const res = await getClientDocAnalysis(linkId, doc._id);
      setAnalysis(res.data.data.analysis);
      if (!res.data.data.analysis) setAError('No analysis available for this document yet.');
    } catch (err) {
      setAError(err.response?.data?.message || 'Failed to load analysis.');
    } finally {
      setALoading(false);
    }
  };

  const toggleOriginal = (i) =>
    setShowOriginal(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  /* ── loading ── */
  if (pageLoading) {
    return (
      <>
        <Header title="Client Documents" />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </>
    );
  }

  /* ── error ── */
  if (pageError) {
    return (
      <>
        <Header title="Client Documents" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <p className="text-on-surface-variant text-center max-w-md">{pageError}</p>
          <button onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:opacity-90">
            ← Go Back
          </button>
        </div>
      </>
    );
  }

  const client = link?.clientId || {};

  return (
    <>
      <Header title={client.name || link?.clientEmail || 'Client Documents'}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 text-sm font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
      </Header>

      <div className="p-8 pb-24 max-w-6xl space-y-8">

        {/* ── Client profile card ── */}
        <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
              <span className="text-xl font-bold text-primary font-headline">
                {(client.name || link?.clientEmail || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-headline font-extrabold text-white tracking-tight">
                  {client.name || link?.clientEmail}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />Linked
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5">{client.email || link?.clientEmail}</p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { icon: 'description', label: `${link?.stats?.totalDocuments ?? 0} total docs`     },
                { icon: 'share',       label: `${docs.length} shared with you`                      },
                { icon: 'folder_open', label: `${link?.stats?.totalCases ?? 0} cases`               },
                { icon: 'schedule',    label: `Linked ${formatRelative(link?.acceptedAt)}`          },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Shared documents grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-headline uppercase tracking-widest text-on-surface-variant">
                Shared Documents
              </h2>
              <span className="text-[11px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
                {docs.length}
              </span>
            </div>
            {selectedDoc && (
              <button
                onClick={() => { setSelectedDoc(null); setAnalysis(null); }}
                className="text-xs text-on-surface-variant hover:text-white flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Close analysis
              </button>
            )}
          </div>

          {docs.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-white/5 space-y-3">
              <span className="material-symbols-outlined text-5xl text-primary opacity-20 block">description</span>
              <p className="font-headline font-bold text-white/60">No documents shared yet</p>
              <p className="text-sm text-on-surface-variant">
                The client hasn't shared any documents with you yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => (
                <DocCard
                  key={doc._id}
                  doc={doc}
                  isSelected={selectedDoc?._id === doc._id}
                  onClick={() => handleSelectDoc(doc)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Full analysis panel ── */}
        {selectedDoc && (
          <div className="space-y-6">
            {/* Panel header */}
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-headline font-bold text-on-surface text-base truncate">{selectedDoc.originalName}</h2>
                <p className="text-xs text-on-surface-variant">Full AI Analysis — Read Only</p>
              </div>
            </div>

            {aLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                  <p className="text-sm text-on-surface-variant">Loading analysis…</p>
                </div>
              </div>
            )}

            {aError && !aLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">analytics</span>
                <p className="text-on-surface-variant text-sm text-center">{aError}</p>
              </div>
            )}

            {!aLoading && !aError && analysis && (
              <AnalysisView
                doc={selectedDoc}
                analysis={analysis}
                tab={tab}
                setTab={setTab}
                showOriginal={showOriginal}
                toggleOriginal={toggleOriginal}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Document card ─────────────────────────────────────────────────── */

function DocCard({ doc, isSelected, onClick }) {
  const score    = doc.healthScore ?? 0;
  const riskColor = doc.riskLevel === 'high' ? 'text-error' : doc.riskLevel === 'medium' ? 'text-amber-400' : 'text-primary';
  const ringColor = doc.riskLevel === 'high' ? 'ring-error/20' : doc.riskLevel === 'medium' ? 'ring-amber-400/20' : 'ring-primary/20';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition-all ${
        isSelected
          ? 'bg-primary/8 border-primary/30 ring-2 ring-primary/20'
          : 'bg-surface-container-low border-white/5 hover:border-primary/20 hover:bg-surface-container'
      }`}
    >
      {/* Doc icon + name */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary/20' : 'bg-surface-container-high'}`}>
          <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate font-headline ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
            {doc.originalName}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{doc.docType || 'Unknown type'}</p>
        </div>
        {isSelected && (
          <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">expand_less</span>
        )}
      </div>

      {/* Health score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">Health</span>
          <span className={`text-sm font-bold font-headline ${ScoreColor(score)}`}>{score}%</span>
        </div>
        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-primary' : score >= 50 ? 'bg-tertiary-container' : 'bg-error'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        {doc.riskCount > 0 && (
          <span className={`flex items-center gap-1 text-[11px] font-bold ${riskColor}`}>
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            {doc.riskCount} risk{doc.riskCount !== 1 ? 's' : ''}
          </span>
        )}
        {doc.riskCount === 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            No risks
          </span>
        )}
        {doc.expiryDate && (
          <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[12px]">event</span>
            Expires {formatDate(doc.expiryDate)}
          </span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-on-surface-variant ml-auto">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {formatRelative(doc.uploadedAt)}
        </span>
      </div>

      {/* View analysis CTA */}
      <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold transition-colors ${
        isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
      }`}>
        <span className="material-symbols-outlined text-sm">{isSelected ? 'keyboard_arrow_up' : 'analytics'}</span>
        {isSelected ? 'Hide Analysis' : 'View Full Analysis'}
      </div>
    </button>
  );
}

/* ── Full analysis view ────────────────────────────────────────────── */

function AnalysisView({ doc, analysis, tab, setTab, showOriginal, toggleOriginal }) {
  const score      = analysis.healthScore ?? 0;
  const compliance = analysis.compliance  || {};
  const clauses    = analysis.clauses     || [];
  const risks      = analysis.risks       || [];

  return (
    <div className="space-y-6">
      {/* Top grid — health + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Health donut */}
        <div className={`lg:col-span-4 bg-surface-container-low p-8 rounded-2xl border-l-4 ${BorderColor(score)}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-headline font-bold">Document Health</h3>
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full font-label ${
              score >= 80 ? 'bg-primary/20 text-primary' :
              score >= 50 ? 'bg-tertiary-container/20 text-tertiary-container' :
                            'bg-error/20 text-error'
            }`}>
              {doc?.riskLevel?.toUpperCase() || 'LOW'} RISK
            </span>
          </div>
          <HealthScoreRing
            score={score}
            compliance={compliance}
            risks={risks}
            confidenceScore={analysis.confidenceScore ?? 0}
          />
        </div>

        {/* AI Summary */}
        <div className="lg:col-span-8 bg-surface-container-low p-8 rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="text-lg font-headline font-bold">AI Summary</h3>
            <span className="ml-auto text-[10px] text-on-surface-variant font-label">
              {formatDate(analysis.analyzedAt)}
            </span>
          </div>

          <div className="text-on-surface-variant leading-relaxed text-sm mb-4 flex-1 space-y-3 overflow-y-auto max-h-56 custom-scrollbar pr-1">
            {analysis.summary
              ? analysis.summary.split('|||').map((section, i) => {
                  const trimmed   = section.trim();
                  if (!trimmed) return null;
                  const colonIdx  = trimmed.indexOf(':');
                  const heading   = colonIdx !== -1 ? trimmed.slice(0, colonIdx).trim() : null;
                  const body      = colonIdx !== -1 ? trimmed.slice(colonIdx + 1).trim() : trimmed;
                  const isHeading = heading && /^[A-Z][A-Z\s&]+$/.test(heading);
                  return (
                    <div key={i} className={i > 0 ? 'pt-2 border-t border-white/5' : ''}>
                      {isHeading && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container block mb-1">{heading}</span>
                      )}
                      <p className="text-sm leading-relaxed">{isHeading ? body : trimmed}</p>
                    </div>
                  );
                })
              : <p className="text-sm">No summary available.</p>}
          </div>

          {(analysis.confidenceScore ?? 100) < 60 && (
            <div className="flex items-start gap-3 bg-yellow-400/10 border border-yellow-400/25 rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-yellow-400 text-base flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <p className="text-xs text-yellow-400 leading-relaxed">
                <span className="font-bold">Low confidence ({analysis.confidenceScore}%)</span> — verify with additional review before advising the client.
              </p>
            </div>
          )}

          {/* Top 2 risks preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risks.length > 0 ? risks.slice(0, 2).map((risk, i) => (
              <div key={i} className={`p-4 rounded-xl border flex gap-3 ${rc(risk.severity).bg} ${rc(risk.severity).border}`}>
                <span className={`material-symbols-outlined text-xl flex-shrink-0 ${rc(risk.severity).text}`} style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <div>
                  <p className={`font-bold text-sm mb-1 ${rc(risk.severity).text}`}>{risk.title}</p>
                  <p className="text-xs text-on-surface-variant leading-snug">{risk.description}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <p className="text-primary font-bold text-sm mb-1">No Critical Risks Detected</p>
                  <p className="text-xs text-on-surface-variant">This document appears to be well-structured and low-risk.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doc metadata row */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Document Type',  value: analysis.detectedDocType    || doc.docType || '—'          },
          { label: 'Jurisdiction',   value: analysis.detectedJurisdiction || doc.jurisdiction || '—'   },
          { label: 'Health Score',   value: `${score} / 100`                                           },
          { label: 'Confidence',     value: `${analysis.confidenceScore ?? 0}%`                        },
          { label: 'Expiry',         value: (analysis.expiryDate  || doc.expiryDate)  ? formatDate(analysis.expiryDate  || doc.expiryDate)  : '—' },
          { label: 'Renewal',        value: (analysis.renewalDate || doc.renewalDate) ? formatDate(analysis.renewalDate || doc.renewalDate) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-container-low rounded-xl px-4 py-3 border border-white/5 flex-1 min-w-[140px]">
            <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-headline font-bold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 w-fit border border-white/5">
        {ANALYSIS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold font-headline transition-all ${
              tab === t ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            {t}
            {t === 'Clauses' && <span className="ml-1.5 text-[10px] opacity-70">({clauses.length})</span>}
            {t === 'Risks'   && <span className="ml-1.5 text-[10px] opacity-70">({risks.length})</span>}
          </button>
        ))}
      </div>

      {/* ── Tab: Summary ── */}
      {tab === 'Summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Document Type',  value: analysis.detectedDocType    || doc.docType || '—' },
            { label: 'Jurisdiction',   value: analysis.detectedJurisdiction || '—'              },
            { label: 'Expiry Date',    value: (analysis.expiryDate  || doc.expiryDate)  ? formatDate(analysis.expiryDate  || doc.expiryDate)  : '—' },
            { label: 'Renewal Date',   value: (analysis.renewalDate || doc.renewalDate) ? formatDate(analysis.renewalDate || doc.renewalDate) : '—' },
            { label: 'Health Score',   value: `${score} / 100`                                  },
            { label: 'Confidence',     value: `${analysis.confidenceScore ?? 0}%`               },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-low rounded-2xl p-6 border border-white/5">
              <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-2">{label}</p>
              <p className="text-xl font-headline font-bold text-on-surface">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Clauses ── */}
      {tab === 'Clauses' && (
        <div className="space-y-4">
          {clauses.length === 0
            ? <div className="text-center py-16 text-on-surface-variant">No clauses extracted.</div>
            : clauses.map((clause, i) => {
                const isOriginal = showOriginal.has(i);
                return (
                  <div key={i} className={`bg-surface-container rounded-2xl border ${rc(clause.riskLevel).border} transition-all`}>
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                      <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0 ${rc(clause.riskLevel).bg} ${rc(clause.riskLevel).text}`}>
                        {clause.riskLevel || 'low'} risk
                      </span>
                      <h4 className="text-sm font-headline font-bold text-on-surface flex-1 truncate">{clause.type}</h4>
                      {clause.confidence != null && (
                        <span className={`text-[10px] font-label font-bold flex-shrink-0 ${confText(clause.confidence)}`}>
                          {clause.confidence}%
                        </span>
                      )}
                      <button
                        onClick={() => toggleOriginal(i)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-label transition-all flex-shrink-0 ${
                          isOriginal
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-white border border-white/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{isOriginal ? 'translate' : 'gavel'}</span>
                        {isOriginal ? 'Plain English' : 'View Original'}
                      </button>
                    </div>

                    <div className="px-6 py-5">
                      {isOriginal ? (
                        <div>
                          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Original Legal Text
                          </p>
                          <p className="italic text-on-surface-variant/80 text-sm leading-relaxed border-l-2 border-outline-variant/30 pl-4">
                            "{clause.originalText}"
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-label text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">translate</span>
                            What this means
                          </p>
                          <div className={`${rc(clause.riskLevel).bg} p-4 rounded-xl border ${rc(clause.riskLevel).border}`}>
                            <p className="text-sm text-on-surface leading-relaxed">{clause.plainEnglish}</p>
                          </div>
                          {clause.confidence != null && clause.confidence < 60 && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="material-symbols-outlined text-yellow-400 text-sm flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                              <p className="text-[11px] text-yellow-400">Low confidence ({clause.confidence}%) — verify manually.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── Tab: Risks ── */}
      {tab === 'Risks' && (
        <div className="space-y-4">
          {risks.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <p className="text-on-surface-variant font-headline font-bold">No risks detected</p>
            </div>
          ) : risks.map((risk, i) => (
            <div key={i} className={`bg-surface-container rounded-2xl p-6 border ${rc(risk.severity).border}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rc(risk.severity).bg}`}>
                  <span className={`material-symbols-outlined ${rc(risk.severity).text}`} style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className={`font-headline font-bold text-base ${rc(risk.severity).text}`}>{risk.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rc(risk.severity).bg} ${rc(risk.severity).text}`}>
                      {risk.severity?.toUpperCase()}
                    </span>
                    {risk.clauseRef && (
                      <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{risk.clauseRef}</span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{risk.description}</p>
                  {risk.recommendation && (
                    <div className="bg-surface-container-high rounded-xl p-4 flex items-start gap-3 border border-white/5">
                      <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                      <p className="text-sm text-on-surface leading-relaxed">{risk.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Compliance ── */}
      {tab === 'Compliance' && (
        <div className="space-y-6">
          {(() => {
            const cs = compliance.score ?? 0;
            const breakdown = [
              { label: 'All mandatory clauses', points: 40, earned: compliance.mandatoryClauses  },
              { label: 'Signature found',        points: 20, earned: compliance.signaturePresent  },
              { label: 'Valid dates found',       points: 20, earned: compliance.datesValid        },
              { label: 'Indian jurisdiction',     points: 20, earned: compliance.jurisdictionValid },
            ];
            return (
              <div className={`p-6 rounded-2xl border ${cs >= 80 ? 'bg-primary/5 border-primary/20' : cs >= 40 ? 'bg-tertiary-container/5 border-tertiary-container/20' : 'bg-error/5 border-error/20'}`}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Compliance Score</p>
                    <p className={`text-5xl font-headline font-extrabold ${ScoreColor(cs)}`}>{cs}<span className="text-2xl font-normal">%</span></p>
                  </div>
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/10" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {cs >= 80 ? 'verified' : cs >= 40 ? 'warning' : 'dangerous'}
                  </span>
                </div>
                <div className="space-y-2">
                  {breakdown.map(({ label, points, earned }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-sm flex-shrink-0 ${earned ? 'text-primary' : 'text-on-surface-variant/30'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {earned ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full ${earned ? (cs >= 80 ? 'bg-primary' : cs >= 40 ? 'bg-tertiary-container' : 'bg-error') : ''}`}
                          style={{ width: earned ? `${points}%` : '0%' }} />
                      </div>
                      <span className={`text-xs font-bold w-12 text-right flex-shrink-0 ${earned ? ScoreColor(cs) : 'text-on-surface-variant/30'}`}>
                        {earned ? `+${points}` : '+0'}<span className="font-normal text-on-surface-variant/40"> /{points}</span>
                      </span>
                      <span className="text-[11px] text-on-surface-variant w-44 flex-shrink-0">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Mandatory clause checks */}
          <div>
            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-3">Mandatory Clause Checks</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'termination',    label: 'Termination Clause',          desc: 'How the agreement can be ended' },
                { key: 'payment',        label: 'Payment Terms',                desc: 'Payment amounts, schedules, conditions' },
                { key: 'confidentiality',label: 'Confidentiality Clause',       desc: 'Protection of sensitive information' },
                { key: 'jurisdiction',   label: 'Jurisdiction / Governing Law', desc: 'Which law applies' },
                { key: 'liability',      label: 'Liability Clause',             desc: 'Who is responsible if things go wrong' },
                { key: 'indemnity',      label: 'Indemnity Clause',             desc: 'Who covers costs from third-party claims' },
              ].map(({ key, label, desc }) => {
                const found = !(compliance.missingClauses || []).includes(key);
                return (
                  <div key={key} className={`rounded-xl p-4 border flex items-start gap-3 ${found ? 'bg-primary/5 border-primary/15' : 'bg-error/5 border-error/15'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${found ? 'bg-primary/20' : 'bg-error/20'}`}>
                      <span className={`material-symbols-outlined text-base ${found ? 'text-primary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {found ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <div>
                      <p className={`font-headline font-bold text-sm ${found ? 'text-on-surface' : 'text-error'}`}>{label}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Structural checks */}
          <div>
            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-3">Structural Checks</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Signature Present',        desc: 'Document has a signature block',   pass: compliance.signaturePresent  },
                { label: 'Valid Dates Found',         desc: 'Date format detected',             pass: compliance.datesValid        },
                { label: 'Indian Jurisdiction Valid', desc: 'Governed by Indian law',           pass: compliance.jurisdictionValid },
              ].map(({ label, desc, pass }) => (
                <div key={label} className={`rounded-xl p-4 border flex items-start gap-3 ${pass ? 'bg-primary/5 border-primary/15' : 'bg-error/5 border-error/15'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pass ? 'bg-primary/20' : 'bg-error/20'}`}>
                    <span className={`material-symbols-outlined text-base ${pass ? 'text-primary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {pass ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div>
                    <p className={`font-headline font-bold text-sm ${pass ? 'text-on-surface' : 'text-error'}`}>{label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {compliance.jurisdictionDetected && compliance.jurisdictionDetected !== 'Not specified' && (
            <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <div>
                <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Jurisdiction Detected</p>
                <p className="font-headline font-bold text-on-surface">{compliance.jurisdictionDetected}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
