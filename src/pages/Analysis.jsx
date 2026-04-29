import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { analyzeDocument, getAnalysis } from '../api/analysis.api';
import { getDocument, getTextPreview, getAnnotations, createAnnotation, deleteAnnotation } from '../api/documents.api';
import ConsentPanel from '../components/ConsentPanel';
import HealthScoreRing from '../components/HealthScoreRing';
import { generateAnalysisReport } from '../utils/generateReport';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/* ── helpers ──────────────────────────────────────────────────────── */
const RISK_COLOR = {
  high:   { text: 'text-error',              border: 'border-error/30',              bg: 'bg-error/5'              },
  medium: { text: 'text-tertiary-container', border: 'border-tertiary-container/30', bg: 'bg-tertiary-container/5' },
  low:    { text: 'text-primary',            border: 'border-primary/30',            bg: 'bg-primary/5'            },
};
const rc = (level) => RISK_COLOR[level] || RISK_COLOR.low;

const ScoreColor = (s) =>
  s >= 80 ? 'text-primary' : s >= 50 ? 'text-tertiary-container' : 'text-error';
const BorderColor = (s) =>
  s >= 80 ? 'border-primary' : s >= 50 ? 'border-tertiary-container' : 'border-error';
// Confidence tiers: 85-100 green, 60-84 amber, <60 yellow warning
const confText = (c) => c >= 85 ? 'text-primary' : c >= 60 ? 'text-tertiary-container' : 'text-yellow-400';
const confBg   = (c) => c >= 85
  ? 'bg-primary/10 border-primary/20'
  : c >= 60
    ? 'bg-tertiary-container/10 border-tertiary-container/20'
    : 'bg-yellow-400/10 border-yellow-400/20';

const TABS = ['Summary', 'Clauses', 'Risks', 'Compliance', 'Annotations'];

const ANNOTATION_COLORS = {
  yellow: { bg: 'bg-yellow-400/15', border: 'border-yellow-400/40', dot: 'bg-yellow-400', label: 'Note'     },
  blue:   { bg: 'bg-blue-400/15',   border: 'border-blue-400/40',   dot: 'bg-blue-400',   label: 'Info'     },
  green:  { bg: 'bg-primary/15',    border: 'border-primary/40',    dot: 'bg-primary',    label: 'Approved' },
  red:    { bg: 'bg-error/15',      border: 'border-error/40',      dot: 'bg-error',      label: 'Flag'     },
};

/* ── component ────────────────────────────────────────────────────── */
export default function Analysis() {
  const { docId }  = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();

  const [doc,      setDoc]      = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [tab,      setTab]      = useState('Summary');
  const [phase,    setPhase]    = useState('loading'); // loading | consent | analyzing | done | error
  const [errMsg,   setErrMsg]   = useState('');
  const [rerunning,    setRerunning]    = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  // tracks which clause indices are showing their original legal text
  const [showOriginal, setShowOriginal] = useState(new Set());

  // consent panel state
  const [consentOpen,    setConsentOpen]    = useState(false);
  const [consentPreview, setConsentPreview] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMeta,    setConsentMeta]    = useState({ wordCount: 0, charCount: 0 });
  const [pendingRerun,   setPendingRerun]   = useState(false);

  // Collaboration — annotations + presence
  const [annotations,      setAnnotations]      = useState([]);
  const [onlineUsers,      setOnlineUsers]       = useState([]);
  const [activeClause,     setActiveClause]      = useState(null); // clause index being annotated
  const [annotationText,   setAnnotationText]    = useState('');
  const [annotationColor,  setAnnotationColor]   = useState('yellow');
  const [savingAnnotation, setSavingAnnotation]  = useState(false);

  /* ── fetch / auto-analyze ─────────────────────────────────────── */
  useEffect(() => { if (docId) init(); }, [docId]);

  /* ── Socket room lifecycle ────────────────────────────────────── */
  useEffect(() => {
    if (!socket || !docId) return;
    joinRoom(docId);
    return () => leaveRoom(docId);
  }, [socket, docId, joinRoom, leaveRoom]);

  /* ── Real-time event listeners ────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const onUpdate = (data) => {
      if (data.type === 'annotation') {
        setAnnotations((prev) => {
          // deduplicate — the creating client also receives this via io.to()
          const exists = prev.some((a) => String(a._id) === String(data.annotation._id));
          return exists ? prev : [...prev, data.annotation];
        });
      }
      if (data.type === 'annotation-delete') {
        setAnnotations((prev) => prev.filter((a) => String(a._id) !== data.annotationId));
      }
    };

    const onPresence = ({ users }) => setOnlineUsers(users);

    socket.on('document-update', onUpdate);
    socket.on('presence-update', onPresence);
    return () => {
      socket.off('document-update', onUpdate);
      socket.off('presence-update', onPresence);
    };
  }, [socket]);

  /* ── Fetch existing annotations when doc loads ─────────────────── */
  useEffect(() => {
    if (!docId || phase !== 'done') return;
    getAnnotations(docId)
      .then((res) => setAnnotations(res.data.data.annotations || []))
      .catch(() => {});
  }, [docId, phase]);

  /* ── Annotation handlers ──────────────────────────────────────── */
  const handleSaveAnnotation = async (clauseIndex) => {
    if (!annotationText.trim()) return;
    setSavingAnnotation(true);
    try {
      const res = await createAnnotation(docId, {
        clauseIndex,
        text:  annotationText.trim(),
        color: annotationColor,
      });
      // Add locally (socket broadcast deduplicates for other clients)
      setAnnotations((prev) => {
        const a = res.data.data.annotation;
        const exists = prev.some((x) => String(x._id) === String(a._id));
        return exists ? prev : [...prev, a];
      });
      setActiveClause(null);
      setAnnotationText('');
      setAnnotationColor('yellow');
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingAnnotation(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    setAnnotations((prev) => prev.filter((a) => String(a._id) !== String(annotationId)));
    try {
      await deleteAnnotation(docId, annotationId);
    } catch {
      // re-fetch on failure
      getAnnotations(docId).then((r) => setAnnotations(r.data.data.annotations || [])).catch(() => {});
    }
  };

  const init = async () => {
    setPhase('loading');
    setErrMsg('');
    try {
      const docRes = await getDocument(docId);
      setDoc(docRes.data.data.document);

      try {
        const aRes = await getAnalysis(docId);
        setAnalysis(aRes.data.data.analysis);
        setPhase('done');
      } catch (e) {
        if (e.response?.status === 404) {
          // No analysis yet — show consent before running
          await openConsent(false);
        } else throw e;
      }
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Failed to load document.');
      setPhase('error');
    }
  };

  const openConsent = useCallback(async (rerun) => {
    setPendingRerun(rerun);
    setConsentOpen(true);
    setConsentLoading(true);
    setPhase('consent');
    try {
      const res = await getTextPreview(docId);
      setConsentPreview(res.data.data.preview);
      setConsentMeta({ wordCount: res.data.data.wordCount, charCount: res.data.data.charCount });
    } catch {
      setConsentPreview(null);
    } finally {
      setConsentLoading(false);
    }
  }, [docId]);

  const handleConsentConfirm = () => {
    setConsentOpen(false);
    runAnalysis(pendingRerun);
  };

  const handleConsentCancel = () => {
    setConsentOpen(false);
    if (phase === 'consent' && !analysis) {
      setPhase('error');
      setErrMsg('Analysis cancelled. Click Re-analyze to run when ready.');
    }
  };

  const runAnalysis = async (rerun = false) => {
    setPhase('analyzing');
    if (rerun) setRerunning(true);
    try {
      const res = await analyzeDocument(docId, rerun);
      setAnalysis(res.data.data.analysis);
      setShowOriginal(new Set());
      setPhase('done');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Analysis failed. Please try again.');
      setPhase('error');
    } finally {
      setRerunning(false);
    }
  };

  /* ── loading screen ───────────────────────────────────────────── */
  if (phase === 'loading' || phase === 'analyzing') {
    return (
      <>
        <Header title={phase === 'analyzing' ? 'Analyzing…' : 'Loading…'} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
            <span
              className="material-symbols-outlined text-6xl text-primary animate-pulse relative z-10"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
          </div>
          <h2 className="text-3xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
            {phase === 'analyzing' ? 'AI Analysis in Progress' : 'Loading Document'}
          </h2>
          <p className="text-on-surface-variant font-body mt-4 tracking-widest uppercase text-sm">
            {phase === 'analyzing'
              ? 'Running Gemini 1.5 Flash + Compliance Engine…'
              : 'Fetching your document…'}
          </p>
          {phase === 'analyzing' && (
            <div className="mt-8 flex flex-col items-center gap-2 text-xs text-on-surface-variant max-w-sm text-center">
              <p>Extracting clauses · Detecting risks · Checking compliance · Scoring health</p>
              <p className="text-primary/60">This takes 10–30 seconds depending on document size.</p>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── error screen ─────────────────────────────────────────────── */
  if (phase === 'error') {
    return (
      <>
        <Header title="Analysis Error" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-6">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <h2 className="text-2xl font-headline font-bold text-error">Analysis Failed</h2>
          <p className="text-on-surface-variant text-center max-w-md">{errMsg}</p>
          <div className="flex gap-4">
            <button
              onClick={() => runAnalysis(false)}
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── derived values ───────────────────────────────────────────── */
  const score      = analysis?.healthScore ?? 0;
  const compliance = analysis?.compliance || {};
  const clauses       = analysis?.clauses   || [];
  const risks         = analysis?.risks     || [];

  /* ── main render ──────────────────────────────────────────────── */
  return (
    <>
      <Header title={doc?.originalName || 'Document Analysis'}>
        <div className="flex items-center gap-3">
          {/* Online presence avatars */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5" title={onlineUsers.map((u) => u.name).join(', ')}>
              {onlineUsers.slice(0, 4).map((u, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center -ml-1 first:ml-0"
                  title={u.name}
                >
                  <span className="text-[10px] font-bold text-primary">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {onlineUsers.length > 4 && (
                <span className="text-xs text-on-surface-variant ml-1">+{onlineUsers.length - 4}</span>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" title="Live" />
            </div>
          )}

          <button
            onClick={async () => {
              setDownloading(true);
              try { generateAnalysisReport(doc, analysis); }
              finally { setDownloading(false); }
            }}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline-variant/30 text-sm font-bold hover:bg-white/5 transition-colors text-on-surface-variant disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${downloading ? 'animate-pulse' : ''}`}>
              download
            </span>
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button
            onClick={() => openConsent(true)}
            disabled={rerunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline-variant/30 text-sm font-bold hover:bg-white/5 transition-colors text-on-surface-variant disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${rerunning ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {rerunning ? 'Re-analyzing…' : 'Re-analyze'}
          </button>
          <button
            onClick={() => navigate(`/ask?docId=${docId}`)}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            Ask AI
          </button>
        </div>
      </Header>

      <div className="p-8 min-h-[calc(100vh-64px)] pb-24">
        {/* Breadcrumb */}
        <nav className="flex gap-2 text-[10px] font-label text-on-surface-variant mb-4 tracking-widest uppercase">
          <Link to="/documents" className="hover:text-primary transition-colors">Repository</Link>
          <span>/</span>
          <span>{analysis?.detectedDocType || doc?.docType || 'Document'}</span>
          <span>/</span>
          <span className="text-on-surface truncate max-w-[200px]">{doc?.originalName}</span>
        </nav>

        {/* Classification chip row */}
        {analysis?.detectedDocType && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-full">
              <span
                className="material-symbols-outlined text-primary text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                description
              </span>
              <span className="text-primary font-headline font-bold text-sm">{analysis.detectedDocType}</span>
              <span className="text-primary/50 text-[10px] font-label">AI detected</span>
            </div>
            {analysis.detectedDocType !== doc?.docType && doc?.docType && doc.docType !== 'Other' && (
              <span className="text-[11px] text-on-surface-variant font-label">
                You selected: <span className="line-through opacity-60">{doc.docType}</span>
              </span>
            )}
            {analysis?.detectedJurisdiction && analysis.detectedJurisdiction !== 'Not specified' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-white/5 rounded-full">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">location_on</span>
                <span className="text-on-surface-variant text-[11px] font-label">{analysis.detectedJurisdiction}</span>
              </div>
            )}
          </div>
        )}

        {/* Top grid — health + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
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
              confidenceScore={analysis?.confidenceScore ?? 0}
            />
          </div>

          {/* AI Summary */}
          <div className="lg:col-span-8 bg-surface-container-low p-8 rounded-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="text-lg font-headline font-bold">AI Summary</h3>
              <span className="ml-auto text-[10px] text-on-surface-variant font-label">
                {new Date(analysis?.analyzedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-base mb-4 font-body flex-1">
              {analysis?.summary || 'No summary available.'}
            </p>

            {/* Low-confidence global warning */}
            {(analysis?.confidenceScore ?? 100) < 60 && (
              <div className="flex items-start gap-3 bg-yellow-400/10 border border-yellow-400/25 rounded-xl px-4 py-3 mb-4">
                <span
                  className="material-symbols-outlined text-yellow-400 text-base flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>
                <p className="text-xs text-yellow-400 leading-relaxed">
                  <span className="font-bold">Low confidence ({analysis.confidenceScore}%)</span> — the document may be incomplete or hard to read. Verify this analysis with a qualified lawyer before acting on it.
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-container-low rounded-xl p-1 w-fit border border-white/5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold font-headline transition-all ${
                tab === t
                  ? 'bg-primary text-on-primary shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {t}
              {t === 'Clauses'     && <span className="ml-1.5 text-[10px] opacity-70">({clauses.length})</span>}
              {t === 'Risks'       && <span className="ml-1.5 text-[10px] opacity-70">({risks.length})</span>}
              {t === 'Annotations' && annotations.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({annotations.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Summary ──────────────────────────────────────── */}
        {tab === 'Summary' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Document Type',   value: analysis?.detectedDocType    || doc?.docType || '—' },
              { label: 'Jurisdiction',    value: analysis?.detectedJurisdiction || doc?.jurisdiction || '—' },
              { label: 'Expiry Date',     value: (analysis?.expiryDate  || doc?.expiryDate)  ? new Date(analysis?.expiryDate  || doc?.expiryDate).toLocaleDateString('en-IN')  : '—' },
              { label: 'Renewal Date',    value: (analysis?.renewalDate || doc?.renewalDate) ? new Date(analysis?.renewalDate || doc?.renewalDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Health Score',    value: `${score} / 100` },
              { label: 'Confidence',      value: `${analysis?.confidenceScore ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-container-low rounded-2xl p-6 border border-white/5">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-2">{label}</p>
                <p className="text-xl font-headline font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Clauses ──────────────────────────────────────── */}
        {tab === 'Clauses' && (
          <div className="space-y-4">
            {clauses.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">No clauses extracted.</div>
            ) : clauses.map((clause, i) => {
              const isOriginal = showOriginal.has(i);
              const toggleOriginal = () =>
                setShowOriginal((prev) => {
                  const next = new Set(prev);
                  isOriginal ? next.delete(i) : next.add(i);
                  return next;
                });
              return (
                <div key={i} className={`bg-surface-container rounded-2xl border ${rc(clause.riskLevel).border} transition-all`}>
                  {/* Card header */}
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
                    {/* Toggle button */}
                    <button
                      onClick={toggleOriginal}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-label transition-all flex-shrink-0 ${
                        isOriginal
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-white border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isOriginal ? 'translate' : 'gavel'}
                      </span>
                      {isOriginal ? 'Plain English' : 'View Original'}
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="px-6 py-5">
                    {isOriginal ? (
                      /* Original legal text */
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
                      /* Plain English — default view */
                      <div>
                        <p className="text-[10px] font-label text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">translate</span>
                          What this means for you
                        </p>
                        <div className={`${rc(clause.riskLevel).bg} p-4 rounded-xl border ${rc(clause.riskLevel).border}`}>
                          <p className="text-sm text-on-surface leading-relaxed">{clause.plainEnglish}</p>
                        </div>
                        {clause.confidence != null && clause.confidence < 60 && (
                          <div className="flex items-center gap-2 mt-3">
                            <span
                              className="material-symbols-outlined text-yellow-400 text-sm flex-shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              warning
                            </span>
                            <p className="text-[11px] text-yellow-400 leading-snug">
                              Low confidence ({clause.confidence}%) — verify this clause with a qualified lawyer.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Existing annotations on this clause ── */}
                    {annotations.filter((a) => a.clauseIndex === i).map((a) => {
                      const ac = ANNOTATION_COLORS[a.color] || ANNOTATION_COLORS.yellow;
                      return (
                        <div key={a._id} className={`mt-3 flex items-start gap-3 p-3 rounded-xl border ${ac.bg} ${ac.border}`}>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${ac.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-on-surface-variant font-label">{a.userName}</span>
                              <span className="text-[10px] text-on-surface-variant/50">
                                {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-sm text-on-surface">{a.text}</p>
                          </div>
                          {String(a.userId) === String(user?._id || user?.id) && (
                            <button
                              onClick={() => handleDeleteAnnotation(String(a._id))}
                              className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Add note form (inline) ── */}
                    {activeClause === i ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          autoFocus
                          rows={2}
                          value={annotationText}
                          onChange={(e) => setAnnotationText(e.target.value)}
                          placeholder="Add a note or observation…"
                          className="w-full bg-surface-container-high border border-white/10 focus:border-primary text-white text-sm py-2 px-3 rounded-lg outline-none resize-none transition-colors"
                        />
                        <div className="flex items-center gap-2">
                          {Object.entries(ANNOTATION_COLORS).map(([c, s]) => (
                            <button
                              key={c}
                              onClick={() => setAnnotationColor(c)}
                              title={s.label}
                              className={`w-5 h-5 rounded-full ${s.dot} transition-transform ${annotationColor === c ? 'scale-125 ring-2 ring-white/40' : 'opacity-60 hover:opacity-100'}`}
                            />
                          ))}
                          <div className="ml-auto flex gap-2">
                            <button
                              onClick={() => { setActiveClause(null); setAnnotationText(''); }}
                              className="text-xs px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-white border border-white/10 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveAnnotation(i)}
                              disabled={savingAnnotation || !annotationText.trim()}
                              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                            >
                              {savingAnnotation
                                ? <><span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>Saving…</>
                                : <><span className="material-symbols-outlined text-xs">save</span>Save</>
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveClause(i); setAnnotationText(''); setAnnotationColor('yellow'); }}
                        className="mt-3 flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-primary transition-colors font-label"
                      >
                        <span className="material-symbols-outlined text-sm">add_comment</span>
                        Add note
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab: Risks ────────────────────────────────────────── */}
        {tab === 'Risks' && (
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <p className="text-on-surface-variant font-headline font-bold">No risks detected</p>
                <p className="text-sm text-on-surface-variant">This document has no identified risk factors.</p>
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-label ${rc(risk.severity).bg} ${rc(risk.severity).text}`}>
                        {risk.severity?.toUpperCase()}
                      </span>
                      {risk.clauseRef && (
                        <span className="text-[10px] text-on-surface-variant font-label bg-surface-container-high px-2 py-0.5 rounded-full">
                          {risk.clauseRef}
                        </span>
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

        {/* ── Tab: Compliance ───────────────────────────────────── */}
        {tab === 'Compliance' && (
          <div className="space-y-6">
            {/* Score banner */}
            {(() => {
              const cs = compliance.score ?? 0;
              const breakdown = [
                { label: 'All mandatory clauses', points: 40, earned: compliance.mandatoryClauses },
                { label: 'Signature found',        points: 20, earned: compliance.signaturePresent },
                { label: 'Valid dates found',       points: 20, earned: compliance.datesValid       },
                { label: 'Indian jurisdiction',     points: 20, earned: compliance.jurisdictionValid},
              ];
              return (
                <div className={`p-6 rounded-2xl border ${cs >= 80 ? 'bg-primary/5 border-primary/20' : cs >= 40 ? 'bg-tertiary-container/5 border-tertiary-container/20' : 'bg-error/5 border-error/20'}`}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Overall Compliance Score</p>
                      <p className={`text-5xl font-headline font-extrabold ${ScoreColor(cs)}`}>
                        {cs}<span className="text-2xl font-normal">%</span>
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/10" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {cs >= 80 ? 'verified' : cs >= 40 ? 'warning' : 'dangerous'}
                    </span>
                  </div>
                  {/* Point breakdown */}
                  <div className="space-y-2">
                    {breakdown.map(({ label, points, earned }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-sm flex-shrink-0 ${earned ? 'text-primary' : 'text-on-surface-variant/30'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {earned ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${earned ? (cs >= 80 ? 'bg-primary' : cs >= 40 ? 'bg-tertiary-container' : 'bg-error') : ''}`}
                            style={{ width: earned ? `${(points / 100) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className={`text-xs font-headline font-bold w-12 text-right flex-shrink-0 ${earned ? ScoreColor(cs) : 'text-on-surface-variant/30'}`}>
                          {earned ? `+${points}` : `+0`}
                          <span className="font-normal text-on-surface-variant/40"> /{points}</span>
                        </span>
                        <span className="text-[11px] text-on-surface-variant w-40 flex-shrink-0">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 6 mandatory clause checks */}
            <div>
              <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                Mandatory Clause Checks
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'termination',    label: 'Termination Clause',   desc: 'How the agreement can be ended by either party' },
                  { key: 'payment',        label: 'Payment Terms',         desc: 'Payment amounts, schedules, and conditions' },
                  { key: 'confidentiality',label: 'Confidentiality Clause',desc: 'Protection of sensitive or proprietary information' },
                  { key: 'jurisdiction',   label: 'Jurisdiction / Governing Law', desc: "Which state or country's law applies" },
                  { key: 'liability',      label: 'Liability Clause',      desc: 'Who is responsible if something goes wrong' },
                  { key: 'indemnity',      label: 'Indemnity Clause',      desc: 'Who covers costs if a third party makes a claim' },
                ].map(({ key, label, desc }) => {
                  const found = !(compliance.missingClauses || []).includes(key);
                  return (
                    <div
                      key={key}
                      className={`rounded-xl p-4 border flex items-start gap-3 ${
                        found ? 'bg-primary/5 border-primary/15' : 'bg-error/5 border-error/15'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${found ? 'bg-primary/20' : 'bg-error/20'}`}>
                        <span
                          className={`material-symbols-outlined text-base ${found ? 'text-primary' : 'text-error'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {found ? 'check_circle' : 'cancel'}
                        </span>
                      </div>
                      <div>
                        <p className={`font-headline font-bold text-sm ${found ? 'text-on-surface' : 'text-error'}`}>{label}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Structural checks */}
            <div>
              <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                Structural Checks
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Signature Present',         desc: 'Document has a signature block',          pass: compliance.signaturePresent  },
                  { label: 'Valid Dates Found',          desc: 'Date format detected in document',        pass: compliance.datesValid        },
                  { label: 'Indian Jurisdiction Valid',  desc: 'Governed by Indian law or state court',   pass: compliance.jurisdictionValid },
                ].map(({ label, desc, pass }) => (
                  <div key={label} className={`rounded-xl p-4 border flex items-start gap-3 ${pass ? 'bg-primary/5 border-primary/15' : 'bg-error/5 border-error/15'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${pass ? 'bg-primary/20' : 'bg-error/20'}`}>
                      <span className={`material-symbols-outlined text-base ${pass ? 'text-primary' : 'text-error'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {pass ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <div>
                      <p className={`font-headline font-bold text-sm ${pass ? 'text-on-surface' : 'text-error'}`}>{label}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jurisdiction detected */}
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

        {/* ── Tab: Annotations ──────────────────────────────── */}
        {tab === 'Annotations' && (
          <div className="space-y-4">
            {/* Connection status */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-primary animate-pulse' : 'bg-error'}`} />
              {isConnected ? `Live — ${onlineUsers.length} viewer${onlineUsers.length !== 1 ? 's' : ''} in this document` : 'Connecting…'}
            </div>

            {annotations.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <span className="material-symbols-outlined text-5xl block opacity-20">add_comment</span>
                <p className="text-white/30 font-headline font-bold text-lg">No annotations yet</p>
                <p className="text-sm text-on-surface-variant">
                  Go to the <button onClick={() => setTab('Clauses')} className="text-primary underline">Clauses tab</button> and click "Add note" on any clause.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {annotations.map((a) => {
                  const ac = ANNOTATION_COLORS[a.color] || ANNOTATION_COLORS.yellow;
                  const clauseLabel = analysis?.clauses?.[a.clauseIndex]?.type || `Clause ${a.clauseIndex + 1}`;
                  return (
                    <div key={a._id} className={`rounded-xl p-5 border ${ac.bg} ${ac.border}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${ac.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-xs font-bold text-on-surface font-headline">{a.userName}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant border border-white/5">
                              {clauseLabel}
                            </span>
                            <span className="text-[10px] text-on-surface-variant ml-auto">
                              {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface leading-relaxed">{a.text}</p>
                        </div>
                        {String(a.userId) === String(user?._id || user?.id) && (
                          <button
                            onClick={() => handleDeleteAnnotation(String(a._id))}
                            className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Ask AI button */}
      <button
        onClick={() => navigate(`/ask?docId=${docId}`)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-50"
        title="Ask AI about this document"
      >
        <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
      </button>

      <ConsentPanel
        isOpen={consentOpen}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
        title={pendingRerun ? 'Re-analyze Document' : 'Analyze Document'}
        confirmLabel={pendingRerun ? 'Confirm & Re-analyze' : 'Confirm & Analyze'}
        preview={consentPreview}
        previewLoading={consentLoading}
        wordCount={consentMeta.wordCount}
        charCount={consentMeta.charCount}
        details={[
          'Extracted document text (chunked)',
          'Document type for context',
          'Jurisdiction for compliance check',
          'No personal or account data included',
        ]}
      />
    </>
  );
}
