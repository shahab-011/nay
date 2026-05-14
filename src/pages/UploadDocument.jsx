import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { uploadDocument, uploadTextOnly } from '../api/documents.api';
import { usePrivacy } from '../context/PrivacyContext';

const itemV = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const DOC_TYPES = [
  'Contract', 'NDA', 'MoU', 'Rent Agreement',
  'Offer Letter', 'Will', 'Property Deed', 'Other',
];

const JURISDICTIONS = [
  'Not detected', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'European Union', 'India', 'Singapore', 'UAE', 'Germany', 'France',
  'South Africa', 'Kenya', 'Nigeria', 'Other',
];

const ACCEPT       = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';
const IMAGE_EXTS   = ['jpg', 'jpeg', 'png', 'webp'];
const TEXT_EXTS    = ['pdf', 'doc', 'docx'];

function getExt(filename) {
  return filename.split('.').pop().toLowerCase();
}

/* ── browser-side extraction ──────────────────────────────────────── */
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

  const [progress,    setProgress]    = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  /* ── derived ──────────────────────────────────────────────────── */
  const fileExt            = file ? getExt(file.name) : '';
  const isImageFile        = IMAGE_EXTS.includes(fileExt);
  const isTextableFile     = TEXT_EXTS.includes(fileExt);
  const willExtractLocally = isPrivate && tab === 'file' && isTextableFile;

  /* ── drag & drop ─────────────────────────────────────────────── */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  /* ── upload ───────────────────────────────────────────────────── */
  const handleFileUpload = async () => {
    if (!file) return setError('Please select a file first.');
    setError('');
    setLoading(true);
    setProgress(0);

    try {
      if (willExtractLocally) {
        setProgressMsg('Reading file locally…');
        setProgress(5);

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

        setProgressMsg('Securing metadata…');
        setProgress(90);
        const res = await uploadTextOnly(file.name, extractedText, docType, jurisdiction, true);
        setProgress(100);
        navigate('/analysis/' + res.data.data.document._id);

      } else {
        if (isPrivate && isImageFile) {
          setProgressMsg('Sending image for OCR…');
        }
        const formData = new FormData();
        formData.append('document',     file);
        formData.append('docType',      docType);
        formData.append('isPrivate',    isPrivate);
        formData.append('jurisdiction', jurisdiction);

        const res = await uploadDocument(formData, (pct) => {
          setProgress(pct);
          setProgressMsg(`Uploading ${pct}%…`);
        });
        navigate('/analysis/' + res.data.data.document._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMsg('');
    }
  };

  const handleTextUpload = async () => {
    if (!pastedText.trim())   return setError('Please paste your document text.');
    if (!textFileName.trim()) return setError('Please enter a document name.');
    setError('');
    setLoading(true);
    try {
      const res = await uploadTextOnly(
        textFileName.trim(), pastedText.trim(), docType, jurisdiction, isPrivate
      );
      navigate('/analysis/' + res.data.data.document._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => tab === 'file' ? handleFileUpload() : handleTextUpload();

  const canSubmit =
    !loading &&
    (tab === 'file'
      ? !!file
      : pastedText.trim().length > 0 && textFileName.trim().length > 0);

  return (
    <>
      <Header title="Upload Document" />

      <div className="max-w-6xl mx-auto p-4 md:p-8 xl:p-10">
        <motion.div variants={{ animate: { transition: { staggerChildren: 0.09 } } }} initial="initial" animate="animate">

        <motion.div variants={itemV} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight mb-2">
            <span className="gradient-text">Secure Document</span>{' '}
            <span className="text-on-surface">Intake</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Upload a file or paste text for AI-powered legal analysis. All processing is encrypted end-to-end.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div variants={itemV} className="flex gap-1.5 mb-7 p-1 w-fit rounded-xl"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          {['file', 'text'].map((t) => (
            <motion.button key={t} onClick={() => { setTab(t); setError(''); }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold font-headline transition-all ${
                tab === t
                  ? 'text-on-primary shadow-md'
                  : 'text-on-surface-variant'
              }`}
              style={tab === t ? { background: 'var(--purple)', color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.25)' } : {}}
            >
              {t === 'file' ? '📄 Upload File' : '📋 Paste Text'}
            </motion.button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Column ─────────────────────────────────────── */}
          <motion.div variants={itemV} className="lg:col-span-7 space-y-5">

            {tab === 'file' ? (
              <>
                <motion.div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  animate={dragging ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-2xl p-10 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300"
                  style={dragging
                    ? { borderColor: 'var(--purple)', background: 'var(--purple-soft)', boxShadow: '0 0 30px rgba(124,58,237,0.12)' }
                    : { borderColor: 'var(--border)', background: 'var(--elevated)' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPT}
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                  />
                  <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center mb-6 shadow-xl mx-auto">
                    <span className="material-symbols-outlined text-primary text-4xl">upload_file</span>
                  </div>

                  {file ? (
                    <>
                      <p className="text-xl font-headline font-bold text-primary mb-1 truncate max-w-[80%]">
                        {file.name}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {isPrivate && (
                        <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
                          willExtractLocally
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary/10 text-secondary border-secondary/20'
                        }`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {willExtractLocally ? 'shield_lock' : 'info'}
                          </span>
                          {willExtractLocally
                            ? 'Text extracted in your browser — file never leaves your device'
                            : 'Image OCR requires server processing — sent securely'}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
                        {dragging ? 'Drop it!' : 'Drop your file here'}
                      </h3>
                      <p className="text-on-surface-variant font-body text-sm">
                        PDF, DOCX, DOC, JPG, PNG, WEBP — max 50 MB
                      </p>
                    </>
                  )}

                  <div className="mt-6 px-6 py-2.5 bg-surface-container-high text-on-surface rounded-lg font-medium border border-outline-variant text-sm">
                    {file ? 'Change File' : 'Browse Files'}
                  </div>

                  {loading && progress > 0 && (
                    <div className="w-full mt-5 space-y-2">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>{progressMsg}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          style={{ background: 'linear-gradient(90deg, #44e5c2, #38debb)', boxShadow: '0 0 8px rgba(68,229,194,0.5)' }} />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Pipeline steps when file selected */}
                {file && (
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    {[
                      { icon: 'folder',                                          label: 'File selected'                                    },
                      { icon: willExtractLocally ? 'computer' : 'cloud_upload', label: willExtractLocally ? 'Extracted locally' : 'Server OCR' },
                      { icon: 'psychology',                                      label: 'AI analysis'                                       },
                    ].map(({ icon, label }, i) => (
                      <div key={label} className={`rounded-xl p-3 border ${i === 0 ? 'border-primary/20 bg-primary/5 text-primary' : 'border-white/5 text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-xl block mb-1">{icon}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-label text-on-surface-variant mb-2 block uppercase tracking-wider">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={textFileName}
                    onChange={(e) => setTextFileName(e.target.value)}
                    placeholder="e.g. Rental_Agreement_2024.txt"
                    className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary text-on-surface py-3 px-4 rounded-t-xl outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-label text-on-surface-variant mb-2 block uppercase tracking-wider">
                    Document Text
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste the full text of your legal document here…"
                    rows={14}
                    className="w-full bg-surface-container-low border border-outline-variant/20 focus:border-primary text-on-surface py-3 px-4 rounded-xl outline-none transition-colors resize-none font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-on-surface-variant mt-1 text-right">
                    {pastedText.length.toLocaleString()} characters
                  </p>
                </div>
              </div>
            )}

            {/* Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-label text-on-surface-variant block uppercase tracking-wider">
                  Document Type
                </label>
                <div className="relative">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-surface-container-low border-b border-outline-variant/20 focus:border-primary text-on-surface py-3 px-4 rounded-t-xl appearance-none cursor-pointer outline-none"
                  >
                    {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-label text-on-surface-variant block uppercase tracking-wider">
                  Jurisdiction
                </label>
                <div className="relative">
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-surface-container-low border-b border-outline-variant/20 focus:border-primary text-on-surface py-3 px-4 rounded-t-xl appearance-none cursor-pointer outline-none"
                  >
                    {JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    location_on
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right Column ────────────────────────────────────── */}
          <motion.div variants={itemV} className="lg:col-span-5 space-y-5">

            {/* Analysis options */}
            <div className="card rounded-2xl p-6">
              <h4 className="font-headline font-bold text-on-surface mb-6">Analysis Includes</h4>
              <div className="space-y-4">
                {[
                  ['Risk Detection',         'Flag unfavorable clauses & liabilities'],
                  ['Plain Language Summary', 'Translate legalese into simple English'],
                  ['Compliance Check',       'Applicable law mandatory clause check'],
                  ['Jurisdiction Detection', 'Auto-detect applicable jurisdiction'],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{title}</p>
                      <p className="text-[12px] text-on-surface-variant">{sub}</p>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative flex-shrink-0">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm">
                <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className={`w-full h-14 font-headline font-extrabold text-[15px] rounded-2xl transition-all flex items-center justify-center gap-3 ${
                canSubmit ? 'text-on-primary' : 'text-on-surface-variant cursor-not-allowed'
              }`}
              style={canSubmit ? {
                background: 'var(--purple)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
                color: '#fff',
              } : { background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                    className="material-symbols-outlined text-xl">progress_activity</motion.span>
                  {progressMsg || 'Processing…'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Analyze Document
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div variants={itemV} className="mt-16 flex flex-wrap justify-center gap-10 opacity-25">
          {[
            ['verified_user', 'ISO 27001 Certified'],
            ['lock',          'AES-256 Encrypted'],
            ['cloud_off',     'Offline-First for PDFs'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-xs font-label font-bold tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </motion.div>

        </motion.div>
      </div>
    </>
  );
}
