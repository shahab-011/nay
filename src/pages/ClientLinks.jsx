import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
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

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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

const STATUS_CFG = {
  pending:  { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  accepted: { text: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/20'   },
  rejected: { text: 'text-error',     bg: 'bg-error/10',     border: 'border-error/20'     },
  unlinked: { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 border border-white/5">
      <span className={`material-symbols-outlined text-2xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div className="mt-3 text-3xl font-headline font-extrabold text-on-surface">{value}</div>
      <div className="text-xs text-on-surface-variant mt-0.5">{label}</div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-white/5">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold font-headline rounded-t-lg transition-all ${
            active === t.key
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          {t.label}
          {t.count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
              active === t.key ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
            }`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="text-center py-16 space-y-4 bg-surface-container-low rounded-2xl border border-white/5">
      <span className="material-symbols-outlined text-5xl block text-primary opacity-20">{icon}</span>
      <div>
        <p className="text-white/60 font-headline font-bold text-lg">{title}</p>
        <p className="text-sm text-on-surface-variant mt-1 max-w-xs mx-auto">{sub}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">{action.icon || 'add'}</span>
          {action.label}
        </button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(n => (
        <div key={n} className="bg-surface-container-low rounded-xl p-6 animate-pulse h-24" />
      ))}
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
      <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
      {msg}
      {onRetry && <button onClick={onRetry} className="ml-auto underline font-bold">Retry</button>}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function ClientLinks() {
  const { user } = useAuth();
  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  return (
    <>
      <Header title="Client Links" />
      <div className="p-4 md:p-8 pb-24 space-y-8 max-w-5xl">
        {isLawyer ? <LawyerView /> : <ClientView />}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LAWYER VIEW
══════════════════════════════════════════════════════════════════════ */

function LawyerView() {
  const navigate            = useNavigate();
  const [tab, setTab]       = useState('clients');
  const [links, setLinks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  // Send request form state
  const [reqEmail, setReqEmail] = useState('');
  const [reqMsg,   setReqMsg]   = useState('');
  const [sending,  setSending]  = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok, msg }

  // Shared-docs viewer modal
  const [docsModal, setDocsModal] = useState(null); // { link, docs[], loading, error }

  // Direct messaging panel
  const [msgPanel, setMsgPanel] = useState(null); // { linkId, otherName }

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await getLinkedClients();
      setLinks(r.data.data.clients || []);
    } catch { setError('Failed to load clients. Please retry.'); }
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
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Client Links</h1>
          <p className="text-on-surface-variant text-sm mt-1">Send link requests, manage connected clients, and view shared documents</p>
        </div>
        <button
          onClick={() => setTab('send')}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,201,167,0.2)]"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Send Request
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon="group"     label="Linked Clients"   value={accepted.length}                                   color="text-primary"   />
          <StatCard icon="schedule"  label="Pending Requests" value={pending.length}                                    color="text-amber-400" />
          <StatCard icon="handshake" label="Total Requests"   value={links.length}                                      color="text-secondary" />
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

      {loading && <LoadingSkeleton />}

      {/* ── Linked Clients tab ── */}
      {!loading && tab === 'clients' && (
        <div className="space-y-4">
          {accepted.length === 0
            ? <EmptyState icon="group" title="No linked clients yet" sub="Send a link request and wait for your client to accept." action={{ label: 'Send Request', icon: 'person_add', onClick: () => setTab('send') }} />
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
        </div>
      )}

      {/* ── All requests tab ── */}
      {!loading && tab === 'requests' && (
        <div className="space-y-3">
          {nonAccepted.length === 0
            ? <EmptyState icon="schedule" title="No requests yet" sub="Requests you send to clients will appear here." action={{ label: 'Send Request', icon: 'person_add', onClick: () => setTab('send') }} />
            : nonAccepted.map(link => (
                <RequestRow key={link._id} link={link} primaryLabel={link.clientEmail} />
              ))
          }
        </div>
      )}

      {/* ── Send request tab ── */}
      {tab === 'send' && (
        <div className="max-w-lg">
          <SendRequestForm
            email={reqEmail}     setEmail={setReqEmail}
            message={reqMsg}     setMessage={setReqMsg}
            sending={sending}    result={sendResult}
            onSubmit={handleSendRequest}
          />
        </div>
      )}

      {/* Docs viewer modal */}
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

/* ══════════════════════════════════════════════════════════════════════
   CLIENT VIEW
══════════════════════════════════════════════════════════════════════ */

function ClientView() {
  const [tab,         setTab]         = useState('lawyers');
  const [allLinks,    setAllLinks]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [actionError, setActionError] = useState('');
  const [shareModal,  setShareModal]  = useState(null);
  const [msgPanel,    setMsgPanel]    = useState(null); // { linkId, otherName }

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
    try {
      await apiAccept(linkId);
      setTab('lawyers');
      load();
    } catch (err) {
      setAllLinks(prev);
      setActionError(err.response?.data?.message || 'Failed to accept request. Please try again.');
    }
  };

  const handleReject = async (linkId) => {
    setActionError('');
    const prev = allLinks;
    setAllLinks(l => l.map(x => x._id === linkId ? { ...x, status: 'rejected' } : x));
    try { await apiReject(linkId); }
    catch (err) {
      setAllLinks(prev);
      setActionError(err.response?.data?.message || 'Failed to reject request. Please try again.');
    }
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
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">My Lawyers</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your connected lawyers and control which documents they can view</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon="gavel"     label="Linked Lawyers"    value={accepted.length} color="text-primary"   />
          <StatCard icon="schedule"  label="Pending Requests"  value={pending.length}  color="text-amber-400" />
          <StatCard icon="handshake" label="Total"             value={allLinks.length} color="text-secondary" />
        </div>
      )}

      {error && <ErrorBanner msg={error} onRetry={load} />}
      {actionError && (
        <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm">
          <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
          {actionError}
          <button onClick={() => setActionError('')} className="ml-auto text-error/60 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'lawyers',  label: 'My Lawyers',      count: accepted.length },
          { key: 'requests', label: 'Pending Requests', count: pending.length  },
        ]}
      />

      {loading && <LoadingSkeleton />}

      {/* ── My Lawyers tab ── */}
      {!loading && tab === 'lawyers' && (
        <div className="space-y-4">
          {accepted.length === 0
            ? <EmptyState icon="gavel" title="No lawyers linked yet" sub="When a lawyer sends you a link request and you accept, they will appear here." />
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
        </div>
      )}

      {/* ── Pending Requests tab ── */}
      {!loading && tab === 'requests' && (
        <div className="space-y-3">
          {pending.length === 0
            ? <EmptyState icon="schedule" title="No pending requests" sub="Lawyer link requests sent to your email will appear here." />
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
        </div>
      )}

      {/* Document sharing modal */}
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

/* ── Shared sub-components ─────────────────────────────────────────── */

function LawyerClientCard({ link, onUnlink, onViewDocs, onViewClient, onMessage }) {
  const client  = link.clientId || {};
  const initial = (client.name || link.clientEmail || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={onViewClient}
      className="bg-surface-container-low rounded-2xl border border-white/5 p-6 hover:border-primary/30 hover:bg-surface-container cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
          <span className="text-lg font-bold text-primary font-headline">{initial}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-0.5">
            <span className="font-bold text-on-surface font-headline text-base group-hover:text-primary transition-colors">
              {client.name || link.clientEmail}
            </span>
            <StatusBadge status={link.status} />
            {client.plan === 'pro' && (
              <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">PRO</span>
            )}
          </div>
          <div className="text-xs text-on-surface-variant">{client.email || link.clientEmail}</div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3 flex-wrap">
            {[
              { icon: 'description', label: `${link.stats?.totalDocuments ?? 0} total docs`  },
              { icon: 'share',       label: `${link.stats?.sharedDocuments ?? 0} shared`      },
              { icon: 'folder_open', label: `${link.stats?.totalCases ?? 0} cases`            },
              { icon: 'schedule',    label: `Linked ${formatRelative(link.acceptedAt)}`       },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions — stop propagation so buttons don't also trigger card navigation */}
        <div className="flex flex-col gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onViewClient}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">analytics</span>
            View Documents
          </button>
          <button
            onClick={onMessage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold hover:bg-secondary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            Message
          </button>
          <button
            onClick={onUnlink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">link_off</span>
            Unlink
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientLawyerCard({ link, onManageDocs, onUnlink, onMessage }) {
  const lawyer  = link.lawyerId || {};
  const initial = (lawyer.name || lawyer.email || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-amber-400 font-headline">{initial}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-0.5">
            <span className="font-bold text-on-surface font-headline text-base">{lawyer.name || lawyer.email || 'Unknown Lawyer'}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              Lawyer
            </span>
          </div>
          <div className="text-xs text-on-surface-variant">{lawyer.email}</div>

          <div className="flex items-center gap-5 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-primary">share</span>
              {link.sharedDocuments?.length ?? 0} docs shared
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Linked {formatRelative(link.acceptedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={onManageDocs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Manage Docs
          </button>
          <button
            onClick={onMessage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold hover:bg-secondary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            Message
          </button>
          <button
            onClick={onUnlink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">link_off</span>
            Unlink
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestRow({ link, primaryLabel, secondaryLabel, onAccept, onReject, showActions }) {
  const initial = (primaryLabel || '?').charAt(0).toUpperCase();
  const [busy,  setBusy]  = useState(false);

  const act = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-5 flex items-start gap-4 hover:border-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-on-surface-variant font-headline">{initial}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-on-surface text-sm">{primaryLabel}</span>
          {secondaryLabel && <span className="text-xs text-on-surface-variant">{secondaryLabel}</span>}
          <StatusBadge status={link.status} />
        </div>
        {link.message && (
          <p className="text-xs text-on-surface-variant mt-1.5 italic line-clamp-2">"{link.message}"</p>
        )}
        <div className="text-[10px] text-on-surface-variant mt-1">{formatDate(link.createdAt)}</div>
      </div>

      {showActions && link.status === 'pending' && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => act(onAccept)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            Accept
          </button>
          <button
            onClick={() => act(onReject)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function SendRequestForm({ email, setEmail, message, setMessage, sending, result, onSubmit }) {
  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 p-7">
      <div className="mb-6">
        <h3 className="text-base font-bold font-headline text-on-surface">Send Link Request</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Enter your client's registered email. They'll receive a notification to accept or reject.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Client Email *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="client@example.com"
            className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-slate-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Message (optional)</label>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself or explain why you're connecting…"
            className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-none placeholder-slate-600"
          />
        </div>

        {result && (
          <div className={`flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl border ${
            result.ok
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-error/10 border-error/20 text-error'
          }`}>
            <span className="material-symbols-outlined text-base flex-shrink-0">
              {result.ok ? 'check_circle' : 'error'}
            </span>
            {result.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,167,0.15)]"
        >
          {sending
            ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Sending…</>
            : <><span className="material-symbols-outlined text-base">send</span>Send Link Request</>
          }
        </button>
      </form>
    </div>
  );
}

/* ── Lawyer: view client's shared docs (read-only) ─────────────────── */

function LawyerDocsModal({ link, docs, loading, error, onClose }) {
  const client = link.clientId || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface">Shared Documents</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">From {client.name || link.clientEmail}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
          )}
          {error && <p className="text-error text-sm text-center py-8">{error}</p>}
          {!loading && !error && docs.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">description</span>
              <p className="text-sm text-on-surface-variant">No documents shared yet.</p>
              <p className="text-xs text-on-surface-variant">The client hasn't shared any documents with you.</p>
            </div>
          )}
          {!loading && docs.length > 0 && (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc._id} className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">description</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">{doc.originalName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-on-surface-variant">{doc.docType || 'Unknown type'}</span>
                      {doc.healthScore !== undefined && (
                        <span className={`text-xs font-bold ${doc.healthScore >= 70 ? 'text-primary' : doc.healthScore >= 40 ? 'text-amber-400' : 'text-error'}`}>
                          {doc.healthScore}% health
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Client: manage document sharing with a lawyer ─────────────────── */

function DocShareModal({ link, onClose }) {
  const lawyer  = link.lawyerId || {};
  const [allDocs, setAllDocs] = useState([]);
  const [shared,  setShared]  = useState(new Set(link.sharedDocuments?.map(String) || []));
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(new Set()); // IDs currently being toggled
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

    // Optimistic update
    setSaving(s => new Set(s).add(id));
    setShared(s => { const n = new Set(s); wasShared ? n.delete(id) : n.add(id); return n; });

    try {
      if (wasShared) await apiUnshare(link._id, docId);
      else           await apiShare(link._id, docId);
    } catch {
      // Revert on failure
      setShared(s => { const n = new Set(s); wasShared ? n.add(id) : n.delete(id); return n; });
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface">Manage Shared Documents</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Sharing with {lawyer.name || lawyer.email} · <span className="text-primary font-semibold">{shared.size} doc{shared.size !== 1 ? 's' : ''} shared</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/15 rounded-xl flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">info</span>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Toggle each document to share or unshare with your lawyer. Changes are saved automatically — no submit needed.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
          )}
          {fetchErr && <p className="text-error text-sm text-center py-8">{fetchErr}</p>}
          {!loading && !fetchErr && allDocs.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">description</span>
              <p className="text-sm text-on-surface-variant">No documents uploaded yet.</p>
            </div>
          )}
          {!loading && allDocs.length > 0 && (
            <div className="space-y-2">
              {allDocs.map(doc => {
                const id       = String(doc._id);
                const isShared = shared.has(id);
                const isBusy   = saving.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(doc._id)}
                    disabled={isBusy}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${
                      isShared
                        ? 'bg-primary/8 border-primary/25 hover:bg-primary/12'
                        : 'bg-surface-container border-white/5 hover:border-white/15'
                    } disabled:opacity-60`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      isShared ? 'bg-primary border-primary' : 'bg-transparent border-outline-variant group-hover:border-primary/50'
                    }`}>
                      {isBusy
                        ? <span className="material-symbols-outlined text-[11px] text-on-surface animate-spin">progress_activity</span>
                        : isShared && <span className="material-symbols-outlined text-[11px] text-on-primary">check</span>
                      }
                    </div>

                    {/* Doc icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isShared ? 'bg-primary/20' : 'bg-surface-container-high'}`}>
                      <span className={`material-symbols-outlined text-lg ${isShared ? 'text-primary' : 'text-on-surface-variant'}`}>description</span>
                    </div>

                    {/* Doc info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isShared ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {doc.originalName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-on-surface-variant">{doc.docType || 'Unknown type'}</span>
                        {doc.healthScore !== undefined && (
                          <span className={`text-xs font-bold ${doc.healthScore >= 70 ? 'text-primary' : doc.healthScore >= 40 ? 'text-amber-400' : 'text-error'}`}>
                            {doc.healthScore}% health
                          </span>
                        )}
                      </div>
                    </div>

                    {isShared && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex-shrink-0">
                        SHARED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-white/5 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
