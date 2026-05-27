import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument, uploadTextOnly } from '../api/documents.api';
import { usePrivacy } from '../context/PrivacyContext';
import { I } from '../components/Icons';

/* ── Design tokens ──────────────────────────────────────────────── */
const BG     = '#07091f';
const SUR    = 'rgba(255,255,255,0.04)';
const ELE    = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(255,255,255,0.08)';
const T      = '#f0f0ff';
const TM     = 'rgba(240,240,255,0.5)';
const INDIGO = '#6366f1';
const CYAN   = '#22d3ee';
const ERR    = '#f43f5e';

const DOC_TYPES = [
  'Contract', 'NDA', 'MoU', 'Rent Agreement',
  'Offer Letter', 'Will', 'Property Deed', 'Other',
];

const JURISDICTIONS = [
  'Not detected', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'European Union', 'India', 'Singapore', 'UAE', 'Germany', 'France',
  'South Africa', 'Kenya', 'Nigeria', 'Other',
];

const ACCEPT     = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const TEXT_EXTS  = ['pdf', 'doc', 'docx'];

function getExt(filename) { return filename.split('.').pop().toLowerCase(); }

/* ── browser-side extraction ──────────────────────────────────────── */
async function extractPdfInBrowser(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url,
    ).href;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
    onProgress(Math.round((i / pdf.numPages) * 85));
  }
  return text.trim();
}

async function extractDocxInBrowser(file, onProgress) {
  const mammoth     = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result      = await mammoth.extractRawText({ arrayBuffer });
  onProgress(85);
  return result.value.trim();
}

/* ── Select style (shared) ──────────────────────────────────────── */
const SELECT_STYLE = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: ELE, border: `1px solid ${BORDER}`,
  color: T, fontSize: 13, outline: 'none', cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
};

/* ── component ─────────────────────────────────────────────────────── */
export default function UploadDocument() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const { isPrivate, togglePrivacy } = usePrivacy();

  const [tab,          setTab]          = useState('file');
  const [file,         setFile]         = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [pastedText,   setPastedText]   = useState('');
  const [textFileName, setTextFileName] = useState('');
  const [docType,      setDocType]      = useState('Other');
  const [jurisdiction, setJurisdiction] = useState('Not detected');
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const fileExt            = file ? getExt(file.name) : '';
  const isImageFile        = IMAGE_EXTS.includes(fileExt);
  const isTextableFile     = TEXT_EXTS.includes(fileExt);
  const willExtractLocally = isPrivate && tab === 'file' && isTextableFile;

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileUpload = async () => {
    if (!file) return setError('Please select a file first.');
    setError(''); setLoading(true); setProgress(0);
    try {
      if (willExtractLocally) {
        setProgressMsg('Reading file locally…'); setProgress(5);
        let extractedText = '';
        if (fileExt === 'pdf') {
          extractedText = await extractPdfInBrowser(file, setProgress);
        } else {
          extractedText = await extractDocxInBrowser(file, setProgress);
        }
        if (!extractedText || extractedText.length < 30) {
          return setError(
            fileExt === 'pdf'
              ? 'No readable text found. This may be a scanned PDF — try uploading it as an image instead.'
              : 'Could not extract text from this document. Try the Paste Text tab.'
          );
        }
        setProgressMsg('Securing metadata…'); setProgress(90);
        const res = await uploadTextOnly(file.name, extractedText, docType, jurisdiction, true);
        setProgress(100);
        navigate('/analysis/' + res.data.data.document._id);
      } else {
        if (isPrivate && isImageFile) setProgressMsg('Sending image for OCR…');
        const formData = new FormData();
        formData.append('document', file);
        formData.append('docType', docType);
        formData.append('isPrivate', isPrivate);
        formData.append('jurisdiction', jurisdiction);
        const res = await uploadDocument(formData, (pct) => {
          setProgress(pct); setProgressMsg(`Uploading ${pct}%…`);
        });
        navigate('/analysis/' + res.data.data.document._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false); setProgress(0); setProgressMsg('');
    }
  };

  const handleTextUpload = async () => {
    if (!pastedText.trim())   return setError('Please paste your document text.');
    if (!textFileName.trim()) return setError('Please enter a document name.');
    setError(''); setLoading(true);
    try {
      const res = await uploadTextOnly(textFileName.trim(), pastedText.trim(), docType, jurisdiction, isPrivate);
      navigate('/analysis/' + res.data.data.document._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSubmit = () => tab === 'file' ? handleFileUpload() : handleTextUpload();
  const canSubmit = !loading && (tab === 'file' ? !!file : pastedText.trim().length > 0 && textFileName.trim().length > 0);

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '36px 24px 64px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 36 }}>
          <button
            onClick={() => navigate('/studio')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TM, fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 18 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.color = TM; }}
          >
            <I.ArrowLeft size={14} /> Back to Studio
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              <I.Upload size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.02em' }}>Secure Document Intake</h1>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: TM }}>Upload a file or paste text for AI-powered legal analysis. All processing is encrypted end-to-end.</p>
            </div>
          </div>
        </motion.div>

        {/* ── Tab switcher ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: ELE, border: `1px solid ${BORDER}`, marginBottom: 28 }}
        >
          {['file', 'text'].map(t => (
            <motion.button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: tab === t ? `linear-gradient(135deg, ${INDIGO}, #4f46e5)` : 'transparent',
                color: tab === t ? '#fff' : TM,
                boxShadow: tab === t ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
                transition: 'all 150ms',
              }}
            >
              {t === 'file' ? '📄  Upload File' : '📋  Paste Text'}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

            {/* ── Left column ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {tab === 'file' ? (
                <>
                  {/* Drop zone */}
                  <motion.div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    animate={dragging ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      borderRadius: 18, padding: '48px 32px',
                      border: `2px dashed ${dragging ? INDIGO : BORDER}`,
                      background: dragging ? 'rgba(99,102,241,0.08)' : SUR,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 250ms', boxShadow: dragging ? '0 0 30px rgba(99,102,241,0.15)' : 'none',
                    }}
                  >
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept={ACCEPT} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />

                    <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <I.Upload size={30} style={{ color: INDIGO }} />
                    </div>

                    {file ? (
                      <>
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#a5b4fc', marginBottom: 4, maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                        <p style={{ fontSize: 13, color: TM }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {isPrivate && (
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: willExtractLocally ? 'rgba(99,102,241,0.12)' : 'rgba(34,211,238,0.08)', border: `1px solid ${willExtractLocally ? 'rgba(99,102,241,0.3)' : 'rgba(34,211,238,0.2)'}`, fontSize: 12, fontWeight: 600, color: willExtractLocally ? '#a5b4fc' : CYAN }}>
                            {willExtractLocally ? <I.Shield size={14} /> : <I.Info size={14} />}
                            {willExtractLocally ? 'Text extracted in your browser — file never leaves your device' : 'Image OCR requires server processing — sent securely'}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: T, margin: '0 0 8px' }}>{dragging ? 'Drop it!' : 'Drop your file here'}</h3>
                        <p style={{ fontSize: 13, color: TM, margin: 0 }}>PDF, DOCX, DOC, JPG, PNG, WEBP — max 50 MB</p>
                      </>
                    )}

                    <div style={{ marginTop: 20, padding: '8px 20px', borderRadius: 9, background: ELE, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 600, color: TM }}>
                      {file ? 'Change File' : 'Browse Files'}
                    </div>

                    {loading && progress > 0 && (
                      <div style={{ width: '100%', marginTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: TM, marginBottom: 6 }}>
                          <span>{progressMsg}</span><span>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                          <motion.div
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 100, background: `linear-gradient(90deg, ${CYAN}, ${INDIGO})`, boxShadow: `0 0 8px ${CYAN}66` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Pipeline steps */}
                  {file && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {[
                        { Ic: I.Folder, label: 'File selected',    active: true },
                        { Ic: willExtractLocally ? I.Shield : I.Cloud, label: willExtractLocally ? 'Extracted locally' : 'Server OCR', active: false },
                        { Ic: I.Sparkle, label: 'AI analysis',     active: false },
                      ].map(({ Ic, label, active }) => (
                        <div key={label} style={{ borderRadius: 10, padding: '10px 8px', border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : BORDER}`, background: active ? 'rgba(99,102,241,0.08)' : 'transparent', textAlign: 'center', fontSize: 12, color: active ? '#a5b4fc' : TM }}>
                          <Ic size={18} style={{ display: 'block', margin: '0 auto 6px', opacity: active ? 1 : 0.5 }} />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: TM, textTransform: 'uppercase', marginBottom: 8 }}>Document Name</label>
                    <input
                      type="text"
                      value={textFileName}
                      onChange={e => setTextFileName(e.target.value)}
                      placeholder="e.g. Rental_Agreement_2024.txt"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}`, color: T, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: TM, textTransform: 'uppercase', marginBottom: 8 }}>Document Text</label>
                    <textarea
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste the full text of your legal document here…"
                      rows={13}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}`, color: T, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6, boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.15)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <div style={{ textAlign: 'right', fontSize: 11, color: TM, marginTop: 4 }}>{pastedText.length.toLocaleString()} characters</div>
                  </div>
                </div>
              )}

              {/* Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: TM, textTransform: 'uppercase', marginBottom: 8 }}>Document Type</label>
                  <div style={{ position: 'relative' }}>
                    <select value={docType} onChange={e => setDocType(e.target.value)} style={SELECT_STYLE}>
                      {DOC_TYPES.map(t => <option key={t} value={t} style={{ background: '#0e1033' }}>{t}</option>)}
                    </select>
                    <I.Chevron size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(180deg)', color: TM, pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: TM, textTransform: 'uppercase', marginBottom: 8 }}>Jurisdiction</label>
                  <div style={{ position: 'relative' }}>
                    <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} style={SELECT_STYLE}>
                      {JURISDICTIONS.map(j => <option key={j} value={j} style={{ background: '#0e1033' }}>{j}</option>)}
                    </select>
                    <I.MapPin size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TM, pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Right column ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Analysis options card */}
              <div style={{ borderRadius: 16, padding: '22px', background: SUR, border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <I.Sparkle size={16} style={{ color: CYAN }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: T }}>Analysis Includes</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    ['Risk Detection',         'Flag unfavorable clauses & liabilities'],
                    ['Plain Language Summary', 'Translate legalese into simple English'],
                    ['Compliance Check',       'Applicable law mandatory clause check'],
                    ['Jurisdiction Detection', 'Auto-detect applicable jurisdiction'],
                  ].map(([title, sub]) => (
                    <div key={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T }}>{title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: TM }}>{sub}</p>
                      </div>
                      <div style={{ width: 42, height: 22, borderRadius: 100, background: `linear-gradient(90deg, ${INDIGO}, #4f46e5)`, position: 'relative', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', right: 3, top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy info */}
              <div style={{ borderRadius: 16, padding: '16px 18px', background: isPrivate ? 'rgba(99,102,241,0.08)' : SUR, border: `1px solid ${isPrivate ? 'rgba(99,102,241,0.3)' : BORDER}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={togglePrivacy}>
                <I.Lock size={18} style={{ color: isPrivate ? '#a5b4fc' : TM, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isPrivate ? '#a5b4fc' : T }}>Privacy Mode {isPrivate ? 'ON' : 'OFF'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: TM }}>{isPrivate ? 'PDFs extracted locally — nothing uploaded' : 'Click to enable offline processing'}</p>
                </div>
                <div style={{ width: 42, height: 22, borderRadius: 100, background: isPrivate ? `linear-gradient(90deg, ${INDIGO}, #4f46e5)` : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, right: isPrivate ? 3 : undefined, left: isPrivate ? undefined : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'all 200ms' }} />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 12, padding: '12px 14px' }}
                  >
                    <I.Alert size={16} style={{ color: ERR, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: ERR }}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: canSubmit ? `linear-gradient(135deg, ${INDIGO}, #4f46e5)` : 'rgba(255,255,255,0.06)',
                  color: canSubmit ? '#fff' : TM,
                  boxShadow: canSubmit ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
                  transition: 'all 200ms',
                }}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                    />
                    {progressMsg || 'Processing…'}
                  </>
                ) : (
                  <>
                    <I.Zap size={17} /> Analyze Document
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ── Trust badges ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28, opacity: 0.3 }}
        >
          {[
            { Ic: I.Shield, label: 'AES-256 Encrypted' },
            { Ic: I.Lock,   label: 'Offline-First for PDFs' },
            { Ic: I.Globe,  label: 'GDPR Compliant' },
          ].map(({ Ic, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ic size={15} style={{ color: T }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T }}>{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
