import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { communicationsApi } from '../api/communications.api';
import { mattersApi } from '../api/matters.api';

const TYPE_META = {
  Call:    { icon: I.Phone,         color: '#3B82F6', bg: '#EFF6FF' },
  Email:   { icon: I.Mail,          color: '#10B981', bg: '#ECFDF5' },
  Meeting: { icon: I.Video,         color: '#7C3AED', bg: '#F5F3FF' },
  Note:    { icon: I.MessageSquare, color: '#F59E0B', bg: '#FFF7ED' },
};

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── Log Entry Modal ─────────────────────────────────────────── */
function LogModal({ onClose, onSave, matters }) {
  const [form, setForm] = useState({
    type: 'Call', direction: 'Inbound', contact: '', matterId: '',
    date: new Date().toISOString().slice(0, 10), time: '',
    duration: '', summary: '', attorney: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.contact || !form.summary) { setErr('Contact and summary are required'); return; }
    setSaving(true);
    try {
      const r = await communicationsApi.create(form);
      onSave(r.data.data || r.data);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>Log Communication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>
        {err && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <button key={type} onClick={() => set('type', type)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.type === type ? meta.color : '#E5E7EB'}`, background: form.type === type ? meta.bg : '#fff', color: form.type === type ? meta.color : '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <meta.icon size={16} /> {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Direction</label>
            <select value={form.direction} onChange={e => set('direction', e.target.value)} style={inp}>
              <option>Inbound</option><option>Outbound</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Contact / Party</label>
            <input value={form.contact} onChange={e => set('contact', e.target.value)} style={inp} placeholder="Name or company" />
          </div>
          <div>
            <label style={lbl}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Duration</label>
            <input value={form.duration} onChange={e => set('duration', e.target.value)} style={inp} placeholder="e.g. 30 min" />
          </div>
          <div>
            <label style={lbl}>Handled By</label>
            <input value={form.attorney} onChange={e => set('attorney', e.target.value)} style={inp} placeholder="Attorney name" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>Linked Matter</label>
            <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={inp}>
              <option value="">— No matter —</option>
              {matters.map(m => <option key={m._id} value={m._id}>{m.matterNumber} — {m.title}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Summary / Notes</label>
          <textarea value={form.summary} onChange={e => set('summary', e.target.value)} style={{ ...inp, height: 100, resize: 'vertical' }} placeholder="What was discussed, decided, or actioned…" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            <I.Check size={14} /> {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Entry card ──────────────────────────────────────────────── */
function EntryCard({ entry, onDelete }) {
  const meta = TYPE_META[entry.type] || TYPE_META.Note;
  const matterLabel = entry.matterId?.matterNumber
    ? `${entry.matterId.matterNumber} — ${entry.matterId.title}`
    : entry.matterId?.title || '';

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 18px', display: 'flex', gap: 16 }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <meta.icon size={18} style={{ color: meta.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{entry.contact}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: meta.bg, color: meta.color }}>{entry.type}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: entry.direction === 'Inbound' ? '#EFF6FF' : '#F0FDF4', color: entry.direction === 'Inbound' ? '#1D4ED8' : '#15803D' }}>{entry.direction}</span>
            </div>
            {matterLabel && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{matterLabel}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{entry.date?.slice(0, 10)} {entry.time}</div>
              {entry.duration && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{entry.duration} min</div>}
            </div>
            <button onClick={() => onDelete(entry._id)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.X size={12} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>{entry.summary}</div>
        {entry.attorney && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Handled by: {entry.attorney}</div>}
      </div>
    </motion.div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function Communications() {
  const [entries, setEntries] = useState([]);
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commsRes, mattersRes] = await Promise.all([
        communicationsApi.list({ limit: 200 }),
        mattersApi.list({ limit: 200 }),
      ]);
      const commsBody = commsRes.data.data || commsRes.data;
      setEntries(commsBody.logs || commsBody || []);
      const mattersBody = mattersRes.data.data || mattersRes.data;
      setMatters(mattersBody.matters || mattersBody || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setEntries(es => es.filter(e => e._id !== id));
    try { await communicationsApi.remove(id); } catch { load(); }
  };

  const filtered = useMemo(() => entries.filter(e =>
    (typeFilter === 'All' || e.type === typeFilter) &&
    (e.contact?.toLowerCase().includes(search.toLowerCase()) || e.summary?.toLowerCase().includes(search.toLowerCase()))
  ), [entries, typeFilter, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const day = (e.date || e.createdAt || '').slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const stats = {
    total: entries.length,
    calls: entries.filter(e => e.type === 'Call').length,
    emails: entries.filter(e => e.type === 'Email').length,
    meetings: entries.filter(e => e.type === 'Meeting').length,
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px 60px' }}>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.MessageSquare size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Communications</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Log all client calls, emails, and meetings linked to matters</p>
              </div>
            </div>
            <button onClick={() => setShowLog(true)} style={btnPurple}><I.Plus size={15} /> Log Communication</button>
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[['Total', stats.total, '#7C3AED', I.Activity], ['Calls', stats.calls, '#3B82F6', I.Phone], ['Emails', stats.emails, '#10B981', I.Mail], ['Meetings', stats.meetings, '#F59E0B', I.Video]].map(([label, val, color, Ic]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={16} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <I.Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communications…" style={{ ...inp, paddingLeft: 34 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Call', 'Email', 'Meeting', 'Note'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid', borderColor: typeFilter === t ? '#7C3AED' : '#E5E7EB', background: typeFilter === t ? '#EDE9FE' : '#fff', color: typeFilter === t ? '#7C3AED' : '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <I.MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No communications found</p>
          </div>
        ) : (
          grouped.map(([date, dayEntries]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.Calendar size={13} />
                {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Unknown date'}
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnimatePresence>
                  {dayEntries.map(e => <EntryCard key={e._id} entry={e} onDelete={handleDelete} />)}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      {showLog && <LogModal onClose={() => setShowLog(false)} matters={matters} onSave={e => setEntries(es => [e, ...es])} />}
    </div>
  );
}
