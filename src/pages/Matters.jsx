import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { mattersApi } from '../api/matters.api';
import { tasksApi }   from '../api/tasks.api';
import { timeApi }    from '../api/timeTracking.api';
import { billingApi } from '../api/billing.api';

/* ── Constants ─────────────────────────────────────────────────── */
const PRACTICE_AREAS = [
  'Family Law','Criminal','Contract','Property','Immigration',
  'Employment','IP','Personal Injury','Tax','Civil','Corporate','Other',
];
const STAGES   = ['Intake','Open','In Discovery','Pre-Trial','Trial','Settlement','Closed','Archived'];
const STATUSES = ['active','pending','on_hold','closed','archived'];
const BILLING_TYPES = ['hourly','flat_fee','contingency','retainer','pro_bono'];

const STATUS_META = {
  active:   { label: 'Active',   bg: 'var(--green-bg)',  color: 'var(--green)'       },
  pending:  { label: 'Pending',  bg: 'var(--amber-bg)', color: 'var(--amber)'       },
  on_hold:  { label: 'On Hold',  bg: '#FEF3C7',         color: '#92400E'            },
  closed:   { label: 'Closed',   bg: 'var(--active)',   color: 'var(--text-muted)'  },
  archived: { label: 'Archived', bg: 'var(--active)',   color: 'var(--text-muted)'  },
};

const BILLING_LABEL = {
  hourly: 'Hourly', flat_fee: 'Flat Fee', contingency: 'Contingency',
  retainer: 'Retainer', pro_bono: 'Pro Bono',
};

const TABS = ['Overview','Tasks','Notes','Documents','Time','Billing'];
const ease = [0.22, 1, 0.36, 1];

/* ── Helpers ────────────────────────────────────────────────────── */
function clientName(m) {
  if (!m.clientId) return null;
  const c = m.clientId;
  return c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.company || null;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(n) {
  if (!n) return '—';
  return `$${Number(n).toLocaleString()}`;
}

/* ── StatusBadge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      background: m.bg, color: m.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: m.color }} />
      {m.label}
    </span>
  );
}

/* ── EmptyState ───────────────────────────────────────────────── */
function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        {icon}
      </div>
      <div className="h-title" style={{ fontSize: 19, marginBottom: 8 }}>{title}</div>
      <p className="t-secondary" style={{ fontSize: 14, marginBottom: 20 }}>{sub}</p>
      {action && <button className="btn btn-purple" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* ── CloseMatterModal ─────────────────────────────────────────── */
function CloseMatterModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try { await onConfirm({ closureReason: reason, closureNotes: notes }); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 24px 64px rgba(11,11,20,0.18)', border: '1px solid var(--border)', padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(220,38,96,0.08)', display: 'grid', placeItems: 'center', color: 'var(--red)' }}>
            <I.X size={20} />
          </div>
          <div>
            <div className="h-title" style={{ fontSize: 18 }}>Close Matter</div>
            <div className="t-secondary" style={{ fontSize: 13, marginTop: 2 }}>Record the reason for closing this matter</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Closure Reason</label>
            <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Settlement reached, case dismissed…" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Additional Notes</label>
            <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any final notes about this matter…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleConfirm} disabled={saving}
            style={{ background: 'var(--red)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Closing…' : 'Close Matter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── MatterModal ─────────────────────────────────────────────── */
function MatterModal({ matter, onClose, onSave }) {
  const [form, setForm] = useState({
    title:         matter?.title || '',
    description:   matter?.description || '',
    practiceArea:  matter?.practiceArea || 'Other',
    status:        matter?.status || 'active',
    stage:         matter?.stage || 'Intake',
    billingType:   matter?.billingType || 'hourly',
    hourlyRate:    matter?.hourlyRate || '',
    estimatedValue:matter?.estimatedValue || '',
    openDate:      matter?.openDate ? new Date(matter.openDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    courtName:     matter?.courtName || '',
    courtCaseNumber: matter?.courtCaseNumber || '',
    opposingParty:   matter?.opposingParty || '',
    opposingCounsel: matter?.opposingCounsel || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Matter title is required'); return; }
    setSaving(true);
    try {
      const r = matter
        ? await mattersApi.update(matter._id, form)
        : await mattersApi.create(form);
      onSave(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save matter');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, children, half }) => (
    <div style={{ marginBottom: half ? 0 : 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(11,11,20,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25, ease }}
        style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 24, boxShadow: '0 32px 80px rgba(11,11,20,0.18)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="h-title" style={{ fontSize: 22 }}>{matter ? 'Edit Matter' : 'New Matter'}</div>
            <div className="t-secondary" style={{ fontSize: 13, marginTop: 2 }}>{matter ? 'Update matter details' : 'Create a new legal matter'}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
            <I.X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && (
            <div style={{ background: 'rgba(220,38,96,0.07)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 18, border: '1px solid rgba(220,38,96,0.2)' }}>{error}</div>
          )}
          <Field label="Matter Title *">
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Smith v. Johnson — Employment Dispute" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Field label="Practice Area" half>
              <select className="input" value={form.practiceArea} onChange={e => set('practiceArea', e.target.value)} style={{ cursor: 'pointer' }}>
                {PRACTICE_AREAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)} style={{ cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
              </select>
            </Field>
            <Field label="Stage" half>
              <select className="input" value={form.stage} onChange={e => set('stage', e.target.value)} style={{ cursor: 'pointer' }}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Open Date" half>
              <input className="input" type="date" value={form.openDate} onChange={e => set('openDate', e.target.value)} />
            </Field>
            <Field label="Billing Type" half>
              <select className="input" value={form.billingType} onChange={e => set('billingType', e.target.value)} style={{ cursor: 'pointer' }}>
                {BILLING_TYPES.map(b => <option key={b} value={b}>{BILLING_LABEL[b]}</option>)}
              </select>
            </Field>
            <Field label="Hourly Rate ($)" half>
              <input className="input" type="number" min="0" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} placeholder="250" />
            </Field>
          </div>
          <Field label="Estimated Value ($)">
            <input className="input" type="number" min="0" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} placeholder="10000" />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the matter…" style={{ resize: 'vertical' }} />
          </Field>
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 16px', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Court / Opposing Party</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
              <Field label="Court Name" half>
                <input className="input" value={form.courtName} onChange={e => set('courtName', e.target.value)} placeholder="Supreme Court of Pakistan" />
              </Field>
              <Field label="Case Number" half>
                <input className="input" value={form.courtCaseNumber} onChange={e => set('courtCaseNumber', e.target.value)} placeholder="2024-CIV-0042" />
              </Field>
              <Field label="Opposing Party" half>
                <input className="input" value={form.opposingParty} onChange={e => set('opposingParty', e.target.value)} placeholder="Party name" />
              </Field>
              <Field label="Opposing Counsel" half>
                <input className="input" value={form.opposingCounsel} onChange={e => set('opposingCounsel', e.target.value)} placeholder="Attorney name" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : matter ? 'Update Matter' : 'Create Matter'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── TaskRow ──────────────────────────────────────────────────── */
const TASK_STATUS_COLOR = { todo: 'var(--text-muted)', in_progress: 'var(--amber)', review: 'var(--purple)', done: 'var(--green)' };
const TASK_PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };

function TaskRow({ task, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => onToggle(task)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.status === 'done' ? 'var(--green)' : 'var(--border)'}`, background: task.status === 'done' ? 'var(--green)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {task.status === 'done' && <I.Check size={12} style={{ color: '#fff' }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--ink)' }}>{task.title}</div>
        {task.dueDate && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Due {fmtDate(task.dueDate)}</div>}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: TASK_PRIORITY_COLOR[task.priority] || 'var(--text-muted)' }}>{task.priority}</span>
    </div>
  );
}

/* ── NoteCard ─────────────────────────────────────────────────── */
function NoteCard({ note, onDelete, onPin, onEdit }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: note.isPinned ? 'rgba(124,58,237,0.04)' : 'var(--surface)', border: `1px solid ${note.isPinned ? 'var(--purple-mist)' : 'var(--border)'}`, display: 'flex', gap: 14 }}>
      {note.isPinned && (
        <div style={{ width: 3, borderRadius: 2, background: 'var(--purple)', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{note.text}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {note.createdBy?.name && `${note.createdBy.name} · `}{fmtDate(note.createdAt)}
            {note.updatedAt && ' (edited)'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onPin(note._id)} style={{ fontSize: 11, fontWeight: 600, color: note.isPinned ? 'var(--purple)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}>
              {note.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button onClick={() => onDelete(note._id)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MatterDetail ─────────────────────────────────────────────── */
function MatterDetail({ matter, onEdit, onBack, onMatterChange }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Notes state
  const [notes, setNotes]         = useState([]);
  const [noteText, setNoteText]   = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);

  // Tasks state
  const [tasks, setTasks]         = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Time entries state
  const [timeEntries, setTimeEntries] = useState([]);
  const [timeLoaded, setTimeLoaded]   = useState(false);

  // Invoices state
  const [invoices, setInvoices]     = useState([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  useEffect(() => { setNotesLoaded(false); setTasksLoaded(false); setTimeLoaded(false); setInvoicesLoaded(false); }, [matter._id]);

  useEffect(() => {
    if (activeTab === 'Notes' && !notesLoaded) {
      mattersApi.notes(matter._id)
        .then(r => setNotes(r.data.data || []))
        .catch(() => {})
        .finally(() => setNotesLoaded(true));
    }
  }, [activeTab, notesLoaded, matter._id]);

  useEffect(() => {
    if (activeTab === 'Tasks' && !tasksLoaded) {
      tasksApi.list({ matterId: matter._id, limit: 100 })
        .then(r => setTasks(r.data.data?.tasks || r.data.data || []))
        .catch(() => {})
        .finally(() => setTasksLoaded(true));
    }
  }, [activeTab, tasksLoaded, matter._id]);

  useEffect(() => {
    if (activeTab === 'Time' && !timeLoaded) {
      timeApi.list({ matterId: matter._id, limit: 100 })
        .then(r => setTimeEntries(r.data.data?.entries || r.data.data || []))
        .catch(() => {})
        .finally(() => setTimeLoaded(true));
    }
  }, [activeTab, timeLoaded, matter._id]);

  useEffect(() => {
    if (activeTab === 'Billing' && !invoicesLoaded) {
      billingApi.listInvoices({ matterId: matter._id, limit: 50 })
        .then(r => setInvoices(r.data.data?.invoices || r.data.data || []))
        .catch(() => {})
        .finally(() => setInvoicesLoaded(true));
    }
  }, [activeTab, invoicesLoaded, matter._id]);

  async function submitNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const r = await mattersApi.addNote(matter._id, { text: noteText });
      setNotes(n => [r.data.data, ...n]);
      setNoteText('');
    } catch { /* silent */ } finally { setAddingNote(false); }
  }

  async function deleteNote(noteId) {
    setNotes(n => n.filter(x => x._id !== noteId));
    try { await mattersApi.deleteNote(matter._id, noteId); }
    catch { mattersApi.notes(matter._id).then(r => setNotes(r.data.data || [])); }
  }

  async function pinNote(noteId) {
    try {
      await mattersApi.pinNote(matter._id, noteId);
      setNotes(n => n.map(x => x._id === noteId ? { ...x, isPinned: !x.isPinned } : x)
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));
    } catch { /* silent */ }
  }

  async function toggleTask(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(task._id, { status: newStatus }); }
    catch { setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: task.status } : t)); }
  }

  async function handleClose(payload) {
    try {
      const r = await mattersApi.close(matter._id, payload);
      onMatterChange(r.data.data);
      setShowCloseModal(false);
    } catch { /* silent */ }
  }

  async function handleArchive() {
    try {
      const r = await mattersApi.archive(matter._id);
      onMatterChange(r.data.data);
    } catch { /* silent */ }
  }

  async function handleReopen() {
    try {
      const r = await mattersApi.reopen(matter._id);
      onMatterChange(r.data.data);
    } catch { /* silent */ }
  }

  const daysOpen = matter.openDate
    ? Math.floor((Date.now() - new Date(matter.openDate)) / 86400000)
    : 0;

  const isClosed   = matter.status === 'closed' || matter.status === 'archived';
  const clientDisplay = clientName(matter);

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
          <I.ArrowLeft size={15} /> All Matters
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 className="h-title" style={{ fontSize: 26 }}>{matter.title}</h1>
            <StatusBadge status={matter.status} />
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'var(--purple-soft)', color: 'var(--purple)' }}>{matter.practiceArea}</span>
          </div>
          <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)', fontSize: 13, flexWrap: 'wrap' }}>
            {matter.matterNumber && <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{matter.matterNumber}</span>}
            {clientDisplay && <span><I.User size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{clientDisplay}</span>}
            {matter.assignedTo?.length > 0 && <span><I.Briefcase size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{matter.assignedTo.map(u => u.name).join(', ')}</span>}
            <span><I.Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{daysOpen}d open</span>
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{matter.stage}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isClosed ? (
            <button className="btn btn-secondary btn-sm" onClick={handleReopen}>Reopen</button>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleArchive}>Archive</button>
              <button className="btn btn-sm" onClick={() => setShowCloseModal(true)} style={{ background: 'rgba(220,38,96,0.08)', color: 'var(--red)', border: '1px solid rgba(220,38,96,0.2)' }}>Close Matter</button>
            </>
          )}
          <button className="btn btn-purple btn-sm" onClick={onEdit}><I.Settings size={14} /> Edit</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { l: 'Billing',    v: BILLING_LABEL[matter.billingType] || '—' },
          { l: 'Hourly Rate', v: matter.hourlyRate ? `$${matter.hourlyRate}/hr` : '—' },
          { l: 'Est. Value',  v: fmtCurrency(matter.estimatedValue) },
          { l: 'Days Open',   v: daysOpen },
          { l: 'Opened',      v: fmtDate(matter.openDate) },
        ].map(({ l, v }) => (
          <div key={l} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 17 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* Overview */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
              <div className="card" style={{ padding: 28 }}>
                <div className="h-title" style={{ fontSize: 16, marginBottom: 16 }}>Matter Details</div>
                {matter.description && (
                  <p className="t-secondary" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{matter.description}</p>
                )}
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    ['Practice Area', matter.practiceArea],
                    ['Status', STATUS_META[matter.status]?.label || matter.status],
                    ['Stage', matter.stage],
                    ['Billing Type', BILLING_LABEL[matter.billingType] || '—'],
                    ['Opened', fmtDate(matter.openDate)],
                    matter.closeDate && ['Closed', fmtDate(matter.closeDate)],
                    matter.courtName && ['Court', matter.courtName],
                    matter.courtCaseNumber && ['Case Number', matter.courtCaseNumber],
                    matter.opposingParty && ['Opposing Party', matter.opposingParty],
                    matter.opposingCounsel && ['Opposing Counsel', matter.opposingCounsel],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                {matter.closureReason && (
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(220,38,96,0.05)', border: '1px solid rgba(220,38,96,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Closure Reason</div>
                    <p style={{ fontSize: 13, color: 'var(--ink)' }}>{matter.closureReason}</p>
                    {matter.closureNotes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{matter.closureNotes}</p>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Client card */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Client</div>
                  {clientDisplay ? (
                    <>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{clientDisplay}</div>
                      {matter.clientId?.email && <div className="t-secondary" style={{ fontSize: 13 }}>{matter.clientId.email}</div>}
                    </>
                  ) : (
                    <div className="t-secondary" style={{ fontSize: 13 }}>No client linked</div>
                  )}
                  {matter.coClients?.length > 0 && (
                    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Co-Clients</div>
                      {matter.coClients.map(c => (
                        <div key={c._id} style={{ fontSize: 13, marginBottom: 4 }}>
                          {c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.company}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Stage pipeline */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Stage Pipeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {STAGES.map((s, i) => {
                      const current = STAGES.indexOf(matter.stage);
                      const past = i < current, active = i === current;
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 11, background: active ? 'var(--purple)' : past ? 'var(--green)' : 'var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            {past && <I.Check size={11} style={{ color: '#fff' }} />}
                            {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--purple)' : past ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Tags */}
                {matter.tags?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>Tags</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {matter.tags.map(t => (
                        <span key={t} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'var(--active)', color: 'var(--text-secondary)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks */}
          {activeTab === 'Tasks' && (
            <div style={{ maxWidth: 720 }}>
              {!tasksLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState icon={<I.Check size={26} />} title="No tasks yet" sub="Tasks assigned to this matter will appear here." />
              ) : (
                <div className="card" style={{ padding: '8px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Tasks ({tasks.length})</span>
                    <span style={{ fontSize: 13, color: 'var(--green)' }}>{tasks.filter(t => t.status === 'done').length} done</span>
                  </div>
                  {tasks.map(t => <TaskRow key={t._id} task={t} onToggle={toggleTask} />)}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {activeTab === 'Notes' && (
            <div style={{ maxWidth: 720 }}>
              <div className="card" style={{ padding: 22, marginBottom: 20 }}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>Add Note</div>
                <textarea className="input" rows={4} placeholder="Write a note about this matter…" value={noteText} onChange={e => setNoteText(e.target.value)} style={{ marginBottom: 12, resize: 'vertical' }} />
                <button className="btn btn-purple btn-sm" onClick={submitNote} disabled={addingNote || !noteText.trim()}>
                  {addingNote ? 'Adding…' : 'Add Note'}
                </button>
              </div>
              {!notesLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
                </div>
              ) : notes.length === 0 ? (
                <EmptyState icon={<I.Doc size={26} />} title="No notes yet" sub="Add notes to track important information about this matter." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notes.map(n => (
                    <NoteCard key={n._id} note={n} onDelete={deleteNote} onPin={pinNote} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {activeTab === 'Documents' && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <I.Doc size={28} />
              </div>
              <div className="h-title" style={{ fontSize: 20, marginBottom: 8 }}>Matter Documents</div>
              <p className="t-secondary" style={{ fontSize: 14, marginBottom: 20 }}>Upload and manage documents related to this matter from the Document Studio.</p>
              <a href="/documents" className="btn btn-purple" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <I.Upload size={15} /> Go to Documents
              </a>
            </div>
          )}

          {/* Time */}
          {activeTab === 'Time' && (
            <div style={{ maxWidth: 720 }}>
              {!timeLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
                </div>
              ) : timeEntries.length === 0 ? (
                <EmptyState icon={<I.Clock size={26} />} title="No time entries" sub="Time entries logged against this matter will appear here." />
              ) : (
                <div className="card" style={{ padding: '8px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Time Entries ({timeEntries.length})</span>
                    <span style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600 }}>
                      {timeEntries.reduce((s, e) => s + (e.duration || 0), 0).toFixed(1)}h total
                    </span>
                  </div>
                  {timeEntries.map(e => (
                    <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{e.description || e.activityType || 'Time entry'}</div>
                        {e.date && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(e.date)}</div>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>{e.duration?.toFixed(1) || '—'}h</span>
                      {e.isBillable && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Billable</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billing */}
          {activeTab === 'Billing' && (
            <div style={{ maxWidth: 720 }}>
              {!invoicesLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
                </div>
              ) : invoices.length === 0 ? (
                <EmptyState icon={<I.Receipt size={26} />} title="No invoices yet" sub="Invoices for this matter will appear here." />
              ) : (
                <div className="card" style={{ padding: '8px 20px' }}>
                  <div style={{ padding: '12px 0 8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Invoices ({invoices.length})</span>
                  </div>
                  {invoices.map(inv => (
                    <div key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.invoiceNumber || inv._id}</div>
                        {inv.dueDate && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Due {fmtDate(inv.dueDate)}</div>}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtCurrency(inv.total)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: inv.status === 'paid' ? 'var(--green-bg)' : 'var(--amber-bg)', color: inv.status === 'paid' ? 'var(--green)' : 'var(--amber)' }}>{inv.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Close modal */}
      <AnimatePresence>
        {showCloseModal && (
          <CloseMatterModal onClose={() => setShowCloseModal(false)} onConfirm={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── MatterCard ──────────────────────────────────────────────── */
function MatterCard({ matter, onClick }) {
  const daysOpen = matter.openDate
    ? Math.floor((Date.now() - new Date(matter.openDate)) / 86400000)
    : 0;
  const client = clientName(matter);

  return (
    <motion.div className="card" style={{ padding: 22, cursor: 'pointer' }} onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(11,11,20,0.10)' }} layout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div className="h-title" style={{ fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matter.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{client || 'No client linked'}</div>
        </div>
        <StatusBadge status={matter.status} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600 }}>{matter.practiceArea}</span>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--active)', color: 'var(--text-secondary)', fontWeight: 500 }}>{matter.stage}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{daysOpen}d open</span>
        <span>{BILLING_LABEL[matter.billingType] || '—'}{matter.hourlyRate ? ` · $${matter.hourlyRate}/hr` : ''}</span>
        {matter.matterNumber && <span style={{ fontFamily: 'monospace' }}>{matter.matterNumber}</span>}
      </div>
    </motion.div>
  );
}

/* ── MatterListRow ───────────────────────────────────────────── */
function MatterListRow({ matter, onClick }) {
  const client = clientName(matter);
  return (
    <div className="card" style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={onClick}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matter.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{client || '—'}</div>
      </div>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{matter.practiceArea}</span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{matter.stage}</span>
      <StatusBadge status={matter.status} />
      {matter.matterNumber && <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 80, textAlign: 'right' }}>{matter.matterNumber}</span>}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Matters() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  const [matters,       setMatters]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterArea,    setFilterArea]    = useState('all');
  const [showModal,     setShowModal]     = useState(false);
  const [editingMatter, setEditingMatter] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [view,          setView]          = useState('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await mattersApi.list();
      setMatters(r.data.data?.matters || []);
    } catch {
      setError('Failed to load matters. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      setSelectedMatter(fresh.data.data);
    }
  }

  function handleMatterChange(updated) {
    setSelectedMatter(updated);
    setMatters(ms => ms.map(m => m._id === updated._id ? updated : m));
  }

  const filtered = matters.filter(m => {
    const matchSearch = !search
      || m.title?.toLowerCase().includes(search.toLowerCase())
      || clientName(m)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchArea   = filterArea === 'all' || m.practiceArea === filterArea;
    return matchSearch && matchStatus && matchArea;
  });

  const stats = {
    total:    matters.length,
    active:   matters.filter(m => m.status === 'active').length,
    pending:  matters.filter(m => m.status === 'pending').length,
    closed:   matters.filter(m => m.status === 'closed' || m.status === 'archived').length,
  };

  /* Detail view */
  if (selectedMatter) {
    return (
      <div style={{ padding: '80px 28px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <MatterDetail
          matter={selectedMatter}
          onBack={() => { setSelectedMatter(null); navigate('/matters'); }}
          onEdit={() => { setEditingMatter(selectedMatter); setShowModal(true); }}
          onMatterChange={handleMatterChange}
        />
        <AnimatePresence>
          {showModal && (
            <MatterModal
              matter={editingMatter}
              onClose={() => { setShowModal(false); setEditingMatter(null); }}
              onSave={async (saved) => {
                setShowModal(false);
                const fresh = await mattersApi.get(saved._id || selectedMatter._id);
                const updated = fresh.data.data;
                setSelectedMatter(updated);
                setMatters(ms => ms.map(m => m._id === updated._id ? updated : m));
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="h-title" style={{ fontSize: 30, marginBottom: 4 }}>Matters</h1>
          <p className="t-secondary" style={{ fontSize: 14 }}>Manage all your legal cases and client matters</p>
        </div>
        <button className="btn btn-purple" onClick={() => { setEditingMatter(null); setShowModal(true); }}>
          <I.Upload size={16} style={{ transform: 'rotate(90deg)' }} /> New Matter
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { l: 'Total',   v: stats.total,   col: 'var(--purple)',      bg: 'var(--purple-soft)' },
          { l: 'Active',  v: stats.active,  col: 'var(--green)',       bg: 'var(--green-bg)'    },
          { l: 'Pending', v: stats.pending, col: 'var(--amber)',       bg: 'var(--amber-bg)'    },
          { l: 'Closed',  v: stats.closed,  col: 'var(--text-muted)', bg: 'var(--active)'      },
        ].map(({ l, v, col, bg }) => (
          <div key={l} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 28, color: col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search matters or clients…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140, cursor: 'pointer' }}>
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
        </select>
        <select className="input" value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ width: 180, cursor: 'pointer' }}>
          <option value="all">All Areas</option>
          {PRACTICE_AREAS.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4, background: 'var(--active)', borderRadius: 10, padding: 4 }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ width: 34, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: view === v ? 'var(--surface)' : 'transparent', color: view === v ? 'var(--purple)' : 'var(--text-muted)', boxShadow: view === v ? '0 1px 4px rgba(11,11,20,0.08)' : 'none', transition: 'all 0.15s' }}>
              {v === 'grid' ? <I.Chart size={15} /> : <I.Doc size={15} />}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, border: '1px solid rgba(217,119,6,0.2)' }}>
          <I.Alert size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />{error}
        </div>
      )}

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(m => <MatterCard key={m._id} matter={m} onClick={() => setSelectedMatter(m)} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => <MatterListRow key={m._id} matter={m} onClick={() => setSelectedMatter(m)} />)}
        </div>
      )}

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
