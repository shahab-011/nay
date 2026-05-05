import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { askAI, getChatHistory, clearChatHistory, analyzeDocument } from '../api/analysis.api';
import { getDocuments, getDocument, getTextPreview, uploadTextOnly } from '../api/documents.api';
import { useAuth } from '../context/AuthContext';
import ConsentPanel from '../components/ConsentPanel';

/* ── browser PDF extraction (same as UploadDocument) ──────────────── */
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
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
    onProgress(Math.round((i / pdf.numPages) * 80));
  }
  return text.trim();
}

async function extractDocxInBrowser(file, onProgress) {
  const mammoth     = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result      = await mammoth.extractRawText({ arrayBuffer });
  onProgress(80);
  return result.value.trim();
}

const SUGGESTIONS = [
  { icon: 'handshake',    text: 'What are my obligations?' },
  { icon: 'fact_check',   text: 'Is this clause standard?' },
  { icon: 'search',       text: 'What clauses are missing?' },
  { icon: 'translate',    text: 'Explain in simple language.' },
  { icon: 'warning',      text: 'Is this risky?' },
];

const fmtTime = (ts) =>
  ts
    ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

/* ── component ────────────────────────────────────────────────────── */
export default function AskAI() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const paramDocId      = searchParams.get('docId');

  /* doc selection */
  const [docs,        setDocs]        = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docId,       setDocId]       = useState(paramDocId || '');
  const [pickerTab,   setPickerTab]   = useState('existing'); // 'existing' | 'upload'
  const [docSearch,   setDocSearch]   = useState('');

  /* inline upload state */
  const [uploadFile,     setUploadFile]     = useState(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg,      setUploadMsg]      = useState('');
  const [uploadError,    setUploadError]    = useState('');
  const uploadInputRef = useRef(null);

  /* chat */
  const [messages,  setMessages]  = useState([]);
  const [question,  setQuestion]  = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [error,     setError]     = useState('');

  /* consent — shown once per session per document */
  const [consentOpen,    setConsentOpen]    = useState(false);
  const [consentPreview, setConsentPreview] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMeta,    setConsentMeta]    = useState({ wordCount: 0, charCount: 0 });
  const [pendingQuestion, setPendingQuestion] = useState('');
  const consentedDocs = useRef(new Set(JSON.parse(sessionStorage.getItem('nyaya_consented_docs') || '[]')));

  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  /* ── fetch document list ──────────────────────────────────────── */
  useEffect(() => {
    getDocuments()
      .then((res) => setDocs(res.data.data.documents || []))
      .catch(() => {});
  }, []);

  /* ── load doc + history when docId changes ────────────────────── */
  useEffect(() => {
    if (!docId) { setSelectedDoc(null); setMessages([]); return; }
    loadDocAndHistory(docId);
  }, [docId]);

  const loadDocAndHistory = async (id) => {
    setLoading(true);
    setError('');
    try {
      const [docRes, histRes] = await Promise.all([
        getDocument(id),
        getChatHistory(id),
      ]);
      setSelectedDoc(docRes.data.data.document);
      setMessages(histRes.data.data.messages || []);
    } catch {
      setError('Failed to load document or chat history.');
    } finally {
      setLoading(false);
    }
  };

  /* ── auto-scroll on new messages ──────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  /* ── auto-resize textarea ─────────────────────────────────────── */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [question]);

  /* ── consent helpers ─────────────────────────────────────────── */
  const openConsentForQuestion = useCallback(async (q) => {
    setPendingQuestion(q);
    setConsentOpen(true);
    setConsentLoading(true);
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
    // remember consent for this doc for the rest of the session
    consentedDocs.current.add(docId);
    sessionStorage.setItem('nyaya_consented_docs', JSON.stringify([...consentedDocs.current]));
    setConsentOpen(false);
    sendQuestion(pendingQuestion);
  };

  /* ── send ─────────────────────────────────────────────────────── */
  const sendQuestion = useCallback(async (q) => {
    setSending(true);
    setError('');
    const userMsg = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await askAI(docId, q);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.data.answer, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get a response. Please try again.');
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setQuestion(q);
    } finally {
      setSending(false);
    }
  }, [docId]);

  const handleSend = useCallback(async () => {
    if (!question.trim() || !docId || sending) return;
    const q = question.trim();
    setQuestion('');

    // Show consent panel on first message per doc per session
    if (!consentedDocs.current.has(docId)) {
      await openConsentForQuestion(q);
    } else {
      sendQuestion(q);
    }
  }, [question, docId, sending, openConsentForQuestion, sendQuestion]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── clear history ────────────────────────────────────────────── */
  const handleClear = async () => {
    if (!docId || !window.confirm('Clear all chat history for this document?')) return;
    setClearing(true);
    try {
      await clearChatHistory(docId);
      setMessages([]);
    } catch {
      setError('Failed to clear history.');
    } finally {
      setClearing(false);
    }
  };

  /* ── inline upload ────────────────────────────────────────────── */
  const handleUploadFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setUploadError('Only PDF, DOC, and DOCX files are supported.');
      return;
    }
    setUploadFile(file);
    setUploadError('');
    setUploadProgress(5);
    setUploadMsg('Extracting text from document…');
    try {
      let text = '';
      if (ext === 'pdf') {
        text = await extractPdfInBrowser(file, setUploadProgress);
      } else {
        text = await extractDocxInBrowser(file, setUploadProgress);
      }
      setUploadProgress(85);
      setUploadMsg('Uploading to NyayaAI…');
      const upRes = await uploadTextOnly(file.name, text, 'Other', 'Not detected', true);
      const newDocId = upRes.data.data.document._id;
      setUploadProgress(90);
      setUploadMsg('Running AI analysis…');
      await analyzeDocument(newDocId);
      setUploadProgress(100);
      setUploadMsg('Done! Starting chat…');
      // refresh docs list then open chat
      const docsRes = await getDocuments();
      setDocs(docsRes.data.data.documents || []);
      setDocId(newDocId);
      navigate(`/ask?docId=${newDocId}`, { replace: true });
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
      setUploadMsg('');
      setUploadFile(null);
    }
  };

  /* ── copy message ─────────────────────────────────────────────── */
  const copyMsg = (text) => navigator.clipboard.writeText(text).catch(() => {});

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <>
      <Header title="Ask AI">
        <div className="flex items-center gap-3">
          {/* Doc selector chip */}
          <div className="relative">
            <select
              value={docId}
              onChange={(e) => {
                setDocId(e.target.value);
                navigate(`/ask?docId=${e.target.value}`, { replace: true });
              }}
              className="appearance-none pl-8 pr-8 py-1.5 bg-surface-container-low rounded-full border border-outline-variant/20 text-sm text-on-surface font-label outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="">— Select a document —</option>
              {docs.map((d) => (
                <option key={d._id} value={d._id}>{d.originalName}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-primary text-[16px] pointer-events-none">description</span>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[14px] pointer-events-none">expand_more</span>
          </div>

          {/* Clear history */}
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/20 text-xs font-bold text-on-surface-variant hover:text-error hover:border-error/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              {clearing ? 'Clearing…' : 'Clear Chat'}
            </button>
          )}

          {/* View analysis link */}
          {docId && (
            <Link
              to={`/analysis/${docId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/20 text-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              Analysis
            </Link>
          )}
        </div>
      </Header>

      <div className="flex flex-col h-[calc(100vh-64px)] bg-surface">

        {/* ── Document Picker ────────────────────────────────────── */}
        {!docId && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="px-8 py-10 max-w-5xl mx-auto w-full">

              {/* Heading */}
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(68,229,194,0.15)]">
                  <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <h2 className="text-3xl font-headline font-extrabold text-white mb-2 tracking-tight">Ask AI About a Document</h2>
                <p className="text-on-surface-variant text-sm max-w-md">
                  Choose an existing document or upload a new one — get instant AI answers in plain English.
                </p>
              </div>

              {/* Tab toggle */}
              <div className="flex items-center gap-1 bg-surface-container rounded-2xl p-1.5 mb-8 max-w-xs mx-auto border border-white/5 shadow-inner">
                {[
                  { key: 'existing', icon: 'folder_open', label: 'My Documents' },
                  { key: 'upload',   icon: 'upload_file', label: 'Upload New'   },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => { setPickerTab(key); setUploadError(''); setUploadFile(null); setUploadProgress(0); setUploadMsg(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      pickerTab === key
                        ? 'bg-primary text-on-primary shadow-[0_2px_12px_rgba(68,229,194,0.3)]'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Tab: existing documents ── */}
              {pickerTab === 'existing' && (
                <>
                  {/* Search */}
                  <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Search by name or type…"
                      className="w-full bg-surface-container border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/40 transition-colors placeholder:text-on-surface-variant/40"
                    />
                  </div>

                  {docs.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">folder_open</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface mb-1">No documents yet</p>
                        <p className="text-sm text-on-surface-variant">Upload your first document to get started.</p>
                      </div>
                      <button
                        onClick={() => setPickerTab('upload')}
                        className="mt-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Upload a Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs
                        .filter((d) =>
                          !docSearch ||
                          d.originalName.toLowerCase().includes(docSearch.toLowerCase()) ||
                          d.docType?.toLowerCase().includes(docSearch.toLowerCase())
                        )
                        .map((doc) => {
                          const score = doc.healthScore || 0;
                          const health =
                            score >= 80 ? { color: 'text-primary',   bar: 'bg-primary',   glow: 'shadow-primary/20'   }
                            : score >= 50 ? { color: 'text-amber-400', bar: 'bg-amber-400', glow: 'shadow-amber-400/20' }
                            :               { color: 'text-error',     bar: 'bg-error',     glow: 'shadow-error/20'     };
                          const analyzed = doc.status === 'analyzed';
                          return (
                            <button
                              key={doc._id}
                              onClick={() => {
                                setDocId(doc._id);
                                navigate(`/ask?docId=${doc._id}`, { replace: true });
                              }}
                              className="text-left bg-surface-container-low hover:bg-surface-container border border-white/5 hover:border-primary/25 rounded-2xl p-5 transition-all duration-200 group hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                            >
                              {/* Icon + name */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                  <span className="material-symbols-outlined text-primary text-xl">description</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate leading-tight" title={doc.originalName}>
                                    {doc.originalName.replace(/\.[^.]+$/, '')}
                                  </p>
                                  <p className="text-[11px] text-on-surface-variant/70 mt-0.5 font-label">
                                    {doc.docType && doc.docType !== 'Other' ? doc.docType : doc.fileType?.toUpperCase() || 'Document'}
                                  </p>
                                </div>
                              </div>

                              {/* Health bar */}
                              {analyzed ? (
                                <div className="flex items-center gap-2.5 mb-4">
                                  <div className="flex-1 h-1.5 bg-outline-variant/15 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${health.bar} transition-all`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                  <span className={`text-[11px] font-extrabold font-label tabular-nums ${health.color}`}>{score}</span>
                                </div>
                              ) : (
                                <div className="h-[26px] mb-4 flex items-center">
                                  <span className="text-[11px] text-on-surface-variant/50 font-label italic">Not yet analyzed</span>
                                </div>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full font-label ${
                                  analyzed
                                    ? 'bg-primary/10 text-primary border border-primary/15'
                                    : 'bg-outline-variant/10 text-on-surface-variant border border-white/5'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${analyzed ? 'bg-primary' : 'bg-on-surface-variant/40'}`} />
                                  {analyzed ? 'Ready to chat' : 'Upload only'}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/50 font-label">
                                  {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab: upload new ── */}
              {pickerTab === 'upload' && (
                <div className="max-w-md mx-auto">
                  {uploadProgress > 0 ? (
                    <div className="bg-surface-container-low rounded-2xl p-10 border border-white/5 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                        {uploadProgress === 100
                          ? <span className="material-symbols-outlined text-3xl text-primary">check_circle</span>
                          : <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                        }
                      </div>
                      <p className="font-semibold text-on-surface mb-1 truncate">{uploadFile?.name}</p>
                      <p className="text-sm text-on-surface-variant mb-6">{uploadMsg}</p>
                      <div className="w-full bg-outline-variant/15 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-primary font-bold">{uploadProgress}%</p>
                      {uploadError && <p className="mt-4 text-sm text-error">{uploadError}</p>}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                      onDragLeave={() => setUploadDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setUploadDragging(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleUploadFile(f);
                      }}
                      onClick={() => uploadInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200 ${
                        uploadDragging
                          ? 'border-primary bg-primary/10 scale-[1.01]'
                          : 'border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <input
                        ref={uploadInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => { if (e.target.files[0]) handleUploadFile(e.target.files[0]); }}
                      />
                      <span className="material-symbols-outlined text-6xl text-primary/40 mb-5 block">upload_file</span>
                      <p className="font-bold text-on-surface text-lg mb-1">Drop your document here</p>
                      <p className="text-sm text-on-surface-variant mb-5">or click to browse files</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {['PDF', 'DOC', 'DOCX'].map((ext) => (
                          <span key={ext} className="text-[11px] bg-surface-container px-3 py-1 rounded-full text-on-surface-variant border border-white/5 font-label font-bold">
                            {ext}
                          </span>
                        ))}
                      </div>
                      {uploadError && (
                        <p className="mt-5 text-sm text-error flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-base">error</span>
                          {uploadError}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/40 font-label">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Text extracted in your browser — raw file never leaves your device
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {docId && loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="text-on-surface-variant">Loading chat history…</p>
          </div>
        )}

        {/* ── Chat view ─────────────────────────────────────────── */}
        {docId && !loading && (
          <>
            {/* Document info bar */}
            {selectedDoc && (
              <div className="px-8 py-2 border-b border-white/5 bg-surface-container/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">description</span>
                <span className="text-sm font-label text-on-surface-variant truncate">
                  {selectedDoc.originalName}
                </span>
                {selectedDoc.docType && (
                  <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full font-label text-on-surface-variant border border-white/5">
                    {selectedDoc.docType}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-on-surface-variant font-label uppercase tracking-wider">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 max-w-4xl mx-auto w-full">

              {/* Welcome message */}
              {messages.length === 0 && !sending && (
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg">
                    <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-2xl rounded-tl-none border border-outline-variant/5 shadow-sm max-w-[85%]">
                    <p className="text-on-surface leading-relaxed font-body">
                      Hello! I've loaded{' '}
                      <span className="text-primary font-semibold">{selectedDoc?.originalName}</span>.
                      Ask me anything about this document — I'll answer in plain English and always tell you where the information comes from.
                    </p>
                    <p className="text-xs text-on-surface-variant mt-3 italic">
                      ⚠ AI-generated — verify with a qualified lawyer
                    </p>
                  </div>
                </div>
              )}

              {/* Message history */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-5 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {/* AI avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg">
                      <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                  )}

                  <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-primary px-6 py-4 rounded-2xl rounded-tr-none shadow-[0_4px_20px_rgba(68,229,194,0.2)]">
                        <p className="text-on-primary font-medium font-body whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="bg-surface-container-low p-6 rounded-2xl rounded-tl-none border border-outline-variant/5 shadow-sm">
                        <p className="text-on-surface leading-relaxed font-body whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}

                    <div className={`flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] font-label text-on-surface-variant/50 uppercase tracking-widest">
                        {msg.role === 'user' ? 'You' : 'Nyaya AI'} · {fmtTime(msg.timestamp)}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyMsg(msg.content)}
                          className="text-[10px] font-label text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          Copy
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/20 text-primary font-bold text-sm flex-shrink-0">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg">
                    <span className="material-symbols-outlined text-on-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <div className="bg-surface-container-low px-6 py-5 rounded-2xl rounded-tl-none border border-outline-variant/5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-error/10 border border-error/20 text-error px-5 py-3 rounded-xl text-sm max-w-2xl mx-auto">
                  <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input area ──────────────────────────────────────── */}
            <div className="bg-[#000b2f]/60 backdrop-blur-2xl border-t border-white/5 px-8 py-6">
              <div className="max-w-4xl mx-auto w-full">

                {/* Quick suggestion chips */}
                {messages.length === 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                    {SUGGESTIONS.map(({ icon, text }) => (
                      <button
                        key={text}
                        onClick={() => setQuestion(text)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-xs font-medium text-on-surface-variant transition-all whitespace-nowrap shrink-0"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">{icon}</span>
                        {text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea + send */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                  <div className="relative bg-surface-container-low border border-outline-variant/20 rounded-2xl p-2 flex flex-col focus-within:border-primary/40 transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending || !docId}
                      rows={1}
                      placeholder={docId ? 'Ask anything about your document… (Ctrl+Enter to send)' : 'Select a document first'}
                      className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 px-4 pt-4 pb-2 resize-none font-body outline-none overflow-hidden disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center px-4 py-2 border-t border-white/5">
                      <p className="text-[10px] text-on-surface-variant/40 font-label">
                        Ctrl+Enter to send
                      </p>
                      <button
                        onClick={handleSend}
                        disabled={!question.trim() || !docId || sending}
                        className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-xl font-bold font-headline flex items-center gap-2 hover:shadow-[0_0_20px_rgba(68,229,194,0.3)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                      >
                        {sending ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        )}
                        {sending ? 'Thinking…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-[10px] font-label text-on-surface-variant/40 uppercase tracking-widest">
                  ⚠ AI-generated responses — always verify with a qualified lawyer
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <ConsentPanel
        isOpen={consentOpen}
        onConfirm={handleConsentConfirm}
        onCancel={() => { setConsentOpen(false); setQuestion(pendingQuestion); }}
        title="Send Message to AI"
        confirmLabel="Confirm & Send"
        preview={consentPreview}
        previewLoading={consentLoading}
        wordCount={consentMeta.wordCount}
        charCount={consentMeta.charCount}
        details={[
          'Your question (shown above)',
          'Relevant document text chunks',
          'Last 6 messages for context',
          'No personal or account data included',
        ]}
      />
    </>
  );
}
