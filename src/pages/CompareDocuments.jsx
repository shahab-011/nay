import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { compareDocuments, getComparisons } from '../api/comparisons.api';
import { getDocuments, getTextPreview, uploadTextOnly } from '../api/documents.api';
import ConsentPanel from '../components/ConsentPanel';

/* ── browser PDF/DOCX extraction ──────────────────────────────────── */
async function extractPdfInBrowser(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
    onProgress(Math.round((i / pdf.numPages) * 80));
  }
  return text.trim();
}

async function extractDocxInBrowser(file, onProgress) {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  onProgress(80);
  return result.value.trim();
}

/* ── design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:      '#f4f6fd',
  sur:     '#ffffff',
  bdr:     '#e5e7f5',
  indigo:  '#6366f1',
  indigoS: 'rgba(99,102,241,0.08)',
  indigoBdr:'rgba(99,102,241,0.2)',
  ink:     '#1e1b4b',
  muted:   '#6b7099',
  subtle:  '#f0f2ff',
  ele:     '#eaecf8',
  amber:   '#f59e0b',
  amberS:  'rgba(245,158,11,0.08)',
  amberBdr:'rgba(245,158,11,0.22)',
  red:     '#ef4444',
  redS:    'rgba(239,68,68,0.07)',
  redBdr:  'rgba(239,68,68,0.22)',
  green:   '#16a34a',
  greenS:  'rgba(22,163,74,0.07)',
  greenBdr:'rgba(22,163,74,0.22)',
};

/* ── helpers ──────────────────────────────────────────────────────── */
const riskChangeMeta = (rc) => {
  if (!rc) return null;
  const v = rc.toLowerCase();
  if (v === 'improved') return { label: 'Risk Improved', icon: 'trending_up',   color: T.green,  bg: T.greenS, bdr: T.greenBdr };
  if (v === 'worsened') return { label: 'Risk Worsened', icon: 'trending_down', color: T.red,    bg: T.redS,   bdr: T.redBdr   };
  return                       { label: 'Risk Neutral',  icon: 'trending_flat', color: T.muted,  bg: T.subtle, bdr: T.bdr      };
};

const severityMeta = (s) => {
  const v = (s || 'low').toLowerCase();
  if (v === 'high')   return { label: 'High Risk',   color: T.red,    bg: T.redS,   bdr: T.redBdr   };
  if (v === 'medium') return { label: 'Medium Risk', color: T.amber,  bg: T.amberS, bdr: T.amberBdr };
  return                     { label: 'Low Risk',    color: T.indigo, bg: T.indigoS,bdr: T.indigoBdr };
};

/* ── DocSlot ─────────────────────────────────────────────────────── */
function DocSlot({ slot, docId, setDocId, docs, docsLoading, onDocAdded }) {
  const isA   = slot === 'A';
  const accent    = isA ? T.amber  : T.indigo;
  const accentS   = isA ? T.amberS : T.indigoS;
  const accentBdr = isA ? T.amberBdr : T.indigoBdr;
  const accentTxt = isA ? '#92400e' : '#4338ca';

  const [tab,       setTab]       = useState('select');
  const [search,    setSearch]    = useState('');
  const [file,      setFile]      = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef(null);

  const selectedDoc  = docs.find((d) => d._id === docId);
  const filteredDocs = docs.filter((d) =>
    d.originalName.toLowerCase().includes(search.toLowerCase()),
  );

  const pickFile = (f) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.match(/\.docx?$/) && !name.endsWith('.txt')) {
      setErr('Only PDF, DOCX, or TXT files are supported.');
      return;
    }
    setFile(f); setErr(''); setMsg('');
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true); setErr(''); setMsg('Extracting text…'); setProgress(10);
    try {
      let text = '';
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        text = await extractPdfInBrowser(file, setProgress);
      } else if (name.match(/\.docx?$/)) {
        text = await extractDocxInBrowser(file, setProgress);
      } else {
        text = await file.text(); setProgress(80);
      }
      if (!text.trim()) throw new Error('No readable text found in this file.');
      setMsg('Saving…'); setProgress(90);
      const res = await uploadTextOnly(file.name, text);
      const saved = res.data.data.document;
      onDocAdded(saved);
      setDocId(saved._id);
      setProgress(100);
      setTimeout(() => { setTab('select'); setFile(null); setMsg(''); setProgress(0); }, 500);
    } catch (e) {
      setErr(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${accentBdr}`, background: T.sur, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 4px 20px ${accentS}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${accentBdr}`, background: accentS }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${accentBdr}` }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: isA ? '#000' : '#fff' }}>{slot}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, margin: 0 }}>
            {isA ? 'Base Document (Original)' : 'Compare Document (Revised)'}
          </p>
          {selectedDoc && (
            <p style={{ fontSize: 12, fontWeight: 700, color: accentTxt, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedDoc.originalName.replace(/\.[^.]+$/, '')}
            </p>
          )}
        </div>
        {selectedDoc && (
          <button onClick={() => setDocId('')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.bdr}` }}>
        {[['select', 'folder_open', 'My Documents'], ['upload', 'upload_file', 'Upload New']].map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setErr(''); setFile(null); setProgress(0); setMsg(''); }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t ? T.subtle : 'transparent',
              color: tab === t ? accent : T.muted,
              borderBottom: tab === t ? `2.5px solid ${accent}` : '2.5px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Select tab */}
      {tab === 'select' && (
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: T.muted, pointerEvents: 'none' }}>search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              style={{ width: '100%', background: T.subtle, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '8px 12px 8px 34px', fontSize: 12, color: T.ink, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {docsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8, color: T.muted, fontSize: 12 }}>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Loading…
              </div>
            ) : filteredDocs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 12, margin: 0 }}>
                {search ? 'No matching documents.' : 'No documents uploaded yet.'}
              </p>
            ) : (
              filteredDocs.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setDocId(d._id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    border: `1px solid ${docId === d._id ? accentBdr : 'transparent'}`,
                    background: docId === d._id ? accentS : 'transparent',
                    marginBottom: 2, transition: 'all 0.12s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, color: docId === d._id ? accent : T.muted, fontVariationSettings: "'FILL' 1" }}>description</span>
                  <span style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.ink }}>
                    {d.originalName.replace(/\.[^.]+$/, '')}
                  </span>
                  {docId === d._id && <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, color: accent }}>check_circle</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div style={{ padding: 16, flex: 1 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              position: 'relative', borderRadius: 12,
              border: `2px dashed ${dragging ? accent : file ? `${accent}aa` : T.bdr}`,
              background: dragging ? accentS : file ? accentS : T.subtle,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '28px 16px', transition: 'all 0.15s',
            }}
          >
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files[0])} />
            {file ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 34, color: accent, fontVariationSettings: "'FILL' 1" }}>draft</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.ink, textAlign: 'center', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{file.name}</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); setMsg(''); setErr(''); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: T.ele, border: 'none', color: T.muted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 34, color: T.muted }}>cloud_upload</span>
                <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: 0 }}>
                  Drag &amp; drop or <span style={{ fontWeight: 700, color: accent }}>browse</span>
                </p>
                <p style={{ fontSize: 11, color: `${T.muted}99`, margin: 0 }}>PDF · DOCX · TXT</p>
              </>
            )}
          </div>

          {uploading && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 5, width: '100%', background: T.ele, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: accent, width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 4 }}>{msg || 'Processing…'}</p>
            </div>
          )}

          {err && <p style={{ fontSize: 11, color: T.red, background: T.redS, border: `1px solid ${T.redBdr}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginTop: 8 }}>{err}</p>}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
              background: file && !uploading ? accent : T.ele,
              color: file && !uploading ? (isA ? '#000' : '#fff') : T.muted,
              border: 'none', cursor: file && !uploading ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
            }}
          >
            {uploading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progress_activity</span>Uploading…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload</span>Upload &amp; Use</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function CompareDocuments() {
  const navigate = useNavigate();

  const [docs,         setDocs]         = useState([]);
  const [docsLoading,  setDocsLoading]  = useState(true);
  const [docAId,       setDocAId]       = useState('');
  const [docBId,       setDocBId]       = useState('');
  const [result,       setResult]       = useState(null);
  const [comparing,    setComparing]    = useState(false);
  const [error,        setError]        = useState('');
  const [filter,       setFilter]       = useState('All');
  const [history,      setHistory]      = useState([]);

  const [consentOpen,    setConsentOpen]    = useState(false);
  const [consentPreview, setConsentPreview] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMeta,    setConsentMeta]    = useState({ wordCount: 0, charCount: 0 });

  useEffect(() => {
    getDocuments()
      .then((res) => setDocs(res.data.data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
    getComparisons()
      .then((res) => setHistory(res.data.data.comparisons || []))
      .catch(() => setHistory([]));
  }, []);

  const handleDocAdded = (saved) =>
    setDocs((prev) => prev.find((d) => d._id === saved._id) ? prev : [saved, ...prev]);

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
    } catch { setConsentPreview(null); }
    finally { setConsentLoading(false); }
  };

  const runComparison = async () => {
    setConsentOpen(false); setResult(null); setComparing(true); setFilter('All');
    try {
      const res = await compareDocuments(docAId, docBId);
      const comparison = res.data.data.comparison;
      if (
        comparison?.summary?.includes('encountered an error') ||
        comparison?.recommendation?.includes('Unable to complete comparison')
      ) {
        setError('AI comparison failed. Please try again in a few seconds.');
      } else {
        setResult(comparison);
        setHistory((prev) => [comparison, ...prev]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Comparison failed.';
      setError(`AI comparison failed: ${msg}`);
    } finally { setComparing(false); }
  };

  const loadHistory = (h) => {
    setResult(h);
    setDocAId(h.docAId?._id || h.docAId || '');
    setDocBId(h.docBId?._id || h.docBId || '');
    setFilter('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const additions     = result?.additions     || [];
  const removals      = result?.removals      || [];
  const modifications = result?.modifications || [];
  const totalChanges  = additions.length + removals.length + modifications.length;

  const isErrorResult = result && (
    result.summary?.includes('encountered an error') ||
    result.recommendation?.includes('Unable to complete comparison')
  );

  const docA = docs.find((d) => d._id === (result?.docAId?._id || result?.docAId || docAId));
  const docB = docs.find((d) => d._id === (result?.docBId?._id || result?.docBId || docBId));
  const canCompare = docAId && docBId && docAId !== docBId && !comparing;
  const badge = riskChangeMeta(result?.riskChange);

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)',
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
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.ink, letterSpacing: '-0.01em' }}>Compare Documents</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>AI-powered clause-level diff analysis</p>
        </div>
      </header>

      <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Selector panel ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: T.sur, borderRadius: 20, border: `1px solid ${T.bdr}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(99,102,241,0.07)', marginBottom: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderBottom: `1px solid ${T.bdr}`, background: T.subtle }}>
            <motion.span
              animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: T.indigo, fontVariationSettings: "'FILL' 1" }}
            >compare_arrows</motion.span>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.ink }}>Document Comparison</h2>
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Select or upload two versions — AI finds every change in seconds</p>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {/* Three-column grid: Slot A | VS | Slot B */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', gap: 16, alignItems: 'start' }}>
              <DocSlot
                slot="A" docId={docAId}
                setDocId={(id) => { setDocAId(id); setResult(null); setError(''); }}
                docs={docs} docsLoading={docsLoading} onDocAdded={handleDocAdded}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 48 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.ele, border: `2px solid ${T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: T.muted, letterSpacing: '0.08em' }}>VS</span>
                </div>
              </div>
              <DocSlot
                slot="B" docId={docBId}
                setDocId={(id) => { setDocBId(id); setResult(null); setError(''); }}
                docs={docs} docsLoading={docsLoading} onDocAdded={handleDocAdded}
              />
            </div>

            {error && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: T.red, fontSize: 13, background: T.redS, border: `1px solid ${T.redBdr}`, borderRadius: 12, padding: '12px 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>{error}
              </div>
            )}

            <button
              onClick={handleCompare}
              disabled={!canCompare}
              style={{
                marginTop: 20, width: '100%', height: 52, fontWeight: 800, fontSize: 14,
                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: 'none', cursor: canCompare ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                background: canCompare ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : T.ele,
                color: canCompare ? '#fff' : T.muted,
                boxShadow: canCompare ? '0 8px 24px rgba(99,102,241,0.25)' : 'none',
              }}
            >
              {comparing ? (
                <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 22 }}>progress_activity</span>AI is analysing both documents…</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
                  {canCompare ? 'Run AI Comparison' : 'Select two documents to compare'}</>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Analysing state ────────────────────────────────────── */}
        {comparing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '80px 0', background: T.sur, borderRadius: 20, border: `1px solid ${T.bdr}`, marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: T.indigoS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 40, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
              </div>
              <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: T.indigo, display: 'block' }} className="animate-ping" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16, color: T.ink }}>Comparing documents…</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>AI is reading every clause in both versions</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 12, color: T.muted }}>
              {['Reading Document A', 'Finding differences', 'Assessing risk impact'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.indigo, display: 'inline-block' }} className="animate-pulse" />
                  {s}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Error result ────────────────────────────────────────── */}
        {result && isErrorResult && !comparing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '80px 0', background: T.sur, borderRadius: 20, border: `1px solid ${T.bdr}`, marginBottom: 28, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.redS, border: `1px solid ${T.redBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: T.red, fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 16, color: T.ink }}>AI comparison failed</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, maxWidth: 340 }}>
                The AI could not complete this comparison. Please try running it again.
              </p>
            </div>
            <button
              onClick={() => { setResult(null); setError(''); }}
              style={{ padding: '10px 24px', borderRadius: 10, background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────── */}
        {result && !isErrorResult && !comparing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: badge ? 'repeat(5,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
              {[
                { label: 'Total Changes', value: totalChanges,         color: T.ink,    bg: T.sur,    icon: 'change_circle', bdr: T.bdr         },
                { label: 'Additions',     value: additions.length,     color: T.green,  bg: T.greenS, icon: 'add_circle',    bdr: T.greenBdr    },
                { label: 'Removals',      value: removals.length,      color: T.red,    bg: T.redS,   icon: 'remove_circle', bdr: T.redBdr      },
                { label: 'Modifications', value: modifications.length, color: T.amber,  bg: T.amberS, icon: 'edit_note',     bdr: T.amberBdr    },
              ].map(({ label, value, color, bg, icon, bdr }) => (
                <div key={label} style={{ background: bg, borderRadius: 16, padding: '20px 16px', border: `1.5px solid ${bdr}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>{label}</span>
                </div>
              ))}
              {badge && (
                <div style={{ background: badge.bg, borderRadius: 16, padding: '20px 16px', border: `1.5px solid ${badge.bdr}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: badge.color, fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: badge.color, textAlign: 'center', lineHeight: 1.3 }}>{badge.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Risk Change</span>
                </div>
              )}
            </div>

            {/* Doc names bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ background: T.amberS, borderRadius: 14, padding: '14px 18px', border: `1.5px solid ${T.amberBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#000' }}>A</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Original Version</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docA?.originalName || 'Document A'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.muted }}>compare_arrows</span>
              </div>
              <div style={{ background: T.indigoS, borderRadius: 14, padding: '14px 18px', border: `1.5px solid ${T.indigoBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>B</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Revised Version</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docB?.originalName || 'Document B'}</p>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {result.summary && (
              <div style={{ background: T.sur, borderRadius: 16, padding: '20px 24px', border: `1px solid ${T.bdr}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: T.indigoS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>AI Summary</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.7 }}>{result.summary}</p>
              </div>
            )}

            {/* Recommendation */}
            {result.recommendation && (
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: `1.5px solid ${T.indigoBdr}`, background: T.indigoS, padding: '20px 24px 20px 32px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 5, height: '100%', background: T.indigo, borderRadius: '8px 0 0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.indigo }}>AI Recommendation</p>
                    <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.7 }}>{result.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'All',           count: totalChanges,         icon: 'list',          activeColor: T.indigo },
                { label: 'Additions',     count: additions.length,     icon: 'add_circle',    activeColor: T.green  },
                { label: 'Removals',      count: removals.length,      icon: 'remove_circle', activeColor: T.red    },
                { label: 'Modifications', count: modifications.length, icon: 'edit_note',     activeColor: T.amber  },
              ].map(({ label, count, icon, activeColor }) => {
                const active = filter === label;
                return (
                  <button
                    key={label}
                    onClick={() => setFilter(label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10,
                      fontSize: 13, fontWeight: 600, border: `1.5px solid ${active ? activeColor : T.bdr}`,
                      background: active ? activeColor : T.sur, color: active ? '#fff' : T.muted,
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: active ? `0 4px 12px ${activeColor}30` : 'none',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    {label}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 6, minWidth: 20, textAlign: 'center',
                      background: active ? 'rgba(255,255,255,0.25)' : T.ele,
                      color: active ? '#fff' : T.muted,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Diff viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ADDITIONS */}
              {(filter === 'All' || filter === 'Additions') && additions.length > 0 && (
                <div>
                  {filter === 'All' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.green, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
                        Additions <span style={{ color: T.green, marginLeft: 4 }}>{additions.length}</span>
                      </h3>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {additions.map((text, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: T.greenS, border: `1px solid ${T.greenBdr}`, borderLeft: `4px solid ${T.green}`, borderRadius: '0 12px 12px 0', padding: '14px 18px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>add</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.green }}>ADDED</span>
                          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.ink, lineHeight: 1.65 }}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REMOVALS */}
              {(filter === 'All' || filter === 'Removals') && removals.length > 0 && (
                <div>
                  {filter === 'All' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4, marginTop: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.red, fontVariationSettings: "'FILL' 1" }}>remove_circle</span>
                      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
                        Removals <span style={{ color: T.red, marginLeft: 4 }}>{removals.length}</span>
                      </h3>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {removals.map((text, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: T.redS, border: `1px solid ${T.redBdr}`, borderLeft: `4px solid ${T.red}`, borderRadius: '0 12px 12px 0', padding: '14px 18px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>remove</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.red }}>REMOVED</span>
                          <p style={{ margin: '6px 0 0', fontSize: 13, color: `${T.ink}99`, lineHeight: 1.65, textDecoration: 'line-through', textDecorationColor: `${T.red}80` }}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODIFICATIONS */}
              {(filter === 'All' || filter === 'Modifications') && modifications.length > 0 && (
                <div>
                  {filter === 'All' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4, marginTop: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.amber, fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
                        Modifications <span style={{ color: T.amber, marginLeft: 4 }}>{modifications.length}</span>
                      </h3>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {modifications.map((mod, i) => {
                      const sm = severityMeta(mod.severity);
                      return (
                        <div key={i} style={{ background: T.sur, borderRadius: 16, border: `1px solid ${T.bdr}`, borderLeft: `4px solid ${T.amber}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                          {/* Mod header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.bdr}`, background: T.amberS }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <span style={{ width: 26, height: 26, borderRadius: '50%', background: T.amberS, border: `1.5px solid ${T.amberBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 900, color: T.amber }}>{i + 1}</span>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {mod.clauseName || `Change ${i + 1}`}
                              </h4>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, border: `1px solid ${sm.bdr}`, background: sm.bg, color: sm.color, flexShrink: 0, marginLeft: 12 }}>
                              {sm.label}
                            </span>
                          </div>

                          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {mod.before && (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ width: 18, height: 18, borderRadius: 4, background: T.redS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.red }}>A</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${T.red}bb` }}>Before (Version A)</span>
                                </div>
                                <div style={{ background: T.redS, border: `1px solid ${T.redBdr}`, borderLeft: `2px solid ${T.red}`, borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
                                  <p style={{ margin: 0, fontSize: 12, color: `${T.red}cc`, lineHeight: 1.65, fontFamily: 'monospace' }}>{mod.before}</p>
                                </div>
                              </div>
                            )}
                            {mod.after && (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ width: 18, height: 18, borderRadius: 4, background: T.indigoS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.indigo }}>B</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${T.indigo}bb` }}>After (Version B)</span>
                                </div>
                                <div style={{ background: T.indigoS, border: `1px solid ${T.indigoBdr}`, borderLeft: `2px solid ${T.indigo}`, borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
                                  <p style={{ margin: 0, fontSize: 12, color: T.indigo, lineHeight: 1.65, fontFamily: 'monospace' }}>{mod.after}</p>
                                </div>
                              </div>
                            )}
                            {mod.impact && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: T.amberS, border: `1px solid ${T.amberBdr}`, borderRadius: 10, padding: '10px 14px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.amber, flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>info</span>
                                <div>
                                  <span style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.amber, marginBottom: 4 }}>What this means for you</span>
                                  <p style={{ margin: 0, fontSize: 12, color: T.ink, lineHeight: 1.65 }}>{mod.impact}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty states */}
              {totalChanges === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.25, display: 'block', marginBottom: 12 }}>check_circle</span>
                  <p style={{ margin: 0, fontSize: 14 }}>No changes found between these documents.</p>
                </div>
              )}
              {totalChanges > 0 && filter !== 'All' && (
                (filter === 'Additions' && additions.length === 0) ||
                (filter === 'Removals' && removals.length === 0) ||
                (filter === 'Modifications' && modifications.length === 0)
              ) && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.25, display: 'block', marginBottom: 10 }}>
                    {filter === 'Additions' ? 'add_circle' : filter === 'Removals' ? 'remove_circle' : 'edit_note'}
                  </span>
                  <p style={{ margin: 0, fontSize: 13 }}>No {filter.toLowerCase()} in this comparison.</p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: `${T.muted}99`, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0 }}>warning</span>
              AI analysis based on the first ~3000 characters of each document. For very long contracts, changes in later sections may not be detected. Always verify with a qualified lawyer.
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!result && !comparing && !error && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 96, height: 96, borderRadius: 24, background: T.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.bdr}` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 52, color: T.muted, opacity: 0.25 }}>compare</span>
                </div>
                <div style={{ position: 'absolute', bottom: -6, right: -6, width: 32, height: 32, borderRadius: 10, background: T.indigoS, border: `1.5px solid ${T.indigoBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.indigo, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: `${T.ink}55` }}>No comparison yet</p>
                <p style={{ margin: 0, fontSize: 13, color: T.muted, maxWidth: 340 }}>
                  Select or upload Document A (original) and Document B (revised), then click Run AI Comparison
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center', marginTop: 8 }}>
                {[
                  { icon: 'add_circle',    color: T.green, label: 'Additions identified' },
                  { icon: 'remove_circle', color: T.red,   label: 'Removals flagged'     },
                  { icon: 'edit_note',     color: T.amber, label: 'Changes explained'     },
                ].map(({ icon, color, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 26, color, opacity: 0.4, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span style={{ fontSize: 11, color: `${T.muted}99` }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── History table ───────────────────────────────────────── */}
        {history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.muted }}>history</span>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Past Comparisons</h3>
              <span style={{ fontSize: 11, fontWeight: 700, background: T.ele, color: T.muted, padding: '2px 10px', borderRadius: 99, border: `1px solid ${T.bdr}` }}>{history.length}</span>
            </div>
            <div style={{ background: T.sur, borderRadius: 18, border: `1px solid ${T.bdr}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(99,102,241,0.05)' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.bdr}`, background: T.subtle }}>
                    {['Document A', 'Document B', 'Changes', 'Risk', 'Date', ''].map((h) => (
                      <th key={h} style={{ padding: '12px 18px', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, textAlign: h === 'Date' ? 'right' : h === '' ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((h, i) => {
                    const dA    = docs.find((d) => d._id === (h.docAId?._id || h.docAId));
                    const dB    = docs.find((d) => d._id === (h.docBId?._id || h.docBId));
                    const total = (h.additions?.length || 0) + (h.removals?.length || 0) + (h.modifications?.length || 0);
                    const hb    = riskChangeMeta(h.riskChange);
                    const date  = h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr key={h._id || i} style={{ borderBottom: i < history.slice(0, 10).length - 1 ? `1px solid ${T.bdr}` : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = T.subtle}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 22, height: 22, borderRadius: 6, background: T.amberS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.amber, flexShrink: 0 }}>A</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                              {(dA?.originalName || h.docAId?.originalName || 'Document A').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 22, height: 22, borderRadius: 6, background: T.indigoS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: T.indigo, flexShrink: 0 }}>B</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                              {(dB?.originalName || h.docBId?.originalName || 'Document B').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                            <span style={{ color: T.green }}>+{h.additions?.length || 0}</span>
                            <span style={{ color: `${T.muted}66` }}>·</span>
                            <span style={{ color: T.red }}>−{h.removals?.length || 0}</span>
                            <span style={{ color: `${T.muted}66` }}>·</span>
                            <span style={{ color: T.amber }}>~{h.modifications?.length || 0}</span>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted }}>{total} total</p>
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                          {hb
                            ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: `1px solid ${hb.bdr}`, background: hb.bg, color: hb.color }}>{hb.label}</span>
                            : <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 18px', textAlign: 'right', color: T.muted, fontSize: 12 }}>{date}</td>
                        <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                          <button
                            onClick={() => loadHistory(h)}
                            style={{ fontSize: 12, color: T.indigo, background: T.indigoS, border: `1px solid ${T.indigoBdr}`, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
                          >
                            View
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
        confirmLabel="Confirm &amp; Compare"
        preview={consentPreview}
        previewLoading={consentLoading}
        wordCount={consentMeta.wordCount}
        charCount={consentMeta.charCount}
        details={[
          'First ~3000 chars of Document A text sent to AI',
          'First ~3000 chars of Document B text sent to AI',
          'No personal account data included',
          'Results saved to your comparison history',
        ]}
      />
    </div>
  );
}
