import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../api/documents.api';
import { getAlerts } from '../api/alerts.api';
import { ContractStatusBadge } from '../utils/contractStatus';
import { I } from '../components/Icons';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function healthColor(s) {
  if (s >= 75) return 'var(--green)';
  if (s >= 50) return 'var(--amber)';
  return 'var(--red)';
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !value) return;
    let n = 0;
    const step = Math.ceil(value / 40);
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(n);
    }, 20);
    return () => clearInterval(t);
  }, [inView, value]);
  return <span ref={ref}>{display}</span>;
}

const itemV = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const containerV = { animate: { transition: { staggerChildren: 0.08 } } };

const ACCENT = {
  purple: { bg: 'var(--purple-soft)', border: 'var(--purple-mist)', hex: 'var(--purple)' },
  green:  { bg: 'rgba(22,163,106,0.07)', border: 'rgba(22,163,106,0.2)', hex: 'var(--green)' },
  red:    { bg: 'rgba(220,38,96,0.07)',  border: 'rgba(220,38,96,0.2)',  hex: 'var(--red)'   },
  amber:  { bg: 'rgba(217,119,6,0.07)', border: 'rgba(217,119,6,0.2)',  hex: 'var(--amber)' },
};

function StatCard({ Icon, label, value, sub, subColor, loading, progressBar, accent = 'purple' }) {
  const c = ACCENT[accent] || ACCENT.purple;
  return (
    <motion.div variants={itemV} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
      className="card" style={{ background: c.bg, border: `1px solid ${c.border}`, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${c.border}`,
        }}>
          {Icon && <Icon size={16} style={{ color: c.hex }} />}
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-headline)', color: 'var(--ink)', lineHeight: 1 }}>
        {loading ? '—' : typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
      {progressBar !== undefined && progressBar > 0 && !loading && (
        <div style={{ marginTop: 10, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', borderRadius: 4, background: c.hex }}
            initial={{ width: 0 }} animate={{ width: `${progressBar}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: subColor || 'var(--text-muted)' }}>{sub}</div>
    </motion.div>
  );
}

function SectionCard({ title, subtitle, action, onAction, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-headline)' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
        </div>
        {action && (
          <button onClick={onAction}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {action} →
          </button>
        )}
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [docs,    setDocs]    = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDocuments(), getAlerts()])
      .then(([dRes, aRes]) => {
        setDocs(dRes.data.data.documents || []);
        setAlerts(aRes.data.data.alerts  || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDocs    = docs.length;
  const analyzedDocs = docs.filter(d => d.status === 'analyzed');
  const avgHealth    = analyzedDocs.length
    ? Math.round(analyzedDocs.reduce((s, d) => s + (d.healthScore || 0), 0) / analyzedDocs.length) : 0;
  const risksFound   = docs.reduce((s, d) => s + (d.riskCount || 0), 0);
  const expiringSoon = docs.filter(d => {
    if (!d.expiryDate) return false;
    const days = Math.floor((new Date(d.expiryDate) - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const riskCounts   = {
    high:   docs.filter(d => d.riskLevel === 'high').length,
    medium: docs.filter(d => d.riskLevel === 'medium').length,
    low:    docs.filter(d => d.riskLevel === 'low' || !d.riskLevel).length,
  };
  const recentDocs   = [...docs].sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt)).slice(0,4);
  const recentAlerts = alerts.filter(a=>!a.isRead).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);

  return (
    <>
      <Header title="Dashboard" />
      <div style={{ padding: '80px 24px 100px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Greeting */}
        <motion.div variants={itemV} initial="initial" animate="animate" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-headline)', color: 'var(--ink)', lineHeight: 1.1 }}>
            Welcome back{user?.name && <span style={{ color: 'var(--purple)' }}>, {user.name.split(' ')[0]}</span>}.
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {loading ? 'Loading your legal portfolio…'
              : `${totalDocs} document${totalDocs !== 1 ? 's' : ''} · ${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}`}
          </motion.p>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={containerV} initial="initial" animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          <StatCard Icon={I.Folder} label="Total Documents" accent="purple"
            value={loading ? '—' : totalDocs}
            sub={analyzedDocs.length > 0 ? `${analyzedDocs.length} analyzed` : 'None analyzed yet'}
            loading={loading} />
          <StatCard Icon={I.Activity} label="Avg Health Score" accent="green"
            value={loading ? '—' : avgHealth || 0}
            sub={avgHealth >= 75 ? 'Portfolio healthy' : avgHealth > 0 ? 'Needs attention' : 'No analyses yet'}
            subColor={avgHealth >= 75 ? 'var(--green)' : avgHealth > 0 ? 'var(--amber)' : undefined}
            loading={loading} progressBar={avgHealth} />
          <StatCard Icon={I.Alert} label="Risks Found" accent="red"
            value={loading ? '—' : risksFound}
            sub={risksFound > 0 ? 'Across all documents' : 'No risks detected'}
            subColor={risksFound > 0 ? 'var(--red)' : 'var(--green)'}
            loading={loading} />
          <StatCard Icon={I.Clock} label="Expiring Soon" accent="amber"
            value={loading ? '—' : expiringSoon}
            sub={expiringSoon > 0 ? 'Within 30 days' : 'All clear'}
            subColor={expiringSoon > 0 ? 'var(--amber)' : 'var(--green)'}
            loading={loading} />
        </motion.div>

        {/* Middle row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}
          className="lg:grid-cols-3">

          {/* Recent Docs */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.5 }}
            className="lg:col-span-2">
            <SectionCard title="Recent Documents" subtitle="Latest uploads and analyses"
              action="View All" onAction={() => navigate('/documents')}>
              {loading
                ? Array.from({length:3}).map((_,i)=>(
                    <div key={i} style={{ height: 56, borderRadius: 10, marginBottom: 8, background: 'var(--elevated)' }} className="shimmer" />
                  ))
                : recentDocs.length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <I.Folder size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents yet.</p>
                      <button onClick={() => navigate('/upload')}
                        style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                        Upload your first →
                      </button>
                    </div>
                  : <motion.div variants={containerV} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recentDocs.map(doc => (
                        <motion.div key={doc._id} variants={itemV} whileHover={{ x: 4 }}
                          onClick={() => navigate(`/analysis/${doc._id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 10,
                            background: 'var(--elevated)', border: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                              background: 'var(--purple-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <I.Doc size={16} style={{ color: 'var(--purple)' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.originalName}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <ContractStatusBadge doc={doc} size="xs" />
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{doc.docType}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{timeAgo(doc.updatedAt||doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 12 }}>
                            {doc.healthScore > 0 && (
                              <div style={{ textAlign: 'right' }} className="hidden sm:block">
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health</div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: healthColor(doc.healthScore) }}>{doc.healthScore}%</div>
                              </div>
                            )}
                            <I.ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
              }
            </SectionCard>
          </motion.div>

          {/* Risk Summary */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.5 }}>
            <SectionCard title="Risk Summary" subtitle="Portfolio exposure">
              {loading
                ? Array.from({length:3}).map((_,i)=>(
                    <div key={i} style={{ height: 56, borderRadius: 10, marginBottom: 8, background: 'var(--elevated)' }} className="shimmer" />
                  ))
                : totalDocs === 0
                  ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      Upload documents to see breakdown.
                    </p>
                  : [
                      { label:'High',   count:riskCounts.high,   hex:'var(--red)',   bg:'rgba(220,38,96,0.06)',   border:'rgba(220,38,96,0.18)'  },
                      { label:'Medium', count:riskCounts.medium, hex:'var(--amber)', bg:'rgba(217,119,6,0.06)',   border:'rgba(217,119,6,0.18)'  },
                      { label:'Low',    count:riskCounts.low,    hex:'var(--green)', bg:'rgba(22,163,106,0.06)', border:'rgba(22,163,106,0.18)' },
                    ].map(({ label, count, hex, bg, border }, idx) => (
                      <motion.div key={label} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5+idx*0.1 }}
                        style={{ padding: '10px 12px', borderRadius: 10, background: bg, border: `1px solid ${border}`, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: hex }}>{label} Severity</span>
                          <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 20, color: hex }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <motion.div style={{ height: '100%', borderRadius: 4, background: hex }}
                            initial={{ width: 0 }}
                            animate={{ width: totalDocs > 0 ? `${Math.round((count/totalDocs)*100)}%` : '0%' }}
                            transition={{ duration: 1, delay: 0.7+idx*0.1, ease: [0.22,1,0.36,1] }} />
                        </div>
                      </motion.div>
                    ))
              }
              <button onClick={() => navigate('/documents')}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'transparent',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer',
                }}>
                View All Documents
              </button>
            </SectionCard>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="lg:grid-cols-2">

          {/* Alerts */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.5 }}>
            <SectionCard title="Recent Alerts" subtitle="Unread notifications"
              action={unreadAlerts > 0 ? `${unreadAlerts} unread` : undefined}
              onAction={() => navigate('/alerts')}>
              {loading
                ? Array.from({length:3}).map((_,i)=>(
                    <div key={i} style={{ height: 48, borderRadius: 10, marginBottom: 8, background: 'var(--elevated)' }} className="shimmer" />
                  ))
                : recentAlerts.length === 0
                  ? <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <I.Bell size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>All caught up!</p>
                    </div>
                  : recentAlerts.map((alert, idx) => (
                      <motion.div key={alert._id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.6+idx*0.07 }}
                        whileHover={{ x: 3 }} onClick={() => navigate('/alerts')}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          background: 'var(--elevated)', border: '1px solid var(--border)',
                          cursor: 'pointer', marginBottom: 8,
                        }}>
                        <I.Bell size={14} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}
                            className="line-clamp-2">{alert.message}</p>
                          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(alert.createdAt)}</p>
                        </div>
                      </motion.div>
                    ))
              }
              {recentAlerts.length > 0 && (
                <button onClick={() => navigate('/alerts')}
                  style={{ width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 4 }}>
                  View all alerts →
                </button>
              )}
            </SectionCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6, duration:0.5 }}>
            <SectionCard title="Quick Actions" subtitle="Jump straight into your workflow">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { Icon: I.Upload,         label: 'Upload',    sub: 'New document',     path: '/upload',         hex: '#7C3AED' },
                  { Icon: I.Copy,           label: 'Compare',   sub: 'Side-by-side diff', path: '/compare',        hex: '#2563EB' },
                  { Icon: I.MessageCircle,  label: 'Ask AI',    sub: 'Chat with AI',     path: '/ask',            hex: '#7C3AED' },
                  { Icon: I.Network,        label: 'Web Graph', sub: 'Contract network', path: '/obligation-web', hex: '#D97706' },
                ].map(({ Icon, label, sub, path, hex }, idx) => (
                  <motion.button key={label}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7+idx*0.07 }}
                    whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                      padding: '14px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      background: `${hex}08`, border: `1px solid ${hex}20`,
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${hex}15`, border: `1px solid ${hex}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} style={{ color: hex }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-headline)' }}>{label}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {analyzedDocs.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                  style={{
                    marginTop: 12, padding: '12px 14px', borderRadius: 12,
                    background: 'var(--elevated)', border: '1px solid var(--border)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portfolio Health</span>
                    <span style={{ fontWeight: 700, color: healthColor(avgHealth) }}>{avgHealth}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--purple), #9333ea)' }}
                      initial={{ width: 0 }} animate={{ width: `${avgHealth}%` }}
                      transition={{ duration: 1.2, delay: 1, ease: [0.22,1,0.36,1] }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                    Based on {analyzedDocs.length} analyzed document{analyzedDocs.length!==1?'s':''}
                  </p>
                </motion.div>
              )}
            </SectionCard>
          </motion.div>
        </div>

      </div>
    </>
  );
}
