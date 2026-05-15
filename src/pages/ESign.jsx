import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const STATUS_META = {
  Draft:      { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  Pending:    { bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' },
  'Partially Signed': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Completed:  { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  Expired:    { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  Void:       { bg: '#F3F4F6', text: '#9CA3AF', border: '#E5E7EB' },
};

const SEED = [
  {
    id: 1, title: 'Retainer Agreement — Ahmed Al-Rashid', matter: 'M-2024-001',
    status: 'Completed', createdAt: '2026-05-02', expiresAt: '2026-06-02',
    signatories: [
      { name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', signed: true, signedAt: '2026-05-03' },
      { name: 'Adnan Mirza', email: 'adnan@nyayalaw.pk', signed: true, signedAt: '2026-05-03' },
    ],
    auditTrail: [
      { event: 'Document created', time: '2026-05-02 10:00', actor: 'Adnan Mirza' },
      { event: 'Sent to signatories', time: '2026-05-02 10:05', actor: 'Adnan Mirza' },
      { event: 'Signed by Ahmed Al-Rashid', time: '2026-05-03 14:22', actor: 'Ahmed Al-Rashid' },
      { event: 'Signed by Adnan Mirza', time: '2026-05-03 16:44', actor: 'Adnan Mirza' },
      { event: 'Document completed', time: '2026-05-03 16:44', actor: 'System' },
    ],
  },
  {
    id: 2, title: 'NDA — Khan Corp Deal', matter: 'M-2024-002',
    status: 'Partially Signed', createdAt: '2026-05-08', expiresAt: '2026-06-08',
    signatories: [
      { name: 'Sarah Khan', email: 'sarah@corp.pk', signed: true, signedAt: '2026-05-09' },
      { name: 'Opposing Counsel', email: 'counsel@lawfirm.pk', signed: false },
    ],
    auditTrail: [
      { event: 'Document created', time: '2026-05-08 09:00', actor: 'Sadia Farooq' },
      { event: 'Sent to signatories', time: '2026-05-08 09:10', actor: 'Sadia Farooq' },
      { event: 'Signed by Sarah Khan', time: '2026-05-09 11:30', actor: 'Sarah Khan' },
    ],
  },
  {
    id: 3, title: 'Settlement — Malik Property', matter: 'M-2024-003',
    status: 'Pending', createdAt: '2026-05-12', expiresAt: '2026-06-12',
    signatories: [
      { name: 'Farhan Malik', email: 'farhan@gmail.com', signed: false },
      { name: 'City Council Rep', email: 'rep@city.gov.pk', signed: false },
    ],
    auditTrail: [
      { event: 'Document created', time: '2026-05-12 14:00', actor: 'Kamran Ali' },
      { event: 'Sent to signatories', time: '2026-05-12 14:15', actor: 'Kamran Ali' },
    ],
  },
  {
    id: 4, title: 'Employment Offer — New Paralegal', matter: 'Internal',
    status: 'Draft', createdAt: '2026-05-14', expiresAt: '2026-06-14',
    signatories: [
      { name: 'Raza Haider', email: 'raza@email.com', signed: false },
    ],
    auditTrail: [{ event: 'Document created', time: '2026-05-14 16:00', actor: 'Adnan Mirza' }],
  },
];

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── NewRequestModal ─────────────────────────────────────────── */
function NewRequestModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', matter: '', message: '' });
  const [signatories, setSignatories] = useState([{ name: '', email: '' }]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function addSig() { setSignatories(s => [...s, { name: '', email: '' }]); }
  function removeSig(i) { setSignatories(s => s.filter((_, j) => j !== i)); }
  function setSig(i, k, v) { setSignatories(s => s.map((sg, j) => j === i ? { ...sg, [k]: v } : sg)); }

  function save() {
    if (!form.title || !signatories[0].email) return;
    onSave({
      ...form, id: Date.now(),
      status: 'Draft',
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      signatories: signatories.filter(s => s.email).map(s => ({ ...s, signed: false })),
      auditTrail: [{ event: 'Document created', time: new Date().toLocaleString(), actor: 'You' }],
    });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>New Signature Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Document Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder="e.g. Retainer Agreement — Client Name" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Linked Matter (optional)</label>
          <input value={form.matter} onChange={e => set('matter', e.target.value)} style={inp} placeholder="Matter number or name" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Message to Signatories</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)} style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Please review and sign the attached document." />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Signatories</label>
            <button onClick={addSig} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#6D28D9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><I.Plus size={12} /> Add</button>
          </div>
          {signatories.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input value={s.name} onChange={e => setSig(i, 'name', e.target.value)} style={inp} placeholder="Full Name" />
              <input value={s.email} onChange={e => setSig(i, 'email', e.target.value)} style={inp} placeholder="Email" />
              {signatories.length > 1 && (
                <button onClick={() => removeSig(i)} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #FECDD3', background: '#FFF1F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.X size={13} /></button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} style={btnPurple}><I.Send size={14} /> Send for Signing</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Document detail panel ───────────────────────────────────── */
function DocDetail({ doc, onClose, onVoid, onResend }) {
  const sm = STATUS_META[doc.status];
  const signedCount = doc.signatories.filter(s => s.signed).length;
  return (
    <motion.div
      initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 150, background: '#fff', borderLeft: '1.5px solid #E5E7EB', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)', overflowY: 'auto', padding: 24 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', flex: 1, marginRight: 12 }}>{doc.title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><I.X size={18} /></button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>{doc.status}</span>
        {doc.matter && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280' }}>{doc.matter}</span>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Signatories ({signedCount}/{doc.signatories.length})</div>
        {doc.signatories.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: s.signed ? '#ECFDF5' : '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.signed ? <I.Check size={14} style={{ color: '#059669' }} /> : <I.Clock size={14} style={{ color: '#D97706' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.signed ? `Signed ${s.signedAt}` : 'Awaiting signature'}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Audit Trail</div>
        <div style={{ position: 'relative', paddingLeft: 18 }}>
          <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1, background: '#E5E7EB' }} />
          {doc.auditTrail.map((a, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: -14, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{a.event}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.time} · {a.actor}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {doc.status === 'Completed' && (
          <button style={{ ...btnPurple, justifyContent: 'center' }}><I.Download size={14} /> Download Signed Copy</button>
        )}
        {['Pending', 'Partially Signed'].includes(doc.status) && (
          <button onClick={() => onResend(doc.id)} style={{ ...btnPurple, justifyContent: 'center', background: '#3B82F6' }}><I.Send size={14} /> Resend Reminder</button>
        )}
        {!['Completed', 'Void'].includes(doc.status) && (
          <button onClick={() => { onVoid(doc.id); onClose(); }} style={{ ...btnGhost, color: '#DC2626', background: '#FFF1F2', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><I.X size={13} /> Void Document</button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Document row ────────────────────────────────────────────── */
function DocRow({ doc, onClick }) {
  const sm = STATUS_META[doc.status];
  const signedCount = doc.signatories.filter(s => s.signed).length;
  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ background: '#FAFAFA' }}
      onClick={() => onClick(doc)}
      style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
    >
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I.PenTool size={17} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{doc.title}</div>
            {doc.matter && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{doc.matter}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>{doc.status}</span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: '#374151' }}>{signedCount}/{doc.signatories.length} signed</div>
        <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#E5E7EB', width: 80 }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#7C3AED', width: `${(signedCount / doc.signatories.length) * 100}%`, transition: 'width 300ms' }} />
        </div>
      </td>
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>{doc.createdAt}</td>
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>{doc.expiresAt}</td>
    </motion.tr>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
const FILTER_TABS = ['All', 'Pending', 'Partially Signed', 'Completed', 'Draft', 'Void'];

export default function ESign() {
  const [docs, setDocs] = useState(SEED);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = filter === 'All' ? docs : docs.filter(d => d.status === filter);

  function voidDoc(id) { setDocs(ds => ds.map(d => d.id === id ? { ...d, status: 'Void' } : d)); }
  function resend(id) { alert('Reminder sent to pending signatories!'); }

  const stats = {
    total: docs.length,
    pending: docs.filter(d => ['Pending', 'Partially Signed'].includes(d.status)).length,
    completed: docs.filter(d => d.status === 'Completed').length,
    void: docs.filter(d => d.status === 'Void').length,
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.PenTool size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>E-Signatures</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Send documents for electronic signature and track signing progress</p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Request</button>
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[['Total', stats.total, '#7C3AED'], ['Awaiting', stats.pending, '#D97706'], ['Completed', stats.completed, '#059669'], ['Void', stats.void, '#9CA3AF']].map(([label, val, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', borderColor: filter === f ? '#7C3AED' : '#E5E7EB', background: filter === f ? '#EDE9FE' : '#fff', color: filter === f ? '#7C3AED' : '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{f}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Document', 'Status', 'Progress', 'Created', 'Expires'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(d => <DocRow key={d.id} doc={d} onClick={setSelected} />)}
              </AnimatePresence>
            </tbody>
          </table>
          {!filtered.length && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
              <I.PenTool size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No documents in this category</p>
            </div>
          )}
        </div>
      </div>

      {showNew && <NewRequestModal onClose={() => setShowNew(false)} onSave={d => { setDocs(ds => [{ ...d, status: 'Pending' }, ...ds]); }} />}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.3)' }} />
            <DocDetail doc={selected} onClose={() => setSelected(null)} onVoid={id => { voidDoc(id); setSelected(s => s ? { ...s, status: 'Void' } : s); }} onResend={resend} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
