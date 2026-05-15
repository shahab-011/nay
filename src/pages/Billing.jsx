import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { billingApi } from '../api/billing.api';

/* ─── Constants ─────────────────────────────────────────────── */
const STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'];
const STATUS_STYLE = {
  Draft:   { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
  Sent:    { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  Paid:    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  Overdue: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  Void:    { bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' },
};

const TAX_RATES = [0, 5, 8, 10, 15, 18, 20];

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtMoney(n) { return `$${(parseFloat(n) || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
function invoiceNum() { return `INV-${Date.now().toString().slice(-6)}`; }

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}>
      {status}
    </span>
  );
}

/* ─── Line item editor ───────────────────────────────────────── */
function LineItems({ items, onChange }) {
  function update(i, k, v) {
    const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it);
    onChange(next.map(it => ({ ...it, amount: ((parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0)).toFixed(2) })));
  }
  function add() { onChange([...items, { description: '', quantity: 1, rate: 0, amount: '0.00' }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 32px', gap: 8, marginBottom: 6 }}>
        {['Description', 'Qty', 'Rate', 'Amount', ''].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 4px' }}>{h}</div>
        ))}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 32px', gap: 8, marginBottom: 6 }}>
          <input value={it.description || ''} onChange={e => update(i, 'description', e.target.value)} placeholder="Service description"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)' }} />
          <input type="number" min="0" step="0.25" value={it.quantity || ''} onChange={e => update(i, 'quantity', e.target.value)} placeholder="1"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', textAlign: 'right' }} />
          <input type="number" min="0" value={it.rate || ''} onChange={e => update(i, 'rate', e.target.value)} placeholder="250"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', textAlign: 'right' }} />
          <div style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--elevated)', fontWeight: 700, textAlign: 'right' }}>
            {fmtMoney(it.amount)}
          </div>
          <button onClick={() => remove(i)} style={{ width: 32, height: 36, borderRadius: 8, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.X size={13} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px dashed var(--purple-mist)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', fontWeight: 600, marginTop: 4 }}>
        <I.Plus size={13} /> Add Line Item
      </button>
    </div>
  );
}

/* ─── Invoice Modal (create / edit) ─────────────────────────── */
const BLANK_INV = {
  invoice_number: '', client_name: '', matter_name: '',
  invoice_date: todayStr(), due_date: addDays(todayStr(), 30),
  status: 'Draft', tax_rate: 0, discount: 0, notes: '',
  line_items: [{ description: '', quantity: 1, rate: 250, amount: '250.00' }],
};

function InvoiceModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState(() => invoice?.id
    ? { ...invoice, line_items: invoice.line_items?.length ? invoice.line_items : BLANK_INV.line_items }
    : { ...BLANK_INV, invoice_number: invoiceNum() }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const subtotal  = form.line_items.reduce((s, it) => s + parseFloat(it.amount || 0), 0);
  const taxAmt    = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const discount  = parseFloat(form.discount) || 0;
  const total     = subtotal + taxAmt - discount;

  async function save() {
    if (!form.client_name?.trim()) return;
    setSaving(true);
    try { await onSave({ ...form, subtotal, tax_amount: taxAmt, total }); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 640, boxShadow: 'var(--shadow-float)', marginBottom: 24 }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{invoice?.id ? 'Edit Invoice' : 'New Invoice'}</h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{form.invoice_number}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I.X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Client + Matter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Bill To (Client) *</label>
              <input value={form.client_name || ''} onChange={e => set('client_name', e.target.value)} placeholder="Client name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Matter</label>
              <input value={form.matter_name || ''} onChange={e => set('matter_name', e.target.value)} placeholder="Matter name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Dates + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Invoice Date</label>
              <input type="date" value={form.invoice_date || ''} onChange={e => set('invoice_date', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Due Date</label>
              <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box', cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>Line Items</label>
            <LineItems items={form.line_items} onChange={items => set('line_items', items)} />
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 280, background: 'var(--elevated)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>Subtotal</span><span style={{ fontWeight: 700 }}>{fmtMoney(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <select value={form.tax_rate} onChange={e => set('tax_rate', parseFloat(e.target.value))}
                    style={{ padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12, background: 'var(--bg)', cursor: 'pointer' }}>
                    {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                  <span style={{ fontWeight: 700 }}>{fmtMoney(taxAmt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Discount</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>$</span>
                  <input type="number" min="0" value={form.discount || ''} onChange={e => set('discount', parseFloat(e.target.value) || 0)} placeholder="0"
                    style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12, background: 'var(--bg)', textAlign: 'right' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--ink)', borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 2 }}>
                <span>Total</span><span>{fmtMoney(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Notes / Payment Instructions</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="e.g. Payment due within 30 days. Wire transfer or cheque accepted."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={save} disabled={saving || !form.client_name?.trim()}
              style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : invoice?.id ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Invoice detail panel (slide-in) ───────────────────────── */
function InvoiceDetail({ invoice, onClose, onSend, onMarkPaid, onEdit, onDelete }) {
  const [sending, setSending]   = useState(false);
  const [paying, setPaying]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const subtotal = invoice.subtotal || invoice.line_items?.reduce((s, it) => s + parseFloat(it.amount || 0), 0) || 0;
  const total    = invoice.total || subtotal;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(11,11,20,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, background: 'var(--surface)', boxShadow: '-8px 0 48px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #7C3AED11, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>{invoice.invoice_number}</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>{invoice.client_name}</h2>
              {invoice.matter_name && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{invoice.matter_name}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><I.X size={18} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StatusBadge status={invoice.status} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Issued {fmtDate(invoice.invoice_date)}</span>
            <span style={{ fontSize: 12, color: invoice.status === 'Overdue' ? '#EF4444' : 'var(--text-muted)' }}>Due {fmtDate(invoice.due_date)}</span>
          </div>
        </div>

        {/* Total */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Total Amount</span>
          <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--ink)' }}>{fmtMoney(total)}</span>
        </div>

        {/* Line items */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Line Items</div>
          {(invoice.line_items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{it.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{it.quantity} × ${it.rate}/hr</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{fmtMoney(it.amount)}</div>
            </div>
          ))}
          {/* Totals summary */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Subtotal', val: invoice.subtotal || subtotal },
              { label: `Tax (${invoice.tax_rate || 0}%)`, val: invoice.tax_amount || 0 },
              { label: 'Discount', val: -(invoice.discount || 0) },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{r.label}</span><span style={{ fontWeight: 700 }}>{fmtMoney(r.val)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--ink)', borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
              <span>Total Due</span><span>{fmtMoney(total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--elevated)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
            <div style={{ display: 'flex', gap: 10 }}>
              {invoice.status === 'Draft' && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={async () => { setSending(true); await onSend(invoice.id); setSending(false); onClose(); }}
                  disabled={sending}
                  style={{ flex: 1, padding: '11px', borderRadius: 11, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <I.Send size={15} /> {sending ? 'Sending…' : 'Send to Client'}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={async () => { setPaying(true); await onMarkPaid(invoice.id); setPaying(false); onClose(); }}
                disabled={paying}
                style={{ flex: 1, padding: '11px', borderRadius: 11, background: '#D1FAE5', color: '#065F46', border: '1.5px solid #6EE7B7', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <I.Check size={15} /> {paying ? 'Updating…' : 'Mark as Paid'}
              </motion.button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onEdit(invoice); onClose(); }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Edit
            </button>
            <button
              onClick={async () => { if (!window.confirm('Delete this invoice?')) return; setDeleting(true); await onDelete(invoice.id); setDeleting(false); onClose(); }}
              disabled={deleting}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Trust Accounting tab ───────────────────────────────────── */
function TrustTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // 'deposit' | 'transfer'
  const [form, setForm]         = useState({ amount: '', description: '', account_id: '' });

  useEffect(() => {
    billingApi.listTrustAccounts()
      .then(r => setAccounts(r.data?.data || r.data || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Trust Balance', value: fmtMoney(totalBalance), color: '#7C3AED', sub: 'across all accounts' },
          { label: 'Accounts', value: accounts.length, color: '#3B82F6', sub: 'active IOLTA accounts' },
          { label: 'Pending Transfers', value: '—', color: '#F59E0B', sub: 'awaiting clearance' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 18px', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setModal('deposit')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <I.Plus size={14} /> Record Deposit
        </button>
        <button onClick={() => setModal('transfer')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'var(--surface)', color: 'var(--ink)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <I.ArrowRight size={14} /> Transfer to Operating
        </button>
      </div>

      {/* Accounts table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 24, height: 24, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
        </div>
      ) : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--border)' }}>
          <I.DollarSign size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No trust accounts yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Trust accounts will appear here once set up on the backend.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--elevated)' }}>
                {['Account Name','Client','Matter','Balance','Last Activity'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{a.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{a.client_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{a.matter_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: parseFloat(a.balance) >= 0 ? '#065F46' : '#EF4444' }}>{fmtMoney(a.balance)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(a.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deposit / Transfer mini modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => e.target === e.currentTarget && setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 360, boxShadow: 'var(--shadow-float)' }}
            >
              <h3 style={{ margin: '0 0 18px', fontSize: 17, fontWeight: 800 }}>
                {modal === 'deposit' ? 'Record Trust Deposit' : 'Transfer to Operating Account'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <input type="number" min="0" placeholder="Amount ($)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, fontWeight: 700, background: 'var(--bg)' }} />
                <input placeholder="Description / reference" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      if (modal === 'deposit') await billingApi.trustDeposit({ ...form, amount: parseFloat(form.amount) });
                      else                    await billingApi.trustTransfer({ ...form, amount: parseFloat(form.amount) });
                    } catch (_) {}
                    setModal(null); setForm({ amount: '', description: '', account_id: '' });
                  }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Billing ───────────────────────────────────────────── */
export default function Billing() {
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('invoices');
  const [statusFilter, setStatus] = useState('All');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);  // null | 'new' | invoice
  const [detail, setDetail]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await billingApi.listInvoices({ status: statusFilter !== 'All' ? statusFilter : undefined });
      setInvoices(r.data?.data || r.data || []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { if (tab === 'invoices') load(); }, [load, tab]);

  async function handleSave(form) {
    if (form.id) await billingApi.updateInvoice(form.id, form);
    else         await billingApi.createInvoice(form);
    load();
  }
  async function handleSend(id) { await billingApi.sendInvoice(id); load(); }
  async function handlePaid(id) { await billingApi.markPaid(id, { paid_date: new Date().toISOString().slice(0,10) }); load(); }
  async function handleDelete(id) { await billingApi.deleteInvoice(id); setInvoices(prev => prev.filter(i => i.id !== id)); }

  const filtered = invoices.filter(inv =>
    (!search || inv.client_name?.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()))
  );

  // Stats
  const total    = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const paid     = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const outstanding = invoices.filter(i => ['Sent','Overdue'].includes(i.status)).reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const overdue  = invoices.filter(i => i.status === 'Overdue').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Billing</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Invoices, payments, and trust accounting</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setModal({})}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              <I.Plus size={15} /> New Invoice
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Invoiced', value: fmtMoney(total), color: 'var(--purple)', sub: 'all time' },
            { label: 'Collected', value: fmtMoney(paid), color: '#10B981', sub: 'paid invoices' },
            { label: 'Outstanding', value: fmtMoney(outstanding), color: '#3B82F6', sub: 'sent & awaiting payment' },
            { label: 'Overdue', value: overdue, color: '#EF4444', sub: `${overdue} invoice${overdue !== 1 ? 's' : ''}` },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--elevated)', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {['invoices','trust'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--purple)' : 'var(--text-muted)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms',
              }}
            >{t === 'invoices' ? 'Invoices' : 'Trust Accounting'}</button>
          ))}
        </div>

        {tab === 'trust' ? <TrustTab /> : (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            {/* Filters */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Status tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['All', ...STATUSES].map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: statusFilter === s ? (STATUS_STYLE[s]?.bg || 'var(--purple-soft)') : 'transparent',
                      color: statusFilter === s ? (STATUS_STYLE[s]?.color || 'var(--purple)') : 'var(--text-muted)',
                      borderColor: statusFilter === s ? (STATUS_STYLE[s]?.border || 'var(--purple-mist)') : 'transparent',
                      transition: 'all 150ms',
                    }}>{s}</button>
                ))}
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or invoice #…"
                style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', width: 220 }} />
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <I.Receipt size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No invoices yet</p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>Create your first invoice to start billing clients.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--elevated)' }}>
                      {['Invoice #','Client','Matter','Amount','Status','Issued','Due',''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inv => (
                      <tr
                        key={inv.id}
                        style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => setDetail(inv)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>{inv.invoice_number}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{inv.client_name}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{inv.matter_name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{fmtMoney(inv.total || 0)}</td>
                        <td style={{ padding: '12px 16px' }}><StatusBadge status={inv.status} /></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(inv.invoice_date)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: inv.status === 'Overdue' ? '#EF4444' : 'var(--text-muted)', fontWeight: inv.status === 'Overdue' ? 700 : 400, whiteSpace: 'nowrap' }}>{fmtDate(inv.due_date)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={e => { e.stopPropagation(); setDetail(inv); }}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice modal */}
      <AnimatePresence>
        {modal !== null && (
          <InvoiceModal invoice={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {detail && (
          <InvoiceDetail
            invoice={detail}
            onClose={() => setDetail(null)}
            onSend={handleSend}
            onMarkPaid={handlePaid}
            onEdit={inv => { setModal(inv); setDetail(null); }}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
