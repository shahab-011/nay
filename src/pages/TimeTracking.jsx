import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { timeApi } from '../api/timeTracking.api';
import { mattersApi } from '../api/matters.api';

/* ── Helpers ───────────────────────────────────────────────────── */
const pad = n => String(n).padStart(2, '0');

function formatDuration(seconds) {
  const s = Math.max(0, seconds);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n) {
  return '$' + (n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcElapsed(timer) {
  const paused = timer.pausedDuration || 0;
  if (timer.isPaused && timer.pausedAt) {
    return Math.floor((new Date(timer.pausedAt) - new Date(timer.startedAt) - paused) / 1000);
  }
  return Math.floor((Date.now() - new Date(timer.startedAt) - paused) / 1000);
}

const ACTIVITY_TYPES = ['research', 'drafting', 'court', 'client_meeting', 'calls', 'review', 'travel', 'admin', 'other'];
const ACTIVITY_LABELS = {
  research: 'Research', drafting: 'Drafting', court: 'Court',
  client_meeting: 'Client Meeting', calls: 'Calls', review: 'Review',
  travel: 'Travel', admin: 'Admin', other: 'Other',
};
const EXPENSE_CATEGORIES = ['filing_fee', 'court_reporter', 'expert_witness', 'travel', 'copies', 'postage', 'meals', 'other'];
const EXPENSE_LABELS = {
  filing_fee: 'Filing Fee', court_reporter: 'Court Reporter', expert_witness: 'Expert Witness',
  travel: 'Travel', copies: 'Copies', postage: 'Postage', meals: 'Meals', other: 'Other',
};

/* ── Shared UI ─────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)',
  boxSizing: 'border-box', color: 'var(--ink)', outline: 'none',
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width: 38, height: 20, borderRadius: 10, background: value ? 'var(--purple)' : 'var(--border)', position: 'relative', transition: 'background 200ms' }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
    </label>
  );
}

function ModalWrap({ onClose, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-float)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I.X size={18} /></button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled, saveLabel = 'Save' }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
      <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      <button onClick={onSave} disabled={saving || disabled}
        style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: (saving || disabled) ? 0.6 : 1 }}>
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}

/* ── Timer Row ─────────────────────────────────────────────────── */
function TimerRow({ timer, onPause, onResume, onStop }) {
  const [elapsed, setElapsed] = useState(calcElapsed(timer));

  useEffect(() => {
    if (timer.isPaused) { setElapsed(calcElapsed(timer)); return; }
    const id = setInterval(() => setElapsed(calcElapsed(timer)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: timer.isPaused ? 'var(--elevated)' : 'linear-gradient(90deg,rgba(124,58,237,0.06)0%,transparent 100%)',
      borderRadius: 12, border: '1.5px solid var(--border)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: timer.isPaused ? '#F59E0B' : '#10B981' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {timer.matterId?.title || 'No matter'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {ACTIVITY_LABELS[timer.activityType] || timer.activityType || 'Admin'}{timer.description ? ` — ${timer.description}` : ''}
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, color: timer.isPaused ? '#F59E0B' : 'var(--purple)', minWidth: 88, textAlign: 'right' }}>
        {formatDuration(elapsed)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {timer.isPaused ? (
          <button onClick={() => onResume(timer._id)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #10B981', background: 'none', color: '#10B981', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            Resume
          </button>
        ) : (
          <button onClick={() => onPause(timer._id)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            Pause
          </button>
        )}
        <button onClick={() => onStop(timer)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--purple)', background: 'none', color: 'var(--purple)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          Stop
        </button>
      </div>
    </div>
  );
}

/* ── Start Timer Modal ─────────────────────────────────────────── */
function StartTimerModal({ matters, onClose, onStart }) {
  const [form, setForm] = useState({ matterId: '', activityType: 'admin', description: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    try { await onStart(form); onClose(); } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Start Timer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Matter">
          <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={selectStyle}>
            <option value="">No matter</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
          </select>
        </Field>
        <Field label="Activity Type">
          <select value={form.activityType} onChange={e => set('activityType', e.target.value)} style={selectStyle}>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What are you working on?" style={inputStyle} />
        </Field>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} saveLabel="Start Timer" />
      </div>
    </ModalWrap>
  );
}

/* ── Stop Timer Modal ──────────────────────────────────────────── */
function StopTimerModal({ timer, onClose, onStop }) {
  const [form, setForm] = useState({
    activityType: timer.activityType || 'admin',
    description: timer.description || '',
    isBillable: true,
    rate: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    try {
      await onStop(timer._id, { ...form, rate: parseFloat(form.rate) || undefined });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Stop Timer & Log Entry">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Activity Type">
          <select value={form.activityType} onChange={e => set('activityType', e.target.value)} style={selectStyle}>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            placeholder="Work performed…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <Field label="Rate ($/hr)">
          <input type="number" min="0" value={form.rate} onChange={e => set('rate', e.target.value)}
            placeholder="Leave blank for firm default" style={inputStyle} />
        </Field>
        <Toggle label="Billable" value={form.isBillable} onChange={v => set('isBillable', v)} />
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} saveLabel="Save Entry" />
      </div>
    </ModalWrap>
  );
}

/* ── Entry Modal ───────────────────────────────────────────────── */
function EntryModal({ entry, matters, onClose, onSave }) {
  const [form, setForm] = useState(entry?._id ? {
    date:         entry.date ? new Date(entry.date).toISOString().slice(0, 10) : todayStr(),
    matterId:     entry.matterId?._id || entry.matterId || '',
    activityType: entry.activityType || 'admin',
    description:  entry.description || '',
    hours:        String(entry.hours || '1'),
    rate:         String(entry.rate || ''),
    isBillable:   entry.isBillable !== false,
  } : {
    date: todayStr(), matterId: '', activityType: 'admin',
    description: '', hours: '1', rate: '', isBillable: true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const amount = ((parseFloat(form.hours) || 0) * (parseFloat(form.rate) || 0)).toFixed(2);

  async function save() {
    if (!form.description?.trim()) return;
    setSaving(true);
    try {
      await onSave(entry?._id, { ...form, hours: parseFloat(form.hours) || 0, rate: parseFloat(form.rate) || 0 });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title={entry?._id ? 'Edit Time Entry' : 'Log Time'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Activity Type">
            <select value={form.activityType} onChange={e => set('activityType', e.target.value)} style={selectStyle}>
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Matter">
          <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={selectStyle}>
            <option value="">No matter</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
          </select>
        </Field>
        <Field label="Description *">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            placeholder="Work performed…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Hours">
            <input type="number" min="0" step="0.25" value={form.hours} onChange={e => set('hours', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Rate ($/hr)">
            <input type="number" min="0" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
          <Field label="Amount">
            <div style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--elevated)', fontWeight: 700, color: 'var(--ink)' }}>
              ${amount}
            </div>
          </Field>
        </div>
        <Toggle label="Billable" value={form.isBillable} onChange={v => set('isBillable', v)} />
        <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.description?.trim()} saveLabel={entry?._id ? 'Update' : 'Log Time'} />
      </div>
    </ModalWrap>
  );
}

/* ── Expense Modal ─────────────────────────────────────────────── */
function ExpenseModal({ expense, matters, onClose, onSave }) {
  const [form, setForm] = useState(expense?._id ? {
    date:        expense.date ? new Date(expense.date).toISOString().slice(0, 10) : todayStr(),
    matterId:    expense.matterId?._id || expense.matterId || '',
    category:    expense.category || 'other',
    description: expense.description || '',
    amount:      String(expense.amount || ''),
    isBillable:  expense.isBillable !== false,
  } : {
    date: todayStr(), matterId: '', category: 'other',
    description: '', amount: '', isBillable: true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.description?.trim() || !form.amount) return;
    setSaving(true);
    try {
      await onSave(expense?._id, { ...form, amount: parseFloat(form.amount) || 0 });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title={expense?._id ? 'Edit Expense' : 'Add Expense'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)} style={selectStyle}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{EXPENSE_LABELS[c]}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Matter">
          <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={selectStyle}>
            <option value="">No matter</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </Field>
        <Field label="Description *">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            placeholder="Expense details…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <Field label="Amount ($) *">
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={inputStyle} />
        </Field>
        <Toggle label="Billable to client" value={form.isBillable} onChange={v => set('isBillable', v)} />
        <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.description?.trim() || !form.amount} saveLabel={expense?._id ? 'Update' : 'Add Expense'} />
      </div>
    </ModalWrap>
  );
}

/* ── Entry Row ─────────────────────────────────────────────────── */
function EntryRow({ entry, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(entry.date)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.matterId?.title || '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', maxWidth: 220 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description || '—'}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(124,58,237,0.1)', color: 'var(--purple)', whiteSpace: 'nowrap' }}>
          {ACTIVITY_LABELS[entry.activityType] || entry.activityType}
        </span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--ink)', whiteSpace: 'nowrap' }}>{(entry.hours || 0).toFixed(2)}h</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>${entry.rate || 0}/hr</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: entry.isBillable ? 'var(--ink)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {entry.isBillable ? fmtMoney(entry.amount) : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
          background: entry.isBilled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          color: entry.isBilled ? '#10B981' : '#F59E0B' }}>
          {entry.isBilled ? 'Billed' : 'Unbilled'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
          <button onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); }} disabled={deleting}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, color: '#EF4444', fontWeight: 600, opacity: deleting ? 0.5 : 1 }}>Del</button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ── Expense Row ───────────────────────────────────────────────── */
function ExpenseRow({ expense, onEdit, onDelete, onApprove }) {
  const [deleting, setDeleting] = useState(false);
  const SC = {
    pending:  { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
    approved: { bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
  };
  const sc = SC[expense.approvalStatus] || SC.pending;
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(expense.date)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{expense.matterId?.title || '—'}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--elevated)', color: 'var(--ink)' }}>
          {EXPENSE_LABELS[expense.category] || expense.category}
        </span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', maxWidth: 200 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.description}</div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fmtMoney(expense.amount)}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          background: expense.isBillable ? 'rgba(124,58,237,0.1)' : 'var(--elevated)',
          color: expense.isBillable ? 'var(--purple)' : 'var(--text-muted)' }}>
          {expense.isBillable ? 'Billable' : 'Internal'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>
          {expense.approvalStatus}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {expense.approvalStatus === 'pending' && (
            <>
              <button onClick={() => onApprove('approved')} title="Approve"
                style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid #10B981', background: 'none', cursor: 'pointer', fontSize: 12, color: '#10B981', fontWeight: 800 }}>✓</button>
              <button onClick={() => onApprove('rejected')} title="Reject"
                style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid #EF4444', background: 'none', cursor: 'pointer', fontSize: 12, color: '#EF4444', fontWeight: 800 }}>✗</button>
            </>
          )}
          <button onClick={onEdit} style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
          <button onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); }} disabled={deleting}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, color: '#EF4444', fontWeight: 600, opacity: deleting ? 0.5 : 1 }}>Del</button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
const TABS = ['Time Entries', 'Expenses'];

export default function TimeTracking() {
  const [tab, setTab]           = useState('Time Entries');
  const [entries, setEntries]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [timers, setTimers]     = useState([]);
  const [matters, setMatters]   = useState([]);
  const [stats, setStats]       = useState({ totalHours: 0, billableHours: 0, totalValue: 0, unbilledValue: 0 });
  const [expStats, setExpStats] = useState({ totalAmount: 0, billableAmount: 0, unbilledAmount: 0 });
  const [loading, setLoading]   = useState(true);
  const [dateFilter, setDateFilter] = useState('month');
  const [entryModal, setEntryModal]   = useState(null);
  const [expenseModal, setExpenseModal] = useState(null);
  const [startModal, setStartModal]     = useState(false);
  const [stopData, setStopData]         = useState(null);

  const loadMatters = useCallback(async () => {
    try { const r = await mattersApi.list({ limit: 200, status: 'active' }); setMatters(r.data.data?.matters || []); }
    catch { setMatters([]); }
  }, []);

  const loadTimers = useCallback(async () => {
    try { const r = await timeApi.listTimers(); setTimers(r.data.data || []); }
    catch { setTimers([]); }
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let from;
      if (dateFilter === 'today') from = new Date(now.toDateString()).toISOString();
      else if (dateFilter === 'week')  { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString(); }
      else if (dateFilter === 'month') { const d = new Date(now); d.setDate(1); from = d.toISOString(); }
      const r = await timeApi.list(from ? { from } : {});
      const d = r.data.data || {};
      setEntries(d.entries || []);
      setStats({ totalHours: d.totalHours || 0, billableHours: d.billableHours || 0, totalValue: d.totalValue || 0, unbilledValue: d.unbilledValue || 0 });
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [dateFilter]);

  const loadExpenses = useCallback(async () => {
    try {
      const r = await timeApi.listExpenses();
      const d = r.data.data || {};
      setExpenses(d.expenses || []);
      setExpStats({ totalAmount: d.totalAmount || 0, billableAmount: d.billableAmount || 0, unbilledAmount: d.unbilledAmount || 0 });
    } catch { setExpenses([]); }
  }, []);

  useEffect(() => { loadMatters(); loadTimers(); }, [loadMatters, loadTimers]);
  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  useEffect(() => { const id = setInterval(loadTimers, 30000); return () => clearInterval(id); }, [loadTimers]);

  async function handleStartTimer(data) { await timeApi.startTimer(data); loadTimers(); }
  async function handlePauseTimer(id) {
    await timeApi.pauseTimer(id);
    setTimers(prev => prev.map(t => t._id === id ? { ...t, isPaused: true, pausedAt: new Date().toISOString() } : t));
  }
  async function handleResumeTimer(id) { await timeApi.resumeTimer(id); loadTimers(); }
  async function handleStopTimer(id, data) { await timeApi.stopTimer(id, data); setTimers(prev => prev.filter(t => t._id !== id)); loadEntries(); }

  async function handleSaveEntry(id, data) { if (id) await timeApi.update(id, data); else await timeApi.create(data); loadEntries(); }
  async function handleDeleteEntry(id) { await timeApi.remove(id); setEntries(prev => prev.filter(e => e._id !== id)); }

  async function handleSaveExpense(id, data) { if (id) await timeApi.updateExpense(id, data); else await timeApi.createExpense(data); loadExpenses(); }
  async function handleDeleteExpense(id) { await timeApi.deleteExpense(id); setExpenses(prev => prev.filter(e => e._id !== id)); }
  async function handleApproveExpense(id, status) { await timeApi.approveExpense(id, status); loadExpenses(); }

  const STAT_CARDS = [
    { label: 'Total Hours',    value: `${(stats.totalHours).toFixed(1)}h`,   sub: 'selected period',    color: 'var(--purple)' },
    { label: 'Billable Hours', value: `${(stats.billableHours).toFixed(1)}h`, sub: stats.totalHours ? `${Math.round(stats.billableHours / stats.totalHours * 100)}% utilization` : '—', color: '#10B981' },
    { label: 'Total Value',    value: fmtMoney(stats.totalValue),             sub: 'billable entries',   color: '#3B82F6' },
    { label: 'Unbilled',       value: fmtMoney(stats.unbilledValue),          sub: 'ready to invoice',   color: '#F59E0B' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Time & Expenses</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Track billable hours and client expenses</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setExpenseModal({})}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: 'none', color: 'var(--ink)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <I.Plus size={14} /> Add Expense
            </button>
            <button onClick={() => setEntryModal({})}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <I.Plus size={14} /> Log Time
            </button>
          </div>
        </div>

        {/* Active Timers */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.Timer size={16} style={{ color: 'var(--purple)' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Active Timers</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>({timers.length}/5)</span>
            </div>
            {timers.length < 5 && (
              <button onClick={() => setStartModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1.5px solid var(--purple)', background: 'none', color: 'var(--purple)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                <I.Plus size={13} /> Start Timer
              </button>
            )}
          </div>
          {timers.length === 0 ? (
            <div style={{ padding: '20px 24px', borderRadius: 14, border: '1.5px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No active timers. Click "Start Timer" to begin tracking.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {timers.map(t => (
                <TimerRow key={t._id} timer={t}
                  onPause={handlePauseTimer}
                  onResume={handleResumeTimer}
                  onStop={timer => setStopData(timer)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--purple)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text-muted)',
              boxShadow: tab === t ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
            }}>{t}</button>
          ))}
        </div>

        {/* Time Entries Tab */}
        {tab === 'Time Entries' && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
              </div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.Clock size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No time entries</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Start a timer or click "Log Time" to add entries.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--elevated)' }}>
                      {['Date', 'Matter', 'Description', 'Activity', 'Hours', 'Rate', 'Amount', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <EntryRow key={e._id} entry={e} onEdit={() => setEntryModal(e)} onDelete={() => handleDeleteEntry(e._id)} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--elevated)', borderTop: '2px solid var(--border)' }}>
                      <td colSpan={4} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Totals</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: 'var(--ink)' }}>{stats.totalHours.toFixed(2)}h</td>
                      <td />
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{fmtMoney(stats.totalValue)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {tab === 'Expenses' && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total: <b style={{ color: 'var(--ink)' }}>{fmtMoney(expStats.totalAmount)}</b></span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Billable: <b style={{ color: '#10B981' }}>{fmtMoney(expStats.billableAmount)}</b></span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unbilled: <b style={{ color: '#F59E0B' }}>{fmtMoney(expStats.unbilledAmount)}</b></span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</span>
            </div>
            {expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.Receipt size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No expenses yet</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Click "Add Expense" to log a client expense.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--elevated)' }}>
                      {['Date', 'Matter', 'Category', 'Description', 'Amount', 'Billable', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <ExpenseRow key={e._id} expense={e}
                        onEdit={() => setExpenseModal(e)}
                        onDelete={() => handleDeleteExpense(e._id)}
                        onApprove={status => handleApproveExpense(e._id, status)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {startModal && <StartTimerModal key="start" matters={matters} onClose={() => setStartModal(false)} onStart={handleStartTimer} />}
        {stopData   && <StopTimerModal  key="stop"  timer={stopData} onClose={() => setStopData(null)} onStop={handleStopTimer} />}
        {entryModal !== null && <EntryModal   key="entry"   entry={entryModal?._id ? entryModal : null}   matters={matters} onClose={() => setEntryModal(null)}   onSave={handleSaveEntry} />}
        {expenseModal !== null && <ExpenseModal key="expense" expense={expenseModal?._id ? expenseModal : null} matters={matters} onClose={() => setExpenseModal(null)} onSave={handleSaveExpense} />}
      </AnimatePresence>
    </div>
  );
}
