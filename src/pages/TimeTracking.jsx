import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { timeApi } from '../api/timeTracking.api';

/* ─── Helpers ────────────────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function decimalHours(seconds) { return (seconds / 3600).toFixed(2); }

function toSeconds(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACTIVITY_TYPES = ['Billable', 'Non-Billable', 'Fixed Fee', 'Pro Bono'];
const DEFAULT_RATE = 250;

/* ─── Timer widget ───────────────────────────────────────────── */
function TimerWidget({ onStop }) {
  const [running, setRunning]     = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const [startTs, setStartTs]     = useState(null);
  const [matter, setMatter]       = useState('');
  const [desc, setDesc]           = useState('');
  const [billable, setBillable]   = useState(true);
  const intervalRef               = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, startTs]);

  function start() {
    const ts = Date.now();
    setStartTs(ts); setElapsed(0); setRunning(true);
  }

  function stop() {
    setRunning(false);
    clearInterval(intervalRef.current);
    onStop({ elapsed, matter_name: matter, description: desc, billable, date: todayStr() });
    setElapsed(0); setMatter(''); setDesc('');
  }

  function discard() {
    setRunning(false);
    clearInterval(intervalRef.current);
    setElapsed(0);
  }

  return (
    <div style={{
      background: running
        ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
        : 'var(--surface)',
      borderRadius: 20, padding: '24px 28px',
      border: running ? 'none' : '1.5px solid var(--border)',
      boxShadow: running ? '0 16px 48px rgba(124,58,237,0.28)' : 'var(--shadow-card)',
      transition: 'all 300ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

        {/* Timer display */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: running ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            {running ? 'Timer Running' : 'Timer'}
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: 2, color: running ? '#fff' : 'var(--ink)', fontFamily: 'monospace' }}>
            {formatDuration(elapsed)}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
          <input
            value={matter} onChange={e => setMatter(e.target.value)}
            placeholder="Matter name (optional)"
            style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 13,
              background: running ? 'rgba(255,255,255,0.15)' : 'var(--bg)',
              border: `1.5px solid ${running ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
              color: running ? '#fff' : 'var(--ink)', outline: 'none',
            }}
          />
          <input
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What are you working on?"
            style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 13,
              background: running ? 'rgba(255,255,255,0.15)' : 'var(--bg)',
              border: `1.5px solid ${running ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
              color: running ? '#fff' : 'var(--ink)', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setBillable(b => !b)}>
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: billable ? (running ? '#fff' : 'var(--purple)') : 'rgba(255,255,255,0.2)',
                position: 'relative', transition: 'background 200ms',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: billable ? 18 : 2,
                  width: 16, height: 16, borderRadius: 8,
                  background: billable ? (running ? 'var(--purple)' : '#fff') : '#ccc',
                  transition: 'left 200ms',
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: running ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
                Billable
              </span>
            </label>

            <div style={{ flex: 1 }} />

            {running ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={discard} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Discard
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={stop}
                  style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#fff', color: 'var(--purple)', cursor: 'pointer', fontSize: 13, fontWeight: 800 }}
                >
                  Stop & Save
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={start}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--purple)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <I.Clock size={15} /> Start Timer
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Time Entry Modal ───────────────────────────────────────── */
const BLANK_ENTRY = { date: todayStr(), matter_name: '', description: '', duration_minutes: 60, activity_type: 'Billable', rate: DEFAULT_RATE, billable: true, notes: '' };

function EntryModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(entry ? { ...entry } : { ...BLANK_ENTRY });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // duration as HH:MM
  const durationHHMM = `${pad(Math.floor((form.duration_minutes || 0) / 60))}:${pad((form.duration_minutes || 0) % 60)}`;

  function handleDuration(val) {
    const [h, m] = val.split(':').map(s => parseInt(s) || 0);
    set('duration_minutes', h * 60 + m);
  }

  const amount = ((form.duration_minutes || 0) / 60 * (form.rate || 0)).toFixed(2);

  async function save() {
    if (!form.description?.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-float)', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{entry?.id ? 'Edit Time Entry' : 'Log Time'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I.X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date + Matter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Date</label>
              <input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Activity Type</label>
              <select value={form.activity_type || 'Billable'} onChange={e => set('activity_type', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box', cursor: 'pointer' }}>
                {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Matter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Matter</label>
            <input value={form.matter_name || ''} onChange={e => set('matter_name', e.target.value)} placeholder="Matter name"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Description *</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} placeholder="Work performed…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Duration + Rate + Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Duration (HH:MM)</label>
              <input type="time" value={durationHHMM} onChange={e => handleDuration(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Rate ($/hr)</label>
              <input type="number" min="0" value={form.rate || ''} onChange={e => set('rate', parseFloat(e.target.value) || 0)} placeholder="250"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Amount</label>
              <div style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--elevated)', fontWeight: 700, color: 'var(--ink)' }}>
                ${amount}
              </div>
            </div>
          </div>

          {/* Billable toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => set('billable', !form.billable)}>
            <div style={{ width: 38, height: 20, borderRadius: 10, background: form.billable ? 'var(--purple)' : 'var(--border)', position: 'relative', transition: 'background 200ms' }}>
              <div style={{ position: 'absolute', top: 2, left: form.billable ? 20 : 2, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Mark as billable</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={save} disabled={saving || !form.description?.trim()}
              style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : entry?.id ? 'Update' : 'Log Time'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Entry row ───────────────────────────────────────────────── */
function EntryRow({ entry, onEdit, onDelete }) {
  const hrs = ((entry.duration_minutes || 0) / 60).toFixed(2);
  const amount = ((entry.duration_minutes || 0) / 60 * (entry.rate || 0)).toFixed(2);
  const [deleting, setDeleting] = useState(false);

  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{entry.matter_name || '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', maxWidth: 260 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--ink)' }}>{hrs}h</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: entry.activity_type === 'Billable' ? 'rgba(124,58,237,0.1)' : 'var(--elevated)',
          color: entry.activity_type === 'Billable' ? 'var(--purple)' : 'var(--text-muted)',
        }}>{entry.activity_type || 'Billable'}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>${entry.rate || 0}/hr</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: entry.billable ? 'var(--ink)' : 'var(--text-muted)' }}>
        {entry.billable !== false ? `$${amount}` : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(entry)} style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
          <button
            onClick={async () => { setDeleting(true); await onDelete(entry.id); }}
            disabled={deleting}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 12, color: '#EF4444', fontWeight: 600, opacity: deleting ? 0.5 : 1 }}
          >Del</button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ─── Main TimeTracking ──────────────────────────────────────── */
export default function TimeTracking() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);  // null | 'new' | entry object
  const [dateFilter, setDateFilter] = useState('week');
  const [matterFilter, setMatterFilter] = useState('');
  const [typeFilter, setTypeFilter]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await timeApi.list({ range: dateFilter, matter: matterFilter || undefined });
      setEntries(r.data?.data || r.data || []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [dateFilter, matterFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (form.id) await timeApi.update(form.id, form);
    else         await timeApi.create(form);
    load();
  }

  async function handleDelete(id) {
    await timeApi.remove(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function handleTimerStop(data) {
    // Convert elapsed seconds to minutes
    const duration_minutes = Math.round(data.elapsed / 60) || 1;
    setModal({ ...data, duration_minutes, rate: DEFAULT_RATE, activity_type: 'Billable' });
  }

  // Filtered + stats
  const filtered = entries.filter(e => {
    if (typeFilter !== 'all' && (e.activity_type || 'Billable') !== typeFilter) return false;
    return true;
  });

  const totalMins   = filtered.reduce((s, e) => s + (e.duration_minutes || 0), 0);
  const billableMins = filtered.filter(e => e.billable !== false).reduce((s, e) => s + (e.duration_minutes || 0), 0);
  const totalAmount  = filtered.filter(e => e.billable !== false).reduce((s, e) => s + (e.duration_minutes / 60) * (e.rate || 0), 0);
  const unbilledMins = filtered.filter(e => e.billable !== false && !e.invoiced).reduce((s, e) => s + (e.duration_minutes || 0), 0);

  const STATS = [
    { label: 'Total Hours', value: `${(totalMins / 60).toFixed(1)}h`, sub: 'selected period', color: 'var(--purple)' },
    { label: 'Billable Hours', value: `${(billableMins / 60).toFixed(1)}h`, sub: `${totalMins ? Math.round(billableMins / totalMins * 100) : 0}% utilization`, color: '#10B981' },
    { label: 'Total Value', value: `$${totalAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'billable only', color: '#3B82F6' },
    { label: 'Unbilled', value: `${(unbilledMins / 60).toFixed(1)}h`, sub: 'ready to invoice', color: '#F59E0B' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Time Tracking</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Track billable hours and manage time entries</p>
          </div>
          <button onClick={() => setModal({})}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            <I.Plus size={15} /> Log Time
          </button>
        </div>

        {/* Timer widget */}
        <div style={{ marginBottom: 24 }}>
          <TimerWidget onStop={handleTimerStop} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters + table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer' }}>
              <option value="all">All Types</option>
              {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            <input value={matterFilter} onChange={e => setMatterFilter(e.target.value)} placeholder="Filter by matter…"
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', flex: 1, minWidth: 160 }} />

            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
              <I.Clock size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No time entries yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Start the timer above or click "Log Time" to add entries manually.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--elevated)' }}>
                    {['Date','Matter','Description','Duration','Type','Rate','Amount',''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <EntryRow key={e.id} entry={e} onEdit={entry => setModal(entry)} onDelete={handleDelete} />
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--elevated)', borderTop: '2px solid var(--border)' }}>
                    <td colSpan={3} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Totals</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: 'var(--ink)' }}>{(totalMins / 60).toFixed(2)}h</td>
                    <td colSpan={2} />
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>${totalAmount.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal !== null && (
          <EntryModal
            entry={modal?.id ? modal : (Object.keys(modal).length ? modal : null)}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
