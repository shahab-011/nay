import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const STAGES = ['New Lead', 'Contacted', 'Consultation', 'Proposal Sent', 'Won', 'Lost'];
const STAGE_COLOR = {
  'New Lead':      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Contacted':     { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  'Consultation':  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'Proposal Sent': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'Won':           { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  'Lost':          { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
};
const PRACTICE_AREAS = ['Family Law', 'Criminal', 'Contract', 'Property', 'Immigration', 'Employment', 'IP', 'Corporate', 'Tax', 'Personal Injury', 'Civil', 'Other'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Advertisement', 'Walk-in', 'Phone', 'Other'];

const SEED_LEADS = [
  { id: 1, name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', phone: '+92 300 1234567', area: 'Family Law', source: 'Referral', value: 150000, stage: 'Consultation', createdAt: '2026-05-01', notes: 'Divorce proceedings. Has two children. Urgent.' },
  { id: 2, name: 'Sarah Khan', email: 'sarah@corp.pk', phone: '+92 321 9876543', area: 'Corporate', source: 'LinkedIn', value: 500000, stage: 'Proposal Sent', createdAt: '2026-04-28', notes: 'Company restructuring and shareholder agreement.' },
  { id: 3, name: 'Farhan Malik', email: 'farhan@gmail.com', phone: '+92 333 5551234', area: 'Property', source: 'Website', value: 80000, stage: 'New Lead', createdAt: '2026-05-10', notes: 'Property dispute with neighbor.' },
  { id: 4, name: 'Zara Industries', email: 'legal@zara.pk', phone: '+92 51 8887766', area: 'Employment', source: 'Referral', value: 200000, stage: 'Contacted', createdAt: '2026-05-05', notes: 'Wrongful termination case. 45 employees involved.' },
  { id: 5, name: 'Bilal Hussain', email: 'bilal@email.com', phone: '+92 311 2223344', area: 'Criminal', source: 'Phone', value: 250000, stage: 'Won', createdAt: '2026-04-15', notes: 'Retainer signed. White collar fraud defense.' },
  { id: 6, name: 'Nadia Sheikh', email: 'nadia@tech.com', phone: '+92 322 6667788', area: 'IP', source: 'Website', value: 120000, stage: 'Lost', createdAt: '2026-04-20', notes: 'Went with another firm. Price sensitive.' },
];

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

/* ─── Stats bar ───────────────────────────────────────────────── */
function Stats({ leads }) {
  const active = leads.filter(l => !['Won', 'Lost'].includes(l.stage));
  const won = leads.filter(l => l.stage === 'Won');
  const total = leads.length;
  const winRate = total ? Math.round((won.length / total) * 100) : 0;
  const pipelineValue = active.reduce((s, l) => s + l.value, 0);
  const stats = [
    { label: 'Total Leads', value: total, icon: I.Target, color: '#7C3AED' },
    { label: 'Active Pipeline', value: `PKR ${(pipelineValue / 1000).toFixed(0)}k`, icon: I.TrendingUp, color: '#10B981' },
    { label: 'Win Rate', value: `${winRate}%`, icon: I.CheckSquare, color: '#3B82F6' },
    { label: 'Won This Month', value: won.length, icon: I.Star, color: '#F59E0B' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <s.icon size={18} style={{ color: s.color }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Lead card ───────────────────────────────────────────────── */
function LeadCard({ lead, onDragStart, onClick }) {
  const sc = STAGE_COLOR[lead.stage];
  return (
    <motion.div
      layout
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      onClick={() => onClick(lead)}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      style={{
        background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB',
        padding: '14px 16px', cursor: 'grab', marginBottom: 8,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{lead.name}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{lead.area}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <I.Mail size={10} /> {lead.email}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>PKR {(lead.value / 1000).toFixed(0)}k</span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{daysSince(lead.createdAt)}d ago</span>
      </div>
    </motion.div>
  );
}

/* ─── Kanban column ───────────────────────────────────────────── */
function Column({ stage, leads, onDragStart, onDrop, onCardClick }) {
  const sc = STAGE_COLOR[stage];
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(e, stage); }}
      style={{
        minWidth: 240, flex: '0 0 240px', background: over ? '#F5F3FF' : '#F3F4F6',
        borderRadius: 14, padding: '12px 10px',
        border: over ? '2px dashed #7C3AED' : '2px solid transparent',
        transition: 'all 150ms', maxHeight: '70vh', overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: sc.text, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>{stage}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>{leads.length}</span>
      </div>
      <AnimatePresence>
        {leads.map(l => <LeadCard key={l.id} lead={l} onDragStart={onDragStart} onClick={onCardClick} />)}
      </AnimatePresence>
    </div>
  );
}

/* ─── NewLeadModal ────────────────────────────────────────────── */
function NewLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', area: 'Family Law', source: 'Website', value: '', stage: 'New Lead', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>New Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['name', 'Full Name / Company', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['value', 'Estimated Value (PKR)', 'number']].map(([k, pl, type]) => (
            <div key={k}>
              <label style={lbl}>{pl}</label>
              <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} style={inp} placeholder={pl} />
            </div>
          ))}
          <div>
            <label style={lbl}>Practice Area</label>
            <select value={form.area} onChange={e => set('area', e.target.value)} style={inp}>
              {PRACTICE_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Lead Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={inp}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Details about the lead…" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={() => { if (form.name) { onSave({ ...form, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), value: Number(form.value) || 0 }); onClose(); } }} style={btnPurple}><I.Plus size={14} /> Add Lead</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── LeadDetail slide-in ─────────────────────────────────────── */
function LeadDetail({ lead, onClose, onUpdate, onConvert }) {
  const [editStage, setEditStage] = useState(lead.stage);
  if (!lead) return null;
  return (
    <motion.div
      initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, zIndex: 150,
        background: '#fff', borderLeft: '1.5px solid #E5E7EB',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)', overflowY: 'auto', padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>{lead.name}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={18} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[['Email', lead.email, I.Mail], ['Phone', lead.phone, I.Phone], ['Practice Area', lead.area, I.Briefcase], ['Source', lead.source, I.Target], ['Value', `PKR ${lead.value?.toLocaleString()}`, I.DollarSign], ['Created', lead.createdAt, I.Calendar]].map(([label, val, Ic]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Ic size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <span style={{ color: '#6B7280', width: 90, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#111827', fontWeight: 600 }}>{val}</span>
          </div>
        ))}

        {lead.notes && (
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>NOTES</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{lead.notes}</div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Move to Stage</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STAGES.map(s => {
              const sc = STAGE_COLOR[s];
              return (
                <button key={s} onClick={() => { setEditStage(s); onUpdate(lead.id, s); }} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${editStage === s ? sc.text : '#E5E7EB'}`, background: editStage === s ? sc.bg : '#fff', color: editStage === s ? sc.text : '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{s}</button>
              );
            })}
          </div>
        </div>

        {lead.stage === 'Won' && (
          <button onClick={() => onConvert(lead)} style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <I.Briefcase size={15} /> Convert to Matter
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── Main page ───────────────────────────────────────────────── */
export default function LeadPipeline() {
  const [leads, setLeads] = useState(SEED_LEADS);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const dragId = useRef(null);

  function handleDragStart(e, id) { dragId.current = id; }
  function handleDrop(e, stage) {
    if (!dragId.current) return;
    setLeads(ls => ls.map(l => l.id === dragId.current ? { ...l, stage } : l));
    dragId.current = null;
  }
  function updateStage(id, stage) {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, stage } : l));
    setSelected(s => s && s.id === id ? { ...s, stage } : s);
  }
  function convertToMatter(lead) {
    alert(`Lead "${lead.name}" converted to Matter! (In production this would create a new matter record.)`);
    setSelected(null);
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Target size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Lead Pipeline</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Track prospects from first contact to signed retainer</p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Lead</button>
          </div>
        </motion.div>

        <Stats leads={leads} />

        {/* Kanban board */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {STAGES.map(stage => (
            <Column
              key={stage}
              stage={stage}
              leads={leads.filter(l => l.stage === stage)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onCardClick={setSelected}
            />
          ))}
        </div>
      </div>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onSave={l => setLeads(ls => [l, ...ls])} />}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.3)' }} />
            <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdate={updateStage} onConvert={convertToMatter} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
