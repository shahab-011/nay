import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';
import {
  sendLinkRequest,
  getLinkedClients,
  getClientDocuments,
  unlinkClient,
  getMyLinks,
  acceptLinkRequest as apiAccept,
  rejectLinkRequest as apiReject,
  clientUnlink as apiClientUnlink,
  shareDocument as apiShare,
  unshareDocument as apiUnshare,
} from '../api/lawyer.api';
import { getDocuments } from '../api/documents.api';
import DirectMessagePanel from '../components/collaboration/DirectMessagePanel';

/* ── Style constants ── */
const lbl   = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(240,238,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inp   = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(124,58,237,0.22)', fontSize: 13, color: '#f0eeff', background: 'rgba(255,255,255,0.07)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 14px rgba(124,58,237,0.3)' };
const btnGhost  = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', color: '#f0eeff', border: '1px solid rgba(124,58,237,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const btnDanger = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const card  = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 16, padding: '20px', backdropFilter: 'blur(12px)', marginBottom: 16 };

/* ── Helpers ── */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

const STATUS_STYLE = {
  pending:  { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  accepted: { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.25)'  },
  rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)'  },
  unlinked: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ Ic, label, value, accent }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 14, padding: '18px 20px', backdropFilter: 'blur(12px)' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ic size={17} style={{ color: accent }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </motion.div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
      {tabs.map(t => (
        <motion.button
          key={t.key}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(t.key)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 200ms', background: active === t.key ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent', color: active === t.key ? '#fff' : 'rgba(240,238,255,0.5)', boxShadow: active === t.key ? '0 4px 12px rgba(124,58,237,0.3)' : 'none' }}
        >
          {t.label}
          {t.count > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10, background: active === t.key ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.2)', color: active === t.key ? '#fff' : '#c4b5fd', minWidth: 18, textAlign: 'center' }}>
              {t.count}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function EmptyState({ Ic, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Ic size={24} style={{ color: 'rgba(167,139,250,0.5)' }} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,238,255,0.7)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.35)', maxWidth: 280, margin: '0 auto 20px' }}>{sub}</div>
      {action && (
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={action.onClick} style={btnPurple}>
          <I.Plus size={13} /> {action.label}
        </motion.button>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, height: 88, animation: 'nyaya-pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
      <I.Alert size={15} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{msg}</span>
      {onRetry && <button onClick={onRetry} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 700, fontSize: 12, textDecoration: 'underline' }}>Retry</button>}
    </div>
  );
}

/* ── Main export ── */
export default function ClientLinks() {
  const { user } = useAuth();
  const isLawyer = ['lawyer', 'admin', 'owner', 'attorney'].includes(user?.role);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', padding: '32px 28px', color: '#f0eeff' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: 100, left: '35%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 120, right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }}>
        {isLawyer ? <LawyerView /> : <ClientView />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LAWYER VIEW
══════════════════════════════════════════════════════════ */
function LawyerView() {
  const navigate   = useNavigate();
  const [tab, setTab]     = useState('clients');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [reqEmail, setReqEmail]   = useState('');
  const [reqMsg,   setReqMsg]     = useState('');
  const [sending,  setSending]    = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [docsModal, setDocsModal] = useState(null);
  const [msgPanel,  setMsgPanel]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await getLinkedClients();
      setLinks(r.data.data.clients || []);
    } catch { setError('Failed to load clients.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accepted    = links.filter(l => l.status === 'accepted');
  const pending     = links.filter(l => l.status === 'pending');
  const nonAccepted = links.filter(l => l.status !== 'accepted');

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Unlink this client? You will lose access to their shared documents.')) return;
    const prev = links;
    setLinks(l => l.map(x => x._id === linkId ? { ...x, status: 'unlinked' } : x));
    try { await unlinkClient(linkId); }
    catch { setLinks(prev); }
  };

  const openDocs = async (link) => {
    setDocsModal({ link, docs: [], loading: true, error: '' });
    try {
      const r = await getClientDocuments(link.clientId._id);
      setDocsModal(m => ({ ...m, docs: r.data.data.documents || [], loading: false }));
    } catch {
      setDocsModal(m => ({ ...m, loading: false, error: 'Failed to load documents.' }));
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setSendResult(null);
    if (!reqEmail.trim()) return setSendResult({ ok: false, msg: 'Client email is required' });
    setSending(true);
    try {
      await sendLinkRequest(reqEmail.trim(), reqMsg.trim());
      setSendResult({ ok: true, msg: `Request sent to ${reqEmail.trim()}` });
      setReqEmail(''); setReqMsg('');
      load();
    } catch (err) {
      setSendResult({ ok: false, msg: err.response?.data?.message || 'Failed to send request' });
    } finally { setSending(false); }
  };

  return (
    <>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', margin: 0 }}>Client Links</h1>
          <p style={{ fontSize: 13, color: 'rgba(240,238,255,0.45)', marginTop: 4 }}>Send link requests, manage connected clients, and view shared documents.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTab('send')} style={btnPurple}>
          <I.UserPlus size={14} /> Send Request
        </motion.button>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard Ic={I.Users}  label="Linked Clients"   value={accepted.length}    accent="#7c3aed" />
          <StatCard Ic={I.Clock}  label="Pending Requests" value={pending.length}     accent="#fbbf24" />
          <StatCard Ic={I.Hand}   label="Total Requests"   value={links.length}       accent="#60a5fa" />
        </div>
      )}

      {error && <ErrorBanner msg={error} onRetry={load} />}

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'clients',  label: 'Linked Clients', count: accepted.length    },
          { key: 'requests', label: 'All Requests',   count: nonAccepted.length },
          { key: 'send',     label: 'Send Request',   count: 0                  },
        ]}
      />

      {loading && <Skeleton />}

      <AnimatePresence mode="wait">
        {/* Linked Clients */}
        {!loading && tab === 'clients' && (
          <motion.div key="clients" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {accepted.length === 0
              ? <EmptyState Ic={I.Users} title="No linked clients yet" sub="Send a link request and wait for your client to accept." action={{ label: 'Send Request', onClick: () => setTab('send') }} />
              : accepted.map(link => (
                  <LawyerClientCard
                    key={link._id}
                    link={link}
                    onUnlink={() => handleUnlink(link._id)}
                    onViewDocs={() => openDocs(link)}
                    onViewClient={() => navigate(`/lawyer/client/${link._id}`)}
                    onMessage={() => setMsgPanel({ linkId: link._id, otherName: link.clientId?.name || link.clientEmail })}
                  />
                ))
            }
          </motion.div>
        )}

        {/* All Requests */}
        {!loading && tab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {nonAccepted.length === 0
              ? <EmptyState Ic={I.Clock} title="No requests yet" sub="Requests you send to clients will appear here." action={{ label: 'Send Request', onClick: () => setTab('send') }} />
              : nonAccepted.map(link => (
                  <RequestRow key={link._id} link={link} primaryLabel={link.clientEmail} />
                ))
            }
          </motion.div>
        )}

        {/* Send Request */}
        {tab === 'send' && (
          <motion.div key="send" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ maxWidth: 500 }}>
            <SendRequestForm
              email={reqEmail}   setEmail={setReqEmail}
              message={reqMsg}   setMessage={setReqMsg}
              sending={sending}  result={sendResult}
              onSubmit={handleSendRequest}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {docsModal && (
        <LawyerDocsModal
          link={docsModal.link}
          docs={docsModal.docs}
          loading={docsModal.loading}
          error={docsModal.error}
          onClose={() => setDocsModal(null)}
        />
      )}

      {msgPanel && (
        <DirectMessagePanel
          linkId={msgPanel.linkId}
          otherName={msgPanel.otherName}
          onClose={() => setMsgPanel(null)}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CLIENT VIEW
══════════════════════════════════════════════════════════ */
function ClientView() {
  const [tab,         setTab]         = useState('lawyers');
  const [allLinks,    setAllLinks]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [actionError, setActionError] = useState('');
  const [shareModal,  setShareModal]  = useState(null);
  const [msgPanel,    setMsgPanel]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await getMyLinks();
      setAllLinks(r.data.data.links || []);
    } catch { setError('Failed to load your lawyer links.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accepted = allLinks.filter(l => l.status === 'accepted');
  const pending  = allLinks.filter(l => l.status === 'pending');

  const handleAccept = async (linkId) => {
    setActionError('');
    const prev = allLinks;
    setAllLinks(l => l.map(x => x._id === linkId ? { ...x, status: 'accepted' } : x));
    try { await apiAccept(linkId); setTab('lawyers'); load(); }
    catch (err) { setAllLinks(prev); setActionError(err.response?.data?.message || 'Failed to accept.'); }
  };

  const handleReject = async (linkId) => {
    setActionError('');
    const prev = allLinks;
    setAllLinks(l => l.map(x => x._id === linkId ? { ...x, status: 'rejected' } : x));
    try { await apiReject(linkId); }
    catch (err) { setAllLinks(prev); setActionError(err.response?.data?.message || 'Failed to reject.'); }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Unlink from this lawyer? They will no longer see your shared documents.')) return;
    const prev = allLinks;
    setAllLinks(l => l.filter(x => x._id !== linkId));
    try { await apiClientUnlink(linkId); }
    catch { setAllLinks(prev); }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', margin: 0 }}>My Lawyers</h1>
        <p style={{ fontSize: 13, color: 'rgba(240,238,255,0.45)', marginTop: 4 }}>Manage your connected lawyers and control which documents they can view.</p>
      </div>

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard Ic={I.Scale}  label="Linked Lawyers"   value={accepted.length} accent="#7c3aed" />
          <StatCard Ic={I.Clock}  label="Pending Requests" value={pending.length}  accent="#fbbf24" />
          <StatCard Ic={I.Hand}   label="Total"            value={allLinks.length} accent="#60a5fa" />
        </div>
      )}

      {error && <ErrorBanner msg={error} onRetry={load} />}
      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          <I.Alert size={15} />
          <span style={{ flex: 1 }}>{actionError}</span>
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}><I.X size={14} /></button>
        </div>
      )}

      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'lawyers',  label: 'My Lawyers',       count: accepted.length },
          { key: 'requests', label: 'Pending Requests',  count: pending.length  },
        ]}
      />

      {loading && <Skeleton />}

      <AnimatePresence mode="wait">
        {!loading && tab === 'lawyers' && (
          <motion.div key="lawyers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {accepted.length === 0
              ? <EmptyState Ic={I.Scale} title="No lawyers linked yet" sub="When a lawyer sends you a link request and you accept, they will appear here." />
              : accepted.map(link => (
                  <ClientLawyerCard
                    key={link._id}
                    link={link}
                    onManageDocs={() => setShareModal(link)}
                    onUnlink={() => handleUnlink(link._id)}
                    onMessage={() => setMsgPanel({ linkId: link._id, otherName: link.lawyerId?.name || link.lawyerId?.email || 'Lawyer' })}
                  />
                ))
            }
          </motion.div>
        )}

        {!loading && tab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {pending.length === 0
              ? <EmptyState Ic={I.Clock} title="No pending requests" sub="Lawyer link requests sent to your email will appear here." />
              : pending.map(link => (
                  <RequestRow
                    key={link._id}
                    link={link}
                    primaryLabel={link.lawyerId?.name || link.lawyerId?.email || 'Unknown Lawyer'}
                    secondaryLabel={link.lawyerId?.email}
                    onAccept={() => handleAccept(link._id)}
                    onReject={() => handleReject(link._id)}
                    showActions
                  />
                ))
            }
          </motion.div>
        )}
      </AnimatePresence>

      {shareModal && (
        <DocShareModal
          link={shareModal}
          onClose={() => { setShareModal(null); load(); }}
        />
      )}

      {msgPanel && (
        <DirectMessagePanel
          linkId={msgPanel.linkId}
          otherName={msgPanel.otherName}
          onClose={() => setMsgPanel(null)}
        />
      )}
    </>
  );
}

/* ── Lawyer Client Card ── */
function LawyerClientCard({ link, onUnlink, onViewDocs, onViewClient, onMessage }) {
  const client  = link.clientId || {};
  const initial = (client.name || link.clientEmail || '?').charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      onClick={onViewClient}
      style={{ ...card, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}
    >
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, color: '#f0eeff', fontSize: 14 }}>{client.name || link.clientEmail}</span>
          <StatusBadge status={link.status} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.4)', marginBottom: 8 }}>{client.email || link.clientEmail}</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[
            { label: `${link.stats?.totalDocuments ?? 0} total docs` },
            { label: `${link.stats?.sharedDocuments ?? 0} shared` },
            { label: `${link.stats?.totalCases ?? 0} cases` },
            { label: `Linked ${formatRelative(link.acceptedAt)}` },
          ].map(s => (
            <span key={s.label} style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)' }}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onViewClient} style={btnPurple}>
          <I.Eye size={13} /> View Docs
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onMessage} style={btnGhost}>
          <I.MessageCircle size={13} /> Message
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onUnlink} style={btnDanger}>
          <I.X size={13} /> Unlink
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Client Lawyer Card ── */
function ClientLawyerCard({ link, onManageDocs, onUnlink, onMessage }) {
  const lawyer  = link.lawyerId || {};
  const initial = (lawyer.name || lawyer.email || '?').charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fbbf24', flexShrink: 0 }}>
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, color: '#f0eeff', fontSize: 14 }}>{lawyer.name || lawyer.email || 'Unknown Lawyer'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>
            <I.Scale size={10} /> Lawyer
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.4)', marginBottom: 8 }}>{lawyer.email}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)' }}>{link.sharedDocuments?.length ?? 0} docs shared</span>
          <span style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)' }}>Linked {formatRelative(link.acceptedAt)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onManageDocs} style={btnPurple}>
          <I.Filter size={13} /> Manage Docs
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onMessage} style={btnGhost}>
          <I.MessageCircle size={13} /> Message
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onUnlink} style={btnDanger}>
          <I.X size={13} /> Unlink
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Request Row ── */
function RequestRow({ link, primaryLabel, secondaryLabel, onAccept, onReject, showActions }) {
  const initial = (primaryLabel || '?').charAt(0).toUpperCase();
  const [busy, setBusy] = useState(false);
  const act = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  return (
    <motion.div
      whileHover={{ scale: 1.003 }}
      style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 14 }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(240,238,255,0.7)', flexShrink: 0 }}>
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#f0eeff', fontSize: 13 }}>{primaryLabel}</span>
          {secondaryLabel && <span style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)' }}>{secondaryLabel}</span>}
          <StatusBadge status={link.status} />
        </div>
        {link.message && (
          <p style={{ fontSize: 12, color: 'rgba(240,238,255,0.45)', marginTop: 5, fontStyle: 'italic' }}>"{link.message}"</p>
        )}
        <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.3)', marginTop: 5 }}>{formatDate(link.createdAt)}</div>
      </div>

      {showActions && link.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => act(onAccept)} disabled={busy} style={{ ...btnPurple, opacity: busy ? 0.6 : 1 }}>
            <I.Check size={13} /> Accept
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => act(onReject)} disabled={busy} style={{ ...btnDanger, opacity: busy ? 0.6 : 1 }}>
            <I.X size={13} /> Reject
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

/* ── Send Request Form ── */
function SendRequestForm({ email, setEmail, message, setMessage, sending, result, onSubmit }) {
  return (
    <div style={card}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.UserPlus size={16} style={{ color: '#a78bfa' }} /> Send Link Request
        </div>
        <p style={{ fontSize: 12, color: 'rgba(240,238,255,0.4)' }}>Enter your client's registered email. They'll receive a notification to accept or reject.</p>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Client Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com" style={inp} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Message (optional)</label>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself or explain why you're connecting…"
            style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, marginBottom: 14, background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: result.ok ? '#4ade80' : '#f87171', fontSize: 13 }}>
            {result.ok ? <I.Check size={14} /> : <I.Alert size={14} />}
            {result.msg}
          </div>
        )}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={sending}
          style={{ ...btnPurple, width: '100%', justifyContent: 'center', padding: '11px', opacity: sending ? 0.7 : 1 }}
        >
          {sending
            ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} /> Sending…</>
            : <><I.Send size={14} /> Send Link Request</>
          }
        </motion.button>
      </form>
    </div>
  );
}

/* ── Lawyer: view client's shared docs ── */
function LawyerDocsModal({ link, docs, loading, error, onClose }) {
  const client = link.clientId || {};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(6,4,18,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#120d2e', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff' }}>Shared Documents</div>
            <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>From {client.name || link.clientEmail}</div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,238,255,0.6)' }}>
            <I.X size={14} />
          </motion.button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
            </div>
          )}
          {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>{error}</p>}
          {!loading && !error && docs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(240,238,255,0.35)', fontSize: 13 }}>No documents shared yet.</div>
          )}
          {!loading && docs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map(doc => (
                <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I.Doc size={16} style={{ color: '#a78bfa' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>{doc.docType || 'Unknown type'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Client: manage document sharing ── */
function DocShareModal({ link, onClose }) {
  const lawyer   = link.lawyerId || {};
  const [allDocs, setAllDocs] = useState([]);
  const [shared,  setShared]  = useState(new Set(link.sharedDocuments?.map(String) || []));
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(new Set());
  const [fetchErr, setFetchErr] = useState('');

  useEffect(() => {
    getDocuments()
      .then(r => setAllDocs(r.data.data.documents || []))
      .catch(() => setFetchErr('Failed to load your documents.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (docId) => {
    const id = String(docId);
    if (saving.has(id)) return;
    const wasShared = shared.has(id);
    setSaving(s => new Set(s).add(id));
    setShared(s => { const n = new Set(s); wasShared ? n.delete(id) : n.add(id); return n; });
    try {
      if (wasShared) await apiUnshare(link._id, docId);
      else           await apiShare(link._id, docId);
    } catch {
      setShared(s => { const n = new Set(s); wasShared ? n.add(id) : n.delete(id); return n; });
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(6,4,18,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#120d2e', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff' }}>Manage Shared Documents</div>
            <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>
              Sharing with {lawyer.name || lawyer.email} · <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{shared.size} doc{shared.size !== 1 ? 's' : ''} shared</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,238,255,0.6)' }}>
            <I.X size={14} />
          </motion.button>
        </div>

        <div style={{ margin: '14px 22px 0', padding: '10px 14px', borderRadius: 9, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
          <I.Info size={14} style={{ color: '#a78bfa', marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'rgba(240,238,255,0.55)', lineHeight: 1.55, margin: 0 }}>Toggle each document to share or unshare. Changes are saved automatically.</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
            </div>
          )}
          {fetchErr && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{fetchErr}</p>}
          {!loading && !fetchErr && allDocs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(240,238,255,0.3)', fontSize: 13 }}>No documents uploaded yet.</div>
          )}
          {!loading && allDocs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allDocs.map(doc => {
                const id       = String(doc._id);
                const isShared = shared.has(id);
                const isBusy   = saving.has(id);
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggle(doc._id)}
                    disabled={isBusy}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: isShared ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isShared ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 150ms', opacity: isBusy ? 0.6 : 1 }}
                  >
                    {/* Checkbox */}
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isShared ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: isShared ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}>
                      {isShared && !isBusy && <I.Check size={10} style={{ color: '#fff' }} />}
                      {isBusy && <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />}
                    </div>

                    <div style={{ width: 34, height: 34, borderRadius: 9, background: isShared ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.Doc size={16} style={{ color: isShared ? '#a78bfa' : 'rgba(240,238,255,0.3)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isShared ? '#f0eeff' : 'rgba(240,238,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</div>
                      <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginTop: 1 }}>{doc.docType || 'Unknown type'}</div>
                    </div>

                    {isShared && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>SHARED</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(124,58,237,0.12)', flexShrink: 0 }}>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onClose} style={{ ...btnGhost, width: '100%', justifyContent: 'center', padding: 11 }}>
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
