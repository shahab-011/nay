import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { askAI, getChatHistory, clearChatHistory, analyzeDocument } from '../api/analysis.api';
import { getDocuments, getDocument, getTextPreview, uploadTextOnly } from '../api/documents.api';
import { useAuth } from '../context/AuthContext';
import ConsentPanel from '../components/ConsentPanel';

/* ── browser PDF/DOCX extraction ──────────────────────────────────── */
async function extractPdfInBrowser(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
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
  bg:     '#f8f9fe',
  sur:    '#ffffff',
  bdr:    '#e5e7f5',
  indigo: '#6366f1',
  ink:    '#1e1b4b',
  muted:  '#6b7099',
  subtle: '#f0f2ff',
  ele:    '#eaecf8',
};

const SUGGESTIONS = [
  { icon: 'handshake',  text: 'What are my obligations?' },
  { icon: 'fact_check', text: 'Is this clause standard?' },
  { icon: 'search',     text: 'What clauses are missing?' },
  { icon: 'translate',  text: 'Explain in simple language.' },
  { icon: 'warning',    text: 'Is this risky?' },
];

const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Just now';

/* ── markdown-lite renderer ────────────────────────────────────────── */
function parseBold(str) {
  return str.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : p
  );
}

function MessageContent({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const output = [];
  let listBuf = [];
  let k = 0;

  const flushList = () => {
    if (!listBuf.length) return;
    output.push(
      <ul key={k++} style={{ margin: '6px 0', paddingLeft: 0, listStyle: 'none' }}>
        {listBuf.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.indigo, flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 14, lineHeight: 1.65, color: T.ink }}>{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      if (i > 0 && i < lines.length - 1) output.push(<div key={k++} style={{ height: 6 }} />);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      listBuf.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      output.push(
        <div key={k++} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.indigo, flexShrink: 0, minWidth: 18 }}>{line.match(/^\d+/)[0]}.</span>
          <span style={{ fontSize: 14, lineHeight: 1.65, color: T.ink }}>{parseBold(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else if (line.startsWith('⚠')) {
      flushList();
      output.push(
        <p key={k++} style={{ fontSize: 11, color: T.muted, fontStyle: 'italic', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.bdr}` }}>{line}</p>
      );
    } else {
      flushList();
      output.push(<p key={k++} style={{ fontSize: 14, lineHeight: 1.65, color: T.ink, margin: '2px 0' }}>{parseBold(line)}</p>);
    }
  });
  flushList();
  return <div>{output}</div>;
}

/* ── component ─────────────────────────────────────────────────────── */
export default function AskAI() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const paramDocId = searchParams.get('docId');

  const [docs,        setDocs]        = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docId,       setDocId]       = useState(paramDocId || '');
  const [pickerTab,   setPickerTab]   = useState('existing');
  const [docSearch,   setDocSearch]   = useState('');

  const [uploadFile,     setUploadFile]     = useState(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg,      setUploadMsg]      = useState('');
  const [uploadError,    setUploadError]    = useState('');
  const uploadInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error,    setError]    = useState('');

  const [consentOpen,     setConsentOpen]     = useState(false);
  const [consentPreview,  setConsentPreview]  = useState(null);
  const [consentLoading,  setConsentLoading]  = useState(false);
  const [consentMeta,     setConsentMeta]     = useState({ wordCount: 0, charCount: 0 });
  const [pendingQuestion, setPendingQuestion] = useState('');
  const consentedDocs = useRef(new Set(JSON.parse(sessionStorage.getItem('nyaya_consented_docs') || '[]')));

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    getDocuments().then((r) => setDocs(r.data.data.documents || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!docId) { setSelectedDoc(null); setMessages([]); return; }
    loadDocAndHistory(docId);
  }, [docId]);

  const loadDocAndHistory = async (id) => {
    setLoading(true); setError('');
    try {
      const [docRes, histRes] = await Promise.all([getDocument(id), getChatHistory(id)]);
      setSelectedDoc(docRes.data.data.document);
      setMessages(histRes.data.data.messages || []);
    } catch { setError('Failed to load document or chat history.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [question]);

  const openConsentForQuestion = useCallback(async (q) => {
    setPendingQuestion(q); setConsentOpen(true); setConsentLoading(true);
    try {
      const res = await getTextPreview(docId);
      setConsentPreview(res.data.data.preview);
      setConsentMeta({ wordCount: res.data.data.wordCount, charCount: res.data.data.charCount });
    } catch { setConsentPreview(null); }
    finally { setConsentLoading(false); }
  }, [docId]);

  const handleConsentConfirm = () => {
    consentedDocs.current.add(docId);
    sessionStorage.setItem('nyaya_consented_docs', JSON.stringify([...consentedDocs.current]));
    setConsentOpen(false);
    sendQuestion(pendingQuestion);
  };

  const sendQuestion = useCallback(async (q) => {
    setSending(true); setError('');
    const userMsg = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await askAI(docId, q);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.data.answer, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get a response. Please try again.');
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setQuestion(q);
    } finally { setSending(false); }
  }, [docId]);

  const handleSend = useCallback(async () => {
    if (!question.trim() || !docId || sending) return;
    const q = question.trim(); setQuestion('');
    if (!consentedDocs.current.has(docId)) { await openConsentForQuestion(q); }
    else { sendQuestion(q); }
  }, [question, docId, sending, openConsentForQuestion, sendQuestion]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(); } };

  const handleClear = async () => {
    if (!docId || !window.confirm('Clear all chat history for this document?')) return;
    setClearing(true);
    try { await clearChatHistory(docId); setMessages([]); }
    catch { setError('Failed to clear history.'); }
    finally { setClearing(false); }
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) { setUploadError('Only PDF, DOC, and DOCX files are supported.'); return; }
    setUploadFile(file); setUploadError(''); setUploadProgress(5); setUploadMsg('Extracting text from document…');
    try {
      let text = ext === 'pdf' ? await extractPdfInBrowser(file, setUploadProgress) : await extractDocxInBrowser(file, setUploadProgress);
      setUploadProgress(85); setUploadMsg('Uploading to NyayaAI…');
      const upRes = await uploadTextOnly(file.name, text, 'Other', 'Not detected', true);
      const newDocId = upRes.data.data.document._id;
      setUploadProgress(90); setUploadMsg('Running AI analysis…');
      await analyzeDocument(newDocId);
      setUploadProgress(100); setUploadMsg('Done! Starting chat…');
      const docsRes = await getDocuments();
      setDocs(docsRes.data.data.documents || []);
      setDocId(newDocId);
      navigate(`/ask?docId=${newDocId}`, { replace: true });
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadProgress(0); setUploadMsg(''); setUploadFile(null);
    }
  };

  const copyMsg = (text) => navigator.clipboard.writeText(text).catch(() => {});

  /* ── render ─────────────────────────────────────────────────────── */
  const canSend = question.trim() && docId && !sending;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header style={{ background: T.sur, borderBottom: `1px solid ${T.bdr}`, height: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 12px rgba(99,102,241,0.07)' }}>
        <button onClick={() => navigate('/studio')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.subtle, color: T.muted, cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff', fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: T.ink, lineHeight: 1 }}>Ask AI</p>
            <p style={{ fontSize: 11, color: T.muted, lineHeight: 1, marginTop: 2 }}>Legal Document Assistant</p>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: T.indigo, pointerEvents: 'none' }}>description</span>
            <select value={docId} onChange={(e) => { setDocId(e.target.value); navigate(`/ask?docId=${e.target.value}`, { replace: true }); }}
              style={{ appearance: 'none', paddingLeft: 30, paddingRight: 26, paddingTop: 7, paddingBottom: 7, background: T.subtle, border: `1px solid ${T.ele}`, borderRadius: 20, color: T.ink, fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer', maxWidth: 200 }}>
              <option value="">— Select a document —</option>
              {docs.map((d) => <option key={d._id} value={d._id}>{d.originalName}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.muted, pointerEvents: 'none' }}>expand_more</span>
          </div>

          {messages.length > 0 && (
            <button onClick={handleClear} disabled={clearing} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.bdr}`, background: T.sur, color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span>
              <span className="hidden md:inline">{clearing ? 'Clearing…' : 'Clear Chat'}</span>
            </button>
          )}

          {docId && (
            <Link to={`/analysis/${docId}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.bdr}`, background: T.sur, color: T.muted, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>analytics</span>
              <span className="hidden md:inline">View Analysis</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

        {/* ── NO DOC: Document Picker ───────────────────────────── */}
        {!docId && (
          <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
            <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 24px' }}>

              {/* Hero */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: 'center', marginBottom: 40 }}>
                <motion.div
                  animate={{ boxShadow: ['0 0 0 0px rgba(99,102,241,0.2)', '0 0 0 16px rgba(99,102,241,0.06)', '0 0 0 0px rgba(99,102,241,0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 40px rgba(99,102,241,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#fff', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </motion.div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: T.ink, marginBottom: 10, letterSpacing: '-0.5px' }}>Ask AI About a Document</h1>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
                  Choose a document from your library or upload a new one to get instant, plain-English answers about any clause, risk, or obligation.
                </p>
              </motion.div>

              {/* Tab toggle */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                style={{ display: 'flex', gap: 4, background: T.ele, borderRadius: 14, padding: 4, maxWidth: 300, margin: '0 auto 32px' }}>
                {[{ key: 'existing', icon: 'folder_open', label: 'My Documents' }, { key: 'upload', icon: 'upload_file', label: 'Upload New' }].map(({ key, icon, label }) => (
                  <motion.button key={key}
                    onClick={() => { setPickerTab(key); setUploadError(''); setUploadFile(null); setUploadProgress(0); setUploadMsg(''); }}
                    whileHover={{ scale: pickerTab !== key ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 10, border: 'none', background: pickerTab === key ? T.sur : 'transparent', color: pickerTab === key ? T.indigo : T.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: pickerTab === key ? '0 2px 10px rgba(99,102,241,0.12)' : 'none', transition: 'all 0.18s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                    {label}
                  </motion.button>
                ))}
              </motion.div>

              {/* ── Existing docs ── */}
              {pickerTab === 'existing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: T.muted, pointerEvents: 'none' }}>search</span>
                    <input value={docSearch} onChange={(e) => setDocSearch(e.target.value)} placeholder="Search by name or type…"
                      style={{ width: '100%', background: T.sur, border: `1px solid ${T.bdr}`, borderRadius: 12, paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: 13, color: T.ink, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = T.indigo}
                      onBlur={(e) => e.target.style.borderColor = T.bdr} />
                  </div>

                  {docs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.ele, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: T.muted }}>folder_open</span>
                      </div>
                      <p style={{ fontWeight: 700, color: T.ink, marginBottom: 6 }}>No documents yet</p>
                      <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Upload your first document to get started.</p>
                      <button onClick={() => setPickerTab('upload')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                        Upload a Document
                      </button>
                    </div>
                  ) : (
                    <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: 16 }}
                      variants={{ show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show">
                      {docs.filter((d) => !docSearch || d.originalName.toLowerCase().includes(docSearch.toLowerCase()) || d.docType?.toLowerCase().includes(docSearch.toLowerCase())).map((doc) => {
                        const score = doc.healthScore || 0;
                        const hc = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
                        const analyzed = doc.status === 'analyzed';
                        return (
                          <motion.button key={doc._id}
                            variants={{ hidden: { opacity: 0, y: 16, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } } }}
                            whileHover={{ y: -4, boxShadow: `0 12px 32px rgba(99,102,241,0.15), 0 0 0 2px rgba(99,102,241,0.2)` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setDocId(doc._id); navigate(`/ask?docId=${doc._id}`, { replace: true }); }}
                            style={{ textAlign: 'left', background: T.sur, border: `1px solid ${T.bdr}`, borderRadius: 16, padding: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.subtle, border: `1px solid ${T.ele}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.indigo }}>description</span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: 13, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }} title={doc.originalName}>
                                  {doc.originalName.replace(/\.[^.]+$/, '')}
                                </p>
                                <p style={{ fontSize: 11, color: T.muted }}>
                                  {doc.docType && doc.docType !== 'Other' ? doc.docType : doc.fileType?.toUpperCase() || 'Document'}
                                </p>
                              </div>
                            </div>

                            {analyzed ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <div style={{ flex: 1, height: 4, background: T.ele, borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${score}%`, background: hc, borderRadius: 4, transition: 'width 0.6s' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: hc, minWidth: 22 }}>{score}</span>
                              </div>
                            ) : (
                              <div style={{ height: 26, marginBottom: 14, display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: T.muted, fontStyle: 'italic' }}>Not yet analyzed</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: analyzed ? 'rgba(99,102,241,0.08)' : T.ele, color: analyzed ? T.indigo : T.muted, border: `1px solid ${analyzed ? 'rgba(99,102,241,0.2)' : T.bdr}` }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: analyzed ? T.indigo : T.muted, display: 'inline-block' }} />
                                {analyzed ? 'Ready to chat' : 'Upload only'}
                              </span>
                              <span style={{ fontSize: 10, color: T.muted }}>
                                {new Date(doc.uploadedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Upload tab ── */}
              {pickerTab === 'upload' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                  style={{ maxWidth: 500, margin: '0 auto' }}>
                  {uploadProgress > 0 ? (
                    <div style={{ background: T.sur, borderRadius: 20, padding: 40, border: `1px solid ${T.bdr}`, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.subtle, border: `2px solid ${T.indigo}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        {uploadProgress === 100
                          ? <span className="material-symbols-outlined" style={{ fontSize: 28, color: T.indigo }}>check_circle</span>
                          : <span className="material-symbols-outlined animate-spin" style={{ fontSize: 28, color: T.indigo }}>progress_activity</span>}
                      </div>
                      <p style={{ fontWeight: 600, color: T.ink, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadFile?.name}</p>
                      <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>{uploadMsg}</p>
                      <div style={{ width: '100%', height: 6, background: T.ele, borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg,#6366f1,#22d3ee)', borderRadius: 6, transition: 'width 0.4s' }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <div onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }} onDragLeave={() => setUploadDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setUploadDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUploadFile(f); }}
                        onClick={() => uploadInputRef.current?.click()}
                        style={{ border: `2px dashed ${uploadDragging ? T.indigo : T.bdr}`, borderRadius: 20, padding: '52px 32px', textAlign: 'center', cursor: 'pointer', background: uploadDragging ? T.subtle : T.sur, transition: 'all 0.2s', boxShadow: uploadDragging ? `0 0 0 4px rgba(99,102,241,0.1)` : '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <input ref={uploadInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleUploadFile(e.target.files[0]); }} />
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: uploadDragging ? T.indigo : T.muted, marginBottom: 12, display: 'block' }}>cloud_upload</span>
                        <p style={{ fontWeight: 700, color: T.ink, fontSize: 16, marginBottom: 6 }}>Drop your document here</p>
                        <p style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>or click to browse files</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          {['PDF', 'DOC', 'DOCX'].map((ext) => (
                            <span key={ext} style={{ fontSize: 11, background: T.ele, padding: '4px 12px', borderRadius: 20, color: T.muted, fontWeight: 700 }}>{ext}</span>
                          ))}
                        </div>
                        {uploadError && <p style={{ marginTop: 16, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>{uploadError}
                        </p>}
                      </div>
                      <p style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lock</span>
                        Text extracted in your browser — raw file never uploaded
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────── */}
        {docId && loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 24, color: '#fff' }}>progress_activity</span>
            </div>
            <p style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Loading chat history…</p>
          </div>
        )}

        {/* ── Chat view ─────────────────────────────────────────── */}
        {docId && !loading && (
          <>
            {/* Doc info bar */}
            {selectedDoc && (
              <div style={{ background: T.sur, borderBottom: `1px solid ${T.bdr}`, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: T.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: T.indigo }}>description</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedDoc.originalName?.replace(/\.[^.]+$/, '')}
                </span>
                {selectedDoc.docType && selectedDoc.docType !== 'Other' && (
                  <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.08)', color: T.indigo, padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(99,102,241,0.18)', flexShrink: 0 }}>
                    {selectedDoc.docType}
                  </span>
                )}
                <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 0', background: T.bg }} className="no-scrollbar">
              <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                <AnimatePresence>
                {messages.length === 0 && !sending && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <motion.div animate={{ boxShadow: ['0 0 0 0px rgba(99,102,241,0.2)', '0 0 0 8px rgba(99,102,241,0.07)', '0 0 0 0px rgba(99,102,241,0.2)'] }} transition={{ duration: 2.5, repeat: Infinity }}
                      style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 19, color: '#fff', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </motion.div>
                    <div style={{ background: T.sur, border: `1px solid ${T.bdr}`, borderRadius: '4px 16px 16px 16px', padding: '14px 18px', maxWidth: '88%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.65 }}>
                        Hello! I've loaded <strong style={{ color: T.indigo }}>{selectedDoc?.originalName?.replace(/\.[^.]+$/, '')}</strong>.
                        Ask me anything — clause meanings, risks, obligations, payment terms. I'll answer in plain English.
                      </p>
                      <p style={{ fontSize: 11, color: T.muted, marginTop: 8, fontStyle: 'italic' }}>⚠ AI-generated — verify with a qualified lawyer before taking action.</p>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                    {msg.role === 'assistant' && (
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 19, color: '#fff', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '82%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'user' ? (
                        <div style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '16px 4px 16px 16px', padding: '12px 18px', boxShadow: '0 4px 20px rgba(99,102,241,0.28)' }}>
                          <p style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        </div>
                      ) : (
                        <div style={{ background: T.sur, border: `1px solid ${T.bdr}`, borderRadius: '4px 16px 16px 16px', padding: '14px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                          <MessageContent text={msg.content} />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 10, color: T.muted }}>{msg.role === 'user' ? 'You' : 'Nyaya AI'} · {fmtTime(msg.timestamp)}</span>
                        {msg.role === 'assistant' && (
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                            onClick={() => copyMsg(msg.content)} title="Copy"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>content_copy</span>
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: T.subtle, border: `1px solid ${T.ele}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start', color: T.indigo, fontWeight: 800, fontSize: 14 }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>

                <AnimatePresence>
                {sending && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 19, color: '#fff', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div style={{ background: T.sur, border: `1px solid ${T.bdr}`, borderRadius: '4px 16px 16px 16px', padding: '14px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {[0, 1, 2].map((j) => (
                          <motion.span key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: T.indigo, display: 'block', opacity: 0.4 }}
                            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: j * 0.18, ease: 'easeInOut' }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 12, fontSize: 13 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>{error}
                  </motion.div>
                )}
                </AnimatePresence>

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── Input area ─────────────────────────────────────── */}
            <div style={{ background: T.sur, borderTop: `1px solid ${T.bdr}`, padding: '14px 24px 18px', flexShrink: 0, boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ maxWidth: 740, margin: '0 auto' }}>

                <AnimatePresence>
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }} className="no-scrollbar">
                    {SUGGESTIONS.map(({ icon, text }, idx) => (
                      <motion.button key={text}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setQuestion(text)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.bdr}`, background: T.subtle, color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: T.indigo }}>{icon}</span>
                        {text}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
                </AnimatePresence>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: T.subtle, border: `1.5px solid ${T.ele}`, borderRadius: 16, padding: '10px 10px 10px 16px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocusCapture={(e) => { e.currentTarget.style.borderColor = T.indigo; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlurCapture={(e) => { e.currentTarget.style.borderColor = T.ele; e.currentTarget.style.boxShadow = 'none'; }}>
                  <textarea ref={textareaRef} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown} disabled={sending} rows={1}
                    placeholder="Ask anything about your document…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: T.ink, lineHeight: 1.6, overflow: 'hidden', paddingTop: 2 }} />
                  <motion.button whileHover={{ scale: canSend ? 1.08 : 1 }} whileTap={{ scale: canSend ? 0.9 : 1 }}
                    onClick={handleSend} disabled={!canSend}
                    style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, background: canSend ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : T.ele, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canSend ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: canSend ? '0 4px 12px rgba(99,102,241,0.3)' : 'none' }}>
                    {sending
                      ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: T.muted }}>progress_activity</span>
                      : <span className="material-symbols-outlined" style={{ fontSize: 18, color: canSend ? '#fff' : T.muted }}>send</span>}
                  </motion.button>
                </div>

                <p style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: T.muted }}>
                  Ctrl+Enter to send · Always verify AI responses with a qualified lawyer
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <ConsentPanel isOpen={consentOpen} onConfirm={handleConsentConfirm} onCancel={() => { setConsentOpen(false); setQuestion(pendingQuestion); }}
        title="Send Message to AI" confirmLabel="Confirm & Send" preview={consentPreview} previewLoading={consentLoading}
        wordCount={consentMeta.wordCount} charCount={consentMeta.charCount}
        details={['Your question (shown above)', 'Relevant document text chunks', 'Last 6 messages for context', 'No personal or account data included']} />
    </div>
  );
}
