import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  getLawyerDashboard, getLinkedClients, getClientDocuments,
  unlinkClient, sendLinkRequest,
  getCases, createCase, updateCase, deleteCase,
} from '../api/lawyer.api';

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS & STYLE MAPS
══════════════════════════════════════════════════════════════════════ */

const STATUS_STYLE = {
  active:    { bg: 'bg-primary/10',    text: 'text-primary',   dot: 'bg-primary',   label: 'Active'    },
  pending:   { bg: 'bg-amber-400/10',  text: 'text-amber-400', dot: 'bg-amber-400', label: 'Pending'   },
  in_review: { bg: 'bg-blue-400/10',   text: 'text-blue-400',  dot: 'bg-blue-400',  label: 'In Review' },
  'on-hold': { bg: 'bg-slate-500/10',  text: 'text-slate-400', dot: 'bg-slate-400', label: 'On Hold'   },
  completed: { bg: 'bg-emerald-400/10',text: 'text-emerald-400',dot:'bg-emerald-400',label: 'Completed' },
  closed:    { bg: 'bg-slate-600/10',  text: 'text-slate-400', dot: 'bg-slate-400', label: 'Closed'    },
  archived:  { bg: 'bg-slate-700/10',  text: 'text-slate-500', dot: 'bg-slate-500', label: 'Archived'  },
};

const PRIORITY_CFG = {
  high:   { color: 'text-red-400',    bg: 'bg-red-400/10',   dot: 'bg-red-400'    },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-400/10', dot: 'bg-amber-400'  },
  low:    { color: 'text-slate-400',  bg: 'bg-slate-400/10', dot: 'bg-slate-400'  },
};

const CASE_TYPES = [
  'Contract Review', 'Property Law', 'Family Law', 'Criminal Defence',
  'Employment Law', 'Corporate Law', 'Intellectual Property',
  'Dispute Resolution', 'Tenant Rights', 'Consumer Protection', 'Other',
];

const EMPTY_FORM = {
  linkedLinkId: '',
  title: '', clientName: '', clientEmail: '', caseType: '',
  description: '', notes: '', status: 'active', priority: 'medium',
};

/* ══════════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
══════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  const p = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} title={`${priority} priority`} />;
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="text-center py-14 space-y-4 bg-surface-container-low rounded-2xl border border-white/5">
      <span className="material-symbols-outlined text-5xl block text-primary opacity-20">{icon}</span>
      <div>
        <p className="font-headline font-bold text-white/60 text-base">{title}</p>
        <p className="text-sm text-on-surface-variant mt-1 max-w-xs mx-auto">{sub}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-lg">{action.icon || 'add'}</span>
          {action.label}
        </button>
      )}
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface-container-low rounded-xl p-5 animate-pulse h-20" />
      ))}
    </div>
  );
}

function SectionHeader({ title, count, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold font-headline uppercase tracking-widest text-on-surface-variant">{title}</h2>
        {count !== undefined && (
          <span className="text-[11px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
          {action.icon && <span className="material-symbols-outlined text-sm">{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
}

function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════ */

export default function LawyerDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [tab,     setTab]    = useState('overview');
  const [stats,   setStats]  = useState(null);
  const [recent,  setRecent] = useState([]);
  const [links,   setLinks]  = useState([]);
  const [cases,   setCases]  = useState([]);
  const [loading, setLoading]= useState(true);
  const [error,   setError]  = useState('');

  // Modals
  const [caseModal,    setCaseModal]    = useState(null);   // null | { mode:'create'|'edit', data? }
  const [docsModal,    setDocsModal]    = useState(null);   // { link, docs[], loading, error }
  const [requestModal, setRequestModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashRes, linksRes, casesRes] = await Promise.all([
        getLawyerDashboard(),
        getLinkedClients(),
        getCases(),
      ]);
      setStats(dashRes.data.data.stats);
      setRecent(dashRes.data.data.recentCases || []);
      setLinks(linksRes.data.data.clients || []);
      setCases(casesRes.data.data.cases || []);
    } catch {
      setError('Failed to load dashboard data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Client actions ── */
  const handleUnlink = async (linkId) => {
    if (!window.confirm('Unlink this client? They will lose access to shared data.')) return;
    const prev = links;
    setLinks(l => l.map(x => x._id === linkId ? { ...x, status: 'unlinked' } : x));
    try { await unlinkClient(linkId); setLinks(l => l.filter(x => x._id !== linkId)); }
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

  /* ── Case actions ── */
  const handleSaveCase = async (form, isEdit, caseId) => {
    const selectedLink = form.linkedLinkId ? links.find(l => l._id === form.linkedLinkId) : null;
    const payload = {
      title:       form.title,
      clientName:  form.clientName,
      clientEmail: form.clientEmail,
      clientId:    selectedLink?.clientId?._id || null,
      clientLinkId:selectedLink?._id           || null,
      caseType:    form.caseType,
      description: form.description,
      notes:       form.notes,
      status:      form.status,
      priority:    form.priority,
    };
    if (isEdit) {
      const res = await updateCase(caseId, payload);
      setCases(prev => prev.map(c => c._id === caseId ? res.data.data.case : c));
    } else {
      const res = await createCase(payload);
      setCases(prev => [res.data.data.case, ...prev]);
    }
    setCaseModal(null);
    const dashRes = await getLawyerDashboard();
    setStats(dashRes.data.data.stats);
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    const prev = cases;
    setCases(prev => prev.filter(c => c._id !== id));
    try { await deleteCase(id); }
    catch { setCases(prev); }
  };

  const accepted = links.filter(l => l.status === 'accepted');
  const pending  = links.filter(l => l.status === 'pending');

  /* ── render ── */
  return (
    <>
      <Header title="Lawyer Dashboard">
        <button
          onClick={() => setRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,201,167,0.2)]"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Send Link Request
        </button>
      </Header>

      <div className="p-4 md:p-8 pb-24 space-y-8 max-w-6xl">

        {/* ── Hero greeting ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight leading-none">
              <span className="gradient-text">{user?.name?.split(' ')[0]}'s</span>{' '}
              <span className="text-white">Workspace</span>
            </h1>
            <p className="text-on-surface-variant text-sm mt-1.5">Legal Professional Dashboard · NyayaAI</p>
          </div>
          {pending.length > 0 && (
            <div
              onClick={() => { setTab('clients'); }}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-400/10 border border-amber-400/20 rounded-xl cursor-pointer hover:bg-amber-400/15 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-sm font-bold">{pending.length} pending link request{pending.length > 1 ? 's' : ''}</span>
              <span className="material-symbols-outlined text-amber-400 text-base">arrow_forward</span>
            </div>
          )}
        </motion.div>

        {/* ── Stats row ── */}
        {stats && (
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={{ show:{ transition:{ staggerChildren:0.08 } } }} initial="hidden" animate="show">
            {[
              { label: 'Linked Clients',   value: stats.linkedClients  ?? accepted.length, icon: 'group',        color: 'text-primary',    glow: 'shadow-primary/10'  },
              { label: 'Pending Requests', value: stats.pendingLinks   ?? pending.length,  icon: 'schedule',     color: 'text-amber-400',  glow: 'shadow-amber-400/10'},
              { label: 'Active Cases',     value: stats.activeCases    ?? 0,              icon: 'folder_open',  color: 'text-blue-400',   glow: 'shadow-blue-400/10' },
              { label: 'Completed Cases',  value: stats.closedCases    ?? 0,              icon: 'check_circle', color: 'text-emerald-400',glow: ''                   },
            ].map(s => (
              <motion.div key={s.label}
                variants={{ hidden:{ opacity:0, y:20, scale:0.95 }, show:{ opacity:1, y:0, scale:1, transition:{ duration:0.4, ease:[0.22,1,0.36,1] } } }}
                whileHover={{ y:-5, scale:1.03, boxShadow:'0 16px 40px rgba(0,0,0,0.25)' }}
                className="rounded-2xl p-5 border border-white/5"
                style={{ background:'rgba(12,28,73,0.55)', backdropFilter:'blur(12px)' }}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div className="text-3xl font-headline font-extrabold text-white leading-none">{s.value}</div>
                <div className="text-xs text-on-surface-variant mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
            <button onClick={load} className="ml-auto underline font-bold">Retry</button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-white/5">
          {[
            { key: 'overview', label: 'Overview'    },
            { key: 'clients',  label: 'My Clients',  badge: accepted.length  },
            { key: 'cases',    label: 'Cases',        badge: cases.filter(c => ['active','in_review','pending'].includes(c.status)).length },
          ].map(t => (
            <motion.button key={t.key} onClick={() => setTab(t.key)}
              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold font-headline rounded-t-lg transition-colors relative ${
                tab === t.key ? 'text-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {tab === t.key && <motion.div layoutId="lawyer-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" transition={{ type:'spring', stiffness:400, damping:30 }} />}
              {t.label}
              {t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                  tab === t.key ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>{t.badge}</span>
              )}
            </motion.button>
          ))}
        </div>

        {loading && <Skeleton rows={4} />}

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {!loading && tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left — Clients */}
            <div className="lg:col-span-7 space-y-4">
              <SectionHeader
                title="My Clients"
                count={accepted.length}
                action={accepted.length > 3 ? { label: 'View all', onClick: () => setTab('clients') } : undefined}
              />

              {accepted.length === 0 && pending.length === 0 && (
                <EmptyState
                  icon="group"
                  title="No clients linked yet"
                  sub="Send a link request to connect with a client and start managing their cases."
                  action={{ label: 'Send Link Request', icon: 'person_add', onClick: () => setRequestModal(true) }}
                />
              )}

              {/* Accepted clients */}
              {accepted.slice(0, 4).map(link => (
                <ClientCard
                  key={link._id}
                  link={link}
                  onViewDocs={() => openDocs(link)}
                  onNewCase={() => setCaseModal({ mode: 'create', defaultLink: link })}
                  onUnlink={() => handleUnlink(link._id)}
                  onViewClient={() => navigate(`/lawyer/client/${link._id}`)}
                />
              ))}

              {/* Pending requests */}
              {pending.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Awaiting response</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  {pending.slice(0, 2).map(link => (
                    <PendingLinkRow
                      key={link._id}
                      link={link}
                      onCancel={() => handleUnlink(link._id)}
                    />
                  ))}
                  {pending.length > 2 && (
                    <button onClick={() => setTab('clients')} className="text-xs text-primary font-semibold hover:underline pl-1">
                      +{pending.length - 2} more pending request{pending.length - 2 > 1 ? 's' : ''} →
                    </button>
                  )}
                </div>
              )}

              {accepted.length > 0 && (
                <button
                  onClick={() => setRequestModal(true)}
                  className="flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Send another link request
                </button>
              )}
            </div>

            {/* Right — Recent Cases */}
            <div className="lg:col-span-5 space-y-4">
              <SectionHeader
                title="Recent Cases"
                count={cases.length}
                action={{
                  label: cases.length > 0 ? 'View all' : 'New Case',
                  icon:  cases.length > 0 ? undefined : 'add',
                  onClick: cases.length > 0 ? () => setTab('cases') : () => setCaseModal({ mode: 'create' }),
                }}
              />

              {cases.length === 0 ? (
                <EmptyState
                  icon="folder_open"
                  title="No cases yet"
                  sub="Create a case for a linked client to track progress."
                  action={{ label: 'New Case', icon: 'add', onClick: () => setCaseModal({ mode: 'create' }) }}
                />
              ) : (
                <div className="space-y-2">
                  {recent.slice(0, 5).map(c => (
                    <CaseCompactRow
                      key={c._id}
                      c={c}
                      onEdit={() => setCaseModal({ mode: 'edit', data: c })}
                    />
                  ))}
                  {cases.length > 5 && (
                    <button onClick={() => setTab('cases')} className="text-xs text-primary font-semibold hover:underline pl-1">
                      View all {cases.length} cases →
                    </button>
                  )}
                </div>
              )}

              {/* Quick case-status breakdown */}
              {cases.length > 0 && (
                <div className="bg-surface-container-low rounded-xl border border-white/5 p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Case Status Breakdown</div>
                  <div className="space-y-2">
                    {[
                      { label: 'Active',    count: cases.filter(c => c.status === 'active').length,    color: 'bg-primary'    },
                      { label: 'In Review', count: cases.filter(c => c.status === 'in_review').length, color: 'bg-blue-400'   },
                      { label: 'Pending',   count: cases.filter(c => c.status === 'pending').length,   color: 'bg-amber-400'  },
                      { label: 'Completed', count: cases.filter(c => c.status === 'completed').length, color: 'bg-emerald-400'},
                    ].filter(s => s.count > 0).map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                          <span className="text-xs text-on-surface-variant">{s.label}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">{s.count}</span>
                        <div className="w-20 bg-surface-container rounded-full h-1 overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: `${Math.round((s.count / cases.length) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ CLIENTS TAB ════════════════ */}
        {!loading && tab === 'clients' && (
          <div className="space-y-6">

            {/* Accepted clients */}
            <div>
              <SectionHeader
                title="Linked Clients"
                count={accepted.length}
                action={{ label: '+ Send Request', onClick: () => setRequestModal(true) }}
              />
              {accepted.length === 0 ? (
                <EmptyState
                  icon="group"
                  title="No linked clients"
                  sub="Send a link request to a client. Once they accept, they appear here."
                  action={{ label: 'Send Link Request', icon: 'person_add', onClick: () => setRequestModal(true) }}
                />
              ) : (
                <div className="space-y-3">
                  {accepted.map(link => (
                    <ClientCardFull
                      key={link._id}
                      link={link}
                      onViewDocs={() => openDocs(link)}
                      onNewCase={() => setCaseModal({ mode: 'create', defaultLink: link })}
                      onUnlink={() => handleUnlink(link._id)}
                      onViewClient={() => navigate(`/lawyer/client/${link._id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
              <div>
                <SectionHeader title="Pending Requests" count={pending.length} />
                <div className="space-y-2">
                  {pending.map(link => (
                    <PendingLinkRow key={link._id} link={link} onCancel={() => handleUnlink(link._id)} showFull />
                  ))}
                </div>
              </div>
            )}

            {accepted.length === 0 && pending.length === 0 && (
              <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/15 rounded-xl">
                <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0 mt-0.5">info</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">How client linking works</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Send a link request to your client's email. They'll get a notification on NyayaAI and can accept or reject.
                    Once accepted, they control which documents to share with you. You can then view those documents,
                    see the AI analysis, add professional notes, and create cases — all in one place.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ CASES TAB ════════════════ */}
        {!loading && tab === 'cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-on-surface-variant">{cases.length} case{cases.length !== 1 ? 's' : ''} total</span>
                {/* Quick filter chips */}
                {['active', 'in_review', 'pending', 'completed'].map(s => {
                  const count = cases.filter(c => c.status === s).length;
                  if (count === 0) return null;
                  const cfg = STATUS_STYLE[s];
                  return (
                    <span key={s} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cfg.label} · {count}
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => setCaseModal({ mode: 'create' })}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                New Case
              </button>
            </div>

            {cases.length === 0 ? (
              <EmptyState
                icon="folder_open"
                title="No cases yet"
                sub="Create your first case to start tracking client work."
                action={{ label: 'Create First Case', icon: 'add', onClick: () => setCaseModal({ mode: 'create' }) }}
              />
            ) : (
              <div className="space-y-3">
                {cases.map(c => (
                  <CaseFullRow
                    key={c._id}
                    c={c}
                    onEdit={() => setCaseModal({ mode: 'edit', data: c })}
                    onDelete={() => handleDeleteCase(c._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {caseModal && (
        <CaseFormModal
          mode={caseModal.mode}
          initialData={caseModal.data}
          defaultLink={caseModal.defaultLink}
          acceptedLinks={accepted}
          onSave={handleSaveCase}
          onClose={() => setCaseModal(null)}
        />
      )}

      {docsModal && (
        <DocsViewerModal
          link={docsModal.link}
          docs={docsModal.docs}
          loading={docsModal.loading}
          error={docsModal.error}
          onClose={() => setDocsModal(null)}
          onNewCase={(link) => { setDocsModal(null); setCaseModal({ mode: 'create', defaultLink: link }); }}
        />
      )}

      {requestModal && (
        <SendRequestModal
          onClose={() => setRequestModal(false)}
          onSuccess={() => { setRequestModal(false); load(); }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CLIENT CARDS
══════════════════════════════════════════════════════════════════════ */

/* Compact — used in Overview */
function ClientCard({ link, onViewDocs, onNewCase, onUnlink, onViewClient }) {
  const client  = link.clientId || {};
  const initial = (client.name || link.clientEmail || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-4 hover:border-primary/20 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-primary font-headline">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onViewClient} className="font-bold text-on-surface text-sm font-headline truncate hover:text-primary transition-colors text-left">
              {client.name || link.clientEmail}
            </button>
            {client.plan === 'pro' && <span className="text-[9px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">PRO</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-on-surface-variant">{client.email || link.clientEmail}</span>
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-primary">share</span>
              {link.stats?.sharedDocuments ?? 0} shared
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Active {formatRelative(client.lastLogin)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onViewClient} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[13px]">analytics</span>
            View
          </button>
          <button onClick={onNewCase} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-bold hover:text-primary hover:bg-primary/10 transition-colors border border-white/5">
            <span className="material-symbols-outlined text-[13px]">add</span>
            Case
          </button>
        </div>
      </div>
    </div>
  );
}

/* Full — used in Clients tab */
function ClientCardFull({ link, onViewDocs, onNewCase, onUnlink, onViewClient }) {
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />Linked
            </span>
            {client.plan === 'pro' && <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">PRO</span>}
          </div>
          <div className="text-xs text-on-surface-variant">{client.email || link.clientEmail}</div>

          {/* Stats */}
          <div className="flex items-center gap-5 mt-3 flex-wrap">
            {[
              { icon: 'description', v: `${link.stats?.totalDocuments ?? 0} total docs`  },
              { icon: 'share',       v: `${link.stats?.sharedDocuments ?? 0} shared`      },
              { icon: 'folder_open', v: `${link.stats?.totalCases ?? 0} cases`            },
              { icon: 'schedule',    v: `Linked ${formatRelative(link.acceptedAt)}`        },
            ].map(({ icon, v }) => (
              <span key={v} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">{icon}</span>{v}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onViewClient}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">analytics</span>View Documents
          </button>
          <button
            onClick={onNewCase}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant border border-white/10 text-xs font-bold hover:text-primary hover:border-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>New Case
          </button>
          <button
            onClick={onUnlink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-bold hover:bg-error/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">link_off</span>Unlink
          </button>
        </div>
      </div>
    </div>
  );
}

/* Pending request row */
function PendingLinkRow({ link, onCancel, showFull }) {
  const initial = (link.clientEmail || '?').charAt(0).toUpperCase();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try { await onCancel(); } finally { setCancelling(false); }
  };

  return (
    <div className="flex items-center gap-3 p-3.5 bg-surface-container-low rounded-xl border border-amber-400/10 hover:border-amber-400/20 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-amber-400 text-[15px]">schedule</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-on-surface truncate">{link.clientEmail}</div>
        {showFull && link.message && (
          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1 italic">"{link.message}"</p>
        )}
        <div className="text-[10px] text-on-surface-variant mt-0.5">Sent {formatRelative(link.createdAt)} · Awaiting acceptance</div>
      </div>
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="text-[11px] text-on-surface-variant hover:text-error transition-colors font-bold flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">{cancelling ? 'progress_activity' : 'close'}</span>
        Cancel
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CASE ROWS
══════════════════════════════════════════════════════════════════════ */

/* Compact — used in Overview */
function CaseCompactRow({ c, onEdit }) {
  const pCfg  = PRIORITY_CFG[c.priority] || PRIORITY_CFG.medium;
  const sCfg  = STATUS_STYLE[c.status]   || STATUS_STYLE.active;
  const name  = c.clientId?.name || c.clientName || c.clientEmail || '—';

  return (
    <div onClick={onEdit} className="flex items-center gap-3 p-3.5 bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 cursor-pointer transition-colors group">
      <PriorityDot priority={c.priority} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{c.title}</div>
        <div className="text-[11px] text-on-surface-variant mt-0.5">{name} {c.caseType && `· ${c.caseType}`}</div>
      </div>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sCfg.bg} ${sCfg.text}`}>{sCfg.label}</span>
    </div>
  );
}

/* Full — used in Cases tab */
function CaseFullRow({ c, onEdit, onDelete }) {
  const pCfg = PRIORITY_CFG[c.priority] || PRIORITY_CFG.medium;
  const name = c.clientId?.name || c.clientName || c.clientEmail || '—';

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors group">
      <div className="flex items-start gap-4">
        {/* Priority strip */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${pCfg.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-bold text-on-surface font-headline truncate">{c.title}</span>
            <StatusBadge status={c.status} />
            <span className={`text-[11px] font-bold uppercase tracking-wide ${pCfg.color}`}>{c.priority}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">person</span>{name}
            </span>
            {c.caseType && <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">{c.caseType}</span>}
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {formatRelative(c.updatedAt || c.createdAt)}
            </span>
          </div>
          {c.notes && (
            <p className="text-xs text-on-surface-variant mt-2 italic line-clamp-1">"{c.notes}"</p>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[17px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CASE FORM MODAL
══════════════════════════════════════════════════════════════════════ */

function CaseFormModal({ mode, initialData, defaultLink, acceptedLinks, onSave, onClose }) {
  const isEdit  = mode === 'edit';

  const [form, setForm] = useState(() => {
    if (isEdit && initialData) {
      return {
        linkedLinkId: '',
        title:       initialData.title       || '',
        clientName:  initialData.clientName  || initialData.clientId?.name || '',
        clientEmail: initialData.clientEmail || initialData.clientId?.email || '',
        caseType:    initialData.caseType    || '',
        description: initialData.description || '',
        notes:       initialData.notes       || '',
        status:      initialData.status      || 'active',
        priority:    initialData.priority    || 'medium',
      };
    }
    return {
      ...EMPTY_FORM,
      linkedLinkId: defaultLink?._id || '',
      clientName:   defaultLink?.clientId?.name  || defaultLink?.clientEmail || '',
      clientEmail:  defaultLink?.clientEmail     || '',
    };
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill client info when linked client selected
  const handleLinkSelect = (linkId) => {
    set('linkedLinkId', linkId);
    if (!linkId) return;
    const link = acceptedLinks.find(l => l._id === linkId);
    if (link) {
      setForm(f => ({
        ...f,
        linkedLinkId: linkId,
        clientName:   link.clientId?.name  || link.clientEmail,
        clientEmail:  link.clientEmail,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Case title is required');
    if (!form.clientName.trim() && !form.clientEmail.trim() && !form.linkedLinkId) {
      return setError('Link to a client or enter client name/email');
    }
    setSaving(true);
    try {
      await onSave(form, isEdit, initialData?._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '', required = false) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none transition-colors placeholder-slate-600"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-low rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-base font-headline font-bold text-white">{isEdit ? 'Edit Case' : 'New Case'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error px-3 py-2.5 rounded-xl text-sm">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>{error}
            </div>
          )}

          {/* Linked client picker */}
          {!isEdit && acceptedLinks.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Link to a Client</label>
              <select
                value={form.linkedLinkId}
                onChange={e => handleLinkSelect(e.target.value)}
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none transition-colors"
              >
                <option value="">— Select linked client (or enter manually below) —</option>
                {acceptedLinks.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.clientId?.name || l.clientEmail} ({l.clientEmail})
                  </option>
                ))}
              </select>
            </div>
          )}

          {field('Case Title', 'title', 'text', 'e.g. StartupX Contract Review — Rahul', true)}

          {/* Client fields — auto-filled if linked client selected */}
          <div className="grid grid-cols-2 gap-3">
            {field('Client Name', 'clientName', 'text', 'Full name')}
            {field('Client Email', 'clientEmail', 'email', 'client@example.com')}
          </div>

          {/* Case type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Case Type</label>
            <select value={form.caseType} onChange={e => set('caseType', e.target.value)}
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none">
              <option value="">Select type…</option>
              {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none">
                {['active','pending','in_review','on-hold','completed','closed'].map(s => (
                  <option key={s} value={s}>{STATUS_STYLE[s]?.label || s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none">
                {['high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the case and what needs to be done…"
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none resize-none transition-colors placeholder-slate-600" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Professional Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Private notes, legal observations, action items…"
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-2.5 px-3 rounded-xl outline-none resize-none transition-colors placeholder-slate-600" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-on-surface-variant hover:text-white text-sm font-bold transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,167,0.15)]">
              {saving
                ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Saving…</>
                : <><span className="material-symbols-outlined text-base">save</span>{isEdit ? 'Save Changes' : 'Create Case'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DOCS VIEWER MODAL (lawyer sees client's shared docs)
══════════════════════════════════════════════════════════════════════ */

function DocsViewerModal({ link, docs, loading, error, onClose, onNewCase }) {
  const client = link.clientId || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface">Shared Documents</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {client.name || link.clientEmail} · {docs.length} document{docs.length !== 1 ? 's' : ''} shared
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNewCase(link)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>New Case
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <div className="flex items-center justify-center py-10"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}
          {error && <p className="text-error text-sm text-center py-8">{error}</p>}
          {!loading && !error && docs.length === 0 && (
            <div className="text-center py-10 space-y-2">
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
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-on-surface-variant">{doc.docType || 'Unknown type'}</span>
                      {doc.healthScore !== undefined && (
                        <span className={`text-xs font-bold ${doc.healthScore >= 70 ? 'text-primary' : doc.healthScore >= 40 ? 'text-amber-400' : 'text-error'}`}>
                          {doc.healthScore}% health
                        </span>
                      )}
                      {doc.riskCount > 0 && (
                        <span className="text-xs text-error font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          {doc.riskCount} risk{doc.riskCount > 1 ? 's' : ''}
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

/* ══════════════════════════════════════════════════════════════════════
   SEND REQUEST MODAL
══════════════════════════════════════════════════════════════════════ */

function SendRequestModal({ onClose, onSuccess }) {
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!email.trim()) return setResult({ ok: false, msg: 'Client email is required' });
    setSending(true);
    try {
      await sendLinkRequest(email.trim(), message.trim());
      setResult({ ok: true, msg: `Link request sent to ${email.trim()}` });
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || 'Failed to send request' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface">Send Link Request</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Client will receive a notification to accept or reject</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* How it works — brief explainer */}
        <div className="mx-6 mt-5 p-3 bg-primary/5 border border-primary/15 rounded-xl flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">info</span>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Once accepted, the client controls which documents to share with you.
            You can view shared documents and create cases — all without WhatsApp or email attachments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Client Email *</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="client@example.com" autoFocus
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-3 px-4 rounded-xl outline-none transition-colors placeholder-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Message (optional)</label>
            <textarea
              rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Please review my service agreement. I need feedback by Friday."
              className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-3 px-4 rounded-xl outline-none resize-none transition-colors placeholder-slate-600"
            />
          </div>

          {result && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl border ${result.ok ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-error/10 border-error/20 text-error'}`}>
              <span className="material-symbols-outlined text-base flex-shrink-0">{result.ok ? 'check_circle' : 'error'}</span>
              {result.msg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-on-surface-variant hover:text-white text-sm font-bold transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={sending || result?.ok}
              className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,167,0.15)]">
              {sending
                ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Sending…</>
                : result?.ok
                ? <><span className="material-symbols-outlined text-base">check_circle</span>Sent!</>
                : <><span className="material-symbols-outlined text-base">send</span>Send Request</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
