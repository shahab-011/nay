import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

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

export default function ESignSignPage() {
  const { token } = useParams();
  const [doc,     setDoc]     = useState(null);
  const [status,  setStatus]  = useState('loading'); // loading | ready | signed | declined | expired | error | submitting | success | declining
  const [agreed,  setAgreed]  = useState(false);
  const [typedSig, setTypedSig] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [errMsg,  setErrMsg]  = useState('');

  useEffect(() => {
    api.get(`/esign/sign/${token}`)
      .then(r => { setDoc(r.data.data); setStatus('ready'); })
      .catch(err => {
        const msg = err.response?.data?.message || '';
        if (msg.toLowerCase().includes('already signed'))   setStatus('signed');
        else if (msg.toLowerCase().includes('expired'))     setStatus('expired');
        else if (msg.toLowerCase().includes('declined'))    setStatus('declined');
        else { setErrMsg(msg || 'This signing link is invalid or has expired.'); setStatus('error'); }
      });
  }, [token]);

  async function handleSign(e) {
    e.preventDefault();
    if (!agreed) return;
    setStatus('submitting');
    try {
      await api.post(`/esign/sign/${token}`, {
        signatureData: typedSig || null,
        agreedToTerms: true,
      });
      setStatus('success');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Signing failed. Please try again.');
      setStatus('error');
    }
  }

  async function handleDecline(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post(`/esign/sign/${token}/decline`, { reason: declineReason });
      setStatus('declined');
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Could not decline. Please try again.');
      setStatus('error');
    }
  }

  const progress = doc?.progress;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F8FAFC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #6366F1)', display: 'grid', placeItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 20 }}>✍</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Nyaya Law</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Secure Electronic Signature Portal</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E0E7FF', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ color: '#6B7280', fontSize: 14 }}>Loading document…</div>
            </div>
          )}

          {/* Already signed */}
          {status === 'signed' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46', marginBottom: 8 }}>Already Signed</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>You have already signed this document. Thank you!</div>
            </div>
          )}

          {/* Declined */}
          {status === 'declined' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✗</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#991B1B', marginBottom: 8 }}>Signature Declined</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>You have declined to sign this document. The requesting party has been notified.</div>
            </div>
          )}

          {/* Expired / error */}
          {(status === 'expired' || status === 'error') && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏱</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                {status === 'expired' ? 'Link Expired' : 'Invalid Link'}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                {errMsg || 'This signing link has expired. Please contact your attorney for a new link.'}
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginBottom: 10 }}>Document Signed!</div>
              <div style={{ fontSize: 14, color: '#047857', marginBottom: 6 }}>
                Thank you, <strong>{doc?.signatory?.name}</strong>. Your signature has been recorded.
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 16 }}>
                You may close this window. All parties will be notified.
              </div>
            </div>
          )}

          {/* Signing form */}
          {(status === 'ready' || status === 'submitting' || status === 'declining') && doc && (
            <>
              {/* Document header */}
              <div style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', padding: '28px 32px', color: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Signature Request
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, lineHeight: 1.3 }}>{doc.title}</div>
                {doc.description && (
                  <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>{doc.description}</div>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                  {progress && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {progress.signed} of {progress.total} signed
                    </div>
                  )}
                  {doc.expiresAt && (
                    <div style={{ fontSize: 12, opacity: 0.65 }}>Expires {fmtDate(doc.expiresAt)}</div>
                  )}
                </div>
              </div>

              <div style={{ padding: '24px 32px' }}>
                {/* Signatory info */}
                <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '14px 16px', marginBottom: 22, border: '1.5px solid #DDD6FE' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Signing as</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{doc.signatory?.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{doc.signatory?.email} · {doc.signatory?.role?.replace('_', ' ')}</div>
                </div>

                {/* Decline form */}
                {status === 'declining' ? (
                  <form onSubmit={handleDecline} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: 14, borderRadius: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
                      You are about to decline to sign this document. The requesting attorney will be notified.
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Reason for declining (optional)</label>
                      <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3}
                        placeholder="Briefly explain why you are declining…"
                        style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => setStatus('ready')}
                        style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                        Back
                      </button>
                      <button type="submit"
                        style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                        Confirm Decline
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Sign form */
                  <form onSubmit={handleSign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Type your full name as signature</label>
                      <input value={typedSig} onChange={e => setTypedSig(e.target.value)}
                        placeholder={doc.signatory?.name || 'Your full legal name'}
                        style={{ ...inp, fontFamily: 'Georgia, serif', fontSize: 18, color: '#1E1B4B', letterSpacing: '0.01em' }} />
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Type your name exactly as it appears above to apply your electronic signature.</div>
                    </div>

                    {/* Agreement checkbox */}
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                        style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                        I agree that my typed name constitutes my legally binding electronic signature on this document, and I have read and understood its contents.
                      </span>
                    </label>

                    <button type="submit" disabled={!agreed || status === 'submitting'}
                      style={{ width: '100%', padding: '14px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: (!agreed || status === 'submitting') ? 'not-allowed' : 'pointer', opacity: (!agreed || status === 'submitting') ? 0.6 : 1 }}>
                      {status === 'submitting' ? 'Signing…' : 'Sign Document'}
                    </button>

                    <button type="button" onClick={() => setStatus('declining')}
                      style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #FECACA', background: 'rgba(239,68,68,0.06)', color: '#DC2626', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      Decline to Sign
                    </button>

                    <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                      🔒 Your signature is recorded securely with IP address, timestamp, and user agent.
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          Powered by Nyaya Law Platform · Electronic Signatures
        </div>
      </div>
    </div>
  );
}
