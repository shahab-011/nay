import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card',   label: 'Credit / Debit Card' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'cash',          label: 'Cash' },
  { value: 'other',         label: 'Other' },
];

function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TrustPayPage() {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [status,  setStatus]  = useState('loading'); // loading | ready | expired | paid | submitting | success | error
  const [form,    setForm]    = useState({ paymentMethod: 'bank_transfer', transactionId: '', notes: '' });
  const [errMsg,  setErrMsg]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get(`/trust-pay/${token}`)
      .then(r => { setRequest(r.data.data); setStatus('ready'); })
      .catch(err => {
        const code = err.response?.status;
        setStatus(code === 410 ? 'expired' : 'error');
        setErrMsg(err.response?.data?.message || 'This payment link is invalid.');
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post(`/trust-pay/${token}`, form);
      setStatus('success');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Payment submission failed. Please try again.');
      setStatus('error');
    }
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E5E7EB', fontSize: 14,
    background: '#F9FAFB', boxSizing: 'border-box', outline: 'none',
    color: '#111827', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #F8FAFC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'grid', placeItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 20 }}>⚖</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Nyaya Law</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Secure Trust Account Payment Portal</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ color: '#6B7280', fontSize: 14 }}>Loading payment details…</div>
            </div>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏱</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Link Expired</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>This payment link has expired. Please contact your attorney for a new link.</div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && !request && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Invalid Link</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>{errMsg}</div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginBottom: 10 }}>Payment Received!</div>
              <div style={{ fontSize: 14, color: '#047857', marginBottom: 6 }}>
                {fmtMoney(request?.amount)} has been recorded in your attorney's trust account.
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 16 }}>
                You may close this window. Your attorney has been notified.
              </div>
            </div>
          )}

          {/* Payment form */}
          {(status === 'ready' || status === 'submitting' || (status === 'error' && request)) && request && (
            <>
              {/* Amount header */}
              <div style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', padding: '28px 32px', color: '#fff' }}>
                <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {request.firmName || 'Law Firm'} — Trust Account Payment
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>
                  {fmtMoney(request.amount)}
                </div>
                {request.description && (
                  <div style={{ fontSize: 14, opacity: 0.85 }}>{request.description}</div>
                )}
                {request.expiresAt && (
                  <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
                    Link expires: {new Date(request.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>

              <div style={{ padding: '28px 32px' }}>
                {request.clientName && (
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
                    Hello <strong>{request.clientName}</strong>,
                    {request.message && <span> {request.message}</span>}
                    {!request.message && <span> your attorney is requesting a trust account deposit.</span>}
                  </div>
                )}

                {status === 'error' && request && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#991B1B', marginBottom: 18 }}>
                    {errMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Payment Method</label>
                    <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Transaction / Reference # (optional)</label>
                    <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="Bank reference or cheque number" style={inp} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional notes about this payment…" style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>

                  <button type="submit" disabled={status === 'submitting'}
                    style={{ width: '100%', padding: '14px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1, letterSpacing: '-0.01em' }}>
                    {status === 'submitting' ? 'Recording Payment…' : `Confirm Payment of ${fmtMoney(request.amount)}`}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                    🔒 This payment is processed securely by {request.firmName || 'your law firm'}.
                    By submitting you confirm receipt of funds into the trust account.
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          Powered by Nyaya Law Platform · Trust Account Compliance
        </div>
      </div>
    </div>
  );
}
