import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../api/documents.api';
import { getAlerts } from '../api/alerts.api';
import { ContractStatusBadge } from '../utils/contractStatus';

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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function healthColor(s) {
  return s >= 75 ? 'text-primary' : s >= 50 ? 'text-secondary' : 'text-error';
}

const TYPE_ICON = { expiry: 'schedule', compliance: 'gavel', risk: 'warning', general: 'info' };

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
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const containerV = { animate: { transition: { staggerChildren: 0.09 } } };

function StatCard({ icon, label, value, sub, subColor, subIcon, loading, progressBar, accentColor = 'primary' }) {
  const palette = {
    primary:   { bg: 'rgba(68,229,194,0.06)',  border: 'rgba(68,229,194,0.14)',  glow: 'rgba(68,229,194,0.18)',  hex: '#44e5c2' },
    secondary: { bg: 'rgba(102,214,231,0.06)', border: 'rgba(102,214,231,0.14)', glow: 'rgba(102,214,231,0.18)', hex: '#66d6e7' },
    warning:   { bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.14)',  glow: 'rgba(245,158,11,0.14)',  hex: '#f59e0b' },
    error:     { bg: 'rgba(255,107,107,0.06)', border: 'rgba(255,107,107,0.14)', glow: 'rgba(255,107,107,0.14)', hex: '#ff6b6b' },
  };
  const c = palette[accentColor] || palette.primary;
  return (
    <motion.div variants={itemV} whileHover={{ y: -5, scale: 1.02 }} transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl p-5 cursor-default"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl pointer-events-none opacity-70"
        style={{ background: c.glow }} />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${c.hex}18`, border: `1px solid ${c.hex}28` }}>
          <span className="material-symbols-outlined text-xl" style={{ color: c.hex, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className="text-[9px] font-bold font-label uppercase tracking-widest" style={{ color: `${c.hex}80` }}>{label}</span>
      </div>
      <div className={`text-4xl font-black font-headline ${loading ? 'text-on-surface-variant animate-pulse' : 'text-on-surface'}`}>
        {loading ? '—' : typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
      {progressBar !== undefined && progressBar > 0 && !loading && (
        <div className="mt-3 mb-1 w-full bg-white/5 h-1 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" initial={{ width: 0 }}
            animate={{ width: `${progressBar}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: `linear-gradient(90deg, ${c.hex}, ${c.hex}99)` }} />
        </div>
      )}
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${subColor}`}>
        <span className="material-symbols-outlined text-sm">{subIcon}</span>
        <span>{sub}</span>
      </div>
    </motion.div>
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
  const recentAlerts = [...alerts].filter(a=>!a.isRead).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4 md:p-6 xl:p-8 space-y-5 pb-24">

        {/* Greeting */}
        <motion.div variants={itemV} initial="initial" animate="animate" className="pt-1">
          <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight">
            <span className="text-white">Welcome back</span>
            {user?.name && <span className="gradient-text">, {user.name.split(' ')[0]}</span>}
            <span className="text-white">.</span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-on-surface-variant text-sm mt-1">
            {loading ? 'Loading your legal portfolio…'
              : `${totalDocs} document${totalDocs !== 1 ? 's' : ''} · ${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}`}
          </motion.p>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={containerV} initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="folder_open"   label="Total Documents"  accentColor="primary"
            value={loading ? '—' : totalDocs}
            sub={analyzedDocs.length > 0 ? `${analyzedDocs.length} analyzed` : 'None analyzed yet'}
            subColor="text-primary" subIcon="check_circle" loading={loading} />
          <StatCard icon="verified_user" label="Avg Health Score" accentColor="secondary"
            value={loading ? '—' : avgHealth || 0}
            sub={avgHealth >= 75 ? 'Portfolio healthy' : avgHealth > 0 ? 'Needs attention' : 'No analyses yet'}
            subColor={avgHealth >= 75 ? 'text-primary' : avgHealth > 0 ? 'text-secondary' : 'text-on-surface-variant'}
            subIcon={avgHealth >= 75 ? 'trending_up' : 'trending_flat'}
            loading={loading} progressBar={avgHealth} />
          <StatCard icon="warning"       label="Risks Found"      accentColor="error"
            value={loading ? '—' : risksFound}
            sub={risksFound > 0 ? 'Across all documents' : 'No risks detected'}
            subColor={risksFound > 0 ? 'text-error' : 'text-primary'} subIcon={risksFound > 0 ? 'report' : 'check_circle'} loading={loading} />
          <StatCard icon="alarm_on"      label="Expiring Soon"    accentColor="warning"
            value={loading ? '—' : expiringSoon}
            sub={expiringSoon > 0 ? 'Within 30 days' : 'All clear'}
            subColor={expiringSoon > 0 ? 'text-amber-400' : 'text-primary'} subIcon="calendar_month" loading={loading} />
        </motion.div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Docs */}
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.5, ease:[0.22,1,0.36,1] }}
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(12,28,73,0.5)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div className="px-5 pt-5 pb-3 flex justify-between items-center border-b border-white/5">
              <div>
                <h2 className="text-base font-bold font-headline text-white">Recent Documents</h2>
                <p className="text-on-surface-variant text-xs mt-0.5">Latest uploads and analyses</p>
              </div>
              <button onClick={() => navigate('/documents')} className="text-primary text-xs font-bold hover:underline flex items-center gap-0.5">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="p-3 space-y-2">
              {loading ? Array.from({length:3}).map((_,i)=><div key={i} className="h-14 rounded-xl shimmer"/>)
                : recentDocs.length === 0
                  ? <div className="text-center py-12 space-y-2">
                      <motion.span animate={{y:[0,-6,0]}} transition={{duration:3,repeat:Infinity}}
                        className="material-symbols-outlined text-4xl block text-on-surface-variant/15">folder_open</motion.span>
                      <p className="text-on-surface-variant text-sm">No documents yet.</p>
                      <button onClick={() => navigate('/upload')} className="text-primary text-sm font-bold hover:underline">Upload your first →</button>
                    </div>
                  : <motion.div variants={containerV} initial="initial" animate="animate" className="space-y-2">
                      {recentDocs.map(doc => (
                        <motion.div key={doc._id} variants={itemV} whileHover={{ x:4 }}
                          onClick={() => navigate(`/analysis/${doc._id}`)}
                          className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group"
                          style={{ background: 'rgba(24,39,83,0.5)' }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(68,229,194,0.1)', border: '1px solid rgba(68,229,194,0.18)' }}>
                              <span className="material-symbols-outlined text-primary text-base" style={{fontVariationSettings:"'FILL' 1"}}>description</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-on-surface truncate">{doc.originalName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <ContractStatusBadge doc={doc} size="xs" />
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">{doc.docType}</span>
                                <span className="text-[9px] text-on-surface-variant/50">{timeAgo(doc.updatedAt||doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            {doc.healthScore > 0 && (
                              <div className="text-right hidden sm:block">
                                <div className="text-[9px] text-on-surface-variant uppercase">Health</div>
                                <div className={`font-headline font-bold text-sm ${healthColor(doc.healthScore)}`}>{doc.healthScore}%</div>
                              </div>
                            )}
                            <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors text-sm">chevron_right</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
              }
            </div>
          </motion.div>

          {/* Risk Summary */}
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.5, ease:[0.22,1,0.36,1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(12,28,73,0.5)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div className="px-5 pt-5 pb-3 border-b border-white/5">
              <h2 className="text-base font-bold font-headline text-white">Risk Summary</h2>
              <p className="text-on-surface-variant text-xs mt-0.5">Portfolio exposure</p>
            </div>
            <div className="p-3 space-y-2.5">
              {loading ? Array.from({length:3}).map((_,i)=><div key={i} className="h-14 rounded-xl shimmer"/>)
                : totalDocs === 0
                  ? <p className="text-center py-8 text-on-surface-variant text-sm">Upload documents to see breakdown.</p>
                  : [
                      { label:'High',   count:riskCounts.high,   hex:'#ff6b6b', bg:'rgba(255,107,107,0.07)', border:'rgba(255,107,107,0.2)' },
                      { label:'Medium', count:riskCounts.medium, hex:'#66d6e7', bg:'rgba(102,214,231,0.07)', border:'rgba(102,214,231,0.2)' },
                      { label:'Low',    count:riskCounts.low,    hex:'#44e5c2', bg:'rgba(68,229,194,0.07)',  border:'rgba(68,229,194,0.2)'  },
                    ].map(({ label, count, hex, bg, border }, idx) => (
                      <motion.div key={label} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.5+idx*0.1 }}
                        className="p-3 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: hex }}>{label} Severity</span>
                          <span className="font-headline font-black text-xl" style={{ color: hex }}>{count}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" initial={{ width:0 }}
                            animate={{ width: totalDocs > 0 ? `${Math.round((count/totalDocs)*100)}%` : '0%' }}
                            transition={{ duration:1, delay:0.7+idx*0.1, ease:[0.22,1,0.36,1] }}
                            style={{ background: hex }} />
                        </div>
                      </motion.div>
                    ))
              }
            </div>
            <div className="px-3 pb-3">
              <button onClick={() => navigate('/documents')}
                className="w-full py-2.5 rounded-xl border border-white/8 text-xs font-semibold text-on-surface-variant hover:text-white hover:border-white/15 transition-all">
                View All Documents
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {/* Alerts */}
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.5, ease:[0.22,1,0.36,1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(12,28,73,0.45)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div className="px-5 pt-4 pb-3 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold font-headline text-white">Recent Alerts</h3>
                <p className="text-on-surface-variant text-xs mt-0.5">Unread notifications</p>
              </div>
              {unreadAlerts > 0 && (
                <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                  className="bg-primary/12 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold border border-primary/20">
                  {unreadAlerts} UNREAD
                </motion.span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {loading ? Array.from({length:3}).map((_,i)=><div key={i} className="h-12 rounded-xl shimmer"/>)
                : recentAlerts.length === 0
                  ? <div className="text-center py-10 space-y-2">
                      <span className="material-symbols-outlined text-4xl block text-on-surface-variant/15">notifications_off</span>
                      <p className="text-on-surface-variant text-sm">All caught up!</p>
                    </div>
                  : recentAlerts.map((alert, idx) => (
                      <motion.div key={alert._id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.6+idx*0.07 }}
                        whileHover={{ x:3 }} onClick={() => navigate('/alerts')}
                        className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer"
                        style={{ background: 'rgba(24,39,83,0.5)' }}>
                        <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5"
                          style={{ fontVariationSettings:"'FILL' 1" }}>
                          {TYPE_ICON[alert.alertType] || 'info'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">{alert.message}</p>
                          <p className="text-[9px] text-on-surface-variant/50 mt-0.5">{timeAgo(alert.createdAt)}</p>
                        </div>
                      </motion.div>
                    ))
              }
              {recentAlerts.length > 0 && (
                <button onClick={() => navigate('/alerts')} className="w-full text-center text-primary text-xs font-bold hover:underline pt-1">
                  View all alerts →
                </button>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6, duration:0.5, ease:[0.22,1,0.36,1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(12,28,73,0.45)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
              <h3 className="text-base font-bold font-headline text-white">Quick Actions</h3>
              <p className="text-on-surface-variant text-xs mt-0.5">Jump straight into your workflow</p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon:'upload_file',    label:'Upload',    sub:'New document',      path:'/upload',          color:'#44e5c2' },
                  { icon:'compare_arrows', label:'Compare',   sub:'Side-by-side diff', path:'/compare',         color:'#66d6e7' },
                  { icon:'psychology',     label:'Ask AI',    sub:'Chat with AI',      path:'/ask',             color:'#a78bfa' },
                  { icon:'hub',            label:'Web Graph', sub:'Contract network',  path:'/obligation-web',  color:'#f59e0b' },
                ].map(({ icon, label, sub, path, color }, idx) => (
                  <motion.button key={label}
                    initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: 0.7+idx*0.07 }}
                    whileHover={{ y:-4, scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl text-left"
                    style={{ background:`${color}09`, border:`1px solid ${color}18` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background:`${color}15`, border:`1px solid ${color}25` }}>
                      <span className="material-symbols-outlined text-base" style={{ color, fontVariationSettings:"'FILL' 1" }}>{icon}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-on-surface font-headline">{label}</p>
                      <p className="text-[10px] text-on-surface-variant/55">{sub}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              {analyzedDocs.length > 0 && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
                  className="mt-3 p-3.5 rounded-xl" style={{ background:'rgba(24,39,83,0.5)', border:'1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between text-[10px] mb-2">
                    <span className="text-on-surface-variant font-label uppercase tracking-widest">Portfolio Health</span>
                    <span className={`font-bold ${healthColor(avgHealth)}`}>{avgHealth}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width:0 }}
                      animate={{ width:`${avgHealth}%` }}
                      transition={{ duration:1.2, delay:1, ease:[0.22,1,0.36,1] }}
                      style={{ background:'linear-gradient(90deg,#44e5c2,#38debb)' }} />
                  </div>
                  <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                    Based on {analyzedDocs.length} analyzed document{analyzedDocs.length!==1?'s':''}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
