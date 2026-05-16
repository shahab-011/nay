import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { esignApi } from '../api/esign.api';

/* ─── Constants ───────────────────────────────────────────────── */
const STATUS_META = {
  draft:            { label: 'Draft',            bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  pending:          { label: 'Pending',           bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' },
  partially_signed: { label: 'Partially Signed',  bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  completed:        { label: 'Completed',         bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  expired:          { label: 'Expired',           bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  void:             { label: 'Void',              bg: '#F3F4F6', text: '#9CA3AF', border: '#E5E7EB' },
};

const ROLES = [
  { value: 'client',      label: 'Client' },
  { value: 'co_client',   label: 'Co-Client' },
  { value: 'attorney',    label: 'Attorney' },
  { value: 'witness',     label: 'Witness' },
  { value: 'third_party', label: 'Third Party' },
];

const FILTER_TABS = ['all', 'pending', 'partially_signed', 'completed', 'draft', 'void'];

function roleLabel(r) {
  return ROLES.find(x => x.value === r)?.label || r || 'Client';
}
function statusMeta(s) {
  return STATUS_META[s] || STATUS_META.draft;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost  = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── NewRequestModal ─────────────────────────────────────────── */
function NewRequestModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    signingMode: 'parallel',
  });
  const [signatories, setSignatories] = useState([{ name: '', email: '', role: 'client', phone: '' }]);
  const [saving, setSaving] = useState(false);
  const [sendNow, setSendNow] = useState(true);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function addSig()           { setSignatories(s => [...s, { name: '', email: '', role: 'client', phone: '' }]); }
  function removeSig(i)       { setSignatories(s => s.filter((_, j) => j !== i)); }
  function setSig(i, k, v)    { setSignatories(s => s.map((sg, j) => j === i ? { ...sg, [k]: v } : sg)); }

  async function save() {
    if (!form.title || !signatories[0]?.email) return;
    setSaving(true);
    try {
      const createRes = await esignApi.create({
        ...form,
        signatories: signatories.filter(s => s.email).map(s => ({
          name:  s.name,
          email: s.email,
          role:  s.role,
          phone: s.phone || undefined,
        })),
      });
      const newDoc = createRes.data.data;
      if (sendNow) {
        const sendRes = await esignApi.send(newDoc._id);
        onSave(sendRes.data.data?.request || { ...newDoc, status: 'pending' });
      } else {
        onSave(newDoc);
      }
      onClose();
    } catch (e) {
      console.error('Failed to create e-sign request:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>New Signature Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Document Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder="e.g. Retainer Agreement — Client Name" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description / Message to Signatories</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Please review and sign the attached document." />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Signing Order</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ value: 'parallel', label: 'Parallel', desc: 'Everyone signs at once' }, { value: 'sequential', label: 'Sequential', desc: 'Each person signs in order' }].map(opt => (
              <button key={opt.value} onClick={() => set('signingMode', opt.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.signingMode === opt.value ? '#7C3AED' : '#E5E7EB'}`, background: form.signingMode === opt.value ? '#F5F3FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.signingMode === opt.value ? '#7C3AED' : '#374151' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Signatories</label>
            <button onClick={addSig} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#6D28D9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <I.Plus size={12} /> Add
            </button>
          </div>
          {signatories.map((s, i) => (
            <div key={i} style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: '1.5px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                  {form.signingMode === 'sequential' ? `Signatory ${i + 1} (signs ${i === 0 ? '1st' : i === 1 ? '2nd' : `${i + 1}th`})` : `Signatory ${i + 1}`}
                </div>
                {signatories.length > 1 && (
                  <button onClick={() => removeSig(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}><I.X size={14} /></button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input value={s.name} onChange={e => setSig(i, 'name', e.target.value)} style={inp} placeholder="Full Name" />
                <input value={s.email} onChange={e => setSig(i, 'email', e.target.value)} style={inp} placeholder="Email" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={s.role} onChange={e => setSig(i, 'role', e.target.value)} style={inp}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <input value={s.phone || ''} onChange={e => setSig(i, 'phone', e.target.value)} style={inp} placeholder="Phone (optional)" />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="sendNow" checked={sendNow} onChange={e => setSendNow(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="sendNow" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Send immediately after creating</label>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            <I.Send size={14} /> {saving ? 'Creating…' : sendNow ? 'Create & Send' : 'Save as Draft'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── VoidModal ───────────────────────────────────────────────── */
function VoidModal({ docId, onClose, onVoid }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await esignApi.void(docId, { reason });
      onVoid(docId);
      onClose();
    } catch (e) {
      console.error('Void failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Void Signature Request</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>This will cancel all outstanding signature requests and notify signatories.</p>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Reason (optional)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} style={inp} placeholder="e.g. Document superseded" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...btnPurple, background: '#DC2626', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Voiding…' : 'Void Request'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── DocDetail panel ─────────────────────────────────────────── */
function DocDetail({ doc, onClose, onVoid, onResend, onReload }) {
  const sm = statusMeta(doc.status);
  const signedCount   = (doc.signatories || []).filter(s => s.status === 'signed').length;
  const declinedCount = (doc.signatories || []).filter(s => s.status === 'declined').length;
  const total         = (doc.signatories || []).length;
  const matterLabel   = doc.matterId?.matterNumber || doc.matterId?.title || '';
  const [resending, setResending]   = useState(false);
  const [showVoid, setShowVoid]     = useState(false);
  const [auditFull, setAuditFull]   = useState(false);
  const trail = doc.auditTrail || [];

  async function handleResend() {
    setResending(true);
    try {
      await esignApi.resend(doc._id);
      onReload();
    } catch (e) {
      console.error('Resend failed:', e);
    } finally {
      setResending(false);
    }
  }

  async function handleDownload() {
    try {
      const res = await esignApi.download(doc._id);
      const info = res.data.data;
      alert(`Signed document: ${info.title}\nCompleted: ${fmtDate(info.completedAt)}\nHash: ${info.signedDocumentHash || 'N/A'}`);
    } catch (e) {
      console.error('Download failed:', e);
    }
  }

  return (
    <>
      <motion.div
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, zIndex: 150, background: '#fff', borderLeft: '1.5px solid #E5E7EB', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827', flex: 1, marginRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}><I.X size={18} /></button>
        </div>

        {/* Status + meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>{sm.label}</span>
          {matterLabel && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280' }}>{matterLabel}</span>}
          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>
            {doc.signingMode === 'sequential' ? 'Sequential' : 'Parallel'}
          </span>
        </div>

        {/* Progress */}
        <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 12, marginBottom: 18, border: '1.5px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{signedCount} of {total} signed</div>
            {declinedCount > 0 && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>{declinedCount} declined</span>}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB' }}>
            <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7C3AED, #6D28D9)', width: `${total ? (signedCount / total) * 100 : 0}%`, transition: 'width 400ms' }} />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Expires {fmtDate(doc.expiresAt)}</div>
        </div>

        {/* Signatories */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Signatories</div>
          {(doc.signatories || []).map((s, i) => {
            const signed   = s.status === 'signed';
            const declined = s.status === 'declined';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: signed ? '#F0FDF4' : declined ? '#FFF1F2' : '#F9FAFB', borderRadius: 10, marginBottom: 6, border: `1px solid ${signed ? '#86EFAC' : declined ? '#FECDD3' : '#E5E7EB'}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: signed ? '#ECFDF5' : declined ? '#FEE2E2' : '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {signed ? <I.Check size={13} style={{ color: '#059669' }} /> : declined ? <I.X size={13} style={{ color: '#EF4444' }} /> : <I.Clock size={13} style={{ color: '#D97706' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.email} · {roleLabel(s.role)}</div>
                  {signed && <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Signed {fmtDateTime(s.signedAt)}</div>}
                  {declined && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>Declined{s.declineReason ? `: ${s.declineReason}` : ''}</div>}
                  {!signed && !declined && doc.signingMode === 'sequential' && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Signs {i === 0 ? '1st' : `after #${i}`}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit trail */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Audit Trail</div>
            {trail.length > 4 && (
              <button onClick={() => setAuditFull(f => !f)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#7C3AED', fontWeight: 600, padding: 0 }}>
                {auditFull ? 'Show less' : `+${trail.length - 4} more`}
              </button>
            )}
          </div>
          <div style={{ position: 'relative', paddingLeft: 18 }}>
            <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1, background: '#E5E7EB' }} />
            {(auditFull ? trail : trail.slice(-4)).map((a, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ position: 'absolute', left: -14, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{a.event}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>
                  {fmtDateTime(a.time)}{a.actor ? ` · ${a.actor}` : ''}
                  {a.details ? <span style={{ display: 'block', color: '#9CA3AF' }}>{a.details}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {doc.status === 'completed' && (
            <button onClick={handleDownload} style={{ ...btnPurple, justifyContent: 'center' }}><I.Download size={14} /> Download Signed Copy</button>
          )}
          {['pending', 'partially_signed'].includes(doc.status) && (
            <button onClick={handleResend} disabled={resending} style={{ ...btnPurple, justifyContent: 'center', background: '#3B82F6', opacity: resending ? 0.7 : 1 }}>
              <I.Send size={14} /> {resending ? 'Resending…' : 'Resend to Unsigned'}
            </button>
          )}
          {!['completed', 'void', 'expired'].includes(doc.status) && (
            <button onClick={() => setShowVoid(true)} style={{ ...btnGhost, color: '#DC2626', background: '#FFF1F2', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.X size={13} /> Void Document
            </button>
          )}
        </div>
      </motion.div>

      {showVoid && (
        <VoidModal
          docId={doc._id}
          onClose={() => setShowVoid(false)}
          onVoid={id => { onVoid(id); onClose(); }}
        />
      )}
    </>
  );
}

/* ─── DocRow ──────────────────────────────────────────────────── */
function DocRow({ doc, onClick }) {
  const sm          = statusMeta(doc.status);
  const signedCount = (doc.signatories || []).filter(s => s.status === 'signed').length;
  const total       = (doc.signatories || []).length || 1;
  const matterLabel = doc.matterId?.matterNumber || doc.matterId?.title || '';

  return (
    <motion.tr
      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
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
            {matterLabel && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{matterLabel}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>{sm.label}</span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: '#374151' }}>{signedCount}/{total} signed</div>
        <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#E5E7EB', width: 80 }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#7C3AED', width: `${(signedCount / total) * 100}%`, transition: 'width 300ms' }} />
        </div>
      </td>
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(doc.createdAt)}</td>
      <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(doc.expiresAt)}</td>
    </motion.tr>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function ESign() {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await esignApi.list();
      const d = res.data.data;
      setDocs(Array.isArray(d) ? d : d?.requests || []);
    } catch (e) {
      console.error('Failed to load e-sign requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

  function voidDoc(id) {
    setDocs(ds => ds.map(d => d._id === id ? { ...d, status: 'void' } : d));
    if (selected?._id === id) setSelected(null);
  }

  const stats = {
    total:     docs.length,
    awaiting:  docs.filter(d => ['pending', 'partially_signed'].includes(d.status)).length,
    completed: docs.filter(d => d.status === 'completed').length,
    void:      docs.filter(d => d.status === 'void').length,
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
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Send documents for electronic signature — track signing progress in real-time</p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Request</button>
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            ['Total', stats.total, '#7C3AED'],
            ['Awaiting', stats.awaiting, '#D97706'],
            ['Completed', stats.completed, '#059669'],
            ['Void', stats.void, '#9CA3AF'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => {
            const meta = statusMeta(f);
            const label = f === 'all' ? 'All' : meta.label;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', borderColor: filter === f ? '#7C3AED' : '#E5E7EB', background: filter === f ? '#EDE9FE' : '#fff', color: filter === f ? '#7C3AED' : '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF', fontSize: 14 }}>Loading…</div>
          ) : (
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
                  {filtered.map(d => <DocRow key={d._id} doc={d} onClick={setSelected} />)}
                </AnimatePresence>
              </tbody>
            </table>
          )}
          {!loading && !filtered.length && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
              <I.PenTool size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No documents in this category</p>
              <button onClick={() => setShowNew(true)} style={{ ...btnPurple, margin: '14px auto 0', justifyContent: 'center' }}><I.Plus size={15} /> New Request</button>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onSave={newDoc => { setDocs(ds => [newDoc, ...ds]); }}
        />
      )}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.3)' }} />
            <DocDetail
              doc={selected}
              onClose={() => setSelected(null)}
              onVoid={voidDoc}
              onReload={load}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
