import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../api/documents.api';
import { getAlerts } from '../api/alerts.api';
import { ContractStatusBadge } from '../utils/contractStatus';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function healthColor(score) {
  if (score >= 75) return 'text-primary';
  if (score >= 50) return 'text-secondary';
  return 'text-error';
}

function riskBadgeStyle(level) {
  if (level === 'critical') return 'bg-error/20 text-error';
  if (level === 'high')     return 'bg-error/10 text-error';
  if (level === 'medium')   return 'bg-secondary/10 text-secondary';
  return 'bg-surface-container text-on-surface-variant';
}

const TYPE_ICON = {
  expiry:     'schedule',
  compliance: 'gavel',
  risk:       'warning',
  general:    'info',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [docs,   setDocs]   = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDocuments(), getAlerts()])
      .then(([dRes, aRes]) => {
        setDocs(dRes.data.data.documents   || []);
        setAlerts(aRes.data.data.alerts    || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── derived stats ───────────────────────────────────────────── */
  const totalDocs    = docs.length;
  const analyzedDocs = docs.filter((d) => d.status === 'analyzed');
  const avgHealth    = analyzedDocs.length
    ? Math.round(analyzedDocs.reduce((s, d) => s + (d.healthScore || 0), 0) / analyzedDocs.length)
    : 0;
  const risksFound    = docs.reduce((sum, d) => sum + (d.riskCount || 0), 0);
  const expiringSoon  = docs.filter((d) => {
    if (!d.expiryDate) return false;
    const days = Math.floor((new Date(d.expiryDate) - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;
  const unreadAlerts  = alerts.filter((a) => !a.isRead).length;

  const riskCounts = {
    high:   docs.filter((d) => d.riskLevel === 'high').length,
    medium: docs.filter((d) => d.riskLevel === 'medium').length,
    low:    docs.filter((d) => d.riskLevel === 'low' || !d.riskLevel).length,
  };

  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 4);

  const recentAlerts = [...alerts]
    .filter((a) => !a.isRead)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <>
      <Header title="Dashboard Overview">
        <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">security</span>
      </Header>

      <div className="p-8 space-y-8">

        {/* ── Greeting ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-white">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {loading ? 'Loading your legal portfolio…' : `You have ${totalDocs} document${totalDocs !== 1 ? 's' : ''} and ${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* ── 4 Stat Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="folder_open"
            label="Total Documents"
            value={loading ? '—' : totalDocs.toLocaleString()}
            sub={analyzedDocs.length > 0 ? `${analyzedDocs.length} analyzed` : 'None analyzed yet'}
            subColor="text-primary"
            subIcon="check_circle"
            loading={loading}
          />
          <StatCard
            icon="verified_user"
            label="Avg Health Score"
            value={loading ? '—' : avgHealth ? `${avgHealth}%` : '—'}
            sub={avgHealth >= 75 ? 'Portfolio healthy' : avgHealth > 0 ? 'Needs attention' : 'No analyses yet'}
            subColor={avgHealth >= 75 ? 'text-primary' : avgHealth > 0 ? 'text-secondary' : 'text-on-surface-variant'}
            subIcon={avgHealth >= 75 ? 'trending_up' : 'trending_flat'}
            loading={loading}
            progressBar={avgHealth}
          />
          <StatCard
            icon="warning"
            label="Risks Found"
            value={loading ? '—' : risksFound}
            sub={risksFound > 0 ? 'Across all documents' : 'No risks detected'}
            subColor={risksFound > 0 ? 'text-error' : 'text-primary'}
            subIcon={risksFound > 0 ? 'report' : 'check_circle'}
            loading={loading}
          />
          <StatCard
            icon="alarm_on"
            label="Expiring Soon"
            value={loading ? '—' : expiringSoon}
            sub={expiringSoon > 0 ? 'Within 30 days' : 'Nothing expiring soon'}
            subColor={expiringSoon > 0 ? 'text-secondary' : 'text-primary'}
            subIcon="calendar_month"
            loading={loading}
          />
        </div>

        {/* ── Middle row ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Documents */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl p-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold font-headline tracking-tight">Recent Documents</h2>
                <p className="text-on-surface-variant text-sm">Latest uploads and analyses</p>
              </div>
              <button
                onClick={() => navigate('/documents')}
                className="text-primary text-sm font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <span className="material-symbols-outlined text-4xl block opacity-20">folder_open</span>
                <p className="text-on-surface-variant text-sm">No documents yet.</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Upload your first document →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/analysis/${doc._id}`)}
                    className="group flex items-center justify-between p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          description
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-on-surface truncate">{doc.originalName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <ContractStatusBadge doc={doc} size="xs" />
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">{doc.docType}</span>
                          <span className="text-[10px] text-on-surface-variant">{timeAgo(doc.updatedAt || doc.createdAt)}</span>
                          {doc.riskLevel && doc.riskLevel !== 'low' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${riskBadgeStyle(doc.riskLevel)}`}>
                              {doc.riskLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                      {doc.healthScore > 0 && (
                        <div className="text-right">
                          <div className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Health</div>
                          <div className={`font-headline font-bold text-sm ${healthColor(doc.healthScore)}`}>
                            {doc.healthScore}%
                          </div>
                        </div>
                      )}
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                        chevron_right
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Summary */}
          <div className="bg-surface-container rounded-xl p-8">
            <h2 className="text-xl font-bold font-headline tracking-tight mb-1">Risk Summary</h2>
            <p className="text-on-surface-variant text-sm mb-6">Exposure across your portfolio</p>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-surface-container-high rounded-xl animate-pulse" />
                ))}
              </div>
            ) : totalDocs === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                Upload documents to see risk breakdown.
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'High',   count: riskCounts.high,   border: 'border-error',     bg: 'bg-error/5',     color: 'text-error'     },
                  { label: 'Medium', count: riskCounts.medium, border: 'border-secondary', bg: 'bg-secondary/5', color: 'text-secondary' },
                  { label: 'Low',    count: riskCounts.low,    border: 'border-primary',   bg: 'bg-primary/5',   color: 'text-primary'   },
                ].map(({ label, count, border, bg, color }) => (
                  <div key={label} className={`p-4 rounded-xl border-l-4 ${border} ${bg}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label} Severity</span>
                      <span className={`font-headline font-bold text-lg ${color}`}>{String(count).padStart(2, '0')}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
                        style={{ width: totalDocs > 0 ? `${Math.round((count / totalDocs) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/documents')}
              className="w-full mt-6 py-3 rounded-lg border border-outline-variant/30 text-sm font-semibold hover:bg-white/5 transition-colors text-on-surface-variant"
            >
              View All Documents
            </button>
          </div>
        </div>

        {/* ── Bottom row ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">

          {/* Recent Alerts */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold font-headline tracking-tight">Recent Alerts</h3>
                <p className="text-on-surface-variant text-sm">Unread notifications</p>
              </div>
              {unreadAlerts > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-bold font-label">
                  {unreadAlerts} UNREAD
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-surface-container rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <span className="material-symbols-outlined text-4xl block opacity-20">notifications_off</span>
                <p className="text-on-surface-variant text-sm">No unread alerts. You're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    onClick={() => navigate('/alerts')}
                    className="flex items-start gap-3 p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
                  >
                    <span
                      className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {TYPE_ICON[alert.alertType] || 'info'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface leading-snug line-clamp-2">{alert.message}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1">{timeAgo(alert.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/alerts')}
                  className="w-full text-center text-primary text-sm font-semibold hover:underline pt-2"
                >
                  View all alerts →
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-white/5">
            <h3 className="text-lg font-bold font-headline tracking-tight mb-2">Quick Actions</h3>
            <p className="text-on-surface-variant text-sm mb-6">Jump straight into your workflow</p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'upload_file',    label: 'Upload Document',  sub: 'Add a new file',          path: '/upload'    },
                { icon: 'compare_arrows', label: 'Compare Docs',     sub: 'Side-by-side diff',       path: '/compare'   },
                { icon: 'psychology',     label: 'Ask AI',           sub: 'Chat about a document',   path: '/ask'       },
                { icon: 'folder_open',    label: 'My Documents',     sub: 'Browse your library',     path: '/documents' },
              ].map(({ icon, label, sub, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-start gap-2 p-5 bg-surface-container rounded-xl border border-white/5 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group"
                >
                  <span
                    className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{label}</p>
                    <p className="text-[11px] text-on-surface-variant">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Portfolio health bar */}
            {analyzedDocs.length > 0 && (
              <div className="mt-6 p-4 bg-surface-container rounded-xl border border-white/5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-on-surface-variant font-label uppercase tracking-wider">Portfolio Health</span>
                  <span className={`font-bold ${healthColor(avgHealth)}`}>{avgHealth}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700"
                    style={{ width: `${avgHealth}%` }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2">
                  Based on {analyzedDocs.length} analyzed document{analyzedDocs.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── StatCard ──────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, subColor, subIcon, loading, progressBar }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-white/5">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1 font-label">{label}</div>
      <div className={`text-4xl font-bold font-headline ${loading ? 'text-on-surface-variant animate-pulse' : 'text-on-surface'}`}>
        {value}
      </div>
      {progressBar !== undefined && progressBar > 0 && (
        <div className="mt-3 mb-1 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-700" style={{ width: `${progressBar}%` }} />
        </div>
      )}
      <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${subColor}`}>
        <span className="material-symbols-outlined text-sm">{subIcon}</span>
        <span>{sub}</span>
      </div>
    </div>
  );
}
