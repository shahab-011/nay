import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';
import { reportsApi } from '../api/reports.api';

/* ── Design tokens ───────────────────────────────────────────── */
const T = {
  bg:     'var(--bg)',
  sur:    'var(--surface)',
  sur2:   'var(--elevated)',
  bdr:    'var(--border)',
  purp:   'var(--purple)',
  lav:    'var(--purple-hover)',
  ink:    'var(--ink)',
  muted:  'var(--text-secondary)',
  dim:    'var(--text-muted)',
  shadow: 'var(--shadow-card)',
  glow:   'var(--purple-glow)',
};

/* ── Animation presets ───────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const staggerGrid = (delay = 0) => ({
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: delay } },
});

/* ── KPI stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color, glowColor }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, boxShadow: `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${color}44` }}
      transition={{ duration: 0.2 }}
      style={{
        background: T.sur,
        border: `1px solid ${T.bdr}`,
        borderRadius: 20,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: T.shadow,
        transition: 'box-shadow 250ms, transform 250ms',
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, boxShadow: `0 0 16px ${color}20`,
        }}>
          {icon}
        </div>
        {sub && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            background: `${color}18`, color, letterSpacing: '0.06em',
            textTransform: 'uppercase', border: `1px solid ${color}28`,
          }}>
            {sub}
          </span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 30, fontWeight: 900, color: T.ink,
          lineHeight: 1, letterSpacing: '-0.02em',
        }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 6, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Feature definitions ─────────────────────────────────────── */
const FEATURES = [
  { Ic: I.Briefcase,     label: 'Matters',         path: '/matters',        color: '#7c3aed', desc: 'Active cases, stages, and client workflows' },
  { Ic: I.Users,         label: 'Contacts',         path: '/contacts',       color: '#3b82f6', desc: 'Clients, counsel, courts, and witnesses' },
  { Ic: I.CheckSquare,   label: 'Tasks',            path: '/tasks',          color: '#22c55e', desc: 'Kanban, priorities, due dates, subtasks' },
  { Ic: I.Calendar,      label: 'Calendar',         path: '/cal',            color: '#f59e0b', desc: 'Court dates, hearings, and deadlines' },
  { Ic: I.Timer,         label: 'Time Tracking',    path: '/time',           color: '#a78bfa', desc: 'Live timer, manual entries, matter linking' },
  { Ic: I.DollarSign,    label: 'Billing',          path: '/billing',        color: '#ef4444', desc: 'Invoices, payments, and trust accounting' },
  { Ic: I.Chart,         label: 'Reports',          path: '/reports',        color: '#f97316', desc: 'Revenue, utilization, and firm analytics' },
  { Ic: I.Target,        label: 'Lead Pipeline',    path: '/leads',          color: '#10b981', desc: 'Prospects, conversion funnel, win rates' },
  { Ic: I.Shield,        label: 'Conflict Check',   path: '/conflicts',      color: '#ef4444', desc: 'Detect conflicts before taking new clients' },
  { Ic: I.Layers,        label: 'Doc Automation',   path: '/doc-automation', color: '#06b6d4', desc: 'Smart templates, auto-fill, and download' },
  { Ic: I.PenTool,       label: 'E-Signatures',     path: '/esign',          color: '#6366f1', desc: 'Send, sign, and track with audit trail' },
  { Ic: I.MessageSquare, label: 'Communications',   path: '/communications', color: '#3b82f6', desc: 'Call logs, emails, matter-linked records' },
  { Ic: I.Settings,      label: 'Firm Settings',    path: '/firm-settings',  color: '#94a3b8', desc: 'Team, billing defaults, notifications' },
];

const QUICK_ACTIONS = [
  { label: 'New Matter',   path: '/matters',  Ic: I.Briefcase, color: '#7c3aed' },
  { label: 'Add Contact',  path: '/contacts', Ic: I.UserPlus,  color: '#3b82f6' },
  { label: 'Log Time',     path: '/time',     Ic: I.Timer,     color: '#a78bfa' },
  { label: 'New Invoice',  path: '/billing',  Ic: I.Receipt,   color: '#22c55e' },
];

/* ── Feature card ────────────────────────────────────────────── */
function FeatureCard({ f, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? `${f.color}0f` : T.sur,
        borderRadius: 18,
        border: `1px solid ${hov ? f.color + '45' : T.bdr}`,
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${f.color}30` : T.shadow,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
      }}
    >
      {/* Ambient glow spot */}
      <div style={{
        position: 'absolute', top: -10, right: -10,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${f.color}18 0%, transparent 70%)`,
        opacity: hov ? 1 : 0.5,
        transition: 'opacity 300ms',
        pointerEvents: 'none',
      }} />

      <motion.div
        animate={{ rotate: hov ? 6 : 0, scale: hov ? 1.05 : 1 }}
        transition={{ duration: 0.3, ease }}
        style={{
          width: 46, height: 46, borderRadius: 14,
          background: `${f.color}18`,
          border: `1px solid ${f.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: f.color,
          boxShadow: hov ? `0 0 20px ${f.color}30` : 'none',
        }}
      >
        <f.Ic size={21} />
      </motion.div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 5, letterSpacing: '-0.01em' }}>{f.label}</div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{f.desc}</div>
      </div>

      <motion.div
        animate={{ x: hov ? 3 : 0, opacity: hov ? 1 : 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: f.color }}
      >
        Open <I.ArrowRight size={13} />
      </motion.div>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function PracticeHub() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [stats, setStats] = useState(null);

  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    reportsApi.dashboard().then(r => setStats(r.data?.data)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, position: 'relative' }}>

      {/* ── Ambient background decoration ─────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -150, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -200, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '36px 32px 80px' }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ marginBottom: 40 }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20, fontSize: 12, color: T.dim }}>
            <I.Home size={12} style={{ color: T.muted }} />
            <span>NyayaAI</span>
            <I.ChevronRight size={11} />
            <span style={{ color: T.lav, fontWeight: 600 }}>Practice Management</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e88', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>
                  {greet}, {user?.name?.split(' ')[0] || 'Counselor'} · {today}
                </span>
              </motion.div>

              <h1 style={{
                margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, var(--ink) 0%, var(--purple) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Practice Hub
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: T.muted, maxWidth: 480, lineHeight: 1.6 }}>
                Your complete legal practice — matters, billing, calendar, and team, all in one place.
              </p>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map(qa => (
                <motion.button
                  key={qa.label}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(qa.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 11,
                    border: `1px solid ${qa.color}35`,
                    background: `${qa.color}10`,
                    color: qa.color,
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${qa.color}1e`; e.currentTarget.style.borderColor = `${qa.color}55`; e.currentTarget.style.boxShadow = `0 0 16px ${qa.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${qa.color}10`; e.currentTarget.style.borderColor = `${qa.color}35`; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <qa.Ic size={14} />
                  {qa.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Stats row ─────────────────────────────────────── */}
        <motion.div
          variants={staggerGrid(0.1)}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 48 }}
        >
          <StatCard
            icon={<I.Briefcase size={20} />}
            label="Active Matters"
            value={stats?.activeMatters ?? stats?.matters?.open ?? '—'}
            sub="This month"
            color="#7c3aed"
            glowColor="rgba(124,58,237,0.22)"
          />
          <StatCard
            icon={<I.CheckSquare size={20} />}
            label="Tasks Due Today"
            value={stats?.tasksDueToday ?? '—'}
            sub="Pending"
            color="#22c55e"
            glowColor="rgba(34,197,94,0.18)"
          />
          <StatCard
            icon={<I.Timer size={20} />}
            label="Hours This Week"
            value={stats?.hoursThisWeek ?? stats?.totalHours ?? '—'}
            sub="Billable"
            color="#a78bfa"
            glowColor="rgba(167,139,250,0.18)"
          />
          <StatCard
            icon={<I.DollarSign size={20} />}
            label="Outstanding"
            value={stats?.outstandingRevenue != null ? `₹${Number(stats.outstandingRevenue).toLocaleString('en-IN')}` : '—'}
            sub="Invoices"
            color="#ef4444"
            glowColor="rgba(239,68,68,0.18)"
          />
        </motion.div>

        {/* ── Section divider ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ height: 1, flex: 1, background: T.bdr }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: T.dim,
            textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap',
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${T.bdr}`,
            background: 'rgba(124,58,237,0.06)',
          }}>
            All Modules
          </span>
          <div style={{ height: 1, flex: 1, background: T.bdr }} />
        </div>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <motion.div
          variants={staggerGrid(0.15)}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 52 }}
        >
          {FEATURES.map(f => (
            <FeatureCard key={f.label} f={f} onClick={() => navigate(f.path)} />
          ))}
        </motion.div>

        {/* ── Info strip ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
        >
          {[
            { Ic: I.Zap,    color: '#7c3aed', title: 'AI-Powered',        desc: 'Every module enhanced with Gemini and Claude AI for smart automation.' },
            { Ic: I.Shield, color: '#22c55e', title: 'Encrypted & Secure', desc: 'All data is end-to-end encrypted and SOC 2 compliant.' },
            { Ic: I.Globe,  color: '#3b82f6', title: 'Indian Law Ready',   desc: 'Built for Indian advocates with Indian court workflows and INR billing.' },
          ].map(({ Ic, color, title, desc }) => (
            <div key={title} style={{
              padding: '18px 20px',
              background: T.sur,
              border: `1px solid ${T.bdr}`,
              borderRadius: 16,
              display: 'flex', gap: 14, alignItems: 'flex-start',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${color}18`,
                border: `1px solid ${color}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color,
              }}>
                <Ic size={17} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
