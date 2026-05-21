import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { formatMoney, getStoredCurrency } from '../utils/currency';

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit / Debit Card' },
  { value: 'wire',        label: 'Bank Wire Transfer' },
  { value: 'ach',         label: 'ACH / Direct Debit' },
  { value: 'check',       label: 'Cheque' },
  { value: 'cash',        label: 'Cash' },
  { value: 'other',       label: 'Other' },
];

function fmtMoney(n, currency) {
  return formatMoney(n, currency || getStoredCurrency());
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E5E7EB', fontSize: 14,
  background: '#F9FAFB', boxSizing: 'border-box', outline: 'none',
  color: '#111827', fontFamily: 'inherit',
};

export default function InvoicePayPage() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [status,  setStatus]  = useState('loading'); // loading | ready | paid | submitting | success | error
  const [form,    setForm]    = useState({ method: 'credit_card', transactionId: '', name: '' });
  const [errMsg,  setErrMsg]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get(`/payments/public/${token}`)
      .then(r => {
        const inv = r.data.data;
        setInvoice(inv);
        setStatus(inv.status === 'paid' ? 'paid' : 'ready');
      })
      .catch(err => {
        setErrMsg(err.response?.data?.message || 'This invoice link is invalid or has expired.');
        setStatus('error');
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post(`/payments/public/${token}/pay`, {
        amount:        invoice.amountOutstanding,
        method:        form.method,
        transactionId: form.transactionId || undefined,
      });
      setStatus('success');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Payment submission failed. Please try again.');
      setStatus('error');
    }
  }

  const isOverdue = invoice?.dueDate && new Date(invoice.dueDate) < new Date() && invoice?.status !== 'paid';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #F8FAFC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 20 }}>⚖</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Nyaya Law</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Secure Invoice Payment Portal</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ color: '#6B7280', fontSize: 14 }}>Loading invoice…</div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Invalid Link</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>{errMsg}</div>
            </div>
          )}

          {/* Already paid */}
          {status === 'paid' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginBottom: 10 }}>Invoice Paid</div>
              <div style={{ fontSize: 14, color: '#047857' }}>
                Invoice {invoice?.invoiceNumber} has already been paid in full. Thank you!
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginBottom: 10 }}>Payment Recorded!</div>
              <div style={{ fontSize: 14, color: '#047857', marginBottom: 6 }}>
                Your payment of {fmtMoney(invoice?.amountOutstanding)} has been submitted.
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 16 }}>
                You may close this window. Your attorney has been notified.
              </div>
            </div>
          )}

          {/* Payment form */}
          {(status === 'ready' || status === 'submitting') && invoice && (
            <>
              {/* Invoice header */}
              <div style={{ background: isOverdue ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #7C3AED, #4F46E5)', padding: '28px 32px', color: '#fff' }}>
                <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Invoice {invoice.invoiceNumber}
                  {isOverdue && <span style={{ marginLeft: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>OVERDUE</span>}
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>
                  {fmtMoney(invoice.amountOutstanding)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Amount Due</div>
                {invoice.dueDate && (
                  <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
                    Due: {fmtDate(invoice.dueDate)}
                  </div>
                )}
              </div>

              <div style={{ padding: '24px 32px' }}>
                {/* Client greeting */}
                {invoice.clientName && (
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
                    Hello <strong>{invoice.clientName}</strong>, please complete your payment below.
                  </div>
                )}

                {/* Invoice summary */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {invoice.lineItems?.slice(0, 3).map((li, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#374151' }}>{li.description || 'Service'}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{fmtMoney(li.amount)}</span>
                    </div>
                  ))}
                  {invoice.lineItems?.length > 3 && (
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>+{invoice.lineItems.length - 3} more items</div>
                  )}
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                    <span>Total Due</span>
                    <span style={{ color: isOverdue ? '#DC2626' : '#111827' }}>{fmtMoney(invoice.amountOutstanding)}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Payment Method</label>
                    <select value={form.method} onChange={e => set('method', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Reference / Transaction # (optional)</label>
                    <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="Bank reference or cheque number" style={inp} />
                  </div>

                  <button type="submit" disabled={status === 'submitting'}
                    style={{ width: '100%', padding: '14px 20px', borderRadius: 12, background: isOverdue ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1, letterSpacing: '-0.01em' }}>
                    {status === 'submitting' ? 'Processing…' : `Pay ${fmtMoney(invoice.amountOutstanding)}`}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                    🔒 Your payment is processed securely. By submitting you confirm this payment.
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          Powered by Nyaya Law Platform · Secure Payments
        </div>
      </div>
    </div>
  );
}
