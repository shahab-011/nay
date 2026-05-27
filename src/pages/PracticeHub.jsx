import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';
import { reportsApi } from '../api/reports.api';

/* ── Shared animation helpers ────────────────────────────────── */
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } };
const stagger = (delay = 0) => ({ show: { transition: { staggerChildren: 0.08, delayChildren: delay } } });

/* ── KPI stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color, bg, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -4, boxShadow: `0 20px 48px rgba(0,0,0,0.18)` }}
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 18,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'default',
        transition: 'border-color 200ms',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Subtle background glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${bg} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        {sub && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color, letterSpacing: '0.04em' }}>
            {sub}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'var(--font-headline)' }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
    </motion.div>
  );
}

/* ── Feature definitions ─────────────────────────────────────── */
const FEATURES = [
  { Ic: I.Briefcase,    label: 'Matters',            path: '/matters',        color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  desc: 'Active cases, stages, and client workflows' },
  { Ic: I.Users,        label: 'Contacts',           path: '/contacts',       color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  desc: 'Clients, counsel, courts, and witnesses' },
  { Ic: I.CheckSquare,  label: 'Tasks',              path: '/tasks',          color: '#10B981', bg: 'rgba(16,185,129,0.08)',  desc: 'Kanban, priorities, due dates, subtasks' },
  { Ic: I.Calendar,     label: 'Calendar',           path: '/cal',            color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  desc: 'Court dates, hearings, and deadlines' },
  { Ic: I.Timer,        label: 'Time Tracking',      path: '/time',           color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', desc: 'Live timer, manual entries, matter linking' },
  { Ic: I.DollarSign,   label: 'Billing',            path: '/billing',        color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   desc: 'Invoices, payments, and trust accounting' },
  { Ic: I.Chart,        label: 'Reports',            path: '/reports',        color: '#F97316', bg: 'rgba(249,115,22,0.08)',  desc: 'Revenue, utilization, and firm analytics' },
  { Ic: I.Target,       label: 'Lead Pipeline',      path: '/leads',          color: '#10B981', bg: 'rgba(16,185,129,0.08)', desc: 'Prospects, conversion funnel, win rates' },
  { Ic: I.Shield,       label: 'Conflict Check',     path: '/conflicts',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  desc: 'Detect conflicts before taking new clients' },
  { Ic: I.Layers,       label: 'Doc Automation',     path: '/doc-automation', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',  desc: 'Smart templates, auto-fill, and download' },
  { Ic: I.PenTool,      label: 'E-Signatures',       path: '/esign',          color: '#6366F1', bg: 'rgba(99,102,241,0.08)', desc: 'Send, sign, and track with audit trail' },
  { Ic: I.MessageSquare,label: 'Communications',     path: '/communications', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', desc: 'Call logs, emails, matter-linked records' },
  { Ic: I.Settings,     label: 'Firm Settings',      path: '/firm-settings',  color: '#6B7280', bg: 'rgba(107,114,128,0.08)',desc: 'Team, billing defaults, notifications' },
];

const QUICK_ACTIONS = [
  { label: 'New Matter',   path: '/matters',   Ic: I.Briefcase, color: '#7C3AED' },
  { label: 'Add Contact',  path: '/contacts',  Ic: I.UserPlus,  color: '#3B82F6' },
  { label: 'Log Time',     path: '/time',      Ic: I.Timer,     color: '#8B5CF6' },
  { label: 'New Invoice',  path: '/billing',   Ic: I.Receipt,   color: '#10B981' },
];

/* ── Feature card ────────────────────────────────────────────── */
function FeatureCard({ f, onClick }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, boxShadow: `0 24px 56px rgba(0,0,0,0.14)` }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '55'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        border: '1.5px solid var(--border)',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'pointer',
        transition: 'border-color 200ms',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner glow */}
      <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${f.bg} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, border: `1px solid ${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, flexShrink: 0 }}>
        <f.Ic size={22} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 5, letterSpacing: '-0.01em' }}>{f.label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: f.color }}>
        Open <I.ArrowRight size={13} />
      </div>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function PracticeHub() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [stats, setStats] = useState(null);

  const hour   = new Date().getHours();
  const greet  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    reportsApi.dashboard().then(r => setStats(r.data?.data)).catch(() => {});
  }, []);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 72px' }}>

        {/* ── Page header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 36 }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 12, color: 'var(--text-muted)' }}>
            <I.Home size={12} />
            <span>NyayaAI</span>
            <I.ChevronRight size={12} />
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Practice Management</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}
              >
                {greet}, {user?.name?.split(' ')[0] || 'Counselor'} · {today}
              </motion.p>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', fontFamily: 'var(--font-headline)' }}>
                Practice Hub
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)', maxWidth: 500 }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--surface)', color: qa.color, cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-card)', transition: 'border-color 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = qa.color + '44'; e.currentTarget.style.background = qa.color + '08'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
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
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 44 }}
        >
          <StatCard
            icon={<I.Briefcase size={20} />}
            label="Active Matters"
            value={stats?.activeMatters ?? stats?.matters?.open ?? '—'}
            sub="This month"
            color="#7C3AED"
            bg="rgba(124,58,237,0.1)"
          />
          <StatCard
            icon={<I.CheckSquare size={20} />}
            label="Tasks Due Today"
            value={stats?.tasksDueToday ?? '—'}
            sub="Pending"
            color="#10B981"
            bg="rgba(16,185,129,0.1)"
          />
          <StatCard
            icon={<I.Timer size={20} />}
            label="Hours This Week"
            value={stats?.hoursThisWeek ?? stats?.totalHours ?? '—'}
            sub="Billable"
            color="#8B5CF6"
            bg="rgba(139,92,246,0.1)"
          />
          <StatCard
            icon={<I.DollarSign size={20} />}
            label="Outstanding"
            value={stats?.outstandingRevenue != null ? `₹${Number(stats.outstandingRevenue).toLocaleString('en-IN')}` : '—'}
            sub="Invoices"
            color="#EF4444"
            bg="rgba(239,68,68,0.1)"
          />
        </motion.div>

        {/* ── Section divider ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            All Modules
          </span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 48 }}
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
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}
        >
          {[
            { Ic: I.Zap,    color: '#7C3AED', title: 'AI-Powered',         desc: 'Every module is enhanced with Gemini and Claude AI for smart automation.' },
            { Ic: I.Shield, color: '#10B981', title: 'Encrypted & Secure',  desc: 'All data is end-to-end encrypted and SOC 2 compliant.' },
            { Ic: I.Globe,  color: '#3B82F6', title: 'Indian Law Ready',    desc: 'Built for Indian advocates with Indian court workflows and INR billing.' },
          ].map(({ Ic, color, title, desc }) => (
            <div key={title} style={{ padding: '18px 20px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                <Ic size={17} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
