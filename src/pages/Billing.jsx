import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { billingApi } from '../api/billing.api';
import { mattersApi } from '../api/matters.api';
import { contactsApi } from '../api/contacts.api';

/* ── Helpers ───────────────────────────────────────────────────── */
function fmtMoney(n) { return '$' + (n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d)  { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; }
function todayStr()  { return new Date().toISOString().slice(0, 10); }
function addDays(n)  { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const STATUS_META = {
  draft:           { label: 'Draft',          bg: '#F3F4F6', color: '#6B7280' },
  sent:            { label: 'Sent',           bg: '#DBEAFE', color: '#1E40AF' },
  partially_paid:  { label: 'Partial',        bg: '#FEF3C7', color: '#92400E' },
  paid:            { label: 'Paid',           bg: '#D1FAE5', color: '#065F46' },
  overdue:         { label: 'Overdue',        bg: '#FEE2E2', color: '#991B1B' },
  void:            { label: 'Void',           bg: '#F3F4F6', color: '#9CA3AF' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>;
}

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

function ModalWrap({ onClose, title, subtitle, children, wide }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: wide ? 720 : 520, boxShadow: 'var(--shadow-float)', marginBottom: 24, overflow: 'hidden' }}
      >
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

/* ── Line Item Editor ──────────────────────────────────────────── */
function LineItems({ items, onChange }) {
  const update = (i, k, v) => {
    const next = items.map((it, idx) => {
      if (idx !== i) return it;
      const updated = { ...it, [k]: v };
      updated.amount = +((parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0)).toFixed(2);
      return updated;
    });
    onChange(next);
  };
  const add    = () => onChange([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  const remove = i  => onChange(items.filter((_, idx) => idx !== i));

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
          <input type="number" min="0" step="0.25" value={it.quantity ?? ''} onChange={e => update(i, 'quantity', e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', textAlign: 'right' }} />
          <input type="number" min="0" value={it.rate ?? ''} onChange={e => update(i, 'rate', e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', textAlign: 'right' }} />
          <div style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--elevated)', fontWeight: 700, textAlign: 'right' }}>
            {fmtMoney(it.amount)}
          </div>
          <button onClick={() => remove(i)} style={{ width: 32, height: 36, borderRadius: 8, border: '1.5px solid #FCA5A5', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.X size={13} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px dashed var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', fontWeight: 600, marginTop: 4 }}>
        <I.Plus size={13} /> Add Line Item
      </button>
    </div>
  );
}

/* ── Invoice Modal ─────────────────────────────────────────────── */
function InvoiceModal({ invoice, matters, contacts, onClose, onSave }) {
  const isEdit = !!invoice?._id;
  const [form, setForm] = useState(isEdit ? {
    clientId:     invoice.clientId?._id || invoice.clientId || '',
    clientName:   invoice.clientName || '',
    clientEmail:  invoice.clientEmail || '',
    matterId:     invoice.matterId?._id || invoice.matterId || '',
    issueDate:    invoice.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 10) : todayStr(),
    dueDate:      invoice.dueDate   ? new Date(invoice.dueDate).toISOString().slice(0, 10)   : addDays(30),
    lineItems:    invoice.lineItems?.length ? invoice.lineItems : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    discountType:  invoice.discountType  || '',
    discountValue: invoice.discountValue || 0,
    notes:         invoice.notes  || '',
    terms:         invoice.terms  || '',
  } : {
    clientId: '', clientName: '', clientEmail: '', matterId: '',
    issueDate: todayStr(), dueDate: addDays(30),
    lineItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    discountType: '', discountValue: 0, notes: '', terms: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const subtotal      = form.lineItems.reduce((s, li) => s + (li.amount || 0), 0);
  const discountAmt   = form.discountType === 'percent' ? subtotal * (form.discountValue || 0) / 100
    : form.discountType === 'fixed' ? Math.min(form.discountValue || 0, subtotal) : 0;
  const total = subtotal - discountAmt;

  function handleContactSelect(cid) {
    const c = contacts.find(x => x._id === cid);
    set('clientId', cid);
    if (c) { set('clientName', `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.company || ''); set('clientEmail', c.email || ''); }
  }

  async function save() {
    if (!form.clientName?.trim() && !form.clientId) return;
    setSaving(true);
    try {
      await onSave(invoice?._id, form);
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title={isEdit ? 'Edit Invoice' : 'New Invoice'} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Client + Matter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Client">
            <select value={form.clientId} onChange={e => handleContactSelect(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select client</option>
              {contacts.map(c => <option key={c._id} value={c._id}>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || c.company}</option>)}
            </select>
          </Field>
          <Field label="Matter">
            <select value={form.matterId} onChange={e => set('matterId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">No matter</option>
              {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
            </select>
          </Field>
        </div>
        {/* Client name override */}
        <Field label="Bill To (name)">
          <input value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Client / company name" style={inputStyle} />
        </Field>
        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Issue Date">
            <input type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
          </Field>
        </div>
        {/* Line Items */}
        <Field label="Line Items">
          <LineItems items={form.lineItems} onChange={items => set('lineItems', items)} />
        </Field>
        {/* Discount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Discount Type">
            <select value={form.discountType} onChange={e => set('discountType', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">None</option>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </Field>
          <Field label="Discount Value">
            <input type="number" min="0" value={form.discountValue} onChange={e => set('discountValue', parseFloat(e.target.value) || 0)}
              disabled={!form.discountType} style={{ ...inputStyle, opacity: form.discountType ? 1 : 0.5 }} />
          </Field>
        </div>
        {/* Totals summary */}
        <div style={{ background: 'var(--elevated)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Subtotal</span><span style={{ fontWeight: 600 }}>{fmtMoney(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#EF4444' }}>
              <span>Discount</span><span style={{ fontWeight: 600 }}>-{fmtMoney(discountAmt)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: 'var(--ink)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span>Total</span><span>{fmtMoney(total)}</span>
          </div>
        </div>
        {/* Notes */}
        <Field label="Notes / Payment Instructions">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Payment instructions, thank you note…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.clientName?.trim()} saveLabel={isEdit ? 'Update' : 'Create Invoice'} />
      </div>
    </ModalWrap>
  );
}

/* ── Generate from Matter Modal ────────────────────────────────── */
function GenerateModal({ matters, onClose, onGenerate }) {
  const [matterId, setMatterId] = useState('');
  const [dueDate, setDueDate]   = useState(addDays(30));
  const [saving, setSaving]     = useState(false);

  async function submit() {
    if (!matterId) return;
    setSaving(true);
    try { await onGenerate({ matterId, dueDate }); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Generate Invoice from Matter">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Matter *">
          <select value={matterId} onChange={e => setMatterId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select matter</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}{m.matterNumber ? ` (${m.matterNumber})` : ''}</option>)}
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)', fontSize: 12, color: '#1E40AF' }}>
          All unbilled time entries and expenses for the selected matter will be added as line items automatically.
        </div>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!matterId} saveLabel="Generate Invoice" />
      </div>
    </ModalWrap>
  );
}

/* ── Mark Paid Modal ───────────────────────────────────────────── */
function MarkPaidModal({ invoice, onClose, onMark }) {
  const [form, setForm] = useState({ amount: String(invoice.amountOutstanding || invoice.total || ''), method: 'check', transactionId: '', notes: '', date: todayStr() });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    try { await onMark({ ...form, amount: parseFloat(form.amount) || 0 }); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Record Payment" subtitle={`${invoice.invoiceNumber} — Outstanding: ${fmtMoney(invoice.amountOutstanding)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Amount ($)">
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Payment Method">
          <select value={form.method} onChange={e => set('method', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {['check', 'wire', 'ach', 'credit_card', 'cash', 'other'].map(m => (
              <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </Field>
        <Field label="Reference / Transaction ID">
          <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="Optional" style={inputStyle} />
        </Field>
        <Field label="Notes">
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" style={inputStyle} />
        </Field>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!form.amount || parseFloat(form.amount) <= 0} saveLabel="Record Payment" />
      </div>
    </ModalWrap>
  );
}

/* ── Void Modal ────────────────────────────────────────────────── */
function VoidModal({ invoice, onClose, onVoid }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setSaving(true);
    try { await onVoid(reason); onClose(); } finally { setSaving(false); }
  }

  return (
    <ModalWrap onClose={onClose} title="Void Invoice" subtitle={invoice.invoiceNumber}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#991B1B' }}>
          Voiding will unmark all time entries and expenses associated with this invoice so they can be re-billed.
        </div>
        <Field label="Reason *">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for voiding…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <ModalFooter onClose={onClose} onSave={submit} saving={saving} disabled={!reason.trim()} saveLabel="Void Invoice" />
      </div>
    </ModalWrap>
  );
}

/* ── Invoice Detail Panel ──────────────────────────────────────── */
function InvoiceDetail({ invoice, onClose, onAction, onRefresh }) {
  const [copying, setCopying] = useState(false);

  async function generateLink() {
    const r = await billingApi.generatePaymentLink(invoice._id);
    const link = r.data.data?.paymentLink;
    if (link) { navigator.clipboard?.writeText(link); setCopying(true); setTimeout(() => setCopying(false), 2000); }
  }

  const canSend   = ['draft', 'sent'].includes(invoice.status);
  const canPay    = ['sent', 'partially_paid', 'overdue', 'draft'].includes(invoice.status);
  const canVoid   = invoice.status !== 'void';
  const canEdit   = invoice.status === 'draft';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(11,11,20,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{ width: 480, maxWidth: '95vw', height: '100vh', background: 'var(--surface)', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--ink)' }}>{invoice.invoiceNumber}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{invoice.clientName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I.X size={18} /></button>
        </div>

        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total', value: fmtMoney(invoice.total), color: 'var(--ink)' },
              { label: 'Paid', value: fmtMoney(invoice.amountPaid), color: '#10B981' },
              { label: 'Outstanding', value: fmtMoney(invoice.amountOutstanding), color: invoice.amountOutstanding > 0 ? '#EF4444' : '#10B981' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--elevated)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Issue Date', value: fmtDate(invoice.issueDate) },
              { label: 'Due Date',   value: fmtDate(invoice.dueDate) },
              { label: 'Matter',     value: invoice.matterId?.title || '—' },
              { label: 'Sent',       value: fmtDate(invoice.sentAt) },
            ].map(r => (
              <div key={r.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Line items */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Line Items</div>
            {(invoice.lineItems || []).map((li, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{li.description}</div>
                  {li.quantity !== 1 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{li.quantity} × ${li.rate}/hr</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginLeft: 16 }}>{fmtMoney(li.amount)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 900, color: 'var(--ink)' }}>
              <span>Total</span><span>{fmtMoney(invoice.total)}</span>
            </div>
          </div>

          {/* Payments history */}
          {invoice.payments?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payment History</div>
              {invoice.payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{fmtMoney(p.amount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(p.date)} · {(p.method || '').replace('_', ' ')}</div>
                  </div>
                  {p.transactionId && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{p.transactionId}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--elevated)', fontSize: 13, color: 'var(--text-muted)' }}>
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canEdit && <button onClick={() => onAction('edit')} style={actionBtn('var(--purple)', '#fff')}>Edit</button>}
            {canSend && <button onClick={() => onAction('send')} style={actionBtn('#3B82F6', '#fff')}>Send to Client</button>}
            {canPay  && <button onClick={() => onAction('pay')}  style={actionBtn('#10B981', '#fff')}>Record Payment</button>}
            <button onClick={generateLink} style={actionBtn('transparent', 'var(--ink)', '1.5px solid var(--border)')}>
              {copying ? '✓ Copied!' : 'Copy Pay Link'}
            </button>
          </div>
          {canVoid && (
            <button onClick={() => onAction('void')} style={{ ...actionBtn('transparent', '#EF4444', '1.5px solid #FCA5A5'), width: '100%', justifyContent: 'center' }}>
              Void Invoice
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function actionBtn(bg, color, border = 'none') {
  return { padding: '9px 16px', borderRadius: 10, border, background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 };
}

/* ── Invoice Table Row ─────────────────────────────────────────── */
function InvoiceRow({ invoice, onClick }) {
  const clientName = invoice.clientId
    ? (`${invoice.clientId.firstName || ''} ${invoice.clientId.lastName || ''}`.trim() || invoice.clientId.company)
    : invoice.clientName;

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--purple)', fontSize: 13 }}>{invoice.invoiceNumber}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{clientName || '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {invoice.matterId?.title || '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(invoice.issueDate)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: invoice.status === 'overdue' ? '#EF4444' : 'var(--text-muted)', fontWeight: invoice.status === 'overdue' ? 700 : 400, whiteSpace: 'nowrap' }}>
        {fmtDate(invoice.dueDate)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fmtMoney(invoice.total)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{fmtMoney(invoice.amountOutstanding)}</td>
      <td style={{ padding: '12px 16px' }}><StatusBadge status={invoice.status} /></td>
    </motion.tr>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function Billing() {
  const [invoices, setInvoices]     = useState([]);
  const [matters, setMatters]       = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [stats, setStats]           = useState({ totalBilled: 0, totalCollected: 0, totalOutstanding: 0, overdueCount: 0 });
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceModal, setInvoiceModal]   = useState(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [markPaidModal, setMarkPaidModal] = useState(null);
  const [voidModal, setVoidModal]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search)       params.search = search;
      const r = await billingApi.listInvoices(params);
      const d = r.data.data || {};
      setInvoices(d.invoices || []);
      setStats({ totalBilled: d.totalBilled || 0, totalCollected: d.totalCollected || 0, totalOutstanding: d.totalOutstanding || 0, overdueCount: d.overdueCount || 0 });
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  const loadSupport = useCallback(async () => {
    try {
      const [mr, cr] = await Promise.all([mattersApi.list({ limit: 200 }), contactsApi.list({ limit: 200 })]);
      setMatters(mr.data.data?.matters  || []);
      setContacts(cr.data.data?.contacts || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSupport(); }, [loadSupport]);

  async function handleSave(id, data) {
    if (id) await billingApi.updateInvoice(id, data);
    else    await billingApi.createInvoice(data);
    load();
    setSelectedInvoice(null);
  }

  async function handleGenerate(data) {
    await billingApi.generateFromMatter(data);
    load();
  }

  async function handleSend(id) {
    await billingApi.sendInvoice(id);
    load();
    setSelectedInvoice(null);
  }

  async function handleMarkPaid(id, data) {
    await billingApi.markPaid(id, data);
    load();
    setMarkPaidModal(null);
    setSelectedInvoice(null);
  }

  async function handleVoid(id, reason) {
    await billingApi.voidInvoice(id, reason);
    load();
    setVoidModal(null);
    setSelectedInvoice(null);
  }

  async function openDetail(invoice) {
    const r = await billingApi.getInvoice(invoice._id);
    setSelectedInvoice(r.data.data);
  }

  function handleAction(action) {
    if (action === 'edit') { setInvoiceModal(selectedInvoice); setSelectedInvoice(null); }
    if (action === 'send') { handleSend(selectedInvoice._id); }
    if (action === 'pay')  { setMarkPaidModal(selectedInvoice); }
    if (action === 'void') { setVoidModal(selectedInvoice); }
  }

  const STAT_CARDS = [
    { label: 'Total Billed',   value: fmtMoney(stats.totalBilled),      color: 'var(--purple)' },
    { label: 'Collected',      value: fmtMoney(stats.totalCollected),    color: '#10B981' },
    { label: 'Outstanding',    value: fmtMoney(stats.totalOutstanding),  color: '#3B82F6' },
    { label: 'Overdue',        value: `${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''}`, color: '#EF4444' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Billing & Invoices</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Generate invoices, track payments, and manage trust accounts</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setGenerateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: 'none', color: 'var(--ink)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <I.Sparkle size={14} /> From Matter
            </button>
            <button onClick={() => setInvoiceModal({})}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              <I.Plus size={14} /> New Invoice
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Invoices table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', flex: 1, minWidth: 160 }} />
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
              <I.DollarSign size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No invoices yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Click "New Invoice" or "From Matter" to create your first invoice.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--elevated)' }}>
                    {['Invoice #', 'Client', 'Matter', 'Issued', 'Due', 'Total', 'Outstanding', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <InvoiceRow key={inv._id} invoice={inv} onClick={() => openDetail(inv)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals & panels */}
      <AnimatePresence>
        {invoiceModal !== null && (
          <InvoiceModal key="inv-modal" invoice={invoiceModal?._id ? invoiceModal : null} matters={matters} contacts={contacts} onClose={() => setInvoiceModal(null)} onSave={handleSave} />
        )}
        {generateModal && (
          <GenerateModal key="gen-modal" matters={matters} onClose={() => setGenerateModal(false)} onGenerate={handleGenerate} />
        )}
        {markPaidModal && (
          <MarkPaidModal key="pay-modal" invoice={markPaidModal} onClose={() => setMarkPaidModal(null)} onMark={data => handleMarkPaid(markPaidModal._id, data)} />
        )}
        {voidModal && (
          <VoidModal key="void-modal" invoice={voidModal} onClose={() => setVoidModal(null)} onVoid={reason => handleVoid(voidModal._id, reason)} />
        )}
        {selectedInvoice && (
          <InvoiceDetail key="detail" invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onAction={handleAction} onRefresh={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
