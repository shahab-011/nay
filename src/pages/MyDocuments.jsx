import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDocuments, deleteDocument } from '../api/documents.api';
import { useAuth } from '../context/AuthContext';
import { ContractStatusBadge } from '../utils/contractStatus';
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

/* ── Helpers ────────────────────────────────────────────────────── */
const HEALTH = (s) =>
  s >= 80 ? { color: '#22c55e', bar: '#22c55e' }
  : s >= 50 ? { color: '#f59e0b', bar: '#f59e0b' }
  : { color: ERR, bar: ERR };

const RISK_STYLE = {
  low:    { label: 'Low Risk',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  medium: { label: 'Med Risk',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high:   { label: 'High Risk', color: ERR,       bg: `rgba(244,63,94,0.1)`  },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtSize = (b) =>
  !b ? '—' : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

const DOC_TYPES = [
  'All Types', 'Contract', 'NDA', 'MoU', 'Rent Agreement', 'Offer Letter',
  'Will', 'Property Deed', 'Partnership Deed', 'Freelance Agreement',
  'Vendor Agreement', 'Service Agreement', 'Consultancy Agreement', 'Other',
];
const RISK_FILTERS = ['All Risks', 'low', 'medium', 'high'];

const SEL_STYLE = {
  padding: '9px 14px', borderRadius: 10, background: ELE,
  border: `1px solid ${BORDER}`, color: T, fontSize: 13,
  outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
};

/* ── Component ──────────────────────────────────────────────────── */
export default function MyDocuments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [riskFilter, setRiskFilter] = useState('All Risks');

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true); setError('');
    try {
      const res = await getDocuments();
      setDocuments(res.data.data.documents || []);
    } catch { setError('Failed to load documents. Please refresh.'); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => documents.filter(doc => {
    const matchSearch = !search || doc.originalName.toLowerCase().includes(search.toLowerCase()) || doc.docType?.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'All Types' || doc.docType === typeFilter;
    const matchRisk   = riskFilter === 'All Risks' || doc.riskLevel === riskFilter;
    return matchSearch && matchType && matchRisk;
  }), [documents, search, typeFilter, riskFilter]);

  const analyzed  = documents.filter(d => d.status === 'analyzed');
  const avgHealth = analyzed.length ? Math.round(analyzed.reduce((s, d) => s + (d.healthScore || 0), 0) / analyzed.length) : 0;
  const highRisk  = documents.filter(d => d.riskLevel === 'high').length;

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch { alert('Delete failed. Please try again.'); }
    finally { setDeletingId(null); setConfirmId(null); }
  };

  const STAT_CARDS = [
    { label: 'Total Documents', value: documents.length, color: INDIGO,   bg: 'rgba(99,102,241,0.12)', Ic: I.Folder },
    { label: 'Analyzed',        value: analyzed.length,  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Ic: I.Activity },
    { label: 'Avg Health',      value: `${avgHealth}%`,  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  Ic: I.TrendingUp },
    { label: 'High Risk',       value: highRisk,         color: ERR,       bg: 'rgba(244,63,94,0.12)', Ic: I.Alert },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '36px 24px 72px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <button
              onClick={() => navigate('/studio')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: TM, fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 12 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
              onMouseLeave={e => { e.currentTarget.style.color = TM; }}
            >
              <I.ArrowLeft size={14} /> Back to Studio
            </button>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: T, letterSpacing: '-0.02em' }}>
              Legal{' '}
              <span style={{ background: `linear-gradient(135deg, ${INDIGO}, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Repository</span>
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: TM }}>Manage your complete portfolio of legal documents with AI-powered analysis.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/upload')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 11, background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', flexShrink: 0 }}
          >
            <I.Plus size={14} /> New Document
          </motion.button>
        </motion.div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {STAT_CARDS.map(({ label, value, color, bg, Ic }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -3 }}
              style={{ borderRadius: 14, padding: '16px', background: bg, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={18} style={{ color }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: TM }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search & filter bar ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <I.Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TM }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or document type…"
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}`, color: T, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = INDIGO; }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={SEL_STYLE}>
              {DOC_TYPES.map(t => <option key={t} value={t} style={{ background: '#0e1033' }}>{t}</option>)}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={SEL_STYLE}>
              {RISK_FILTERS.map(r => <option key={r} value={r} style={{ background: '#0e1033' }}>{r === 'All Risks' ? r : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={fetchDocuments}
            title="Refresh"
            style={{ padding: '10px 14px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}`, color: INDIGO, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <I.Activity size={16} />
          </motion.button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${BORDER}`, background: SUR }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: INDIGO, borderRadius: '50%' }} />
              <p style={{ color: TM, fontSize: 14, margin: 0 }}>Loading your documents…</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
              <I.Alert size={40} style={{ color: ERR }} />
              <p style={{ color: ERR, fontSize: 14, margin: 0 }}>{error}</p>
              <button onClick={fetchDocuments} style={{ color: INDIGO, fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try Again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
              <I.Folder size={56} style={{ color: TM, opacity: 0.3 }} />
              <p style={{ color: T, fontSize: 17, fontWeight: 800, margin: 0 }}>{documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}</p>
              <p style={{ color: TM, fontSize: 13, margin: 0, textAlign: 'center', maxWidth: 280 }}>{documents.length === 0 ? 'Upload your first legal document to get started.' : 'Try adjusting your search or filter criteria.'}</p>
              {documents.length === 0 && (
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/upload')} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Upload Document
                </motion.button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                    {['Document', 'Type', 'Health Score', 'Risk Level', 'Contract Status', 'Uploaded', 'Actions'].map((h, i) => (
                      <th key={h} style={{ padding: '14px 18px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: TM, textAlign: i === 6 ? 'right' : 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc, ri) => {
                    const health     = HEALTH(doc.healthScore || 0);
                    const risk       = RISK_STYLE[doc.riskLevel] || RISK_STYLE.low;
                    const isDeleting = deletingId === doc._id;

                    return (
                      <motion.tr
                        key={doc._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.04 }}
                        onClick={() => navigate(`/analysis/${doc._id}`)}
                        style={{
                          borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
                          opacity: isDeleting ? 0.4 : 1, transition: 'background 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Document name */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <I.Doc size={18} style={{ color: INDIGO }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }} title={doc.originalName}>{doc.originalName}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: TM }}>{fmtSize(doc.fileSizeBytes)} · {doc.fileType?.toUpperCase() || 'DOC'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: ELE, color: TM, letterSpacing: '0.04em' }}>
                            {doc.docType || 'Other'}
                          </span>
                        </td>

                        {/* Health score */}
                        <td style={{ padding: '14px 18px' }}>
                          {doc.status === 'analyzed' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 52, height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${doc.healthScore || 0}%`, borderRadius: 100, background: health.bar }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: health.color }}>{doc.healthScore || 0}%</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: TM }}>—</span>
                          )}
                        </td>

                        {/* Risk */}
                        <td style={{ padding: '14px 18px' }}>
                          {doc.status === 'analyzed' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: risk.color, padding: '3px 8px', borderRadius: 100, background: risk.bg }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: risk.color, flexShrink: 0 }} />
                              {risk.label}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: TM }}>—</span>
                          )}
                        </td>

                        {/* Contract Status */}
                        <td style={{ padding: '14px 18px' }}>
                          <ContractStatusBadge doc={doc} size="xs" />
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 12, color: TM }}>{fmtDate(doc.uploadedAt)}</span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          {confirmId === doc._id ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <span style={{ fontSize: 12, color: TM }}>Delete?</span>
                              <button onClick={() => handleDelete(doc._id)} disabled={isDeleting} style={{ fontSize: 11, fontWeight: 700, color: ERR, padding: '4px 10px', borderRadius: 7, background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer' }}>
                                {isDeleting ? '…' : 'Yes'}
                              </button>
                              <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, fontWeight: 700, color: TM, padding: '4px 10px', borderRadius: 7, background: ELE, border: 'none', cursor: 'pointer' }}>
                                No
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, opacity: 0, transition: 'opacity 150ms' }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
                            >
                              <button onClick={() => navigate(`/analysis/${doc._id}`)} style={{ fontSize: 11, fontWeight: 700, color: INDIGO, padding: '4px 10px', borderRadius: 7, background: 'rgba(99,102,241,0.12)', border: 'none', cursor: 'pointer' }}>
                                {doc.status === 'analyzed' ? 'View' : 'Analyze'}
                              </button>
                              <button onClick={() => navigate(`/ask?docId=${doc._id}`)} style={{ fontSize: 11, fontWeight: 700, color: TM, padding: '4px 10px', borderRadius: 7, background: ELE, border: 'none', cursor: 'pointer' }}>
                                Ask AI
                              </button>
                              <button onClick={() => setConfirmId(doc._id)} style={{ padding: '4px 8px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: TM, display: 'flex', alignItems: 'center' }} title="Delete"
                                onMouseEnter={e => { e.currentTarget.style.color = ERR; }}
                                onMouseLeave={e => { e.currentTarget.style.color = TM; }}
                              >
                                <I.X size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          {!loading && !error && filtered.length > 0 && (
            <div style={{ padding: '12px 18px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)' }}>
              <p style={{ margin: 0, fontSize: 12, color: TM }}>
                Showing <span style={{ color: T, fontWeight: 700 }}>{filtered.length}</span> of{' '}
                <span style={{ color: T, fontWeight: 700 }}>{documents.length}</span> documents
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Bottom insight cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {/* Quick Insights */}
          <div style={{ gridColumn: 'span 2', borderRadius: 16, padding: '28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)', border: `1px solid rgba(99,102,241,0.15)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.04 }}>
              <I.Activity size={200} style={{ color: T }} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <I.Sparkle size={18} style={{ color: CYAN }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T }}>Quick Insights</h4>
              </div>
              <p style={{ fontSize: 13, color: TM, lineHeight: 1.65, maxWidth: 500, margin: '0 0 16px' }}>
                {highRisk > 0 ? (
                  <>AI has detected <span style={{ color: ERR, fontWeight: 700 }}>{highRisk} high-risk document{highRisk > 1 ? 's' : ''}</span> in your repository. Review them for detailed recommendations.</>
                ) : analyzed.length > 0 ? (
                  <>Your average document health score is <span style={{ color: '#22c55e', fontWeight: 700 }}>{avgHealth}%</span>. All analyzed documents are within acceptable risk parameters.</>
                ) : (
                  <>Upload and analyze your legal documents to get AI-powered insights, risk detection, and compliance reports.</>
                )}
              </p>
              <button onClick={() => navigate('/upload')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: INDIGO, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Upload a Document <I.ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Repository Stats */}
          <div style={{ borderRadius: 16, padding: '24px', background: SUR, border: `1px solid ${BORDER}` }}>
            <h4 style={{ margin: '0 0 20px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: TM }}>Repository Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Analyzed', count: analyzed.length,                                       color: INDIGO   },
                { label: 'Pending',  count: documents.filter(d => d.status === 'uploaded').length, color: '#64748b' },
                { label: 'Error',    count: documents.filter(d => d.status === 'error').length,    color: ERR       },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: TM }}>{label}</span>
                    <span style={{ color: T, fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, background: color, width: documents.length ? `${(count / documents.length) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {[
                  { label: 'Total Files', value: documents.length, color: INDIGO },
                  { label: 'Analyzed',    value: documents.length ? `${Math.round((analyzed.length / documents.length) * 100)}%` : '0%', color: CYAN },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, padding: '12px', borderRadius: 10, background: ELE, border: `1px solid ${BORDER}` }}>
                    <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: TM }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
