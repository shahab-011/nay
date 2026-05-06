import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
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

/* ── helpers ──────────────────────────────────────────────────────── */
const riskChangeMeta = (rc) => {
  if (!rc) return null;
  const v = rc.toLowerCase();
  if (v === 'improved')  return { label: 'Risk Improved',  icon: 'trending_up',   cls: 'text-primary border-primary/30 bg-primary/10'   };
  if (v === 'worsened')  return { label: 'Risk Worsened',  icon: 'trending_down', cls: 'text-error border-error/30 bg-error/10'         };
  return                        { label: 'Risk Neutral',   icon: 'trending_flat', cls: 'text-on-surface-variant border-white/10 bg-white/5' };
};

const severityMeta = (s) => {
  const v = (s || 'low').toLowerCase();
  if (v === 'high')   return { label: 'High Risk',   cls: 'bg-error/10 text-error border-error/30'        };
  if (v === 'medium') return { label: 'Medium Risk', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  return                     { label: 'Low Risk',    cls: 'bg-primary/10 text-primary border-primary/30'  };
};

/* ── DocSlot ─────────────────────────────────────────────────────── */
function DocSlot({ slot, docId, setDocId, docs, docsLoading, onDocAdded }) {
  const isA = slot === 'A';
  const accentText   = isA ? 'text-amber-400'    : 'text-primary';
  const accentBorder = isA ? 'border-amber-400/30' : 'border-primary/30';
  const accentBg     = isA ? 'bg-amber-400/10'   : 'bg-primary/10';
  const accentFill   = isA ? 'bg-amber-400'      : 'bg-primary';
  const accentBar    = isA ? 'border-amber-400'  : 'border-primary';

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
    d.originalName.toLowerCase().includes(search.toLowerCase())
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
    <div className={`rounded-2xl border ${accentBorder} bg-surface-container-low overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${accentBorder} ${accentBg}`}>
        <div className={`w-8 h-8 rounded-xl ${accentFill} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs font-black text-on-primary">{slot}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {isA ? 'Base Document (Original)' : 'Compare Document (Revised)'}
          </p>
          {selectedDoc && (
            <p className={`text-xs font-semibold truncate ${accentText}`}>
              {selectedDoc.originalName.replace(/\.[^.]+$/, '')}
            </p>
          )}
        </div>
        {selectedDoc && (
          <button onClick={() => setDocId('')} className="text-on-surface-variant hover:text-white transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-white/5">
        {[['select','folder_open','My Documents'], ['upload','upload_file','Upload New']].map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setErr(''); setFile(null); setProgress(0); setMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
              tab === t
                ? `${accentText} border-b-2 ${accentBar} bg-white/[0.03]`
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Select tab */}
      {tab === 'select' && (
        <div className="p-4 space-y-3 flex-1">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full bg-surface-container border border-white/5 focus:border-primary/50 text-on-surface text-xs pl-9 pr-3 py-2 rounded-xl outline-none placeholder:text-on-surface-variant/50 transition-colors"
            />
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
            {docsLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Loading…
              </div>
            ) : filteredDocs.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant text-xs">
                {search ? 'No matching documents.' : 'No documents uploaded yet.'}
              </p>
            ) : (
              filteredDocs.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setDocId(d._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    docId === d._id
                      ? `${accentBg} border ${accentBorder}`
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base flex-shrink-0 ${docId === d._id ? accentText : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  <span className={`text-xs font-medium truncate flex-1 ${docId === d._id ? 'text-white' : 'text-on-surface'}`}>
                    {d.originalName.replace(/\.[^.]+$/, '')}
                  </span>
                  {docId === d._id && <span className={`material-symbols-outlined text-sm flex-shrink-0 ${accentText}`}>check_circle</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="p-4 space-y-3 flex-1">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 py-8 ${
              dragging ? `${isA ? 'border-amber-400' : 'border-primary'} bg-white/[0.04]`
              : file   ? `${isA ? 'border-amber-400/50' : 'border-primary/50'} bg-white/[0.02]`
              :          'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => pickFile(e.target.files[0])} />
            {file ? (
              <>
                <span className={`material-symbols-outlined text-3xl ${accentText}`} style={{ fontVariationSettings: "'FILL' 1" }}>draft</span>
                <p className="text-xs font-semibold text-white text-center max-w-[180px] truncate px-2">{file.name}</p>
                <p className="text-[10px] text-on-surface-variant">{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); setMsg(''); setErr(''); }} className="absolute top-2 right-2 text-on-surface-variant hover:text-white">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">cloud_upload</span>
                <p className="text-xs text-on-surface-variant text-center">
                  Drag &amp; drop or <span className={`font-semibold ${accentText}`}>browse</span>
                </p>
                <p className="text-[10px] text-on-surface-variant/50">PDF · DOCX · TXT</p>
              </>
            )}
          </div>

          {uploading && (
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${isA ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-on-surface-variant text-center">{msg || 'Processing…'}</p>
            </div>
          )}

          {err && <p className="text-[10px] text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-center">{err}</p>}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              file && !uploading
                ? `${isA ? 'bg-amber-400 text-black' : 'bg-primary text-on-primary'} hover:opacity-90 active:scale-[0.98]`
                : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
            }`}
          >
            {uploading
              ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Uploading…</>
              : <><span className="material-symbols-outlined text-sm">upload</span>Upload &amp; Use</>
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
      setResult(res.data.data.comparison);
      setHistory((prev) => [res.data.data.comparison, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed. Please try again.');
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

  const docA = docs.find((d) => d._id === (result?.docAId?._id || result?.docAId || docAId));
  const docB = docs.find((d) => d._id === (result?.docBId?._id || result?.docBId || docBId));
  const canCompare = docAId && docBId && docAId !== docBId && !comparing;
  const badge = riskChangeMeta(result?.riskChange);

  return (
    <>
      <Header title="Compare Documents" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        {/* ── Selector panel ─────────────────────────────────────── */}
        <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
            <div>
              <h2 className="text-sm font-semibold text-white">Document Comparison</h2>
              <p className="text-[11px] text-on-surface-variant">Select or upload two versions to compare — AI finds every change</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_64px_1fr] gap-4 items-start">
              <DocSlot slot="A" docId={docAId} setDocId={(id) => { setDocAId(id); setResult(null); setError(''); }} docs={docs} docsLoading={docsLoading} onDocAdded={handleDocAdded} />
              <div className="flex flex-col items-center justify-center gap-2 pt-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-black text-on-surface-variant tracking-widest">VS</span>
                </div>
              </div>
              <DocSlot slot="B" docId={docBId} setDocId={(id) => { setDocBId(id); setResult(null); setError(''); }} docs={docs} docsLoading={docsLoading} onDocAdded={handleDocAdded} />
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-base flex-shrink-0">error</span>{error}
              </div>
            )}

            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`mt-5 w-full h-14 font-bold text-sm rounded-xl flex items-center justify-center gap-3 transition-all ${
                canCompare
                  ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.005] active:scale-[0.995]'
                  : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
              }`}
            >
              {comparing ? (
                <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>AI is analyzing both documents…</>
              ) : (
                <><span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
                  {canCompare ? 'Run AI Comparison' : 'Select two documents to compare'}</>
              )}
            </button>
          </div>
        </div>

        {/* ── Analyzing state ────────────────────────────────────── */}
        {comparing && (
          <div className="flex flex-col items-center gap-5 py-20">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>compare_arrows</span>
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary animate-ping opacity-40" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-semibold">Comparing documents…</p>
              <p className="text-sm text-on-surface-variant">AI is reading every clause in both versions</p>
            </div>
            <div className="flex items-center gap-6 text-xs text-on-surface-variant">
              {['Reading Document A', 'Finding differences', 'Assessing risk impact'].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────── */}
        {result && !comparing && (
          <div className="space-y-6">

            {/* ── 1. Stats + Risk Change row ─────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Changes', value: totalChanges,       color: 'text-white',     bg: 'bg-surface-container',  icon: 'change_circle'  },
                { label: 'Additions',     value: additions.length,   color: 'text-primary',   bg: 'bg-primary/10',         icon: 'add_circle'     },
                { label: 'Removals',      value: removals.length,    color: 'text-error',     bg: 'bg-error/10',           icon: 'remove_circle'  },
                { label: 'Modifications', value: modifications.length, color: 'text-amber-400', bg: 'bg-amber-500/10',     icon: 'edit_note'      },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className={`${bg} rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center gap-2`}>
                  <span className={`material-symbols-outlined text-2xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <span className={`text-3xl font-headline font-extrabold ${color}`}>{value}</span>
                  <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">{label}</span>
                </div>
              ))}
              {/* Risk change card */}
              {badge && (
                <div className={`rounded-2xl p-5 border flex flex-col items-center justify-center gap-2 ${badge.cls}`}>
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                  <span className="text-sm font-bold text-center leading-tight">{badge.label}</span>
                  <span className="text-[10px] font-label uppercase tracking-wider opacity-60">Risk Change</span>
                </div>
              )}
            </div>

            {/* ── 2. Document names bar ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_40px_1fr] gap-3 items-center">
              <div className="bg-surface-container-low rounded-xl px-5 py-4 border border-amber-400/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-black">A</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">Original Version</p>
                  <p className="text-sm font-semibold text-white truncate">{docA?.originalName || 'Document A'}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">compare_arrows</span>
              </div>
              <div className="bg-surface-container-low rounded-xl px-5 py-4 border border-primary/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-on-primary">B</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">Revised Version</p>
                  <p className="text-sm font-semibold text-white truncate">{docB?.originalName || 'Document B'}</p>
                </div>
              </div>
            </div>

            {/* ── 3. AI Summary ──────────────────────────────────── */}
            {result.summary && (
              <div className="bg-surface-container-low rounded-2xl px-6 py-5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <span className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant">AI Summary</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* ── 4. Recommendation ──────────────────────────────── */}
            {result.recommendation && (
              <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 to-primary/3 px-6 py-5">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl" />
                <div className="flex items-start gap-4 pl-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-label text-primary uppercase tracking-wider mb-2">AI Recommendation</p>
                    <p className="text-sm text-on-surface leading-relaxed">{result.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. Filter tabs ─────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { label: 'All',           count: totalChanges,         icon: 'list'          },
                { label: 'Additions',     count: additions.length,     icon: 'add_circle'    },
                { label: 'Removals',      count: removals.length,      icon: 'remove_circle' },
                { label: 'Modifications', count: modifications.length, icon: 'edit_note'     },
              ].map(({ label, count, icon }) => (
                <button
                  key={label}
                  onClick={() => setFilter(label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === label
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                      : 'bg-surface-container text-on-surface-variant hover:text-white border border-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  {label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center ${
                    filter === label ? 'bg-white/20 text-white' : 'bg-white/5'
                  }`}>{count}</span>
                </button>
              ))}
            </div>

            {/* ── 6. Diff viewer ─────────────────────────────────── */}
            <div className="space-y-4">

              {/* ADDITIONS */}
              {(filter === 'All' || filter === 'Additions') && additions.length > 0 && (
                <div className="space-y-2">
                  {filter === 'All' && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                      <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">
                        Additions <span className="text-primary ml-1">{additions.length}</span>
                      </h3>
                    </div>
                  )}
                  {additions.map((text, i) => (
                    <div key={i} className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 border-l-4 border-l-primary">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-on-primary text-sm">add</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary mr-2">ADDED</span>
                        <p className="text-sm text-on-surface leading-relaxed mt-1">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* REMOVALS */}
              {(filter === 'All' || filter === 'Removals') && removals.length > 0 && (
                <div className="space-y-2">
                  {filter === 'All' && (
                    <div className="flex items-center gap-2 px-1 mt-2">
                      <span className="material-symbols-outlined text-error text-base" style={{ fontVariationSettings: "'FILL' 1" }}>remove_circle</span>
                      <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">
                        Removals <span className="text-error ml-1">{removals.length}</span>
                      </h3>
                    </div>
                  )}
                  {removals.map((text, i) => (
                    <div key={i} className="flex items-start gap-3 bg-error/5 border border-error/15 rounded-xl px-5 py-4 border-l-4 border-l-error">
                      <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-white text-sm">remove</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-error mr-2">REMOVED</span>
                        <p className="text-sm text-on-surface/70 leading-relaxed mt-1 line-through decoration-error/40">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MODIFICATIONS */}
              {(filter === 'All' || filter === 'Modifications') && modifications.length > 0 && (
                <div className="space-y-3">
                  {filter === 'All' && (
                    <div className="flex items-center gap-2 px-1 mt-2">
                      <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                      <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant">
                        Modifications <span className="text-amber-400 ml-1">{modifications.length}</span>
                      </h3>
                    </div>
                  )}
                  {modifications.map((mod, i) => {
                    const sm = severityMeta(mod.severity);
                    return (
                      <div key={i} className="bg-surface-container-low rounded-2xl border border-white/5 border-l-4 border-l-amber-400/60 overflow-hidden">
                        {/* Mod header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-amber-500/[0.04]">
                          <div className="flex items-center gap-3 flex-wrap min-w-0">
                            <span className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-black text-amber-400">{i + 1}</span>
                            </span>
                            <h4 className="font-semibold text-sm text-white truncate">
                              {mod.clauseName || `Change ${i + 1}`}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ml-3 ${sm.cls}`}>
                            {sm.label}
                          </span>
                        </div>

                        <div className="p-5 space-y-3">
                          {/* Before */}
                          {mod.before && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-error/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-error text-xs font-bold">A</span>
                                </span>
                                <span className="text-[10px] font-label font-bold uppercase tracking-wider text-error/70">Before (Version A)</span>
                              </div>
                              <div className="bg-error/8 border border-error/20 rounded-xl px-4 py-3 border-l-2 border-l-error/50">
                                <p className="text-xs text-error/80 leading-relaxed font-mono">{mod.before}</p>
                              </div>
                            </div>
                          )}

                          {/* After */}
                          {mod.after && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary text-xs font-bold">B</span>
                                </span>
                                <span className="text-[10px] font-label font-bold uppercase tracking-wider text-primary/70">After (Version B)</span>
                              </div>
                              <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 border-l-2 border-l-primary/50">
                                <p className="text-xs text-primary/90 leading-relaxed font-mono">{mod.after}</p>
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          {mod.impact && (
                            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                              <span className="material-symbols-outlined text-amber-400 text-base flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">What this means for you</span>
                                <p className="text-xs text-on-surface leading-relaxed">{mod.impact}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state for filter */}
              {totalChanges === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">check_circle</span>
                  <p>No changes found between these documents.</p>
                </div>
              )}
              {totalChanges > 0 && filter !== 'All' && (
                (filter === 'Additions' && additions.length === 0) ||
                (filter === 'Removals' && removals.length === 0) ||
                (filter === 'Modifications' && modifications.length === 0)
              ) && (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">
                    {filter === 'Additions' ? 'add_circle' : filter === 'Removals' ? 'remove_circle' : 'edit_note'}
                  </span>
                  <p className="text-sm">No {filter.toLowerCase()} in this comparison.</p>
                </div>
              )}
            </div>

            {/* ── Disclaimer ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant/50 border-t border-white/5 pt-4">
              <span className="material-symbols-outlined text-sm flex-shrink-0">warning</span>
              AI analysis based on the first ~3000 characters of each document. For very long contracts, changes in later sections may not be detected. Always verify with a qualified lawyer.
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!result && !comparing && (
          <div className="text-center py-24">
            <div className="inline-flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20">compare</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-headline font-bold text-white/30">No comparison yet</p>
                <p className="text-sm text-on-surface-variant max-w-sm">
                  Select or upload Document A (original) and Document B (revised), then click Run AI Comparison
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs text-on-surface-variant mt-2">
                {[
                  { icon: 'add_circle',    color: 'text-primary',   label: 'Additions identified' },
                  { icon: 'remove_circle', color: 'text-error',     label: 'Removals flagged' },
                  { icon: 'edit_note',     color: 'text-amber-400', label: 'Changes explained' },
                ].map(({ icon, color, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <span className={`material-symbols-outlined text-2xl ${color} opacity-40`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="opacity-50">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── History table ───────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-base">history</span>
              <h3 className="text-sm font-label uppercase tracking-wider text-on-surface-variant">Past Comparisons</h3>
              <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full border border-white/5">{history.length}</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant">
                    <th className="text-left px-5 py-3.5 font-normal">Document A</th>
                    <th className="text-left px-5 py-3.5 font-normal">Document B</th>
                    <th className="text-center px-4 py-3.5 font-normal">Changes</th>
                    <th className="text-center px-4 py-3.5 font-normal">Risk</th>
                    <th className="text-right px-5 py-3.5 font-normal">Date</th>
                    <th className="text-center px-4 py-3.5 font-normal"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.slice(0, 10).map((h, i) => {
                    const dA    = docs.find((d) => d._id === (h.docAId?._id || h.docAId));
                    const dB    = docs.find((d) => d._id === (h.docBId?._id || h.docBId));
                    const total = (h.additions?.length || 0) + (h.removals?.length || 0) + (h.modifications?.length || 0);
                    const hb    = riskChangeMeta(h.riskChange);
                    const date  = h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr key={h._id || i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-amber-400/10 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-amber-400">A</span>
                            <span className="text-white font-medium truncate max-w-[140px] text-xs" title={dA?.originalName}>
                              {(dA?.originalName || h.docAId?.originalName || 'Document A').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-primary">B</span>
                            <span className="text-white font-medium truncate max-w-[140px] text-xs" title={dB?.originalName}>
                              {(dB?.originalName || h.docBId?.originalName || 'Document B').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                            <span className="text-primary">+{h.additions?.length || 0}</span>
                            <span className="text-on-surface-variant opacity-40">·</span>
                            <span className="text-error">−{h.removals?.length || 0}</span>
                            <span className="text-on-surface-variant opacity-40">·</span>
                            <span className="text-amber-400">~{h.modifications?.length || 0}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{total} total</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hb ? (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${hb.cls}`}>{hb.label}</span>
                          ) : <span className="text-on-surface-variant text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right text-on-surface-variant text-xs">{date}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => loadHistory(h)}
                            className="text-xs text-primary hover:text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary transition-all font-semibold opacity-0 group-hover:opacity-100"
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
    </>
  );
}
