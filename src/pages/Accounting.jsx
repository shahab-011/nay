import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accountingApi } from '../api/accounting.api';

/* ─── Helpers ───────────────────────────────────────────────────────── */
const fmt$  = n => `$${(parseFloat(n) || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '—';
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

/* ─── Shared primitives ─────────────────────────────────────────────── */
function Tab({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
      borderRadius: 10, border: active ? 'none' : '1px solid rgba(124,58,237,0.2)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
      background: active ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.06)',
      color: active ? '#fff' : 'rgba(240,238,255,0.55)', transition: 'all 0.15s',
      boxShadow: active ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
    }}>
      {label}
      {badge > 0 && (
        <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#EF4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 800 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', ...style }}>
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, loading, variant = 'primary', children, style }) {
  const styles = {
    primary:  { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' },
    secondary:{ background: 'rgba(255,255,255,0.08)', color: 'rgba(240,238,255,0.7)', border: '1px solid rgba(124,58,237,0.2)' },
    danger:   { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
    success:  { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    ghost:    { background: 'rgba(255,255,255,0.05)', color: 'rgba(240,238,255,0.5)', border: '1px solid rgba(124,58,237,0.18)' },
  };
  return (
    <button onClick={disabled || loading ? undefined : onClick}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:'none', cursor: disabled||loading ? 'not-allowed':'pointer', fontSize:13, fontWeight:600, transition:'all 0.15s', opacity: disabled||loading ? 0.6:1, ...styles[variant], ...style }}>
      {loading ? '…' : children}
    </button>
  );
}

function Badge({ text, color = '#7C3AED' }) {
  return <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${color}18`, color }}>{text}</span>;
}

function Alert({ msg, type = 'error' }) {
  if (!msg) return null;
  const c = type === 'error' ? '#EF4444' : '#10B981';
  return <div style={{ padding:'10px 16px', borderRadius:10, background:`${c}12`, color:c, fontSize:13, fontWeight:500, marginBottom:12 }}>{msg}</div>;
}

function StatCard({ label, value, icon, color = '#7C3AED', sub }) {
  return (
    <Card style={{ padding:'20px 22px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:'#f0eeff' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'rgba(240,238,255,0.35)', marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

const TYPE_COLORS = { asset:'#3B82F6', liability:'#EF4444', equity:'#8B5CF6', revenue:'#10B981', expense:'#F59E0B' };

/* ─── Tab 1: Dashboard ──────────────────────────────────────────────── */
function DashboardTab({ onSeed }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await accountingApi.dashboard();
      setData(r.data.data);
    } catch (e) {
      if (e.response?.status === 404 || (e.response?.data?.message || '').includes('No accounts')) {
        setData(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function seed() {
    setSeeding(true); setError('');
    try {
      await accountingApi.accounts.seed();
      onSeed?.();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Seeding failed');
    }
    setSeeding(false);
  }

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'rgba(240,238,255,0.4)' }}>Loading…</div>;

  if (!data || !data.accounts?.length) {
    return (
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📊</div>
        <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:800, color:'#f0eeff' }}>Set up your Chart of Accounts</h2>
        <p style={{ color:'rgba(240,238,255,0.45)', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
          Initialize a standard Pakistani law firm chart of accounts with 24 default accounts — or add your own.
        </p>
        <Alert msg={error} />
        <Btn onClick={seed} loading={seeding}>Initialize Default Accounts</Btn>
      </div>
    );
  }

  const byType = {};
  (data.accounts || []).forEach(a => {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <StatCard label="Cash & Bank" value={fmt$(data.cashBalance)} icon="💵" color="#10B981" />
        <StatCard label="Accounts Receivable" value={fmt$(data.accountsReceivable)} icon="📄" color="#3B82F6" />
        <StatCard label="Trust Liability" value={fmt$(data.trustLiability)} icon="⚖️" color="#8B5CF6" />
        <StatCard label="Unmatched Txns" value={data.unmatchedTransactions} icon="🏦" color="#F59E0B"
          sub={data.unmatchedTransactions > 0 ? 'Need attention' : 'All matched'} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {['asset','liability','equity','revenue','expense'].map(type => (
          <Card key={type} style={{ padding:16 }}>
            <Badge text={type} color={TYPE_COLORS[type]} />
            <div style={{ marginTop:10, fontSize:13, fontWeight:700, color:'#f0eeff' }}>
              {fmt$((byType[type] || []).reduce((s,a) => s + a.balance, 0))}
            </div>
            <div style={{ fontSize:11, color:'rgba(240,238,255,0.35)', marginTop:2 }}>
              {(byType[type] || []).length} account(s)
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab 2: Chart of Accounts ──────────────────────────────────────── */
function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [typeFilter, setType]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ code:'', name:'', type:'asset', subType:'', isBank:false, isTaxCategory:false, taxCategoryLabel:'' });
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await accountingApi.accounts.list(typeFilter ? { type: typeFilter } : {});
      setAccounts(r.data.data || []);
    } catch {}
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setError('');
    try {
      await accountingApi.accounts.create(form);
      setShowForm(false);
      setForm({ code:'', name:'', type:'asset', subType:'', isBank:false, isTaxCategory:false, taxCategoryLabel:'' });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create account'); }
    setSaving(false);
  }

  async function toggle(id, isActive) {
    try { await accountingApi.accounts.update(id, { isActive: !isActive }); load(); } catch {}
  }

  const INPUT = { padding:'8px 12px', borderRadius:8, border:'1px solid rgba(124,58,237,0.22)', fontSize:13, width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.07)', color:'#f0eeff', outline:'none' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', gap:6 }}>
          {['','asset','liability','equity','revenue','expense'].map(t => (
            <Btn key={t} variant={typeFilter===t?'primary':'secondary'} onClick={() => setType(t)} style={{ fontSize:12, padding:'6px 14px' }}>
              {t || 'All'}
            </Btn>
          ))}
        </div>
        <Btn onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add Account'}</Btn>
      </div>

      {showForm && (
        <Card style={{ padding:20, marginBottom:16 }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>New Account</h3>
          <Alert msg={error} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Code *</label>
              <input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="e.g. 4500" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Name *</label>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Account name" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Type *</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} style={INPUT}>
                {['asset','liability','equity','revenue','expense'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Sub-type</label>
              <input value={form.subType} onChange={e => setForm(f=>({...f,subType:e.target.value}))} placeholder="e.g. Current Asset" style={INPUT} />
            </div>
          </div>
          <div style={{ display:'flex', gap:16, marginBottom:14 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isBank} onChange={e => setForm(f=>({...f,isBank:e.target.checked}))} />
              Bank account
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isTaxCategory} onChange={e => setForm(f=>({...f,isTaxCategory:e.target.checked}))} />
              Tax category
            </label>
          </div>
          <Btn onClick={save} loading={saving}>Create Account</Btn>
        </Card>
      )}

      <Card>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
              {['Code','Name','Type','Sub-type','Balance','Status',''].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)' }}>Loading…</td></tr>}
            {!loading && accounts.map((a, i) => (
              <tr key={a._id} style={{ borderBottom:'1px solid rgba(124,58,237,0.08)', background: i%2===0?'transparent':'rgba(255,255,255,0.02)', opacity: a.isActive?1:0.5 }}>
                <td style={{ padding:'11px 16px', fontSize:13, fontWeight:700, color:'#c4b5fd', fontFamily:'monospace' }}>{a.code}</td>
                <td style={{ padding:'11px 16px', fontSize:13, color:'#f0eeff', fontWeight:600 }}>{a.name}</td>
                <td style={{ padding:'11px 16px' }}><Badge text={a.type} color={TYPE_COLORS[a.type]} /></td>
                <td style={{ padding:'11px 16px', fontSize:12, color:'rgba(240,238,255,0.45)' }}>{a.subType || '—'}</td>
                <td style={{ padding:'11px 16px', fontSize:13, fontWeight:700, color: a.balance<0?'#f87171':'#f0eeff' }}>{fmt$(a.balance)}</td>
                <td style={{ padding:'11px 16px' }}>
                  <Badge text={a.isActive?'Active':'Inactive'} color={a.isActive?'#10B981':'#9CA3AF'} />
                </td>
                <td style={{ padding:'11px 16px' }}>
                  {!a.isDefault && (
                    <Btn variant="ghost" onClick={() => toggle(a._id, a.isActive)} style={{ fontSize:11, padding:'4px 10px' }}>
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
            {!loading && accounts.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)', fontSize:13 }}>No accounts found</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─── Tab 3: Journal Entries ────────────────────────────────────────── */
function JournalTab() {
  const [entries,  setEntries]  = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [posting,  setPosting]  = useState(null);
  const [error,    setError]    = useState('');
  const [form, setForm] = useState({
    date: today(), description: '', reference: '', notes: '',
    lines: [
      { accountId:'', debit:'', credit:'', description:'' },
      { accountId:'', debit:'', credit:'', description:'' },
    ],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [er, ar] = await Promise.all([
        accountingApi.entries.list({ limit:50 }),
        accountingApi.accounts.list(),
      ]);
      setEntries(er.data.data?.entries || []);
      setAccounts(ar.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function addLine() {
    setForm(f => ({ ...f, lines: [...f.lines, { accountId:'', debit:'', credit:'', description:'' }] }));
  }

  function removeLine(i) {
    setForm(f => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));
  }

  function setLine(i, field, val) {
    setForm(f => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, [field]: val } : l) }));
  }

  const totalDebit  = form.lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01;

  async function save() {
    setSaving(true); setError('');
    try {
      const lines = form.lines.filter(l => l.accountId).map(l => ({
        accountId: l.accountId,
        debit:  parseFloat(l.debit)  || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description,
      }));
      await accountingApi.entries.create({ ...form, lines });
      setShowForm(false);
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to create entry'); }
    setSaving(false);
  }

  async function post(id) {
    setPosting(id);
    try { await accountingApi.entries.post(id); load(); } catch (e) { alert(e.response?.data?.message || 'Post failed'); }
    setPosting(null);
  }

  const INPUT = { padding:'7px 10px', borderRadius:7, border:'1px solid rgba(124,58,237,0.22)', fontSize:12, width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.07)', color:'#f0eeff', outline:'none' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ New Journal Entry'}</Btn>
      </div>

      {showForm && (
        <Card style={{ padding:22, marginBottom:16 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:'#f0eeff' }}>New Journal Entry</h3>
          <Alert msg={error} />
          <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 160px', gap:10, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Description *</label>
              <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Monthly rent payment" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Reference</label>
              <input value={form.reference} onChange={e => setForm(f=>({...f,reference:e.target.value}))} placeholder="CHQ-001" style={INPUT} />
            </div>
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
                {['Account','Description','Debit','Credit',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding:'4px 6px', width:'35%' }}>
                    <select value={line.accountId} onChange={e => setLine(i,'accountId',e.target.value)} style={INPUT}>
                      <option value="" style={{ background:'#16113a' }}>— Select account —</option>
                      {accounts.map(a => <option key={a._id} value={a._id} style={{ background:'#16113a' }}>{a.code} — {a.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'4px 6px' }}>
                    <input value={line.description} onChange={e => setLine(i,'description',e.target.value)} placeholder="Optional" style={INPUT} />
                  </td>
                  <td style={{ padding:'4px 6px', width:'120px' }}>
                    <input type="number" value={line.debit} onChange={e => setLine(i,'debit',e.target.value)} placeholder="0.00" style={{ ...INPUT, textAlign:'right' }} />
                  </td>
                  <td style={{ padding:'4px 6px', width:'120px' }}>
                    <input type="number" value={line.credit} onChange={e => setLine(i,'credit',e.target.value)} placeholder="0.00" style={{ ...INPUT, textAlign:'right' }} />
                  </td>
                  <td style={{ padding:'4px 6px', width:'30px' }}>
                    {form.lines.length > 2 && (
                      <button onClick={() => removeLine(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,238,255,0.35)', fontSize:16 }}>×</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop:'1px solid rgba(124,58,237,0.2)', background:'rgba(255,255,255,0.03)' }}>
                <td colSpan={2} style={{ padding:'8px 8px', fontSize:12, fontWeight:700, color:'rgba(240,238,255,0.45)' }}>Totals</td>
                <td style={{ padding:'8px 8px', fontSize:13, fontWeight:800, color: balanced?'#4ade80':'#f87171', textAlign:'right' }}>{fmt$(totalDebit)}</td>
                <td style={{ padding:'8px 8px', fontSize:13, fontWeight:800, color: balanced?'#4ade80':'#f87171', textAlign:'right' }}>{fmt$(totalCredit)}</td>
                <td />
              </tr>
            </tbody>
          </table>

          {!balanced && <div style={{ fontSize:12, color:'#EF4444', marginBottom:10 }}>⚠ Debits and credits must balance before saving</div>}

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Btn variant="secondary" onClick={addLine} style={{ fontSize:12 }}>+ Add Line</Btn>
            <Btn onClick={save} loading={saving} disabled={!balanced || !form.description}>Save Entry</Btn>
          </div>
        </Card>
      )}

      {/* Detail drawer */}
      {selected && (
        <Card style={{ padding:20, marginBottom:16, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.28)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#f0eeff' }}>{selected.description}</div>
              <div style={{ fontSize:12, color:'rgba(240,238,255,0.45)' }}>{fmtDate(selected.date)} {selected.reference && `· Ref: ${selected.reference}`}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'rgba(240,238,255,0.4)' }}>×</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
                {['Account','Description','Debit','Credit'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(selected.lines || []).map((l, i) => (
                <tr key={i} style={{ borderBottom:'1px solid rgba(124,58,237,0.1)' }}>
                  <td style={{ padding:'8px 10px', fontSize:13, fontWeight:600, color:'#f0eeff' }}>{l.accountId?.code} — {l.accountId?.name}</td>
                  <td style={{ padding:'8px 10px', fontSize:12, color:'rgba(240,238,255,0.45)' }}>{l.description || '—'}</td>
                  <td style={{ padding:'8px 10px', fontSize:13, textAlign:'right', color:'#f0eeff' }}>{l.debit  > 0 ? fmt$(l.debit)  : '—'}</td>
                  <td style={{ padding:'8px 10px', fontSize:13, textAlign:'right', color:'#f0eeff' }}>{l.credit > 0 ? fmt$(l.credit) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
              {['Date','Description','Reference','Source','Lines','Status','Actions'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)' }}>Loading…</td></tr>}
            {entries.map((e, i) => (
              <tr key={e._id} onClick={() => setSelected(e)}
                style={{ borderBottom:'1px solid rgba(124,58,237,0.08)', background: i%2===0?'transparent':'rgba(255,255,255,0.02)', cursor:'pointer' }}>
                <td style={{ padding:'11px 16px', fontSize:13, color:'rgba(240,238,255,0.55)' }}>{fmtDate(e.date)}</td>
                <td style={{ padding:'11px 16px', fontSize:13, fontWeight:600, color:'#f0eeff' }}>{e.description}</td>
                <td style={{ padding:'11px 16px', fontSize:12, color:'rgba(240,238,255,0.4)', fontFamily:'monospace' }}>{e.reference || '—'}</td>
                <td style={{ padding:'11px 16px' }}>
                  <Badge text={e.source} color={{ manual:'#9CA3AF', invoice:'#10B981', trust:'#7C3AED', bank:'#3B82F6' }[e.source] || '#9CA3AF'} />
                </td>
                <td style={{ padding:'11px 16px', fontSize:13, color:'rgba(240,238,255,0.55)' }}>{e.lines?.length}</td>
                <td style={{ padding:'11px 16px' }}>
                  <Badge text={e.isVoided?'Voided':e.isPosted?'Posted':'Draft'}
                    color={e.isVoided?'#9CA3AF':e.isPosted?'#10B981':'#F59E0B'} />
                </td>
                <td style={{ padding:'11px 16px' }} onClick={ev => ev.stopPropagation()}>
                  {!e.isPosted && !e.isVoided && (
                    <Btn variant="success" loading={posting===e._id} onClick={() => post(e._id)} style={{ fontSize:11, padding:'4px 10px' }}>
                      Post
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)', fontSize:13 }}>No journal entries yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─── Tab 4: Bank Transactions ──────────────────────────────────────── */
function BankTab() {
  const [conns,   setConns]   = useState([]);
  const [txns,    setTxns]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [connFilter, setConn] = useState('');
  const [statusFilter, setStatus] = useState('unmatched');
  const [showConnect, setShowConnect] = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [connForm, setConnForm] = useState({ institutionName:'', accountName:'', accountType:'checking', accountMask:'', isManual:true });
  const [importRaw, setImportRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, tr] = await Promise.all([
        accountingApi.banks.list(),
        accountingApi.transactions.list({ status: statusFilter || undefined, connectionId: connFilter || undefined, limit: 50 }),
      ]);
      setConns(cr.data.data || []);
      setTxns(tr.data.data?.transactions || []);
      setTotal(tr.data.data?.total || 0);
    } catch {}
    setLoading(false);
  }, [statusFilter, connFilter]);

  useEffect(() => { load(); }, [load]);

  async function connect() {
    setSaving(true); setError('');
    try {
      await accountingApi.banks.connect(connForm);
      setShowConnect(false);
      setConnForm({ institutionName:'', accountName:'', accountType:'checking', accountMask:'', isManual:true });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to connect'); }
    setSaving(false);
  }

  async function importCSV() {
    if (!connFilter) { setError('Select a bank connection first'); return; }
    setSaving(true); setError('');
    try {
      const lines = importRaw.trim().split('\n').slice(1); // skip header
      const transactions = lines.map(line => {
        const [date, description, amount, merchant] = line.split(',').map(s => s.trim().replace(/^"|"$/g,''));
        return { date, description, amount: parseFloat(amount), merchant };
      }).filter(t => t.date && !isNaN(t.amount));
      await accountingApi.transactions.import({ connectionId: connFilter, transactions });
      setShowImport(false); setImportRaw('');
      load();
    } catch (e) { setError(e.response?.data?.message || 'Import failed'); }
    setSaving(false);
  }

  async function exclude(id) {
    try { await accountingApi.transactions.exclude(id); load(); } catch {}
  }

  const INPUT = { padding:'8px 12px', borderRadius:8, border:'1px solid rgba(124,58,237,0.22)', fontSize:13, width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.07)', color:'#f0eeff', outline:'none' };

  return (
    <div>
      {/* Bank connections */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <Btn onClick={() => setShowConnect(s=>!s)} variant={showConnect?'secondary':'primary'} style={{ fontSize:12 }}>
          {showConnect ? 'Cancel' : '+ Connect Bank'}
        </Btn>
        {conns.length > 0 && (
          <Btn onClick={() => setShowImport(s=>!s)} variant="secondary" style={{ fontSize:12 }}>
            {showImport ? 'Cancel' : '↑ Import CSV'}
          </Btn>
        )}
        <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
          {['','unmatched','matched','excluded'].map(s => (
            <Btn key={s} variant={statusFilter===s?'primary':'secondary'} onClick={() => setStatus(s)} style={{ fontSize:11, padding:'5px 12px' }}>
              {s || 'All'}
            </Btn>
          ))}
        </div>
      </div>

      {showConnect && (
        <Card style={{ padding:20, marginBottom:14 }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>Add Bank Account</h3>
          <Alert msg={error} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 120px', gap:10, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Institution Name *</label>
              <input value={connForm.institutionName} onChange={e=>setConnForm(f=>({...f,institutionName:e.target.value}))} placeholder="e.g. HBL Bank" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Account Name *</label>
              <input value={connForm.accountName} onChange={e=>setConnForm(f=>({...f,accountName:e.target.value}))} placeholder="e.g. Business Checking" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Account Type</label>
              <select value={connForm.accountType} onChange={e=>setConnForm(f=>({...f,accountType:e.target.value}))} style={INPUT}>
                {['checking','savings','credit','investment','other'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(240,238,255,0.45)', display:'block', marginBottom:4 }}>Last 4</label>
              <input value={connForm.accountMask} onChange={e=>setConnForm(f=>({...f,accountMask:e.target.value}))} placeholder="1234" maxLength={4} style={INPUT} />
            </div>
          </div>
          <Btn onClick={connect} loading={saving}>Add Bank Account</Btn>
        </Card>
      )}

      {showImport && (
        <Card style={{ padding:20, marginBottom:14 }}>
          <h3 style={{ margin:'0 0 8px', fontSize:14, fontWeight:700, color:'#f0eeff' }}>Import CSV Transactions</h3>
          <p style={{ fontSize:12, color:'rgba(240,238,255,0.45)', marginBottom:12 }}>
            First select a bank connection below, then paste CSV. Format: <code>Date,Description,Amount,Merchant</code> (first row is header)
          </p>
          <Alert msg={error} />
          <select value={connFilter} onChange={e=>setConn(e.target.value)} style={{ ...INPUT, marginBottom:10 }}>
            <option value="">— Select bank connection —</option>
            {conns.map(c=><option key={c._id} value={c._id}>{c.institutionName} – {c.accountName}</option>)}
          </select>
          <textarea value={importRaw} onChange={e=>setImportRaw(e.target.value)} rows={6}
            placeholder={'Date,Description,Amount,Merchant\n2025-05-01,Office Supplies,-250.00,Staples\n2025-05-03,Client Payment,5000.00,Ahmed Khan'}
            style={{ ...INPUT, fontFamily:'monospace', fontSize:12, resize:'vertical', marginBottom:10 }} />
          <Btn onClick={importCSV} loading={saving}>Import Transactions</Btn>
        </Card>
      )}

      {/* Connected banks pills */}
      {conns.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          <Btn variant={!connFilter?'primary':'secondary'} onClick={()=>setConn('')} style={{ fontSize:11, padding:'5px 12px' }}>All Banks</Btn>
          {conns.map(c=>(
            <Btn key={c._id} variant={connFilter===c._id?'primary':'secondary'} onClick={()=>setConn(c._id)} style={{ fontSize:11, padding:'5px 12px' }}>
              {c.institutionName} ···{c.accountMask}
            </Btn>
          ))}
        </div>
      )}

      <Card>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(124,58,237,0.15)', fontSize:12, color:'rgba(240,238,255,0.45)' }}>
          {total} transaction(s)
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
              {['Date','Description','Merchant','Amount','Status','Actions'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)' }}>Loading…</td></tr>}
            {txns.map((t, i)=>(
              <tr key={t._id} style={{ borderBottom:'1px solid rgba(124,58,237,0.08)', background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                <td style={{ padding:'10px 16px', fontSize:13, color:'rgba(240,238,255,0.55)' }}>{fmtDate(t.date)}</td>
                <td style={{ padding:'10px 16px', fontSize:13, color:'#f0eeff', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</td>
                <td style={{ padding:'10px 16px', fontSize:12, color:'rgba(240,238,255,0.45)' }}>{t.merchant || '—'}</td>
                <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color: t.amount<0?'#f87171':'#4ade80' }}>{fmt$(t.amount)}</td>
                <td style={{ padding:'10px 16px' }}>
                  <Badge text={t.status} color={{ unmatched:'#F59E0B', matched:'#10B981', excluded:'#9CA3AF' }[t.status]} />
                </td>
                <td style={{ padding:'10px 16px' }}>
                  {t.status === 'unmatched' && (
                    <Btn variant="danger" onClick={()=>exclude(t._id)} style={{ fontSize:11, padding:'4px 10px' }}>Exclude</Btn>
                  )}
                </td>
              </tr>
            ))}
            {!loading && txns.length===0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)', fontSize:13 }}>No transactions — import a CSV to get started</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─── Tab 5: Reports ────────────────────────────────────────────────── */
function ReportsTab() {
  const [subTab,   setSubTab]   = useState('pl');
  const [from,     setFrom]     = useState(monthStart());
  const [to,       setTo]       = useState(today());
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function run() {
    setLoading(true); setError(''); setData(null);
    try {
      let r;
      if (subTab === 'pl')            r = await accountingApi.reports.pl({ from, to });
      else if (subTab === 'balance')  r = await accountingApi.reports.balanceSheet({ asOf: to });
      else if (subTab === 'trial')    r = await accountingApi.reports.trialBalance();
      else if (subTab === 'ledger')   r = await accountingApi.reports.generalLedger({ from, to });
      setData(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'Report failed'); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        {[['pl','P&L'],['balance','Balance Sheet'],['trial','Trial Balance'],['ledger','General Ledger']].map(([k,v])=>(
          <Btn key={k} variant={subTab===k?'primary':'secondary'} onClick={()=>{ setSubTab(k); setData(null); }} style={{ fontSize:12 }}>{v}</Btn>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {subTab !== 'trial' && (
            <>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
                style={{ padding:'7px 10px', borderRadius:8, border:'1px solid rgba(124,58,237,0.22)', fontSize:12, background:'rgba(255,255,255,0.07)', color:'#f0eeff', outline:'none' }} />
              <span style={{ fontSize:12, color:'rgba(240,238,255,0.45)' }}>to</span>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)}
                style={{ padding:'7px 10px', borderRadius:8, border:'1px solid rgba(124,58,237,0.22)', fontSize:12, background:'rgba(255,255,255,0.07)', color:'#f0eeff', outline:'none' }} />
            </>
          )}
          <Btn onClick={run} loading={loading} style={{ fontSize:12 }}>Run Report</Btn>
        </div>
      </div>

      <Alert msg={error} />

      {!data && !loading && (
        <div style={{ textAlign:'center', padding:60, color:'rgba(240,238,255,0.35)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📈</div>
          <div>Select a report and click Run Report</div>
        </div>
      )}

      {data && subTab === 'pl' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <Card style={{ padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'#4ade80' }}>Revenue</h3>
            {data.revenue?.map(r=>(
              <div key={r.accountId} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(124,58,237,0.1)', fontSize:13, color:'#f0eeff' }}>
                <span>{r.code} — {r.name}</span><span style={{ fontWeight:700 }}>{fmt$(r.balance)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontWeight:800, fontSize:15, color:'#f0eeff' }}>
              <span>Total Revenue</span><span style={{ color:'#4ade80' }}>{fmt$(data.totalRevenue)}</span>
            </div>
          </Card>
          <Card style={{ padding:20 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'#f87171' }}>Expenses</h3>
            {data.expenses?.map(r=>(
              <div key={r.accountId} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(124,58,237,0.1)', fontSize:13, color:'#f0eeff' }}>
                <span>{r.code} — {r.name}</span><span style={{ fontWeight:700 }}>{fmt$(r.balance)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontWeight:800, fontSize:15, color:'#f0eeff' }}>
              <span>Total Expenses</span><span style={{ color:'#f87171' }}>{fmt$(data.totalExpenses)}</span>
            </div>
          </Card>
          <Card style={{ padding:20, gridColumn:'1/-1', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:800, color:'#f0eeff' }}>
              <span>Net Income</span>
              <span style={{ color: data.netIncome >= 0 ? '#4ade80' : '#f87171' }}>{fmt$(data.netIncome)}</span>
            </div>
          </Card>
        </div>
      )}

      {data && subTab === 'balance' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {[['Assets', data.assets, '#60a5fa', data.totalAssets], ['Liabilities', data.liabilities, '#f87171', data.totalLiabilities], ['Equity', data.equity, '#c4b5fd', data.totalEquity]].map(([label, rows, color, total])=>(
            <Card key={label} style={{ padding:20 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color }}>{label}</h3>
              {(rows||[]).map(a=>(
                <div key={a._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(124,58,237,0.1)', fontSize:13, color:'rgba(240,238,255,0.7)' }}>
                  <span>{a.code} — {a.name}</span><span style={{ fontWeight:700 }}>{fmt$(a.balance)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontWeight:800, fontSize:14, color:'#f0eeff' }}>
                <span>Total {label}</span><span style={{ color }}>{fmt$(total)}</span>
              </div>
            </Card>
          ))}
          <Card style={{ padding:18, gridColumn:'1/-1', background: data.isBalanced?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${data.isBalanced?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, color:'#f0eeff' }}>
              <span>Assets = Liabilities + Equity</span>
              <span style={{ color: data.isBalanced?'#4ade80':'#f87171' }}>
                {data.isBalanced ? '✓ Balanced' : `⚠ Off by ${fmt$(Math.abs(data.totalAssets - data.liabilitiesAndEquity))}`}
              </span>
            </div>
          </Card>
        </div>
      )}

      {data && subTab === 'trial' && (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
                {['Code','Account','Type','Debit','Credit'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.rows||[]).map((r,i)=>(
                <tr key={r.code} style={{ borderBottom:'1px solid rgba(124,58,237,0.08)', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, fontFamily:'monospace', color:'#c4b5fd' }}>{r.code}</td>
                  <td style={{ padding:'10px 16px', fontSize:13, color:'#f0eeff' }}>{r.name}</td>
                  <td style={{ padding:'10px 16px' }}><Badge text={r.type} color={TYPE_COLORS[r.type]} /></td>
                  <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right', color:'#f0eeff' }}>{r.debit  > 0 ? fmt$(r.debit)  : ''}</td>
                  <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right', color:'#f0eeff' }}>{r.credit > 0 ? fmt$(r.credit) : ''}</td>
                </tr>
              ))}
              <tr style={{ borderTop:'1px solid rgba(124,58,237,0.25)', background:'rgba(255,255,255,0.03)', fontWeight:800 }}>
                <td colSpan={3} style={{ padding:'12px 16px', fontSize:14, color:'#f0eeff' }}>Totals</td>
                <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color: data.isBalanced?'#4ade80':'#f87171' }}>{fmt$(data.totalDebit)}</td>
                <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color: data.isBalanced?'#4ade80':'#f87171' }}>{fmt$(data.totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {data && subTab === 'ledger' && (
        <Card>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.2)' }}>
                {['Date','Description','Reference','Account','Debit','Credit'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:700, color:'rgba(240,238,255,0.45)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.entries||[]).map((e,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid rgba(124,58,237,0.08)', background:i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding:'9px 16px', fontSize:12, color:'rgba(240,238,255,0.55)' }}>{fmtDate(e.date)}</td>
                  <td style={{ padding:'9px 16px', fontSize:12, color:'#f0eeff' }}>{e.description}</td>
                  <td style={{ padding:'9px 16px', fontSize:11, fontFamily:'monospace', color:'rgba(240,238,255,0.4)' }}>{e.reference||'—'}</td>
                  <td style={{ padding:'9px 16px', fontSize:12, color:'rgba(240,238,255,0.7)' }}>{e.account?.code} — {e.account?.name}</td>
                  <td style={{ padding:'9px 16px', fontSize:13, fontWeight:600, textAlign:'right', color:'#f0eeff' }}>{e.debit  > 0 ? fmt$(e.debit)  : ''}</td>
                  <td style={{ padding:'9px 16px', fontSize:13, fontWeight:600, textAlign:'right', color:'#f0eeff' }}>{e.credit > 0 ? fmt$(e.credit) : ''}</td>
                </tr>
              ))}
              {(data.entries||[]).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'rgba(240,238,255,0.35)', fontSize:13 }}>No posted entries in this period</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
const TABS = [
  { id:'dashboard',    label:'Dashboard'     },
  { id:'accounts',     label:'Chart of Accounts' },
  { id:'journal',      label:'Journal Entries'   },
  { id:'bank',         label:'Bank & Transactions'},
  { id:'reports',      label:'Reports'           },
];

export default function Accounting() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [seeded,    setSeeded]    = useState(0);

  return (
    <div style={{ padding:'24px 32px', maxWidth:1400, margin:'0 auto', position:'relative' }}>
      {/* Ambient blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-5%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'15%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📒</div>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#f0eeff' }}>Accounting</h1>
              <div style={{ fontSize:13, color:'rgba(240,238,255,0.45)', marginTop:2 }}>Double-entry bookkeeping · P&L · Balance Sheet · Bank reconciliation</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:4, padding:6, borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(124,58,237,0.18)', marginBottom:24, width:'fit-content', backdropFilter:'blur(8px)' }}>
          {TABS.map(t => <Tab key={t.id} label={t.label} active={activeTab===t.id} onClick={() => setActiveTab(t.id)} />)}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}>
            {activeTab==='dashboard' && <DashboardTab onSeed={() => setSeeded(s => s+1)} />}
            {activeTab==='accounts'  && <AccountsTab key={seeded} />}
            {activeTab==='journal'   && <JournalTab />}
            {activeTab==='bank'      && <BankTab />}
            {activeTab==='reports'   && <ReportsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
