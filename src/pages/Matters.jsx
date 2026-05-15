import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { mattersApi } from '../api/matters.api';

/* ── Constants ───────────────────────────────────────────── */
const STATUSES = ['Open', 'Pending', 'Closed'];
const BILLING_TYPES = ['Hourly', 'Flat Fee', 'Contingency', 'Retainer', 'Subscription'];
const PRACTICE_AREAS = [
  'Corporate', 'Litigation', 'Family', 'Criminal', 'Real Estate',
  'Employment', 'Immigration', 'Intellectual Property', 'Tax', 'Personal Injury',
  'Bankruptcy', 'Estate Planning', 'Civil Rights', 'Environmental', 'Other',
];
const STAGES = ['Intake', 'Active', 'Discovery', 'Negotiation', 'Trial', 'Appeal', 'Closed'];

const STATUS_COLORS = {
  Open:    { bg: 'var(--green-bg)',  color: 'var(--green)' },
  Pending: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
  Closed:  { bg: 'var(--active)',   color: 'var(--text-muted)' },
};

const TABS = ['Overview', 'Documents', 'Time', 'Billing', 'Tasks', 'Notes', 'Calendar'];

const ease = [0.22, 1, 0.36, 1];

/* ── Shared helpers ──────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: s.color }} />
      {status}
    </span>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'var(--purple-soft)', color: 'var(--purple)',
        display: 'grid', placeItems: 'center', margin: '0 auto 20px',
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 20, marginBottom: 8 }}>{title}</div>
      <p className="t-secondary" style={{ fontSize: 14, marginBottom: 24 }}>{sub}</p>
      {action && (
        <button className="btn btn-purple" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}

/* ── Matter Form Modal ───────────────────────────────────── */
function MatterModal({ matter, onClose, onSave }) {
  const [form, setForm] = useState({
    name: matter?.name || '',
    description: matter?.description || '',
    client_name: matter?.client_name || '',
    client_email: matter?.client_email || '',
    practice_area: matter?.practice_area || 'Corporate',
    status: matter?.status || 'Open',
    stage: matter?.stage || 'Intake',
    billing_type: matter?.billing_type || 'Hourly',
    rate: matter?.rate || '',
    budget: matter?.budget || '',
    open_date: matter?.open_date || new Date().toISOString().slice(0, 10),
    responsible_attorney: matter?.responsible_attorney || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Matter name is required'); return; }
    setSaving(true);
    try {
      const result = matter
        ? await mattersApi.update(matter._id, form)
        : await mattersApi.create(form);
      onSave(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save matter');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(11,11,20,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease }}
        style={{
          width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--surface)', borderRadius: 24,
          boxShadow: '0 32px 80px rgba(11,11,20,0.18)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="h-title" style={{ fontSize: 22 }}>{matter ? 'Edit Matter' : 'New Matter'}</div>
            <div className="t-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              {matter ? 'Update matter details' : 'Create a new legal matter'}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
            <I.X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 18, border: '1px solid rgba(220,38,96,0.15)' }}>
              {error}
            </div>
          )}

          <Field label="Matter Name *">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Smith v. Johnson — Employment Dispute" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Practice Area">
              <select className="input" value={form.practice_area} onChange={e => set('practice_area', e.target.value)} style={{ cursor: 'pointer' }}>
                {PRACTICE_AREAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)} style={{ cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className="input" value={form.stage} onChange={e => set('stage', e.target.value)} style={{ cursor: 'pointer' }}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Open Date">
              <input className="input" type="date" value={form.open_date} onChange={e => set('open_date', e.target.value)} />
            </Field>
          </div>

          <Field label="Client Name">
            <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Client full name or company" />
          </Field>
          <Field label="Client Email">
            <input className="input" type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="client@email.com" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="Billing Type">
              <select className="input" value={form.billing_type} onChange={e => set('billing_type', e.target.value)} style={{ cursor: 'pointer' }}>
                {BILLING_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Rate ($/hr)">
              <input className="input" type="number" min="0" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="250" />
            </Field>
            <Field label="Budget ($)">
              <input className="input" type="number" min="0" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="5000" />
            </Field>
          </div>

          <Field label="Responsible Attorney">
            <input className="input" value={form.responsible_attorney} onChange={e => set('responsible_attorney', e.target.value)} placeholder="Attorney name" />
          </Field>

          <Field label="Description">
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the matter…" style={{ resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>
              {saving ? 'Saving…' : matter ? 'Update Matter' : 'Create Matter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Matter Detail ───────────────────────────────────────── */
function MatterDetail({ matter, onEdit, onBack, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    mattersApi.notes(matter._id).then(r => setNotes(r.data || [])).catch(() => {});
  }, [matter._id]);

  async function submitNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const r = await mattersApi.addNote(matter._id, { content: noteText });
      setNotes(n => [r.data, ...n]);
      setNoteText('');
    } catch { /* silent */ } finally { setAddingNote(false); }
  }

  const daysOpen = matter.open_date
    ? Math.floor((Date.now() - new Date(matter.open_date)) / 86400000)
    : 0;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
          <I.ArrowLeft size={15} /> All Matters
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 className="h-title" style={{ fontSize: 26 }}>{matter.name}</h1>
            <StatusBadge status={matter.status} />
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'var(--purple-soft)', color: 'var(--purple)' }}>
              {matter.practice_area}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)', fontSize: 13, flexWrap: 'wrap' }}>
            {matter.client_name && <span><I.User size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{matter.client_name}</span>}
            {matter.responsible_attorney && <span><I.Briefcase size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{matter.responsible_attorney}</span>}
            <span><I.Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{daysOpen} days open</span>
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{matter.stage}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Quick status toggle */}
          {matter.status !== 'Closed' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange(matter.status === 'Open' ? 'Pending' : 'Open')}>
              Mark {matter.status === 'Open' ? 'Pending' : 'Open'}
            </button>
          )}
          {matter.status !== 'Closed' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onStatusChange('Closed')} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
              Close Matter
            </button>
          )}
          <button className="btn btn-purple btn-sm" onClick={onEdit}>
            <I.Settings size={14} /> Edit
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { l: 'Billing Type', v: matter.billing_type || '—' },
          { l: 'Rate', v: matter.rate ? `$${matter.rate}/hr` : '—' },
          { l: 'Budget', v: matter.budget ? `$${Number(matter.budget).toLocaleString()}` : '—' },
          { l: 'Days Open', v: daysOpen },
        ].map(({ l, v }) => (
          <div key={l} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 18 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 28 }}>
        {TABS.map(t => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              <div className="card" style={{ padding: 28 }}>
                <div className="h-title" style={{ fontSize: 16, marginBottom: 16 }}>Matter Details</div>
                {matter.description && (
                  <p className="t-secondary" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>{matter.description}</p>
                )}
                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    ['Practice Area', matter.practice_area],
                    ['Status', matter.status],
                    ['Stage', matter.stage],
                    ['Billing Type', matter.billing_type],
                    ['Open Date', matter.open_date ? new Date(matter.open_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
                    ['Responsible Attorney', matter.responsible_attorney || '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="card" style={{ padding: 22, marginBottom: 16 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Client</div>
                  {matter.client_name ? (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{matter.client_name}</div>
                      {matter.client_email && <div className="t-secondary" style={{ fontSize: 13 }}>{matter.client_email}</div>}
                    </>
                  ) : (
                    <div className="t-secondary" style={{ fontSize: 13 }}>No client linked</div>
                  )}
                </div>
                <div className="card" style={{ padding: 22 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Stage Pipeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {STAGES.map((s, i) => {
                      const current = STAGES.indexOf(matter.stage);
                      const past = i < current, active = i === current;
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 11,
                            background: active ? 'var(--purple)' : past ? 'var(--green)' : 'var(--border)',
                            display: 'grid', placeItems: 'center', flexShrink: 0,
                          }}>
                            {past && <I.Check size={12} style={{ color: '#fff' }} />}
                            {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--purple)' : past ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notes' && (
            <div style={{ maxWidth: 720 }}>
              <div className="card" style={{ padding: 22, marginBottom: 20 }}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Add Note</div>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Write a note about this matter…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <button className="btn btn-purple btn-sm" onClick={submitNote} disabled={addingNote || !noteText.trim()}>
                  {addingNote ? 'Adding…' : 'Add Note'}
                </button>
              </div>
              {notes.length === 0 ? (
                <EmptyState icon={<I.Doc size={28} />} title="No notes yet" sub="Add notes to track important information about this matter." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {notes.map((n, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 10 }}>{n.content}</p>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('en-US') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {['Documents', 'Time', 'Billing', 'Tasks', 'Calendar'].includes(activeTab) && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                {activeTab === 'Documents' && <I.Doc size={28} />}
                {activeTab === 'Time' && <I.Clock size={28} />}
                {activeTab === 'Billing' && <I.Receipt size={28} />}
                {activeTab === 'Tasks' && <I.Check size={28} />}
                {activeTab === 'Calendar' && <I.Calendar size={28} />}
              </div>
              <div className="h-title" style={{ fontSize: 20, marginBottom: 8 }}>{activeTab} — Coming in Phase 2</div>
              <p className="t-secondary" style={{ fontSize: 14 }}>
                {activeTab === 'Documents' && 'Upload and manage documents related to this matter.'}
                {activeTab === 'Time' && 'Track billable time entries and run timers for this matter.'}
                {activeTab === 'Billing' && 'Generate invoices, manage payments and trust funds.'}
                {activeTab === 'Tasks' && 'Create and assign tasks related to this matter.'}
                {activeTab === 'Calendar' && 'View hearings, deadlines, and appointments for this matter.'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Matter Card ─────────────────────────────────────────── */
function MatterCard({ matter, onClick }) {
  const daysOpen = matter.open_date
    ? Math.floor((Date.now() - new Date(matter.open_date)) / 86400000)
    : 0;

  return (
    <motion.div
      className="card"
      style={{ padding: 22, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(11,11,20,0.10)' }}
      layout
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div className="h-title" style={{ fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matter.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{matter.client_name || 'No client'}</div>
        </div>
        <StatusBadge status={matter.status} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600 }}>{matter.practice_area}</span>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--active)', color: 'var(--text-secondary)', fontWeight: 500 }}>{matter.stage}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{daysOpen}d open</span>
        {matter.billing_type && <span>{matter.billing_type}{matter.rate ? ` · $${matter.rate}/hr` : ''}</span>}
        {matter.responsible_attorney && <span>{matter.responsible_attorney}</span>}
      </div>
    </motion.div>
  );
}

/* ── Main Matters Page ───────────────────────────────────── */
export default function Matters() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterArea, setFilterArea] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingMatter, setEditingMatter] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await mattersApi.list();
      setMatters(r.data || []);
    } catch {
      setError('Failed to load matters. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // If URL has :id, auto-open that matter
  useEffect(() => {
    if (paramId && matters.length) {
      const found = matters.find(m => m._id === paramId);
      if (found) setSelectedMatter(found);
    }
  }, [paramId, matters]);

  async function handleSave(saved) {
    setShowModal(false);
    setEditingMatter(null);
    await load();
    if (saved?._id) {
      const fresh = await mattersApi.get(saved._id);
      setSelectedMatter(fresh.data);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!selectedMatter) return;
    try {
      await mattersApi.update(selectedMatter._id, { status: newStatus });
      setSelectedMatter(m => ({ ...m, status: newStatus }));
      setMatters(ms => ms.map(m => m._id === selectedMatter._id ? { ...m, status: newStatus } : m));
    } catch { /* silent */ }
  }

  const filtered = matters.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    const matchArea   = filterArea === 'All' || m.practice_area === filterArea;
    return matchSearch && matchStatus && matchArea;
  });

  const stats = {
    open:    matters.filter(m => m.status === 'Open').length,
    pending: matters.filter(m => m.status === 'Pending').length,
    closed:  matters.filter(m => m.status === 'Closed').length,
  };

  /* Detail view */
  if (selectedMatter) {
    return (
      <div style={{ padding: '80px 28px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <MatterDetail
          matter={selectedMatter}
          onBack={() => { setSelectedMatter(null); navigate('/matters'); }}
          onEdit={() => { setEditingMatter(selectedMatter); setShowModal(true); }}
          onStatusChange={handleStatusChange}
        />
        <AnimatePresence>
          {showModal && (
            <MatterModal
              matter={editingMatter}
              onClose={() => { setShowModal(false); setEditingMatter(null); }}
              onSave={async (saved) => {
                setShowModal(false);
                const fresh = await mattersApi.get(saved._id || selectedMatter._id);
                setSelectedMatter(fresh.data);
                setMatters(ms => ms.map(m => m._id === fresh.data._id ? fresh.data : m));
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* List view */
  return (
    <div style={{ padding: '80px 28px 100px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="h-title" style={{ fontSize: 30, marginBottom: 4 }}>Matters</h1>
          <p className="t-secondary" style={{ fontSize: 14 }}>Manage all your legal cases and client matters</p>
        </div>
        <button className="btn btn-purple" onClick={() => { setEditingMatter(null); setShowModal(true); }}>
          <I.Upload size={16} style={{ transform: 'rotate(90deg)' }} /> New Matter
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { l: 'Total Matters', v: matters.length, col: 'var(--purple)', bg: 'var(--purple-soft)' },
          { l: 'Open',    v: stats.open,    col: 'var(--green)', bg: 'var(--green-bg)' },
          { l: 'Pending', v: stats.pending, col: 'var(--amber)', bg: 'var(--amber-bg)' },
          { l: 'Closed',  v: stats.closed,  col: 'var(--text-muted)', bg: 'var(--active)' },
        ].map(({ l, v, col, bg }) => (
          <div key={l} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 28, color: col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search matters or clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130, cursor: 'pointer' }}>
          <option>All</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ width: 180, cursor: 'pointer' }}>
          <option>All</option>
          {PRACTICE_AREAS.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4, background: 'var(--active)', borderRadius: 10, padding: 4 }}>
          {['grid', 'list'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                width: 34, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
                background: view === v ? 'var(--surface)' : 'transparent',
                color: view === v ? 'var(--purple)' : 'var(--text-muted)',
                boxShadow: view === v ? '0 1px 4px rgba(11,11,20,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {v === 'grid' ? <I.Chart size={15} /> : <I.Doc size={15} />}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, border: '1px solid rgba(217,119,6,0.2)' }}>
          <I.Alert size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 22, height: 140 }}>
              <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 13, width: '45%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 10, width: '90%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<I.Briefcase size={30} />}
          title={matters.length === 0 ? 'No matters yet' : 'No matches found'}
          sub={matters.length === 0 ? 'Create your first legal matter to get started.' : 'Try adjusting your search or filters.'}
          action={matters.length === 0 ? 'Create First Matter' : undefined}
          onAction={() => { setEditingMatter(null); setShowModal(true); }}
        />
      ) : view === 'grid' ? (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}
        >
          {filtered.map(m => (
            <MatterCard key={m._id} matter={m} onClick={() => setSelectedMatter(m)} />
          ))}
        </motion.div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Matter', 'Client', 'Practice Area', 'Status', 'Stage', 'Attorney', 'Days Open'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m._id}
                  onClick={() => setSelectedMatter(m)}
                  style={{ cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{m.client_name || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600 }}>{m.practice_area}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={m.status} /></td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{m.stage}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{m.responsible_attorney || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    {m.open_date ? Math.floor((Date.now() - new Date(m.open_date)) / 86400000) + 'd' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <MatterModal
            matter={editingMatter}
            onClose={() => { setShowModal(false); setEditingMatter(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
