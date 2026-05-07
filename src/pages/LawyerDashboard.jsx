import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  getLawyerDashboard, getClients, getCases,
  createCase, updateCase, deleteCase,
} from '../api/lawyer.api';

/* ── helpers ───────────────────────────────────────────────────────── */

const STATUS_STYLE = {
  active:   { bg: 'bg-primary/10',    text: 'text-primary',   dot: 'bg-primary'   },
  pending:  { bg: 'bg-amber-400/10',  text: 'text-amber-400', dot: 'bg-amber-400' },
  'on-hold':{ bg: 'bg-slate-500/10',  text: 'text-slate-400', dot: 'bg-slate-400' },
  closed:   { bg: 'bg-error/10',      text: 'text-error',     dot: 'bg-error'     },
};

const PRIORITY_STYLE = {
  high:   'text-red-400',
  medium: 'text-amber-400',
  low:    'text-slate-400',
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const EMPTY_FORM = {
  title: '', clientName: '', clientEmail: '',
  caseType: '', description: '', notes: '',
  status: 'active', priority: 'medium',
};

/* ── Main component ────────────────────────────────────────────────── */

export default function LawyerDashboard() {
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const [tab,      setTab]      = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [recent,   setRecent]   = useState([]);
  const [cases,    setCases]    = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Case form modal
  const [showForm,   setShowForm]   = useState(false);
  const [editCase,   setEditCase]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  /* ── Fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, casesRes, clientsRes] = await Promise.all([
        getLawyerDashboard(),
        getCases(),
        getClients(),
      ]);
      setStats(dashRes.data.data.stats);
      setRecent(dashRes.data.data.recentCases || []);
      setCases(casesRes.data.data.cases || []);
      setClients(clientsRes.data.data.clients || []);
    } catch {
      setError('Failed to load lawyer dashboard. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Case form handlers ── */
  const openCreate = () => {
    setEditCase(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditCase(c);
    setForm({
      title:       c.title       || '',
      clientName:  c.clientName  || '',
      clientEmail: c.clientEmail || '',
      caseType:    c.caseType    || '',
      description: c.description || '',
      notes:       c.notes       || '',
      status:      c.status      || 'active',
      priority:    c.priority    || 'medium',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.clientName || !form.clientEmail) {
      return setFormError('Title, client name, and client email are required');
    }
    setSaving(true);
    try {
      if (editCase) {
        const res = await updateCase(editCase._id, form);
        setCases((prev) => prev.map((c) => c._id === editCase._id ? res.data.data.case : c));
      } else {
        const res = await createCase(form);
        setCases((prev) => [res.data.data.case, ...prev]);
      }
      setShowForm(false);
      // Refresh stats
      const dashRes = await getLawyerDashboard();
      setStats(dashRes.data.data.stats);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    const prev = cases;
    setCases((all) => all.filter((c) => c._id !== id));
    try {
      await deleteCase(id);
      const dashRes = await getLawyerDashboard();
      setStats(dashRes.data.data.stats);
    } catch {
      setCases(prev);
    }
  };

  /* ── render ── */
  return (
    <>
      <Header title="Lawyer Dashboard">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Case
        </button>
      </Header>

      <div className="max-w-6xl mx-auto p-8 space-y-8">

        {/* ── Page heading ── */}
        <div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-white mb-1">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-on-surface-variant text-sm">Legal Professional Dashboard</p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
            <button onClick={load} className="ml-auto underline font-bold">Retry</button>
          </div>
        )}

        {/* ── Stats cards ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Cases',   value: stats.totalCases,   icon: 'folder_open',   color: 'text-primary'   },
              { label: 'Active',        value: stats.activeCases,  icon: 'play_circle',   color: 'text-primary'   },
              { label: 'Pending',       value: stats.pendingCases, icon: 'pending',        color: 'text-amber-400' },
              { label: 'Closed',        value: stats.closedCases,  icon: 'check_circle',  color: 'text-slate-400' },
              { label: 'My Documents',  value: stats.totalDocs,    icon: 'description',   color: 'text-secondary' },
              { label: 'Unread Alerts', value: stats.unreadAlerts, icon: 'notifications', color: stats.unreadAlerts > 0 ? 'text-error' : 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-low rounded-2xl p-5 border border-white/5">
                <span className={`material-symbols-outlined text-2xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {s.icon}
                </span>
                <div className="mt-3 text-2xl font-headline font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {['overview', 'cases', 'clients'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold font-headline capitalize rounded-t-lg transition-all ${
                tab === t
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map((n) => (
              <div key={n} className="bg-surface-container-low rounded-xl p-6 animate-pulse h-20" />
            ))}
          </div>
        )}

        {/* ── Overview tab ── */}
        {!loading && tab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-sm font-label text-on-surface-variant uppercase tracking-widest">Recent Cases</h2>
            {recent.length === 0 ? (
              <div className="text-center py-16 space-y-4 bg-surface-container-low rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-5xl block opacity-20 text-primary">folder_open</span>
                <div>
                  <p className="text-white/60 font-headline font-bold text-lg">No cases yet</p>
                  <p className="text-sm text-on-surface-variant mt-1">Create your first case to start managing client work.</p>
                </div>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Create First Case
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((c) => (
                  <CaseRow key={c._id} c={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c._id)} />
                ))}
              </div>
            )}
            {recent.length > 0 && (
              <button
                onClick={() => setTab('cases')}
                className="text-sm text-primary font-semibold hover:underline"
              >
                View all cases →
              </button>
            )}
          </div>
        )}

        {/* ── Cases tab ── */}
        {!loading && tab === 'cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">{cases.length} case{cases.length !== 1 ? 's' : ''} total</span>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 text-sm text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-base">add</span>
                New Case
              </button>
            </div>
            {cases.length === 0 ? (
              <EmptyState icon="folder_open" text="No cases yet" sub="Click 'New Case' to add your first client case." />
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <CaseRow key={c._id} c={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c._id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Clients tab ── */}
        {!loading && tab === 'clients' && (
          <div className="space-y-4">
            <span className="text-sm text-on-surface-variant">{clients.length} unique client{clients.length !== 1 ? 's' : ''}</span>
            {clients.length === 0 ? (
              <EmptyState icon="group" text="No clients yet" sub="Clients appear here once you create cases for them." />
            ) : (
              <div className="space-y-3">
                {clients.map((cl) => (
                  <div key={cl.email} className="bg-surface-container-low rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary font-headline">
                          {cl.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white font-headline">{cl.name}</div>
                        <div className="text-xs text-on-surface-variant">{cl.email}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{cl.totalCases} case{cl.totalCases !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-primary">{cl.activeCases} active</div>
                      </div>
                    </div>
                    {cl.cases.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cl.cases.map((c) => (
                          <span
                            key={c.id}
                            className="text-[11px] px-2.5 py-1 bg-surface-container rounded-lg text-on-surface-variant border border-white/5"
                          >
                            {c.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Case form modal ── */}
      {showForm && (
        <CaseFormModal
          form={form}
          onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          isEdit={!!editCase}
          saving={saving}
          error={formError}
        />
      )}
    </>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function CaseRow({ c, onEdit, onDelete }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 flex items-center gap-4 group hover:bg-surface-container transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-bold text-white font-headline truncate">{c.title}</span>
          <StatusBadge status={c.status} />
          <span className={`text-xs font-bold uppercase ${PRIORITY_STYLE[c.priority] || ''}`}>
            {c.priority}
          </span>
        </div>
        <div className="text-sm text-on-surface-variant">
          {c.clientName}
          {c.clientEmail && <span className="ml-2 text-xs opacity-60">{c.clientEmail}</span>}
          {c.caseType    && <span className="ml-2 px-1.5 py-0.5 bg-surface-container rounded text-[10px]">{c.caseType}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div className="text-center py-16 space-y-3">
      <span className="material-symbols-outlined text-5xl block opacity-20">{icon}</span>
      <p className="text-white/30 font-headline font-bold text-lg">{text}</p>
      <p className="text-sm text-on-surface-variant">{sub}</p>
    </div>
  );
}

const CASE_TYPES = [
  'Contract Review', 'Property Law', 'Family Law', 'Criminal Defence',
  'Employment Law', 'Corporate Law', 'Intellectual Property', 'Dispute Resolution', 'Other',
];

function CaseFormModal({ form, onChange, onSave, onClose, isEdit, saving, error }) {
  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="space-y-1">
      <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-low rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-headline font-bold text-white">
            {isEdit ? 'Edit Case' : 'New Case'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {field('Case Title *', 'title', 'text', 'e.g. Sharma Property Dispute')}

          <div className="grid grid-cols-2 gap-4">
            {field('Client Name *', 'clientName', 'text', 'Full name')}
            {field('Client Email *', 'clientEmail', 'email', 'client@example.com')}
          </div>

          {/* Case type dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Case Type</label>
            <select
              value={form.caseType}
              onChange={(e) => onChange('caseType', e.target.value)}
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none transition-colors"
            >
              <option value="">Select type…</option>
              {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none"
              >
                {['active', 'pending', 'on-hold', 'closed'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => onChange('priority', e.target.value)}
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none"
              >
                {['high', 'medium', 'low'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Brief description of the case…"
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none resize-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Internal Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Private notes visible only to you…"
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-white text-sm py-2.5 px-3 rounded-lg outline-none resize-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-on-surface-variant hover:text-white text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {saving ? (
                <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Saving…</>
              ) : (
                <><span className="material-symbols-outlined text-lg">save</span>{isEdit ? 'Save Changes' : 'Create Case'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
