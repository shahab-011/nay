import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { trustApi } from '../api/trust.api';
import { mattersApi } from '../api/matters.api';

/* ── Helpers ───────────────────────────────────────────────────── */
function fmtMoney(n) { return '$' + (n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d)  { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }
function todayStr()  { return new Date().toISOString().slice(0, 10); }

const TX_META = {
  deposit:              { label: 'Deposit',           color: '#10B981', sign: +1 },
  disbursement:         { label: 'Disbursement',      color: '#EF4444', sign: -1 },
  transfer_to_operating:{ label: 'Transfer to Ops',   color: '#3B82F6', sign: -1 },
  refund:               { label: 'Refund to Client',  color: '#F59E0B', sign: -1 },
  adjustment:           { label: 'Adjustment',        color: '#8B5CF6', sign:  0 },
};

/* ── Shared UI ─────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)',
  boxSizing: 'border-box', color: 'var(--ink)', outline: 'none',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function ModalWrap({ onClose, title, subtitle, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-float)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I.X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
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

/* ── Transaction Modal (Deposit / Disbursement / Transfer / Refund) */
function TxModal({ type, account, matters, onClose, onSave }) {
  const meta = TX_META[type] || TX_META.deposit;
  const needsPayee = ['disbursement', 'refund'].includes(type);

  const [form, setForm] = useState({ amount: '', description: '', matterId: '', payee: '', checkNumber: '', date: todayStr() });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    try {
      await onSave(type, { ...form, amount: parseFloat(form.amount) });
      onClose();
    } finally { setSaving(false); }
  }

  const titles = { deposit: 'Record Deposit', disbursement: 'Record Disbursement', transfer_to_operating: 'Transfer to Operating', refund: 'Record Refund' };

  return (
    <ModalWrap onClose={onClose} title={titles[type]} subtitle={`${account.accountName} — Balance: ${fmtMoney(account.balance)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Amount ($) *">
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={inputStyle} autoFocus />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Matter">
          <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">No matter</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
          </select>
        </Field>
        {needsPayee && (
          <Field label="Payee">
            <input value={form.payee} onChange={e => set('payee', e.target.value)} placeholder="Payee name" style={inputStyle} />
          </Field>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Description">
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Purpose" style={inputStyle} />
          </Field>
          <Field label="Check / Ref #">
            <input value={form.checkNumber} onChange={e => set('checkNumber', e.target.value)} placeholder="Optional" style={inputStyle} />
          </Field>
        </div>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!form.amount || parseFloat(form.amount) <= 0} saveLabel={titles[type]} />
      </div>
    </ModalWrap>
  );
}

/* ── Reconciliation Modal ──────────────────────────────────────── */
function ReconcileModal({ account, onClose, onReconcile }) {
  const [bankBalance, setBankBalance] = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [result, setResult]           = useState(null);

  async function submit() {
    if (!bankBalance) return;
    setSaving(true);
    try {
      const r = await onReconcile({ bankBalance: parseFloat(bankBalance), notes });
      setResult(r);
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Three-Way Reconciliation" subtitle={account.accountName}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!result ? (
          <>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)', fontSize: 12, color: '#1E40AF' }}>
              Enter the balance shown on your bank statement. The system will compare it to the running ledger balance.
            </div>
            <Field label="System Ledger Balance">
              <div style={{ ...inputStyle, background: 'var(--elevated)', fontWeight: 700, color: 'var(--ink)' }}>{fmtMoney(account.balance)}</div>
            </Field>
            <Field label="Bank Statement Balance ($) *">
              <input type="number" min="0" step="0.01" value={bankBalance} onChange={e => setBankBalance(e.target.value)} placeholder="0.00" style={inputStyle} autoFocus />
            </Field>
            <Field label="Notes">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reconciliation notes…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
            <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!bankBalance} saveLabel="Run Reconciliation" />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result.isBalanced ? '✅' : '⚠️'}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: result.isBalanced ? '#10B981' : '#EF4444', marginBottom: 8 }}>
              {result.isBalanced ? 'Reconciliation Passed' : 'Discrepancy Detected'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Bank Balance', value: fmtMoney(result.bankBalance) },
                { label: 'Ledger Balance', value: fmtMoney(result.ledgerTotal) },
                { label: 'Difference', value: fmtMoney(Math.abs(result.difference)), color: result.difference !== 0 ? '#EF4444' : '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 12px', background: 'var(--elevated)', borderRadius: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color || 'var(--ink)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Done</button>
          </div>
        )}
      </div>
    </ModalWrap>
  );
}

/* ── Void Tx Modal ─────────────────────────────────────────────── */
function VoidModal({ tx, accountId, onClose, onVoid }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setSaving(true);
    try { await onVoid(accountId, tx._id, reason); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Void Transaction">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#991B1B' }}>
          Voiding will reverse this transaction's effect on the account balance.
        </div>
        <Field label="Reason *">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for voiding…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!reason.trim()} saveLabel="Void Transaction" />
      </div>
    </ModalWrap>
  );
}

/* ── Transaction Row ───────────────────────────────────────────── */
function TxRow({ tx, accountId, onVoid }) {
  const meta = TX_META[tx.type] || TX_META.deposit;
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid var(--border)', opacity: tx.isVoided ? 0.45 : 1 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</td>
      <td style={{ padding: '11px 16px' }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${meta.color}18`, color: meta.color }}>
          {meta.label}
        </span>
      </td>
      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--ink)', maxWidth: 200 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.payee || '—'}</div>
      </td>
      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{tx.matterId?.title || '—'}</td>
      <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 800, color: meta.sign > 0 ? '#10B981' : meta.sign < 0 ? '#EF4444' : 'var(--ink)', whiteSpace: 'nowrap' }}>
        {meta.sign > 0 ? '+' : meta.sign < 0 ? '−' : ''}{fmtMoney(tx.amount)}
      </td>
      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fmtMoney(tx.balanceAfter)}</td>
      <td style={{ padding: '11px 16px' }}>
        {tx.isVoided ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF' }}>Voided</span>
        ) : (
          <button onClick={() => onVoid(tx)} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Void</button>
        )}
      </td>
    </motion.tr>
  );
}

/* ── Trust Payment Request Modal ───────────────────────────────── */
function PaymentRequestModal({ account, matters, onClose }) {
  const [form, setForm] = useState({ amount: '', clientEmail: '', clientName: '', matterId: '', description: '', message: '' });
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState(null);
  const [err,    setErr]      = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.amount || !form.clientEmail) { setErr('Amount and client email are required'); return; }
    setSaving(true);
    setErr('');
    try {
      const r = await trustApi.requestPayment(account._id, { ...form, amount: parseFloat(form.amount) });
      setResult(r.data.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send payment request');
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Request Trust Payment" subtitle={`${account.accountName} — Balance: ${fmtMoney(account.balance)}`}>
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '16px 18px', borderRadius: 12, background: '#D1FAE5', border: '1.5px solid #6EE7B7', textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginTop: 6 }}>Payment request sent!</div>
            <div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>An email with the payment link has been sent to {form.clientEmail}</div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Payment Link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={result.payUrl || ''} style={{ ...inputStyle, fontSize: 12, flex: 1 }} onClick={e => e.target.select()} />
              <button onClick={() => { navigator.clipboard.writeText(result.payUrl || ''); }}
                style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--elevated)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                <I.Copy size={13} /> Copy
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Done</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div style={{ padding: '10px 13px', borderRadius: 8, background: '#FEF2F2', color: '#991B1B', fontSize: 13 }}>{err}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Amount ($) *">
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={inputStyle} autoFocus />
            </Field>
            <Field label="Matter">
              <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">No matter</option>
                {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Client Email *">
              <input type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="client@example.com" style={inputStyle} />
            </Field>
            <Field label="Client Name">
              <input value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Full name" style={inputStyle} />
            </Field>
          </div>
          <Field label="Purpose / Description">
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Retainer deposit — Smith matter" style={inputStyle} />
          </Field>
          <Field label="Message to Client (optional)">
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3} placeholder="Add a personal note to the email…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>
          <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!form.amount || !form.clientEmail} saveLabel="Send Payment Request" />
        </div>
      )}
    </ModalWrap>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
const TABS = ['Transactions', 'Matter Ledger', 'Reconciliation', 'Payment Requests'];

export default function TrustAccounting() {
  const [accounts, setAccounts]         = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [matters, setMatters]           = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recons, setRecons]             = useState([]);
  const [matterLedger, setMatterLedger] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState('');
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('Transactions');
  const [txModal, setTxModal]           = useState(null);
  const [reconcileModal, setReconcileModal] = useState(false);
  const [voidModal, setVoidModal]       = useState(null);
  const [paymentReqModal, setPaymentReqModal] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      const r = await trustApi.listAccounts();
      const accs = r.data.data || [];
      setAccounts(accs);
      if (!activeAccount && accs.length) setActiveAccount(accs[0]);
    } catch { setAccounts([]); }
  }, [activeAccount]);

  const loadTransactions = useCallback(async () => {
    if (!activeAccount) return;
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const r = await trustApi.getAccountLedger(activeAccount._id, params);
      setTransactions(r.data.data?.transactions || []);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  }, [activeAccount, typeFilter]);

  const loadRecons = useCallback(async () => {
    if (!activeAccount) return;
    try {
      const r = await trustApi.getReconciliationReport(activeAccount._id);
      setRecons(r.data.data?.reconciliations || []);
    } catch { setRecons([]); }
  }, [activeAccount]);

  const loadPaymentRequests = useCallback(async () => {
    if (!activeAccount) return;
    try {
      const r = await trustApi.listPaymentRequests(activeAccount._id);
      setPaymentRequests(r.data.data || []);
    } catch { setPaymentRequests([]); }
  }, [activeAccount]);

  const loadMatters = useCallback(async () => {
    try {
      const r = await mattersApi.list({ limit: 200 });
      setMatters(r.data.data?.matters || []);
    } catch { setMatters([]); }
  }, []);

  useEffect(() => { loadAccounts(); loadMatters(); }, [loadAccounts, loadMatters]);
  useEffect(() => { if (activeAccount) { loadTransactions(); loadRecons(); loadPaymentRequests(); } }, [activeAccount, loadTransactions, loadRecons, loadPaymentRequests]);

  async function loadMatterLedger(matterId) {
    if (!matterId || !activeAccount) return;
    try {
      const r = await trustApi.getMatterLedger(activeAccount._id, matterId);
      setMatterLedger(r.data.data);
    } catch { setMatterLedger(null); }
  }

  async function handleTx(type, data) {
    const fn = { deposit: trustApi.deposit, disbursement: trustApi.disbursement, transfer_to_operating: trustApi.transfer, refund: trustApi.refund }[type];
    if (fn) await fn(activeAccount._id, data);
    await loadAccounts();
    loadTransactions();
  }

  async function handleReconcile(data) {
    const r = await trustApi.reconcile(activeAccount._id, data);
    loadRecons();
    loadAccounts();
    return r.data.data;
  }

  async function handleVoid(accountId, txId, reason) {
    await trustApi.voidTx(accountId, txId, reason);
    await loadAccounts();
    loadTransactions();
  }

  async function handleCancelPaymentRequest(reqId) {
    if (!activeAccount) return;
    try {
      await trustApi.cancelPaymentRequest(activeAccount._id, reqId);
      loadPaymentRequests();
    } catch { /* ignore */ }
  }

  const totalDeposits = transactions.filter(t => t.type === 'deposit' && !t.isVoided).reduce((s, t) => s + t.amount, 0);
  const totalOut      = transactions.filter(t => t.type !== 'deposit' && !t.isVoided).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Trust Accounting</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>IOLTA-compliant trust account management and three-way reconciliation</p>
          </div>
        </div>

        {/* Account selector + balance cards */}
        {accounts.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {accounts.map(acc => (
              <div key={acc._id} onClick={() => setActiveAccount(acc)}
                style={{
                  flex: '0 0 auto', minWidth: 220, padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${activeAccount?._id === acc._id ? 'var(--purple)' : 'var(--border)'}`,
                  background: activeAccount?._id === acc._id ? 'rgba(124,58,237,0.05)' : 'var(--surface)',
                  boxShadow: 'var(--shadow-card)', transition: 'all 150ms',
                }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                  {acc.bankName || 'Trust Account'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{fmtMoney(acc.balance)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{acc.accountName}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {activeAccount && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { type: 'deposit',              label: '+ Deposit',      color: '#10B981' },
              { type: 'disbursement',         label: '− Disbursement', color: '#EF4444' },
              { type: 'transfer_to_operating',label: '⇒ Transfer',     color: '#3B82F6' },
              { type: 'refund',               label: '↩ Refund',       color: '#F59E0B' },
            ].map(({ type, label, color }) => (
              <button key={type} onClick={() => setTxModal(type)}
                style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${color}`, background: `${color}12`, color, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {label}
              </button>
            ))}
            <button onClick={() => setPaymentReqModal(true)}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #7C3AED', background: 'rgba(124,58,237,0.08)', color: '#7C3AED', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.Send size={14} /> Request Payment
            </button>
            <button onClick={() => setReconcileModal(true)}
              style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--purple)', background: 'rgba(124,58,237,0.08)', color: 'var(--purple)', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.CheckSquare size={14} /> Reconcile
            </button>
          </div>
        )}

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

        {/* Transactions Tab */}
        {tab === 'Transactions' && activeAccount && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}>
                <option value="">All Types</option>
                {Object.entries(TX_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>In: <b style={{ color: '#10B981' }}>{fmtMoney(totalDeposits)}</b></span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Out: <b style={{ color: '#EF4444' }}>{fmtMoney(totalOut)}</b></span>
              </div>
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.DollarSign size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No transactions yet</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Use the buttons above to record deposits and disbursements.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--elevated)' }}>
                      {['Date', 'Type', 'Description', 'Matter', 'Amount', 'Balance After', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <TxRow key={tx._id} tx={tx} accountId={activeAccount._id} onVoid={tx => setVoidModal(tx)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Matter Ledger Tab */}
        {tab === 'Matter Ledger' && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select value={selectedMatter} onChange={e => { setSelectedMatter(e.target.value); loadMatterLedger(e.target.value); }}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer', minWidth: 240 }}>
                <option value="">Select a matter…</option>
                {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
              </select>
              {matterLedger && (
                <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: matterLedger.matterBalance >= 0 ? '#10B981' : '#EF4444' }}>
                  Matter Balance: {fmtMoney(matterLedger.matterBalance)}
                </div>
              )}
            </div>
            {!selectedMatter ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.Scale size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Select a matter above</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>View the running trust ledger for any matter.</p>
              </div>
            ) : matterLedger ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--elevated)' }}>
                      {['Date', 'Type', 'Description', 'Amount', 'Running Balance'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matterLedger.ledger.map((tx, i) => {
                      const meta = TX_META[tx.type] || TX_META.deposit;
                      return (
                        <tr key={tx._id || i} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${meta.color}18`, color: meta.color }}>{meta.label}</span>
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--ink)' }}>{tx.description || tx.payee || '—'}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: meta.sign > 0 ? '#10B981' : '#EF4444', whiteSpace: 'nowrap' }}>
                            {meta.sign > 0 ? '+' : '−'}{fmtMoney(tx.amount)}
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: tx.matterBalance >= 0 ? 'var(--ink)' : '#EF4444', whiteSpace: 'nowrap' }}>
                            {fmtMoney(tx.matterBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}

        {/* Reconciliation Tab */}
        {tab === 'Reconciliation' && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Reconciliation History</span>
              <button onClick={() => setReconcileModal(true)}
                style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid var(--purple)', background: 'rgba(124,58,237,0.08)', color: 'var(--purple)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Run Reconciliation
              </button>
            </div>
            {recons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.CheckSquare size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No reconciliations yet</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Run a three-way reconciliation monthly for bar compliance.</p>
              </div>
            ) : (
              <div style={{ padding: '0 0 8px' }}>
                {[...recons].reverse().map((r, i) => (
                  <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.isBalanced ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{fmtDate(r.date)}</div>
                      {r.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bank</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtMoney(r.bankBalance)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ledger</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtMoney(r.ledgerTotal)}</div>
                      </div>
                      <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: r.isBalanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.isBalanced ? '#10B981' : '#EF4444', alignSelf: 'center' }}>
                        {r.isBalanced ? 'Balanced' : 'Discrepancy'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Requests Tab */}
        {tab === 'Payment Requests' && activeAccount && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Payment Requests</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{paymentRequests.length} request{paymentRequests.length !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setPaymentReqModal(true)}
                style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: 'var(--purple)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                + Request Payment
              </button>
            </div>
            {paymentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.DollarSign size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No payment requests</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Send a payment link to a client to request a trust deposit.</p>
              </div>
            ) : (
              <div style={{ padding: '0 0 8px' }}>
                {paymentRequests.map(req => {
                  const statusColor = { pending: '#F59E0B', paid: '#10B981', cancelled: '#6B7280', expired: '#EF4444' }[req.status] || '#6B7280';
                  const statusBg   = { pending: 'rgba(245,158,11,0.1)', paid: 'rgba(16,185,129,0.1)', cancelled: 'rgba(107,114,128,0.1)', expired: 'rgba(239,68,68,0.1)' }[req.status] || 'rgba(107,114,128,0.1)';
                  return (
                    <div key={req._id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{fmtMoney(req.amount)}</span>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor, textTransform: 'capitalize' }}>
                            {req.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                          {req.clientName && <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{req.clientName}</span>}
                          {req.clientName && req.clientEmail && <span> · </span>}
                          {req.clientEmail && <span>{req.clientEmail}</span>}
                        </div>
                        {req.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{req.description}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Sent {fmtDate(req.createdAt)}
                          {req.expiresAt && <span> · Expires {fmtDate(req.expiresAt)}</span>}
                          {req.paidAt && <span> · Paid {fmtDate(req.paidAt)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {req.payUrl && req.status === 'pending' && (
                          <button onClick={() => { navigator.clipboard.writeText(req.payUrl); }}
                            title="Copy payment link"
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <I.Copy size={13} /> Copy Link
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <button onClick={() => handleCancelPaymentRequest(req._id)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #FECACA', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {txModal && (
          <TxModal key="tx" type={txModal} account={activeAccount} matters={matters} onClose={() => setTxModal(null)} onSave={handleTx} />
        )}
        {reconcileModal && activeAccount && (
          <ReconcileModal key="reconcile" account={activeAccount} onClose={() => setReconcileModal(false)} onReconcile={handleReconcile} />
        )}
        {voidModal && (
          <VoidModal key="void" tx={voidModal} accountId={activeAccount?._id} onClose={() => setVoidModal(null)} onVoid={handleVoid} />
        )}
        {paymentReqModal && activeAccount && (
          <PaymentRequestModal key="payreq" account={activeAccount} matters={matters} onClose={() => setPaymentReqModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
