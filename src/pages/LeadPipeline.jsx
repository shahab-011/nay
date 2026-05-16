import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { leadsApi } from '../api/leads.api';

const STAGES = ['New Lead','Contacted','Consultation Scheduled','Proposal Sent','Hired','Not Hired'];
const STAGE_COLOR = {
  'New Lead':               { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Contacted':              { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  'Consultation Scheduled': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'Proposal Sent':          { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'Hired':                  { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  'Not Hired':              { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
};
const PRACTICE_AREAS = ['Family Law','Criminal','Contract','Property','Immigration','Employment','IP','Corporate','Tax','Personal Injury','Civil','Other'];
const SOURCES = ['Website Form','Referral','Social Media','Paid Ad','Phone Call','Walk-in','Bar Referral','Other'];
const FIELD_TYPES = ['text','email','phone','dropdown','checkbox','date','textarea','file','heading','paragraph'];

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGreen = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };

function daysSince(d) { return Math.floor((Date.now() - new Date(d)) / 86400000); }

function Stars({ score, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange?.(n)} style={{ cursor: onChange ? 'pointer' : 'default', fontSize: 13, color: n <= (score || 0) ? '#F59E0B' : '#D1D5DB', lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

function BarChart({ data, labelKey = '_id', valueKey = 'count', color = '#7C3AED' }) {
  if (!data?.length) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 140, fontSize: 12, color: '#374151', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d[labelKey] || 'Unknown'}</div>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 18, overflow: 'hidden' }}>
            <div style={{ width: `${((d[valueKey] || 0) / max) * 100}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s', minWidth: d[valueKey] ? 4 : 0 }} />
          </div>
          <div style={{ width: 32, fontSize: 12, fontWeight: 700, color: '#374151' }}>{d[valueKey] || 0}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stats bar ─────────────────────────────────────────────────── */
function Stats({ leads, stats: apiStats }) {
  const active  = leads.filter(l => !['Hired','Not Hired'].includes(l.stage));
  const hired   = leads.filter(l => l.stage === 'Hired');
  const total   = leads.length;
  const winRate = total ? Math.round((hired.length / total) * 100) : 0;
  const pipelineValue = apiStats?.totalValue ?? active.reduce((s, l) => s + (l.estimatedValue || 0), 0);
  const items = [
    { label: 'Total Leads',     value: total,                                            icon: I.Target,     color: '#7C3AED' },
    { label: 'Active Pipeline', value: `PKR ${((pipelineValue || 0) / 1000).toFixed(0)}k`, icon: I.TrendingUp, color: '#10B981' },
    { label: 'Win Rate',        value: `${winRate}%`,                                    icon: I.CheckSquare, color: '#3B82F6' },
    { label: 'Hired',           value: hired.length,                                     icon: I.Star,        color: '#F59E0B' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
      {items.map(s => (
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

/* ─── Lead card ──────────────────────────────────────────────────── */
function LeadCard({ lead, onDragStart, onClick }) {
  const sc = STAGE_COLOR[lead.stage] || STAGE_COLOR['New Lead'];
  return (
    <motion.div layout draggable onDragStart={e => onDragStart(e, lead._id)} onClick={() => onClick(lead)}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', cursor: 'grab', marginBottom: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{lead.name}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{lead.practiceArea}</span>
      </div>
      {lead.email && (
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <I.Mail size={10} /> {lead.email}
        </div>
      )}
      {lead.score && <div style={{ marginBottom: 4 }}><Stars score={lead.score} /></div>}
      {lead.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {lead.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
          {lead.estimatedValue ? `PKR ${(lead.estimatedValue / 1000).toFixed(0)}k` : '—'}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{daysSince(lead.createdAt)}d ago</span>
      </div>
    </motion.div>
  );
}

/* ─── Kanban column ──────────────────────────────────────────────── */
function Column({ stage, leads, stageValues, onDragStart, onDrop, onCardClick }) {
  const sc = STAGE_COLOR[stage];
  const [over, setOver] = useState(false);
  const totalVal = stageValues?.[stage] || 0;
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(e, stage); }}
      style={{ minWidth: 240, flex: '0 0 240px', background: over ? '#F5F3FF' : '#F3F4F6', borderRadius: 14, padding: '12px 10px', border: over ? '2px dashed #7C3AED' : '2px solid transparent', transition: 'all 150ms', maxHeight: '68vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc.text, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#374151' }}>{stage}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {totalVal > 0 && <span style={{ fontSize: 10, color: '#6B7280' }}>PKR {(totalVal/1000).toFixed(0)}k</span>}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>{leads.length}</span>
        </div>
      </div>
      <AnimatePresence>
        {leads.map(l => <LeadCard key={l._id} lead={l} onDragStart={onDragStart} onClick={onCardClick} />)}
      </AnimatePresence>
    </div>
  );
}

/* ─── New Lead modal ─────────────────────────────────────────────── */
function NewLeadModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', practiceArea: 'Family Law', source: 'Website Form', estimatedValue: '', stage: 'New Lead', description: '', score: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        estimatedValue: Number(form.estimatedValue) || 0,
        score:          Number(form.score) || undefined,
        tags:           form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const r = await leadsApi.create(payload);
      onSave(r.data.data || r.data);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create lead');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>New Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>
        {err && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['name','Full Name','text'],['email','Email','email'],['phone','Phone','tel'],['estimatedValue','Est. Value (PKR)','number']].map(([k,pl,type]) => (
            <div key={k}>
              <label style={lbl}>{pl}</label>
              <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} style={inp} placeholder={pl} />
            </div>
          ))}
          <div>
            <label style={lbl}>Practice Area</label>
            <select value={form.practiceArea} onChange={e => set('practiceArea', e.target.value)} style={inp}>
              {PRACTICE_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Lead Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={inp}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Score (1–5)</label>
            <select value={form.score} onChange={e => set('score', e.target.value)} style={inp}>
              <option value="">No score</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} style={inp} placeholder="urgent, high-value…" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Details about the lead…" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            <I.Plus size={14} /> {saving ? 'Saving…' : 'Add Lead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Consultation booking modal ─────────────────────────────────── */
function BookConsultationModal({ lead, onClose, onBooked }) {
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!date) return;
    setSaving(true);
    try {
      const r = await leadsApi.bookConsultation(lead._id, { consultationDate: date });
      onBooked(r.data.data || r.data);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to book');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 800 }}>Book Consultation</h3>
        <label style={lbl}>Date & Time</label>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={saving || !date} style={{ ...btnGreen, opacity: !date || saving ? 0.6 : 1 }}>
            <I.Calendar size={14} /> {saving ? 'Booking…' : 'Book'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Lead detail panel ──────────────────────────────────────────── */
function LeadDetail({ lead, onClose, onUpdate, onConvert }) {
  const [converting, setConverting]   = useState(false);
  const [showBook, setShowBook]       = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [score, setScore]             = useState(lead.score || 0);

  const handleStage = async (stage) => {
    try {
      await leadsApi.updateStage(lead._id, stage);
      onUpdate(lead._id, { stage });
    } catch { /* silent */ }
  };

  const handleScoreSave = async (n) => {
    setScore(n);
    try {
      await leadsApi.update(lead._id, { score: n });
      onUpdate(lead._id, { score: n });
    } catch { /* silent */ }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const r = await leadsApi.convert(lead._id, { title: `${lead.name} — ${lead.practiceArea}` });
      onConvert(r.data.data || r.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Conversion failed');
    } finally { setConverting(false); }
  };

  if (!lead) return null;
  const sc = STAGE_COLOR[lead.stage] || STAGE_COLOR['New Lead'];

  return (
    <>
      <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 150, background: '#fff', borderLeft: '1.5px solid #E5E7EB', boxShadow: '-8px 0 32px rgba(0,0,0,0.10)', overflowY: 'auto', padding: 24 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>{lead.name}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{lead.stage}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={18} /></button>
        </div>

        {/* Score */}
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>LEAD SCORE</div>
          <Stars score={score} onChange={handleScoreSave} />
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            ['Email',         lead.email,        I.Mail],
            ['Phone',         lead.phone,        I.Phone],
            ['Practice Area', lead.practiceArea, I.Briefcase],
            ['Source',        lead.source,       I.Target],
            ['Value',         lead.estimatedValue ? `PKR ${lead.estimatedValue.toLocaleString()}` : null, I.DollarSign],
            ['Consultation',  lead.consultationDate ? new Date(lead.consultationDate).toLocaleString() : null, I.Calendar],
            ['Follow-up',     lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : null, I.Clock],
            ['Created',       lead.createdAt?.slice(0,10), I.Calendar],
          ].filter(([,v]) => v).map(([label, val, Ic]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <Ic size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span style={{ color: '#6B7280', width: 88, flexShrink: 0, fontSize: 12 }}>{label}</span>
              <span style={{ color: '#111827', fontWeight: 600, fontSize: 12 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {lead.tags?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>TAGS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {lead.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 12, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>{t}</span>)}
            </div>
          </div>
        )}

        {/* Notes */}
        {(lead.description || lead.notes) && (
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>NOTES</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{lead.notes || lead.description}</div>
          </div>
        )}

        {/* Stage selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Move to Stage</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STAGES.map(s => {
              const c = STAGE_COLOR[s];
              return (
                <button key={s} onClick={() => handleStage(s)}
                  style={{ padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${lead.stage === s ? c.text : '#E5E7EB'}`, background: lead.stage === s ? c.bg : '#fff', color: lead.stage === s ? c.text : '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!lead.consultationDate && (
            <button onClick={() => setShowBook(true)} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', width: '100%' }}>
              <I.Calendar size={14} /> Book Consultation
            </button>
          )}
          {!lead.isConverted ? (
            <button onClick={handleConvert} disabled={converting} style={{ ...btnGreen, justifyContent: 'center', width: '100%', opacity: converting ? 0.7 : 1 }}>
              <I.Briefcase size={14} /> {converting ? 'Converting…' : 'Convert to Matter'}
            </button>
          ) : (
            <div style={{ background: '#ECFDF5', borderRadius: 10, padding: 10, fontSize: 13, color: '#059669', fontWeight: 700, textAlign: 'center' }}>
              ✓ Converted to Matter
            </div>
          )}
        </div>

        {/* Activity log */}
        {lead.activityLog?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setShowActivity(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280', padding: 0 }}>
              <I.Clock size={13} /> Activity Log ({lead.activityLog.length})
              <I.ChevronDown size={13} style={{ transform: showActivity ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
            </button>
            <AnimatePresence>
              {showActivity && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...lead.activityLog].reverse().slice(0, 8).map((a, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{new Date(a.date).toLocaleDateString()}</span>
                        <span>{a.description}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {showBook && <BookConsultationModal lead={lead} onClose={() => setShowBook(false)} onBooked={updated => { onUpdate(lead._id, updated); }} />}
    </>
  );
}

/* ─── Analytics view ─────────────────────────────────────────────── */
function AnalyticsView() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leadsApi.analytics.pipeline().then(r => {
      setData(r.data.data || r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading analytics…</div>;
  if (!data)   return <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>No analytics data</div>;

  const { byStage, bySource, byArea, summary } = data;

  const sumCards = [
    { label: 'Total Leads',      value: summary?.total ?? 0,          color: '#7C3AED' },
    { label: 'Hired',            value: summary?.hired ?? 0,          color: '#059669' },
    { label: 'Conversion Rate',  value: `${summary?.conversionRate ?? 0}%`, color: '#3B82F6' },
    { label: 'Pipeline Value',   value: `PKR ${((summary?.pipelineValue || 0)/1000).toFixed(0)}k`, color: '#F59E0B' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {sumCards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Leads by Stage</h4>
          <BarChart data={byStage} color="#7C3AED" />
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Leads by Source</h4>
          <BarChart data={bySource} color="#10B981" />
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Leads by Practice Area</h4>
          <BarChart data={byArea} color="#3B82F6" />
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Value by Stage</h4>
          <BarChart data={byStage} valueKey="value" color="#F59E0B" />
        </div>
      </div>
    </div>
  );
}

/* ─── Form builder modal ─────────────────────────────────────────── */
function FormModal({ form: editForm, onClose, onSave }) {
  const [form, setForm] = useState({
    name:           editForm?.name || '',
    description:    editForm?.description || '',
    successMessage: editForm?.successMessage || 'Thank you! We will be in touch shortly.',
    practiceAreas:  editForm?.practiceAreas || [],
    fields:         editForm?.fields || [],
  });
  const [saving, setSaving] = useState(false);

  const addField = () => setForm(f => ({
    ...f,
    fields: [...f.fields, { type: 'text', label: 'New Field', isRequired: false, options: [], order: f.fields.length }],
  }));

  const updateField = (i, key, val) => setForm(f => {
    const fields = [...f.fields];
    fields[i] = { ...fields[i], [key]: val };
    return { ...f, fields };
  });

  const removeField = (i) => setForm(f => ({ ...f, fields: f.fields.filter((_, j) => j !== i) }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = editForm
        ? await leadsApi.forms.update(editForm._id, form)
        : await leadsApi.forms.create(form);
      onSave(r.data.data || r.data);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save form');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editForm ? 'Edit Form' : 'New Intake Form'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Form Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} placeholder="e.g. Personal Injury Intake" />
          </div>
          <div>
            <label style={lbl}>Success Message</label>
            <input value={form.successMessage} onChange={e => setForm(f => ({ ...f, successMessage: e.target.value }))} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, height: 60, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Form Fields ({form.fields.length})</div>
            <button onClick={addField} style={{ ...btnPurple, padding: '6px 14px', fontSize: 12 }}><I.Plus size={13} /> Add Field</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.fields.map((field, i) => (
              <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #E5E7EB' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10, alignItems: 'center' }}>
                  <input value={field.label} onChange={e => updateField(i, 'label', e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: 12 }} placeholder="Field label" />
                  <select value={field.type} onChange={e => updateField(i, 'type', e.target.value)} style={{ ...inp, padding: '7px 10px', fontSize: 12 }}>
                    {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removeField(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}><I.Trash size={14} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={field.isRequired || false} onChange={e => updateField(i, 'isRequired', e.target.checked)} />
                    Required
                  </label>
                  {['dropdown','checkbox'].includes(field.type) && (
                    <input
                      value={(field.options || []).join(', ')}
                      onChange={e => updateField(i, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                      style={{ ...inp, flex: 1, padding: '5px 10px', fontSize: 12 }}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  )}
                </div>
              </div>
            ))}
            {form.fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: 13 }}>No fields yet — click "Add Field" to start</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.name} style={{ ...btnPurple, opacity: saving || !form.name ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editForm ? 'Save Changes' : 'Create Form'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Intake forms view ──────────────────────────────────────────── */
function FormsView() {
  const [forms, setForms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm]   = useState(null);
  const [responses, setResponses] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await leadsApi.forms.list();
      setForms(r.data.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this form?')) return;
    try {
      await leadsApi.forms.remove(id);
      setForms(fs => fs.filter(f => f._id !== id));
    } catch { /* silent */ }
  };

  const loadResponses = async (form) => {
    try {
      const r = await leadsApi.forms.responses(form._id);
      setResponses({ form, leads: r.data.data || [] });
    } catch { /* silent */ }
  };

  const baseUrl = window.location.origin;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading forms…</div>;

  if (responses) return (
    <div>
      <button onClick={() => setResponses(null)} style={{ ...btnGhost, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <I.ChevronLeft size={14} /> Back to Forms
      </button>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Responses — {responses.form.name} ({responses.leads.length})</h3>
      {responses.leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No submissions yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {responses.leads.map(l => (
            <div key={l._id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{l.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{l.email} · {l.stage} · {new Date(l.createdAt).toLocaleDateString()}</div>
              </div>
              {l.score && <Stars score={l.score} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => { setEditForm(null); setShowModal(true); }} style={btnPurple}>
          <I.Plus size={15} /> New Intake Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <I.FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No intake forms yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Create a form to capture leads from your website</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forms.map(f => (
            <div key={f._id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{f.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: f.isActive ? '#ECFDF5' : '#F3F4F6', color: f.isActive ? '#059669' : '#6B7280', fontWeight: 700 }}>{f.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  {f.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{f.description}</div>}
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {f.fields?.length || 0} fields · {f.usageCount || 0} submissions
                  </div>
                  {f.slug && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 11, background: '#F3F4F6', padding: '3px 8px', borderRadius: 6, color: '#6D28D9', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {baseUrl}/intake/{f.slug}
                      </code>
                      <button onClick={() => navigator.clipboard?.writeText(`${baseUrl}/intake/${f.slug}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontSize: 11 }}>Copy</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => loadResponses(f)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>Responses</button>
                  <button onClick={() => { setEditForm(f); setShowModal(true); }} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                  <button onClick={() => handleDelete(f._id)} style={{ background: 'none', border: '1.5px solid #FCA5A5', borderRadius: 9, padding: '6px 12px', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FormModal
          form={editForm}
          onClose={() => { setShowModal(false); setEditForm(null); }}
          onSave={() => { setShowModal(false); setEditForm(null); load(); }}
        />
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function LeadPipeline() {
  const [leads, setLeads]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [stageValues, setStageValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('kanban');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const dragId = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r    = await leadsApi.list({ limit: 500 });
      const body = r.data.data || r.data;
      setLeads(body.leads || body || []);
      setStats(body.stats || null);
      setStageValues(body.stageValues || {});
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleLeads = searchQ
    ? leads.filter(l => l.name.toLowerCase().includes(searchQ.toLowerCase()) || l.email?.toLowerCase().includes(searchQ.toLowerCase()))
    : leads;

  function handleDragStart(e, id) { dragId.current = id; }
  async function handleDrop(e, stage) {
    if (!dragId.current) return;
    const id = dragId.current;
    dragId.current = null;
    setLeads(ls => ls.map(l => l._id === id ? { ...l, stage } : l));
    try { await leadsApi.updateStage(id, stage); }
    catch { load(); }
  }

  function patchLead(id, patch) {
    setLeads(ls => ls.map(l => l._id === id ? { ...l, ...patch } : l));
    setSelected(s => s?._id === id ? { ...s, ...patch } : s);
  }

  function handleConverted(result) {
    const matterId = result.matter?._id || result._id;
    patchLead(selected._id, { stage: 'Hired', isConverted: true, convertedToMatterId: matterId });
    setSelected(null);
  }

  const viewBtn = (v, label) => (
    <button onClick={() => setView(v)} style={{ padding: '8px 18px', borderRadius: 9, background: view === v ? '#7C3AED' : '#F3F4F6', color: view === v ? '#fff' : '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
      {label}
    </button>
  );

  if (loading) return (
    <div style={{ paddingTop: 120, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 60px' }}>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Target size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Lead Pipeline</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Track prospects from first contact to signed retainer</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {view === 'kanban' && (
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search leads…" style={{ ...inp, width: 200, padding: '8px 12px' }} />
              )}
              {viewBtn('kanban', 'Kanban')}
              {viewBtn('analytics', 'Analytics')}
              {viewBtn('forms', 'Intake Forms')}
              <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Lead</button>
            </div>
          </div>
        </motion.div>

        {view === 'kanban' && (
          <>
            <Stats leads={leads} stats={stats} />
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
              {STAGES.map(stage => (
                <Column key={stage} stage={stage} stageValues={stageValues}
                  leads={visibleLeads.filter(l => l.stage === stage)}
                  onDragStart={handleDragStart} onDrop={handleDrop} onCardClick={setSelected} />
              ))}
            </div>
          </>
        )}

        {view === 'analytics' && <AnalyticsView />}
        {view === 'forms'     && <FormsView />}
      </div>

      {showNew && (
        <NewLeadModal onClose={() => setShowNew(false)} onSave={l => { setLeads(ls => [l, ...ls]); }} />
      )}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.3)' }} />
            <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdate={patchLead} onConvert={handleConverted} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
