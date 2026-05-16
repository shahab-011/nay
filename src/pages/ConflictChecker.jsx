import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { conflictsApi } from '../api/conflicts.api';

/* ─── Constants ───────────────────────────────────────────────── */
const RISK_COLOR  = { none: '#059669', low: '#D97706', medium: '#EA580C', high: '#DC2626' };
const RISK_BG     = { none: '#ECFDF5', low: '#FFF7ED', medium: '#FFF4ED', high: '#FEE2E2' };
const RISK_BORDER = { none: '#6EE7B7', low: '#FED7AA', medium: '#FDBA74', high: '#FCA5A5' };
const SEV_COLOR   = { high: '#DC2626', medium: '#D97706', low: '#2563EB' };
const SEV_BG      = { high: '#FEE2E2', medium: '#FEF3C7', low: '#DBEAFE' };

const TERM_TYPES = ['name', 'email', 'phone', 'company'];

const CONFLICT_LABELS = {
  DIRECT_CONFLICT:        'Direct Conflict',
  OPPOSING_PARTY:         'Opposing Party',
  FORMER_CLIENT:          'Former Client',
  EXISTING_CLIENT:        'Existing Client',
  WITNESS_EXPERT:         'Witness / Expert',
  LEAD_MATCH:             'Lead Match',
  COMMUNICATION_MENTION:  'Communication Mention',
};

/* ─── Sub-components ──────────────────────────────────────────── */
function ConflictFlag({ detail }) {
  const sev = detail.severity || 'low';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: SEV_BG[sev], border: `2px solid ${SEV_COLOR[sev]}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${SEV_COLOR[sev]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <I.Alert size={15} style={{ color: SEV_COLOR[sev] }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: SEV_COLOR[sev], textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          {CONFLICT_LABELS[detail.type] || detail.type} · {sev} risk
        </div>
        <div style={{ fontSize: 13, color: '#374151' }}>{detail.description}</div>
      </div>
    </motion.div>
  );
}

function ResultRow({ icon: Ic, iconBg, iconColor, title, sub, badge, badgeColor, badgeBg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #E5E7EB', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic size={16} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{sub}</div>}
      </div>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badgeBg || '#F3F4F6', color: badgeColor || '#6B7280', whiteSpace: 'nowrap' }}>{badge}</span>
      )}
    </div>
  );
}

/* ─── Resolve Modal ───────────────────────────────────────────── */
function ResolveModal({ check, onClose, onSaved }) {
  const [resolution, setResolution] = useState('clear');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  async function save() {
    setSaving(true);
    try {
      await conflictsApi.resolve(check._id, { resolution, resolutionNotes: notes });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 18, padding: 28, width: 420, maxWidth: '92vw', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 18 }}>Resolve Conflict Check</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Resolution</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['clear', 'waived', 'declined'].map(r => (
              <button key={r} onClick={() => setResolution(r)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `2px solid ${resolution === r ? '#7C3AED' : '#E5E7EB'}`, background: resolution === r ? '#F5F3FF' : '#F9FAFB', color: resolution === r ? '#7C3AED' : '#4B5563', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Notes</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add resolution notes…"
            rows={3}
            style={{ width: '100%', borderRadius: 9, border: '1.5px solid #E5E7EB', padding: '10px 12px', fontSize: 13, color: '#111827', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Resolution'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Print Report ────────────────────────────────────────────── */
function printReport(check, contacts, matters, leads) {
  const win = window.open('', '_blank');
  const terms = (check.searchTerms || []).map(t => `${t.type}: ${t.value}`).join(', ');
  const conflictsHtml = (check.conflictDetails || []).map(d =>
    `<div class="flag ${d.severity}"><strong>${CONFLICT_LABELS[d.type] || d.type}</strong> (${d.severity} risk)<br/>${d.description}</div>`
  ).join('');
  const contactsHtml = (contacts || []).map(c =>
    `<div class="row"><span>${`${c.firstName||''} ${c.lastName||''}`.trim()||c.company||'—'}</span><span class="badge">${c.type}</span></div>`
  ).join('');
  const mattersHtml = (matters || []).map(m =>
    `<div class="row"><span>${m.title} (#${m.matterNumber||'N/A'})</span><span class="badge">${m.status||''}</span></div>`
  ).join('');

  win.document.write(`<!DOCTYPE html><html><head><title>Conflict Check Report</title>
  <style>
    body{font-family:sans-serif;max-width:800px;margin:40px auto;color:#111;font-size:13px}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#6B7280;font-size:12px;margin-bottom:24px}
    .risk-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:13px;margin-bottom:20px}
    .flag{padding:10px 14px;border-radius:8px;margin-bottom:8px;border-left:4px solid #ccc}
    .flag.high{background:#FEE2E2;border-color:#DC2626;color:#991B1B}
    .flag.medium{background:#FEF3C7;border-color:#D97706;color:#92400E}
    .flag.low{background:#DBEAFE;border-color:#2563EB;color:#1E40AF}
    h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6B7280;margin:20px 0 8px}
    .row{display:flex;justify-content:space-between;padding:8px 10px;border:1px solid #E5E7EB;border-radius:6px;margin-bottom:4px}
    .badge{font-size:11px;font-weight:700;background:#F3F4F6;padding:2px 8px;border-radius:12px;color:#374151}
    @media print{body{margin:20px}}
  </style></head><body>
  <h1>Conflict of Interest Check Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Search terms: ${terms}</div>
  <div class="risk-badge" style="background:${RISK_BG[check.riskLevel||'none']};color:${RISK_COLOR[check.riskLevel||'none']};border:1px solid ${RISK_BORDER[check.riskLevel||'none']}">
    ${check.hasConflict ? `Conflict Found — ${check.riskLevel} risk` : 'Clear — No Conflicts'}
  </div>
  ${check.conflictDetails?.length ? `<h3>Conflict Flags (${check.conflictDetails.length})</h3>${conflictsHtml}` : '<p style="color:#059669;font-weight:700">✓ No conflicts detected</p>'}
  ${contacts?.length ? `<h3>Contact Matches (${contacts.length})</h3>${contactsHtml}` : ''}
  ${matters?.length  ? `<h3>Matter Matches (${matters.length})</h3>${mattersHtml}` : ''}
  ${check.resolution ? `<h3>Resolution</h3><div class="flag low"><strong>${check.resolution}</strong><br/>${check.resolutionNotes||''}</div>` : ''}
  </body></html>`);
  win.document.close();
  win.print();
}

/* ─── History Row ─────────────────────────────────────────────── */
function HistoryRow({ check, onView }) {
  const terms = (check.searchTerms || []).map(t => t.value).filter(Boolean).join(', ');
  const rl    = check.riskLevel || 'none';
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: RISK_BG[rl], border: `1.5px solid ${RISK_BORDER[rl]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {check.hasConflict ? <I.Alert size={16} style={{ color: RISK_COLOR[rl] }} /> : <I.Check size={16} style={{ color: '#059669' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{terms || 'No terms'}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
          {new Date(check.createdAt).toLocaleDateString()} · by {check.performedBy?.name || 'Unknown'}
          {check.matterId ? ` · ${check.matterId.title}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: RISK_BG[rl], color: RISK_COLOR[rl] }}>
          {check.riskLevel || 'none'}
        </span>
        {check.resolution && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#059669' }}>
            {check.resolution}
          </span>
        )}
        <button onClick={() => onView(check._id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          View
        </button>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function ConflictChecker() {
  const [tab, setTab]             = useState('check');
  const [terms, setTerms]         = useState([{ type: 'name', value: '' }]);
  const [notes, setNotes]         = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histLoading, setHistLoading] = useState(false);
  const [resolveCheck, setResolveCheck] = useState(null);
  const [histQ, setHistQ]         = useState('');

  /* ── Search terms helpers ── */
  function addTerm() {
    setTerms(prev => [...prev, { type: 'name', value: '' }]);
  }
  function removeTerm(i) {
    setTerms(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateTerm(i, field, val) {
    setTerms(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  }

  /* ── Run check ── */
  const runCheck = useCallback(async () => {
    const filled = terms.filter(t => t.value.trim());
    if (!filled.length) return;
    setLoading(true);
    try {
      const res = await conflictsApi.run({ searchTerms: filled, notes: notes || undefined });
      setResult(res.data.data);
    } catch (e) {
      console.error('Conflict check failed:', e);
    } finally {
      setLoading(false);
    }
  }, [terms, notes]);

  /* ── History ── */
  const loadHistory = useCallback(async (q = histQ) => {
    setHistLoading(true);
    try {
      const res = await conflictsApi.history({ q: q || undefined, limit: 30 });
      const d   = res.data.data;
      setHistory(d.checks || []);
      setHistTotal(d.total || 0);
    } catch (e) {
      console.error('History load failed:', e);
    } finally {
      setHistLoading(false);
    }
  }, [histQ]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  /* ── View from history ── */
  async function viewCheck(id) {
    setLoading(true);
    try {
      const res = await conflictsApi.get(id);
      const c   = res.data.data;
      setResult({
        check:       c,
        contacts:    c.results?.contacts || [],
        matters:     c.results?.matters  || [],
        leads:       c.results?.leads    || [],
        commMatches: [],
      });
      setTab('check');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const check       = result?.check;
  const contacts    = result?.contacts || [];
  const matters     = result?.matters  || [];
  const leads       = result?.leads    || [];
  const riskLevel   = check?.riskLevel || 'none';
  const hasConflict = check?.hasConflict;
  const conflictDetails = check?.conflictDetails || [];

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#EF4444,#DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Shield size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Conflict of Interest Checker</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Search across matters, contacts, and leads before taking new clients</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 12, padding: 4, border: '1.5px solid #E5E7EB', width: 'fit-content' }}>
          {[['check', I.Search, 'Run Check'], ['history', I.Clock, 'History']].map(([id, Ic, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: 'none', background: tab === id ? '#7C3AED' : 'transparent', color: tab === id ? '#fff' : '#6B7280', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .15s' }}>
              <Ic size={14} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Check Tab ── */}
          {tab === 'check' && (
            <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Search form */}
              <div style={{ background: '#fff', borderRadius: 18, border: '2px solid #E5E7EB', padding: 24, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Search Terms</div>

                {terms.map((term, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <select
                      value={term.type}
                      onChange={e => updateTerm(i, 'type', e.target.value)}
                      style={{ width: 110, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#374151', outline: 'none', background: '#F9FAFB', fontWeight: 600 }}
                    >
                      {TERM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <I.Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        value={term.value}
                        onChange={e => updateTerm(i, 'value', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runCheck()}
                        placeholder={`Enter ${term.type}…`}
                        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    {terms.length > 1 && (
                      <button onClick={() => removeTerm(i)} style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <I.Trash size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={addTerm} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1.5px dashed #D1D5DB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                  <I.Plus size={13} /> Add another term
                </button>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Notes (optional)</div>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Reason for this check…"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {result && (
                    <button onClick={() => { setResult(null); setTerms([{ type: 'name', value: '' }]); setNotes(''); }} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Clear
                    </button>
                  )}
                  <button onClick={runCheck} disabled={loading} style={{ padding: '10px 28px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Checking…' : 'Run Check'}
                  </button>
                </div>
              </div>

              {/* Results */}
              <AnimatePresence>
                {result && check && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Summary bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: RISK_BG[riskLevel], border: `1.5px solid ${RISK_BORDER[riskLevel]}` }}>
                          {hasConflict ? <I.Alert size={15} style={{ color: RISK_COLOR[riskLevel] }} /> : <I.Check size={15} style={{ color: '#059669' }} />}
                          <span style={{ fontSize: 13, fontWeight: 800, color: RISK_COLOR[riskLevel] }}>
                            {hasConflict ? `${conflictDetails.length} Flag${conflictDetails.length !== 1 ? 's' : ''} · ${riskLevel} risk` : 'Clear — No Conflicts'}
                          </span>
                        </div>
                        {check.resolution && (
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: '#ECFDF5', color: '#059669' }}>
                            {check.resolution}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {hasConflict && !check.resolution && (
                          <button onClick={() => setResolveCheck(check)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            <I.Check size={13} /> Resolve
                          </button>
                        )}
                        <button onClick={() => printReport(check, contacts, matters, leads)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          <I.Download size={13} /> Print Report
                        </button>
                      </div>
                    </div>

                    {/* Conflict flags */}
                    {conflictDetails.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Conflict Flags</div>
                        {conflictDetails.map((d, i) => <ConflictFlag key={i} detail={d} />)}
                      </div>
                    )}

                    {/* Contact matches */}
                    {contacts.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <I.Users size={13} /> Contact Matches ({contacts.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {contacts.map(c => (
                            <ResultRow key={c._id}
                              icon={I.User} iconBg="#EFF6FF" iconColor="#3B82F6"
                              title={`${c.firstName||''} ${c.lastName||''}`.trim() || c.company || '—'}
                              sub={c.email || c.phone || ''}
                              badge={c.type?.replace(/_/g, ' ')}
                              badgeBg={['opposing_party','opposing_counsel'].includes(c.type) ? '#FEE2E2' : '#F3F4F6'}
                              badgeColor={['opposing_party','opposing_counsel'].includes(c.type) ? '#DC2626' : '#6B7280'}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matter matches */}
                    {matters.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <I.Briefcase size={13} /> Matter Matches ({matters.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {matters.map(m => (
                            <ResultRow key={m._id}
                              icon={I.Briefcase} iconBg="#F5F3FF" iconColor="#7C3AED"
                              title={m.title}
                              sub={`#${m.matterNumber || 'N/A'} · ${m.practiceArea || ''}`}
                              badge={m.status}
                              badgeBg={m.status === 'Active' ? '#ECFDF5' : '#F3F4F6'}
                              badgeColor={m.status === 'Active' ? '#059669' : '#6B7280'}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lead matches */}
                    {leads.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <I.Star size={13} /> Lead Matches ({leads.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {leads.map(l => (
                            <ResultRow key={l._id}
                              icon={I.User} iconBg="#FFF7ED" iconColor="#D97706"
                              title={l.name || l.email || '—'}
                              sub={l.email || ''}
                              badge={l.stage}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All clear */}
                    {!hasConflict && contacts.length === 0 && matters.length === 0 && leads.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                        <I.Search size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>No matches found across contacts, matters, or leads.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info box */}
              {!result && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <I.Info size={15} style={{ color: '#7C3AED' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>How Conflict Checking Works</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                    {[
                      ['Multi-term search', 'Combine name, email, phone, and company to cast a wider net across all records.'],
                      ['7-point analysis', 'Checks for direct conflicts, opposing parties, former clients, witnesses, experts, leads, and communications.'],
                      ['Saved to history', 'Every check is recorded — auditable for professional responsibility compliance.'],
                      ['Print report', 'Generate a printable PDF report with all findings for your file.'],
                    ].map(([t, d]) => (
                      <div key={t} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{t}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{d}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <I.Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    value={histQ}
                    onChange={e => setHistQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadHistory(histQ)}
                    placeholder="Filter by search term…"
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <button onClick={() => loadHistory(histQ)} disabled={histLoading} style={{ padding: '10px 20px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: histLoading ? 0.7 : 1 }}>
                  {histLoading ? '…' : 'Search'}
                </button>
              </div>

              {histLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading history…</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                  <I.Clock size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No conflict checks recorded yet.</p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>{histTotal} check{histTotal !== 1 ? 's' : ''} total</div>
                  {history.map(c => <HistoryRow key={c._id} check={c} onView={viewCheck} />)}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Resolve Modal */}
      {resolveCheck && (
        <ResolveModal
          check={resolveCheck}
          onClose={() => setResolveCheck(null)}
          onSaved={() => {
            setResolveCheck(null);
            if (result?.check?._id === resolveCheck._id) {
              conflictsApi.get(resolveCheck._id).then(r => {
                setResult(prev => ({ ...prev, check: r.data.data }));
              });
            }
          }}
        />
      )}
    </div>
  );
}
