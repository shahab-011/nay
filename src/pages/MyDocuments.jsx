import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getDocuments, deleteDocument } from '../api/documents.api';
import { useAuth } from '../context/AuthContext';
import { ContractStatusBadge } from '../utils/contractStatus';

/* ── helpers ──────────────────────────────────────────────────────── */
const FILE_ICONS = {
  pdf: 'picture_as_pdf', docx: 'description', doc: 'description',
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', other: 'insert_drive_file',
};

const HEALTH = (s) =>
  s >= 80 ? { color: 'text-primary', bar: 'bg-primary' }
  : s >= 50 ? { color: 'text-amber-400', bar: 'bg-amber-400' }
  : { color: 'text-error', bar: 'bg-error' };

const RISK = {
  low:    { label: 'Low Risk',  dot: 'bg-primary',   text: 'text-primary'   },
  medium: { label: 'Med Risk',  dot: 'bg-amber-400', text: 'text-amber-400' },
  high:   { label: 'High Risk', dot: 'bg-error',     text: 'text-error'     },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtSize = (b) =>
  !b ? '—' : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

const DOC_TYPES = [
  'All Types', 'Contract', 'NDA', 'MoU', 'Rent Agreement', 'Offer Letter',
  'Will', 'Property Deed', 'Partnership Deed', 'Freelance Agreement',
  'Vendor Agreement', 'Service Agreement', 'Consultancy Agreement', 'Other',
];
const RISK_FILTERS = ['All Risks', 'low', 'medium', 'high'];

/* ── component ────────────────────────────────────────────────────── */
export default function MyDocuments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId]   = useState(null);

  // filters
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [riskFilter, setRiskFilter] = useState('All Risks');

  /* fetch */
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDocuments();
      setDocuments(res.data.data.documents || []);
    } catch {
      setError('Failed to load documents. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  /* filtered list */
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        !search ||
        doc.originalName.toLowerCase().includes(search.toLowerCase()) ||
        doc.docType?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All Types' || doc.docType === typeFilter;
      const matchRisk = riskFilter === 'All Risks' || doc.riskLevel === riskFilter;
      return matchSearch && matchType && matchRisk;
    });
  }, [documents, search, typeFilter, riskFilter]);

  /* stats */
  const analyzed  = documents.filter((d) => d.status === 'analyzed');
  const avgHealth = analyzed.length
    ? Math.round(analyzed.reduce((s, d) => s + (d.healthScore || 0), 0) / analyzed.length)
    : 0;
  const highRisk  = documents.filter((d) => d.riskLevel === 'high').length;

  /* delete */
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <>
      <Header title="My Documents">
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Document
        </button>
      </Header>

      <div className="p-4 md:p-10 max-w-[1400px] mx-auto min-h-[calc(100vh-64px)]">
        {/* Page header */}
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Legal Repository</h2>
          <p className="text-on-surface-variant font-body max-w-2xl">
            Manage your complete portfolio of legal documents with AI-powered analysis.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Documents', value: documents.length, icon: 'folder_open', color: 'text-primary' },
            { label: 'Analyzed',        value: analyzed.length,  icon: 'analytics',   color: 'text-secondary' },
            { label: 'Avg Health',      value: `${avgHealth}%`,  icon: 'favorite',    color: 'text-primary' },
            { label: 'High Risk',       value: highRisk,         icon: 'warning',     color: 'text-error' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-surface-container-low rounded-xl p-5 border border-white/5 flex items-center gap-4">
              <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-label">{label}</p>
                <p className={`text-2xl font-headline font-extrabold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 group w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-b border-outline-variant/20 focus:border-primary pl-12 pr-4 py-4 text-sm rounded-t-xl outline-none text-on-surface transition-all"
              placeholder="Search by name or document type…"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-surface-container-low border-b border-outline-variant/20 py-4 px-4 text-sm rounded-t-xl text-on-surface font-label min-w-[140px] outline-none"
            >
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-surface-container-low border-b border-outline-variant/20 py-4 px-4 text-sm rounded-t-xl text-on-surface font-label min-w-[140px] outline-none"
            >
              {RISK_FILTERS.map((r) => <option key={r}>{r === 'All Risks' ? r : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}</option>)}
            </select>
            <button
              onClick={fetchDocuments}
              className="bg-surface-container-high hover:bg-surface-container-highest p-4 rounded-xl text-primary transition-all"
              title="Refresh"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
              <p className="text-on-surface-variant font-body">Loading your documents…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-5xl text-error">error</span>
              <p className="text-error font-body">{error}</p>
              <button onClick={fetchDocuments} className="text-primary text-sm font-bold hover:underline">Try Again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">folder_open</span>
              <p className="text-on-surface-variant font-headline font-bold text-lg">
                {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
              </p>
              <p className="text-on-surface-variant text-sm text-center max-w-xs">
                {documents.length === 0
                  ? 'Upload your first legal document to get started.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {documents.length === 0 && (
                <button
                  onClick={() => navigate('/upload')}
                  className="mt-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  Upload Document
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[860px]">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/10">
                    {['Document', 'Type', 'Health Score', 'Risk Level', 'Contract Status', 'Uploaded', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold ${i === 6 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filtered.map((doc) => {
                    const health  = HEALTH(doc.healthScore || 0);
                    const risk    = RISK[doc.riskLevel] || RISK.low;
                    const icon    = FILE_ICONS[doc.fileType] || 'insert_drive_file';
                    const isDeleting = deletingId === doc._id;

                    return (
                      <tr
                        key={doc._id}
                        onClick={() => navigate(`/analysis/${doc._id}`)}
                        className={`hover:bg-white/5 transition-colors group cursor-pointer ${isDeleting ? 'opacity-40' : ''}`}
                      >
                        {/* Document name */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                              <span className="material-symbols-outlined text-xl">{icon}</span>
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-[200px]"
                                title={doc.originalName}
                              >
                                {doc.originalName}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-label tracking-wide">
                                {fmtSize(doc.fileSizeBytes)} · {doc.fileType?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-5 px-6">
                          <span className="bg-surface-container-highest text-secondary text-[11px] font-bold px-2 py-1 rounded tracking-wide font-label">
                            {doc.docType || 'Other'}
                          </span>
                        </td>

                        {/* Health score */}
                        <td className="py-5 px-6">
                          {doc.status === 'analyzed' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${health.bar}`}
                                  style={{ width: `${doc.healthScore || 0}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold font-label ${health.color}`}>
                                {doc.healthScore || 0}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-label">—</span>
                          )}
                        </td>

                        {/* Risk */}
                        <td className="py-5 px-6">
                          {doc.status === 'analyzed' ? (
                            <span className={`flex items-center gap-1.5 text-[11px] font-bold font-label ${risk.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                              {risk.label}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-label">—</span>
                          )}
                        </td>

                        {/* Contract Status */}
                        <td className="py-5 px-6">
                          <ContractStatusBadge doc={doc} size="xs" />
                        </td>

                        {/* Date */}
                        <td className="py-5 px-6">
                          <span className="text-sm text-on-surface-variant font-label">
                            {fmtDate(doc.uploadedAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          {confirmId === doc._id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-on-surface-variant">Delete?</span>
                              <button
                                onClick={() => handleDelete(doc._id)}
                                disabled={isDeleting}
                                className="text-[11px] font-bold text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {isDeleting ? '…' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-[11px] font-bold text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => navigate(`/analysis/${doc._id}`)}
                                className="text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {doc.status === 'analyzed' ? 'View' : 'Analyze'}
                              </button>
                              <button
                                onClick={() => navigate(`/ask?docId=${doc._id}`)}
                                className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Ask AI
                              </button>
                              <button
                                onClick={() => setConfirmId(doc._id)}
                                className="text-on-surface-variant hover:text-error transition-colors p-1"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          {!loading && !error && filtered.length > 0 && (
            <div className="bg-surface-container/50 px-6 py-4 flex items-center justify-between border-t border-outline-variant/5">
              <p className="text-xs text-on-surface-variant font-label">
                Showing <span className="text-on-surface font-bold">{filtered.length}</span> of{' '}
                <span className="text-on-surface font-bold">{documents.length}</span> documents
              </p>
            </div>
          )}
        </div>

        {/* Bottom insight cards */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-2xl border border-primary/10 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Quick Insights
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
                {highRisk > 0 ? (
                  <>AI has detected <span className="text-error font-bold">{highRisk} high-risk document{highRisk > 1 ? 's' : ''}</span> in your repository. Review them in the Analysis page for detailed recommendations.</>
                ) : analyzed.length > 0 ? (
                  <>Your average document health score is <span className="text-primary font-bold">{avgHealth}%</span>. All analyzed documents are within acceptable risk parameters.</>
                ) : (
                  <>Upload and analyze your legal documents to get AI-powered insights, risk detection, and compliance reports.</>
                )}
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-6 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all"
              >
                Upload a Document
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[200px]">analytics</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-8 rounded-2xl border border-outline-variant/10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Repository Stats</h4>
            <div className="space-y-5">
              {[
                { label: 'Analyzed', count: analyzed.length, color: 'bg-primary' },
                { label: 'Pending',  count: documents.filter(d => d.status === 'uploaded').length, color: 'bg-outline-variant' },
                { label: 'Error',    count: documents.filter(d => d.status === 'error').length, color: 'bg-error' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-label mb-2">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="text-on-surface font-bold">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: documents.length ? `${(count / documents.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">Total Files</p>
                  <p className="text-lg font-headline font-extrabold text-primary">{documents.length}</p>
                </div>
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">Analyzed</p>
                  <p className="text-lg font-headline font-extrabold text-secondary">
                    {documents.length ? `${Math.round((analyzed.length / documents.length) * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
