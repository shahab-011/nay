import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { portalApi } from '../api/portal.api';

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ─── OTP Login Screen ────────────────────────────────────────── */
function OTPLogin({ onAuth, magicToken }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Auto-authenticate via magic link token
  useEffect(() => {
    if (!magicToken) return;
    setLoading(true);
    portalApi.magicLink(magicToken)
      .then(r => {
        const { accessToken, sessionTimeout, email: e } = r.data.data;
        localStorage.setItem('portalToken', accessToken);
        onAuth({ accessToken, sessionTimeout, email: e });
      })
      .catch(() => setErr('This portal link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [magicToken, onAuth]);

  async function requestOTP() {
    if (!email.trim()) return;
    setLoading(true); setErr('');
    try {
      const r = await portalApi.requestOTP(email);
      if (r.data.data?.otp) setDevOtp(r.data.data.otp); // dev only
      setStep('otp');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (!otp.trim()) return;
    setLoading(true); setErr('');
    try {
      const r = await portalApi.verifyOTP(email, otp);
      const { accessToken, sessionTimeout } = r.data.data;
      localStorage.setItem('portalToken', accessToken);
      onAuth({ accessToken, sessionTimeout, email });
    } catch (e) {
      setErr(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  if (loading && magicToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Opening your portal…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: 24, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <I.Lock size={26} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Client Portal</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6B7280' }}>
            {step === 'email' ? 'Enter your email to access your portal' : `Enter the 6-digit code sent to ${email}`}
          </p>
          {devOtp && <div style={{ marginTop: 8, padding: '6px 12px', background: '#FEF3C7', borderRadius: 8, fontSize: 13, color: '#92400E', fontWeight: 700 }}>Dev OTP: {devOtp}</div>}
        </div>

        {err && <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{err}</div>}

        {step === 'email' ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && requestOTP()}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                placeholder="your@email.com"
              />
            </div>
            <button onClick={requestOTP} disabled={loading || !email.trim()} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send Access Code'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>6-Digit Code</label>
              <input
                type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 22, fontWeight: 700, color: '#111827', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.2em', textAlign: 'center' }}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <button onClick={verifyOTP} disabled={loading || otp.length < 6} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying…' : 'Access Portal'}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); setErr(''); }} style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ← Back
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Invoice status badge ────────────────────────────────────── */
function InvBadge({ status }) {
  const meta = {
    paid:      { bg: '#ECFDF5', color: '#059669', label: 'Paid' },
    sent:      { bg: '#FFF7ED', color: '#D97706', label: 'Outstanding' },
    overdue:   { bg: '#FFF1F2', color: '#DC2626', label: 'Overdue' },
    draft:     { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  };
  const m = meta[status] || meta.draft;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.bg, color: m.color }}>{m.label}</span>;
}

/* ─── Chat message component ──────────────────────────────────── */
function ChatMessage({ msg }) {
  const isFirm = msg.senderType === 'firm';
  return (
    <div style={{ display: 'flex', flexDirection: isFirm ? 'row' : 'row-reverse', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isFirm ? '#EDE9FE' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: isFirm ? '#7C3AED' : '#059669' }}>
        {(msg.senderName || '?')[0].toUpperCase()}
      </div>
      <div style={{ maxWidth: '72%' }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, textAlign: isFirm ? 'left' : 'right' }}>
          {msg.senderName} · {fmtDateTime(msg.createdAt)}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: isFirm ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: isFirm ? '#F5F3FF' : '#7C3AED', color: isFirm ? '#111827' : '#fff', fontSize: 13, lineHeight: 1.55 }}>
          {msg.body}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Portal ─────────────────────────────────────────────── */
export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get('token');

  const [session, setSession] = useState(() => {
    const t = localStorage.getItem('portalToken');
    return t ? { accessToken: t } : null;
  });

  const [portalData, setPortalData] = useState(null);
  const [matter, setMatter] = useState(null);
  const [docs, setDocs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, docsRes, invoicesRes, apptRes, msgsRes, formsRes] = await Promise.allSettled([
        portalApi.getMe(),
        portalApi.getDocuments(),
        portalApi.getInvoices(),
        portalApi.getAppointments(),
        portalApi.getMessages(),
        portalApi.getForms(),
      ]);

      if (meRes.status === 'fulfilled') setPortalData(meRes.value.data.data);
      if (docsRes.status === 'fulfilled') setDocs(docsRes.value.data.data || []);
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.data.data || []);
      if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data.data || []);
      if (msgsRes.status === 'fulfilled') setMessages(msgsRes.value.data.data || []);
      if (formsRes.status === 'fulfilled') setForms(formsRes.value.data.data || []);

      // Load matter separately
      try {
        const mRes = await portalApi.getMatter();
        setMatter(mRes.data.data);
      } catch {}
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('portalToken');
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadPortal();
  }, [session, loadPortal]);

  useEffect(() => {
    if (activeTab === 'messages' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  function handleAuth(data) {
    setSession(data);
  }

  if (!session) {
    return <OTPLogin onAuth={handleAuth} magicToken={magicToken} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading your portal…</div>
      </div>
    );
  }

  const firm     = portalData?.firm;
  const email    = portalData?.email || session.email || '';
  const stages   = matter?.stages || ['Filing', 'Discovery', 'Pre-Trial', 'Trial', 'Closed'];
  const stageIdx = stages.indexOf(matter?.stage || '') ?? 0;
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const unreadMsgs  = messages.filter(m => m.senderType === 'firm' && !m.readByClient).length;

  const TABS = [
    { id: 'overview',     label: 'Overview',                         icon: I.Home },
    { id: 'documents',    label: `Documents (${docs.length})`,        icon: I.Doc },
    { id: 'invoices',     label: `Invoices (${invoices.length})`,     icon: I.Receipt },
    { id: 'messages',     label: `Messages${unreadMsgs > 0 ? ` (${unreadMsgs})` : ''}`, icon: I.MessageCircle },
    { id: 'appointments', label: `Appointments (${appointments.length})`, icon: I.Calendar },
  ];
  if (forms.length > 0) TABS.push({ id: 'forms', label: `Forms (${forms.length})`, icon: I.Edit });

  async function sendMessage() {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      const r = await portalApi.sendMessage({ body: msgText });
      setMessages(m => [...m, r.data.data]);
      setMsgText('');
    } catch (e) {
      console.error('Send message failed:', e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', fontFamily: 'inherit' }}>

      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <I.Lock size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{firm?.firmName || firm?.name || 'Client Portal'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Secure · Encrypted</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
              {email[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{email}</div>
            <button onClick={() => { localStorage.removeItem('portalToken'); setSession(null); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 11, color: '#fff', fontWeight: 600 }}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Matter header */}
        {matter && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E5E7EB', padding: '22px 24px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {matter.practiceArea || matter.type || 'Matter'} · {matter.matterNumber || ''}
                </div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#111827' }}>{matter.title || matter.name}</h2>
                {matter.assignedAttorney && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Attorney: {matter.assignedAttorney.name}</div>
                )}
              </div>
              {outstanding > 0 && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '10px 16px', textAlign: 'right', cursor: 'pointer' }} onClick={() => setActiveTab('invoices')}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>OUTSTANDING</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>${outstanding.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>View Invoices →</div>
                </div>
              )}
            </div>

            {/* Stage progress */}
            {stages.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case Progress</div>
                <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
                  {stages.map((s, i) => (
                    <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 6, background: i <= stageIdx ? '#7C3AED' : '#E5E7EB', borderRadius: i === 0 ? '3px 0 0 3px' : i === stages.length - 1 ? '0 3px 3px 0' : 0, marginBottom: 5, transition: 'background 400ms' }} />
                      <div style={{ fontSize: 9, fontWeight: i === stageIdx ? 800 : 500, color: i === stageIdx ? '#7C3AED' : i < stageIdx ? '#374151' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 1px' }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 14, padding: 4, border: '1.5px solid #E5E7EB', marginBottom: 22, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: activeTab === t.id ? '#7C3AED' : 'transparent', color: activeTab === t.id ? '#fff' : '#6B7280', transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { label: 'Attorney',    value: matter?.assignedAttorney?.name || firm?.name || '—', sub: firm?.firmName || '', icon: I.User, color: '#7C3AED', tab: null },
              { label: 'Documents',   value: docs.length, sub: 'Shared with you', icon: I.Doc, color: '#3B82F6', tab: 'documents' },
              { label: 'Invoices',    value: invoices.length, sub: outstanding > 0 ? `$${outstanding.toLocaleString()} outstanding` : 'All paid', icon: I.Receipt, color: outstanding > 0 ? '#D97706' : '#10B981', tab: 'invoices' },
              { label: 'Messages',    value: messages.length, sub: unreadMsgs > 0 ? `${unreadMsgs} unread` : 'No unread messages', icon: I.MessageCircle, color: unreadMsgs > 0 ? '#EF4444' : '#6B7280', tab: 'messages' },
              { label: 'Appointments',value: appointments.length, sub: 'Upcoming', icon: I.Calendar, color: '#6366F1', tab: 'appointments' },
            ].map(card => (
              <div key={card.label} onClick={() => card.tab && setActiveTab(card.tab)} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '18px', display: 'flex', alignItems: 'center', gap: 14, cursor: card.tab ? 'pointer' : 'default', transition: 'box-shadow 150ms' }} onMouseEnter={e => card.tab && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: card.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon size={19} style={{ color: card.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: '#111827' }}>{card.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{card.sub}</div>
                </div>
              </div>
            ))}

            {/* Next appointment */}
            {appointments[0] && (
              <div style={{ background: '#F5F3FF', borderRadius: 14, border: '1.5px solid #DDD6FE', padding: '16px 18px', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 14 }}>
                <I.Calendar size={20} style={{ color: '#7C3AED', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Appointment</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 2 }}>{appointments[0].title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{fmtDateTime(appointments[0].startDate)}</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Documents ── */}
        {activeTab === 'documents' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <I.Doc size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No documents shared with you yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {docs.map(doc => (
                  <div key={doc._id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.Doc size={18} style={{ color: '#7C3AED' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmtDate(doc.createdAt)} · {fmtSize(doc.size)}{doc.folderId?.name ? ` · ${doc.folderId.name}` : ''}</div>
                    </div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
                      <I.Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Invoices ── */}
        {activeTab === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {outstanding > 0 && (
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>Outstanding Balance</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 2 }}>${outstanding.toLocaleString()}</div>
                </div>
                <button style={{ padding: '10px 20px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Pay Now</button>
              </div>
            )}
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <I.Receipt size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No invoices yet.</p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                {invoices.map((inv, i) => (
                  <div key={inv._id} style={{ padding: '16px 20px', borderBottom: i < invoices.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{inv.invoiceNumber || `INV-${i + 1}`}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{inv.description || 'Legal Services'} · {fmtDate(inv.issueDate || inv.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>${(inv.total || inv.amount || 0).toLocaleString()}</div>
                      <InvBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Messages ── */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                    <I.MessageCircle size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No messages yet. Send your attorney a message below.</p>
                  </div>
                ) : (
                  messages.map(m => <ChatMessage key={m._id} msg={m} />)
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '14px 16px', borderTop: '1.5px solid #E5E7EB', display: 'flex', gap: 10 }}>
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', color: '#111827' }}
                  placeholder="Type a message…"
                />
                <button onClick={sendMessage} disabled={sending || !msgText.trim()} style={{ padding: '10px 18px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: sending ? 0.7 : 1 }}>
                  <I.Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Appointments ── */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <I.Calendar size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No upcoming appointments.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {appointments.map(appt => (
                  <div key={appt._id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.Calendar size={22} style={{ color: '#7C3AED' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{appt.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{fmtDateTime(appt.startDate)}</div>
                      {appt.location?.address && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{appt.location.address}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#F5F3FF', color: '#7C3AED' }}>{(appt.eventType || '').replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Forms ── */}
        {activeTab === 'forms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {forms.map((f, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I.Edit size={18} style={{ color: '#7C3AED' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' }}>{f.type} · Signature required</div>
                  </div>
                  <a href={`/esign/sign/${f.token}`} style={{ padding: '8px 16px', borderRadius: 9, background: '#7C3AED', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                    Sign Now
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
