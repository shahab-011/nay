import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { communicationsApi } from '../api/communications.api';
import { mattersApi } from '../api/matters.api';

const TYPES = [
  'Email Sent', 'Email Received',
  'Phone Call (Outbound)', 'Phone Call (Inbound)',
  'Video Call', 'Meeting (In-Person)', 'Court Appearance',
  'Text Message', 'Letter Sent', 'Letter Received', 'Note',
];

const TYPE_META = {
  'Email Sent':            { icon: I.Mail,          color: '#059669', bg: '#ECFDF5' },
  'Email Received':        { icon: I.Mail,          color: '#10B981', bg: '#F0FDF4' },
  'Phone Call (Outbound)': { icon: I.Phone,         color: '#3B82F6', bg: '#EFF6FF' },
  'Phone Call (Inbound)':  { icon: I.Phone,         color: '#1D4ED8', bg: '#DBEAFE' },
  'Video Call':            { icon: I.Video,         color: '#7C3AED', bg: '#F5F3FF' },
  'Meeting (In-Person)':   { icon: I.Users,         color: '#D97706', bg: '#FFF7ED' },
  'Court Appearance':      { icon: I.Briefcase,     color: '#DC2626', bg: '#FEF2F2' },
  'Text Message':          { icon: I.MessageSquare, color: '#0891B2', bg: '#ECFEFF' },
  'Letter Sent':           { icon: I.FileText,      color: '#6D28D9', bg: '#EDE9FE' },
  'Letter Received':       { icon: I.FileText,      color: '#4F46E5', bg: '#EEF2FF' },
  'Note':                  { icon: I.Edit,          color: '#F59E0B', bg: '#FFF7ED' },
};

const TEMPLATE_CATEGORIES = ['General', 'Case Status Update', 'Appointment Reminder', 'Document Request', 'Invoice Follow-Up', 'Welcome', 'Closing'];

const lbl     = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp     = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost  = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGreen  = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };

/* ─── Time Entry Prompt ──────────────────────────────────────────── */
function TimeEntryPrompt({ log, onAccept, onDismiss }) {
  const durationMins = log.duration || 15;
  const [hours, setHours] = useState((durationMins / 60).toFixed(2));
  const [rate,  setRate]  = useState('0');
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setSaving(true);
    try {
      await communicationsApi.createTimeEntry(log._id, { hours: Number(hours), rate: Number(rate) });
      onAccept();
    } catch { onDismiss(); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 300, background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', padding: 20, width: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>Create time entry?</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><I.X size={16} /></button>
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
        {log.type} · {log.subject || log.contact}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ ...lbl, fontSize: 11 }}>Hours</label>
          <input type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ ...lbl, fontSize: 11 }}>Rate (PKR/hr)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: 13 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDismiss} style={{ ...btnGhost, flex: 1, padding: '8px', fontSize: 12 }}>Skip</button>
        <button onClick={accept} disabled={saving} style={{ ...btnGreen, flex: 1, justifyContent: 'center', padding: '8px', fontSize: 12, opacity: saving ? 0.7 : 1 }}>
          <I.Clock size={13} /> {saving ? 'Creating…' : 'Create Entry'}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Log Entry Modal ────────────────────────────────────────────── */
function LogModal({ onClose, onSave, matters }) {
  const [form, setForm] = useState({
    type: 'Phone Call (Outbound)', direction: 'Outbound', contact: '',
    matterId: '', date: new Date().toISOString().slice(0, 10), time: '',
    duration: '', subject: '', summary: '', outcome: '',
    isBillable: false, followUpRequired: false, followUpDueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.contact.trim()) { setErr('Contact / party is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration:       form.duration ? Number(form.duration) : undefined,
        matterId:       form.matterId || undefined,
        followUpDueDate:form.followUpDueDate || undefined,
      };
      const r = await communicationsApi.create(payload);
      onSave(r.data.data || r.data);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>Log Communication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>
        {err && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        {/* Type selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Communication Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 6 }}>
            {TYPES.map(t => {
              const m = TYPE_META[t];
              const active = form.type === t;
              return (
                <button key={t} onClick={() => set('type', t)} style={{ padding: '8px 10px', borderRadius: 9, border: `1.5px solid ${active ? m.color : '#E5E7EB'}`, background: active ? m.bg : '#fff', color: active ? m.color : '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}>
                  <m.icon size={13} /> {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Contact / Party</label>
            <input value={form.contact} onChange={e => set('contact', e.target.value)} style={inp} placeholder="Name or company" />
          </div>
          <div>
            <label style={lbl}>Linked Matter</label>
            <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={inp}>
              <option value="">— No matter —</option>
              {matters.map(m => <option key={m._id} value={m._id}>{m.matterNumber} — {m.title}</option>)}
            </select>
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
            <label style={lbl}>Duration (minutes)</label>
            <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} style={inp} placeholder="e.g. 30" min="0" />
          </div>
          <div>
            <label style={lbl}>Direction</label>
            <select value={form.direction} onChange={e => set('direction', e.target.value)} style={inp}>
              <option>Outbound</option><option>Inbound</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Subject</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} style={inp} placeholder="Brief subject line…" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Summary / Notes</label>
          <textarea value={form.summary} onChange={e => set('summary', e.target.value)} style={{ ...inp, height: 90, resize: 'vertical' }} placeholder="What was discussed, decided, or actioned…" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Outcome</label>
          <textarea value={form.outcome} onChange={e => set('outcome', e.target.value)} style={{ ...inp, height: 55, resize: 'vertical' }} placeholder="Next steps or result…" />
        </div>

        {/* Billable + Follow-up */}
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <input type="checkbox" checked={form.isBillable} onChange={e => set('isBillable', e.target.checked)} />
            Billable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <input type="checkbox" checked={form.followUpRequired} onChange={e => set('followUpRequired', e.target.checked)} />
            Follow-up required
          </label>
          {form.followUpRequired && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ ...lbl, margin: 0, fontSize: 12 }}>Due:</label>
              <input type="date" value={form.followUpDueDate} onChange={e => set('followUpDueDate', e.target.value)} style={{ ...inp, width: 160, padding: '6px 10px' }} />
            </div>
          )}
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

/* ─── Email Template Modal ───────────────────────────────────────── */
function TemplateModal({ tpl, onClose, onSave }) {
  const [form, setForm] = useState({ name: tpl?.name || '', subject: tpl?.subject || '', body: tpl?.body || '', category: tpl?.category || 'General' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.subject || !form.body) return;
    setSaving(true);
    try {
      const r = tpl
        ? await communicationsApi.templates.update(tpl._id, form)
        : await communicationsApi.templates.create(form);
      onSave(r.data.data || r.data);
      onClose();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{tpl ? 'Edit Template' : 'New Email Template'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Template Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="e.g. Case Status Update" />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
              {TEMPLATE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Subject</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} style={inp} placeholder="Use {{variable}} for dynamic content" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Body</label>
          <textarea value={form.body} onChange={e => set('body', e.target.value)} style={{ ...inp, height: 200, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Dear {{client_name}},&#10;&#10;I wanted to update you regarding {{matter_title}}…" />
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 18 }}>
          Available variables: <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>{'{{client_name}}'}</code>{' '}
          <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>{'{{matter_title}}'}</code>{' '}
          <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>{'{{attorney_name}}'}</code>{' '}
          <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>{'{{firm_name}}'}</code>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.name || !form.subject || !form.body} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : tpl ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Templates View ─────────────────────────────────────────────── */
function TemplatesView() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await communicationsApi.templates.list();
      setTemplates(r.data.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await communicationsApi.templates.remove(id);
    setTemplates(ts => ts.filter(t => t._id !== id));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading templates…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={btnPurple}>
          <I.Plus size={14} /> New Template
        </button>
      </div>
      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <I.Mail size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No email templates yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Save common email formats for quick reuse</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => (
            <div key={t._id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{t.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EDE9FE', color: '#6D28D9', fontWeight: 700 }}>{t.category}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{t.subject}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>{t.body?.replace(/<[^>]+>/g, '').slice(0, 120)}…</div>
                {t.variables?.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {t.variables.map(v => (
                      <code key={v} style={{ fontSize: 10, background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, color: '#6D28D9' }}>{`{{${v}}}`}</code>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setEditing(t); setShowModal(true); }} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                <button onClick={() => handleDelete(t._id)} style={{ background: 'none', border: '1.5px solid #FCA5A5', borderRadius: 9, padding: '6px 12px', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <TemplateModal tpl={editing} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}

/* ─── Entry card ──────────────────────────────────────────────────── */
function EntryCard({ entry, onDelete }) {
  const meta   = TYPE_META[entry.type] || TYPE_META['Note'];
  const matter = entry.matterId?.matterNumber
    ? `${entry.matterId.matterNumber} — ${entry.matterId.title}`
    : entry.matterId?.title || '';

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '15px 18px', display: 'flex', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <meta.icon size={16} style={{ color: meta.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{entry.contact || entry.contactId?.firstName}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.color }}>{entry.type}</span>
              {entry.isBillable && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFF7ED', color: '#D97706' }}>Billable</span>}
              {entry.followUpRequired && !entry.followUpCompleted && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FEF2F2', color: '#DC2626' }}>Follow-up</span>}
              {entry.source && entry.source !== 'manual' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#EFF6FF', color: '#3B82F6' }}>{entry.source}</span>}
            </div>
            {entry.subject && <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 3 }}>{entry.subject}</div>}
            {matter && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{matter}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{entry.date?.slice(0, 10)} {entry.time}</div>
              {entry.duration && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{entry.duration} min</div>}
            </div>
            <button onClick={() => onDelete(entry._id)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.X size={11} />
            </button>
          </div>
        </div>
        {entry.summary && <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.55, marginTop: 4 }}>{entry.summary}</div>}
        {entry.outcome && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>Outcome: {entry.outcome}</div>}
        {entry.followUpRequired && entry.followUpDueDate && (
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Follow-up due: {entry.followUpDueDate?.slice(0, 10)}</div>
        )}
        {entry.userId?.name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Logged by: {entry.userId.name}</div>}
      </div>
    </motion.div>
  );
}

/* ─── Export preview ─────────────────────────────────────────────── */
function ExportModal({ matterId, matterName, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    communicationsApi.exportTimeline(matterId).then(r => {
      setData(r.data.data || r.data);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, [matterId]);

  const handlePrint = () => window.print();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Timeline Export — {matterName}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={{ ...btnGreen, padding: '7px 14px', fontSize: 12 }}><I.Download size={13} /> Print / PDF</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={18} /></button>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
        ) : !data?.logs?.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No communications for this matter</div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>
              {data.logs.length} entries · Exported {new Date().toLocaleDateString()}
            </div>
            {data.logs.map((e, i) => {
              const meta = TYPE_META[e.type] || TYPE_META['Note'];
              return (
                <div key={i} style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6B7280', marginBottom: 3 }}>
                        <span>{e.date?.slice(0, 10)}</span>
                        <span style={{ fontWeight: 700, color: meta.color }}>{e.type}</span>
                        {e.duration && <span>{e.duration} min</span>}
                      </div>
                      {e.subject && <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 3 }}>{e.subject}</div>}
                      <div style={{ fontSize: 13, color: '#374151' }}>{e.summary}</div>
                      {e.userId?.name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>— {e.userId.name}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Communications() {
  const [entries, setEntries] = useState([]);
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('timeline');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [matterFilter, setMatterFilter] = useState('');
  const [search, setSearch]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [showLog, setShowLog]   = useState(false);
  const [pendingTE, setPendingTE] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commsRes, mattersRes] = await Promise.all([
        communicationsApi.list({ limit: 300 }),
        mattersApi.list({ limit: 200 }),
      ]);
      const cb = commsRes.data.data || commsRes.data;
      setEntries(cb.logs || cb || []);
      const mb = mattersRes.data.data || mattersRes.data;
      setMatters(mb.matters || mb || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setEntries(es => es.filter(e => e._id !== id));
    try { await communicationsApi.remove(id); } catch { load(); }
  };

  const handleSaved = (entry) => {
    setEntries(es => [entry, ...es]);
    if (entry.duration || entry.isBillable) setPendingTE(entry);
  };

  const filtered = useMemo(() => entries.filter(e => {
    if (typeFilter !== 'All' && e.type !== typeFilter) return false;
    if (matterFilter && e.matterId?._id !== matterFilter && e.matterId !== matterFilter) return false;
    if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(e.date) > new Date(dateTo))   return false;
    if (search) {
      const q = search.toLowerCase();
      return e.contact?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q) || e.summary?.toLowerCase().includes(q);
    }
    return true;
  }), [entries, typeFilter, matterFilter, dateFrom, dateTo, search]);

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
    total:    entries.length,
    calls:    entries.filter(e => e.type?.includes('Phone') || e.type === 'Video Call').length,
    emails:   entries.filter(e => e.type?.includes('Email')).length,
    meetings: entries.filter(e => e.type?.includes('Meeting') || e.type === 'Court Appearance').length,
    followUp: entries.filter(e => e.followUpRequired && !e.followUpCompleted).length,
  };

  const viewBtn = (v, label) => (
    <button onClick={() => setView(v)} style={{ padding: '8px 16px', borderRadius: 9, background: view === v ? '#7C3AED' : '#F3F4F6', color: view === v ? '#fff' : '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
      {label}
    </button>
  );

  const selectedMatter = matters.find(m => m._id === matterFilter);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.MessageSquare size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Communications</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Complete log of all client interactions</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {viewBtn('timeline', 'Timeline')}
              {viewBtn('templates', 'Email Templates')}
              <button onClick={() => setShowLog(true)} style={btnPurple}><I.Plus size={15} /> Log Communication</button>
            </div>
          </div>
        </motion.div>

        {view === 'templates' ? <TemplatesView /> : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
              {[['Total', stats.total, '#7C3AED', I.Activity], ['Calls', stats.calls, '#3B82F6', I.Phone], ['Emails', stats.emails, '#10B981', I.Mail], ['Meetings', stats.meetings, '#D97706', I.Users], ['Follow-ups', stats.followUp, '#DC2626', I.AlertCircle]].map(([label, val, color, Ic]) => (
                <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic size={15} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <I.Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communications…" style={{ ...inp, paddingLeft: 32 }} />
              </div>
              <select value={matterFilter} onChange={e => setMatterFilter(e.target.value)} style={{ ...inp, width: 220 }}>
                <option value="">All Matters</option>
                {matters.map(m => <option key={m._id} value={m._id}>{m.matterNumber} — {m.title}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, width: 145 }} placeholder="From" />
              <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ ...inp, width: 145 }} placeholder="To" />
              {matterFilter && (
                <button onClick={() => setShowExport(true)} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I.Download size={13} /> Export
                </button>
              )}
            </div>

            {/* Type filter chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {['All', ...TYPES].map(t => {
                const m = t === 'All' ? null : TYPE_META[t];
                return (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${typeFilter === t ? (m?.color || '#7C3AED') : '#E5E7EB'}`, background: typeFilter === t ? (m?.bg || '#EDE9FE') : '#fff', color: typeFilter === t ? (m?.color || '#7C3AED') : '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Timeline */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
              </div>
            ) : grouped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <I.MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No communications found</p>
              </div>
            ) : (
              grouped.map(([date, dayEntries]) => (
                <div key={date} style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <I.Calendar size={12} />
                    {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Unknown date'}
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    <span style={{ fontWeight: 600, color: '#9CA3AF' }}>{dayEntries.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AnimatePresence>
                      {dayEntries.map(e => <EntryCard key={e._id} entry={e} onDelete={handleDelete} />)}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showLog && <LogModal onClose={() => setShowLog(false)} matters={matters} onSave={handleSaved} />}

      <AnimatePresence>
        {pendingTE && (
          <TimeEntryPrompt
            log={pendingTE}
            onAccept={() => setPendingTE(null)}
            onDismiss={() => setPendingTE(null)}
          />
        )}
      </AnimatePresence>

      {showExport && matterFilter && (
        <ExportModal
          matterId={matterFilter}
          matterName={selectedMatter ? `${selectedMatter.matterNumber} — ${selectedMatter.title}` : ''}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
