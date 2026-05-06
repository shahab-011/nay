import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { compareDocuments, getComparisons } from '../api/comparisons.api';
import { getDocuments, getTextPreview, uploadTextOnly } from '../api/documents.api';
import ConsentPanel from '../components/ConsentPanel';

const FILTER_TABS = ['All', 'Additions', 'Removals', 'Modifications'];

const severityColor = (s) => {
  if (!s) return 'text-on-surface-variant';
  const l = s.toLowerCase();
  if (l === 'high' || l === 'critical') return 'text-error';
  if (l === 'medium') return 'text-amber-400';
  return 'text-primary';
};

const severityBg = (s) => {
  if (!s) return 'bg-surface-container-high';
  const l = s.toLowerCase();
  if (l === 'high' || l === 'critical') return 'bg-error/10 border border-error/20';
  if (l === 'medium') return 'bg-amber-500/10 border border-amber-500/20';
  return 'bg-primary/10 border border-primary/20';
};

const riskChangeBadge = (riskChange) => {
  if (!riskChange) return null;
  const rc = riskChange.toLowerCase();
  if (rc === 'improved') return { label: 'Risk Improved', cls: 'bg-primary/10 text-primary border-primary/30', icon: 'trending_up' };
  if (rc === 'worsened') return { label: 'Risk Worsened', cls: 'bg-error/10 text-error border-error/30', icon: 'trending_down' };
  return { label: 'Risk Neutral', cls: 'bg-white/5 text-on-surface-variant border-white/10', icon: 'trending_flat' };
};

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

/* ── DocSlot — reusable doc picker card for slot A or B ──────────── */
function DocSlot({ slot, docId, setDocId, docs, docsLoading, onDocAdded }) {
  const isA = slot === 'A';
  const accentText  = isA ? 'text-amber-400'   : 'text-primary';
  const accentBorder = isA ? 'border-amber-400/30' : 'border-primary/30';
  const accentBg    = isA ? 'bg-amber-400/10'  : 'bg-primary/10';
  const accentFill  = isA ? 'bg-amber-400'     : 'bg-primary';

  const [tab,       setTab]       = useState('select'); // 'select' | 'upload'
  const [search,    setSearch]    = useState('');
  const [file,      setFile]      = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef(null);

  const selectedDoc = docs.find((d) => d._id === docId);
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
    setFile(f);
    setErr('');
    setMsg('');
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setErr('');
    setMsg('Extracting text…');
    setProgress(10);
    try {
      let text = '';
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        text = await extractPdfInBrowser(file, setProgress);
      } else if (name.match(/\.docx?$/)) {
        text = await extractDocxInBrowser(file, setProgress);
      } else {
        text = await file.text();
        setProgress(80);
      }
      if (!text.trim()) throw new Error('No readable text found in this file.');
      setMsg('Saving document…');
      setProgress(90);
      const res = await uploadTextOnly(file.name, text);
      const saved = res.data.data.document;
      onDocAdded(saved);
      setDocId(saved._id);
      setProgress(100);
      setMsg('');
      setTimeout(() => {
        setTab('select');
        setFile(null);
        setProgress(0);
      }, 500);
    } catch (e) {
      setErr(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-2xl border ${accentBorder} bg-surface-container-low overflow-hidden`}>
      {/* Slot header */}
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${accentBorder} ${accentBg}`}>
        <div className={`w-7 h-7 rounded-lg ${accentFill} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs font-black text-on-primary">{slot}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {isA ? 'Base Document' : 'Compare Document'}
          </p>
          {selectedDoc && (
            <p className={`text-xs font-semibold truncate ${accentText}`}>
              {selectedDoc.originalName.replace(/\.[^.]+$/, '')}
            </p>
          )}
        </div>
        {selectedDoc && (
          <button
            onClick={() => setDocId('')}
            className="text-on-surface-variant hover:text-white transition-colors flex-shrink-0"
            title="Clear selection"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Mode toggle tabs */}
      <div className="flex border-b border-white/5">
        {['select', 'upload'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setErr(''); setFile(null); setProgress(0); setMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
              tab === t
                ? `${accentText} border-b-2 ${isA ? 'border-amber-400' : 'border-primary'} bg-white/[0.03]`
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {t === 'select' ? 'folder_open' : 'upload_file'}
            </span>
            {t === 'select' ? 'My Documents' : 'Upload New'}
          </button>
        ))}
      </div>

      {/* ── Select existing ── */}
      {tab === 'select' && (
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full bg-surface-container border border-white/5 focus:border-primary/50 text-on-surface text-sm pl-9 pr-3 py-2 rounded-xl outline-none placeholder:text-on-surface-variant/50 transition-colors"
            />
          </div>

          {/* Doc list */}
          <div className="space-y-1 max-h-44 overflow-y-auto no-scrollbar">
            {docsLoading ? (
              <div className="flex items-center justify-center py-8 text-on-surface-variant text-xs gap-2">
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Loading…
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-xs">
                {search ? 'No matching documents.' : 'No documents uploaded yet.'}
              </div>
            ) : (
              filteredDocs.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setDocId(d._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    docId === d._id
                      ? `${accentBg} ${accentBorder} border`
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base flex-shrink-0 ${docId === d._id ? accentText : 'text-on-surface-variant'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    description
                  </span>
                  <span className={`text-xs font-medium truncate flex-1 ${docId === d._id ? 'text-white' : 'text-on-surface'}`}>
                    {d.originalName.replace(/\.[^.]+$/, '')}
                  </span>
                  {docId === d._id && (
                    <span className={`material-symbols-outlined text-sm flex-shrink-0 ${accentText}`}>check_circle</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Upload new ── */}
      {tab === 'upload' && (
        <div className="p-4 space-y-3">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 py-7 ${
              dragging
                ? `${isA ? 'border-amber-400' : 'border-primary'} bg-white/[0.04]`
                : file
                ? `${isA ? 'border-amber-400/50' : 'border-primary/50'} bg-white/[0.02]`
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => pickFile(e.target.files[0])}
            />
            {file ? (
              <>
                <span className={`material-symbols-outlined text-3xl ${accentText}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  draft
                </span>
                <p className="text-xs font-semibold text-white text-center max-w-[180px] truncate px-2">{file.name}</p>
                <p className="text-[10px] text-on-surface-variant">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); setMsg(''); setErr(''); }}
                  className="absolute top-2 right-2 text-on-surface-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>
                  cloud_upload
                </span>
                <p className="text-xs text-on-surface-variant text-center leading-relaxed">
                  Drag & drop or <span className={`font-semibold ${accentText}`}>browse</span>
                </p>
                <p className="text-[10px] text-on-surface-variant/50">PDF · DOCX · TXT</p>
              </>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isA ? 'bg-amber-400' : 'bg-primary'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant text-center">{msg || 'Processing…'}</p>
            </div>
          )}

          {err && (
            <p className="text-[10px] text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 text-center">{err}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              file && !uploading
                ? `${isA ? 'bg-amber-400 text-black' : 'bg-primary text-on-primary'} hover:opacity-90 active:scale-[0.98]`
                : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Uploading…</>
            ) : (
              <><span className="material-symbols-outlined text-sm">upload</span>Upload &amp; Use</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
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
  const [historyLoading, setHistoryLoading] = useState(true);

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
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleDocAdded = (savedDoc) => {
    setDocs((prev) => {
      if (prev.find((d) => d._id === savedDoc._id)) return prev;
      return [savedDoc, ...prev];
    });
  };

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

  const additions     = result?.additions     || [];
  const removals      = result?.removals      || [];
  const modifications = result?.modifications || [];

  const allItems = [
    ...additions.map((a, i)    => ({ ...a, _kind: 'addition',     _key: `add-${i}` })),
    ...removals.map((r, i)     => ({ ...r, _kind: 'removal',      _key: `rem-${i}` })),
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

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Hero selector panel ─────────────────────────────────── */}
        <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              compare_arrows
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">Document Comparison</h2>
              <p className="text-[11px] text-on-surface-variant">Select or upload two documents to compare side-by-side</p>
            </div>
          </div>

          <div className="p-6">
            {/* Two slots + VS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              <DocSlot
                slot="A"
                docId={docAId}
                setDocId={(id) => { setDocAId(id); setResult(null); setError(''); }}
                docs={docs}
                docsLoading={docsLoading}
                onDocAdded={handleDocAdded}
              />

              {/* VS divider */}
              <div className="flex flex-col items-center justify-center gap-2 pt-8 lg:pt-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-black text-on-surface-variant tracking-widest">VS</span>
                </div>
                <div className="hidden lg:block w-px h-16 bg-white/5" />
              </div>

              <DocSlot
                slot="B"
                docId={docBId}
                setDocId={(id) => { setDocBId(id); setResult(null); setError(''); }}
                docs={docs}
                docsLoading={docsLoading}
                onDocAdded={handleDocAdded}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                {error}
              </div>
            )}

            {/* Run button */}
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`mt-5 w-full h-14 font-headline font-extrabold text-base rounded-xl flex items-center justify-center gap-3 transition-all ${
                canCompare
                  ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.005] active:scale-[0.995]'
                  : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
              }`}
            >
              {comparing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  Analyzing documents with AI…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    compare_arrows
                  </span>
                  {canCompare ? 'Run AI Comparison' : 'Select two documents to compare'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Comparing skeleton ──────────────────────────────────── */}
        {comparing && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-on-surface-variant">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  compare_arrows
                </span>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-ping opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Comparing documents…</p>
              <p className="text-xs mt-1">AI is analyzing clauses, risks, and changes</p>
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────── */}
        {result && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Changes', value: allItems.length,      color: 'text-white',     bg: 'bg-surface-container',  icon: 'change_circle'   },
                { label: 'Additions',     value: additions.length,     color: 'text-primary',   bg: 'bg-primary/10',         icon: 'add_circle'      },
                { label: 'Removals',      value: removals.length,      color: 'text-error',     bg: 'bg-error/10',           icon: 'remove_circle'   },
                { label: 'Modifications', value: modifications.length, color: 'text-amber-400', bg: 'bg-amber-500/10',       icon: 'edit_note'       },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className={`${bg} rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center gap-2`}>
                  <span className={`material-symbols-outlined text-2xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <span className={`text-3xl font-headline font-extrabold ${color}`}>{value}</span>
                  <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>

            {/* Doc name bar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="bg-surface-container-low rounded-xl px-5 py-3.5 border border-amber-400/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-black">A</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">Base Document</p>
                  <p className="text-sm font-semibold text-white truncate">{docA?.originalName || '—'}</p>
                </div>
              </div>
              <div className="flex justify-center items-center">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">compare_arrows</span>
              </div>
              <div className="bg-surface-container-low rounded-xl px-5 py-3.5 border border-primary/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-on-primary">B</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">Compare Document</p>
                  <p className="text-sm font-semibold text-white truncate">{docB?.originalName || '—'}</p>
                </div>
              </div>
            </div>

            {/* AI Summary + Risk Change */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {result.summary && (
                <div className="lg:col-span-2 bg-surface-container-low rounded-2xl px-6 py-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider">AI Summary</p>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">{result.summary}</p>
                </div>
              )}

              {(() => {
                const badge = riskChangeBadge(result.riskChange);
                if (!badge) return null;
                return (
                  <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-5 border ${badge.cls}`}>
                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                    <div className="text-center">
                      <p className="text-[10px] font-label uppercase tracking-wider opacity-60 mb-1">Risk Change</p>
                      <p className="font-headline font-extrabold text-lg">{badge.label}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div className="flex items-start gap-4 bg-primary/5 border border-primary/20 rounded-2xl px-6 py-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                </div>
                <div>
                  <p className="text-[10px] font-label text-primary uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-sm text-on-surface leading-relaxed">{result.recommendation}</p>
                </div>
              </div>
            )}

            {/* Filter tabs + counts */}
            <div className="flex gap-2 flex-wrap items-center">
              {FILTER_TABS.map((tab) => {
                const count = tab === 'All' ? allItems.length
                  : tab === 'Additions' ? additions.length
                  : tab === 'Removals' ? removals.length
                  : modifications.length;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === tab
                        ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                        : 'bg-surface-container text-on-surface-variant hover:text-white border border-white/5'
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      filter === tab ? 'bg-white/20 text-white' : 'bg-white/5'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Diff viewer */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">check_circle</span>
                <p>No {filter.toLowerCase()} found between these documents.</p>
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

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!result && !comparing && (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30">compare</span>
              </div>
              <div>
                <p className="text-lg font-headline font-bold text-white/30 mb-1">No comparison yet</p>
                <p className="text-sm text-on-surface-variant">Select or upload two documents above, then click Run AI Comparison</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Recent Comparisons ──────────────────────────────────── */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-base" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              <h3 className="text-sm font-label uppercase tracking-wider text-on-surface-variant">Recent Comparisons</h3>
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
                  {history.slice(0, 8).map((h, i) => {
                    const dA = docs.find((d) => d._id === (h.docAId?._id || h.docAId));
                    const dB = docs.find((d) => d._id === (h.docBId?._id || h.docBId));
                    const total = (h.additions?.length || 0) + (h.removals?.length || 0) + (h.modifications?.length || 0);
                    const badge = riskChangeBadge(h.riskChange);
                    const dateStr = h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr key={h._id || i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-black text-amber-400">A</span>
                            </div>
                            <span className="text-white font-medium truncate max-w-[160px] text-xs" title={dA?.originalName}>
                              {(dA?.originalName || 'Doc A').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-black text-primary">B</span>
                            </div>
                            <span className="text-white font-medium truncate max-w-[160px] text-xs" title={dB?.originalName}>
                              {(dB?.originalName || 'Doc B').replace(/\.[^.]+$/, '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-label font-bold">
                            <span className="text-primary">+{h.additions?.length || 0}</span>
                            <span className="text-on-surface-variant">·</span>
                            <span className="text-error">−{h.removals?.length || 0}</span>
                            <span className="text-on-surface-variant">·</span>
                            <span className="text-amber-400">~{h.modifications?.length || 0}</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{total} total</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {badge ? (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-on-surface-variant text-xs">{dateStr}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => {
                              setResult(h);
                              setDocAId(h.docAId?._id || h.docAId);
                              setDocBId(h.docBId?._id || h.docBId);
                              setFilter('All');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs text-primary hover:text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary transition-all font-semibold opacity-0 group-hover:opacity-100"
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

  const kindConfig = {
    addition:    { badge: '+ Added',    badgeCls: 'bg-primary/10 text-primary',      leftBorder: '' },
    removal:     { badge: '− Removed',  badgeCls: 'bg-error/10 text-error',          leftBorder: '' },
    modification:{ badge: '~ Modified', badgeCls: 'bg-amber-500/10 text-amber-400',  leftBorder: 'border-l-[3px] border-amber-400/40' },
  };
  const { badge, badgeCls, leftBorder } = kindConfig[_kind] || kindConfig.addition;

  const title    = item.clauseName || item.clause || item.title || `Change ${index + 1}`;
  const before   = item.before   || item.original || '';
  const after    = item.after    || item.updated  || item.text || item.description || '';
  const severity = item.severity || '';
  const impact   = item.impact   || '';

  return (
    <div className={`p-6 hover:bg-white/[0.015] transition-colors ${leftBorder}`}>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-label font-bold text-on-surface-variant w-5 flex-shrink-0">{index + 1}.</span>
          <h4 className="font-semibold text-sm text-on-surface">{title}</h4>
          {severity && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${severityBg(severity)} ${severityColor(severity)}`}>
              {severity}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${badgeCls}`}>
          {badge}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {(_kind === 'removal' || (_kind === 'modification' && before)) && (
          <div className="flex gap-3 items-start">
            <span className="text-error font-bold text-base flex-shrink-0 mt-0.5 w-4 text-center leading-none">−</span>
            <div className="flex-1 bg-error/8 border border-error/20 text-error/80 px-4 py-3 rounded-xl text-xs leading-relaxed">
              <p className={_kind === 'removal' ? 'line-through opacity-60' : ''}>{before || after}</p>
            </div>
          </div>
        )}

        {(_kind === 'addition' || (_kind === 'modification' && after)) && (
          <div className="flex gap-3 items-start">
            <span className="text-primary font-bold text-base flex-shrink-0 mt-0.5 w-4 text-center leading-none">+</span>
            <div className="flex-1 bg-primary/8 border border-primary/20 text-primary/90 px-4 py-3 rounded-xl text-xs leading-relaxed">
              <p>{after || before}</p>
            </div>
          </div>
        )}
      </div>

      {impact && (
        <div className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant bg-amber-500/5 border-l-2 border-amber-400/30 px-3 py-2 rounded-r-lg">
          <span className="material-symbols-outlined text-amber-400 text-sm flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <span><span className="font-semibold text-on-surface">Impact: </span>{impact}</span>
        </div>
      )}
    </div>
  );
}
