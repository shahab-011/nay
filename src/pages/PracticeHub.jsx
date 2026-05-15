import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';

/* ─── Feature definitions ────────────────────────────────────── */
const FEATURES = [
  {
    icon: I.Briefcase,
    label: 'Matters',
    path: '/matters',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    description: 'Manage active cases, client matters, and legal workflows from open to close.',
    badges: ['Open Matters', 'Stage Tracking', 'Practice Areas'],
    available: true,
  },
  {
    icon: I.Users,
    label: 'Contacts',
    path: '/contacts',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    description: 'Centralized CRM for clients, opposing counsel, courts, and witnesses.',
    badges: ['Conflict Check', 'Related Matters', 'Companies'],
    available: true,
  },
  {
    icon: I.CheckSquare,
    label: 'Tasks',
    path: '/tasks',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    description: 'Assign, track, and complete tasks with priority, due dates, and Kanban board.',
    badges: ['Kanban Board', 'Priorities', 'Due Dates'],
    available: true,
  },
  {
    icon: I.Calendar,
    label: 'Calendar',
    path: '/cal',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    description: 'Court dates, hearings, client meetings, and deadlines in one unified calendar.',
    badges: ['Month/Week/Day', 'Court Dates', 'Reminders'],
    available: true,
  },
  {
    icon: I.Timer,
    label: 'Time Tracking',
    path: '/time',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    description: 'Track billable hours with a live timer, manual entries, and matter linking.',
    badges: ['Live Timer', 'Billable Hours', 'Reports'],
    available: true,
  },
  {
    icon: I.DollarSign,
    label: 'Billing',
    path: '/billing',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    description: 'Generate invoices from time entries, send to clients, and track payments.',
    badges: ['Invoicing', 'Online Payments', 'Trust Accounting'],
    available: true,
  },
  {
    icon: I.Chart,
    label: 'Reports & Analytics',
    path: '/reports',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    description: 'Firm-wide performance, revenue, utilization rates, and client stats.',
    badges: ['Revenue', 'Utilization', 'Client Stats'],
    available: true,
  },
  {
    icon: I.Target,
    label: 'Lead Pipeline',
    path: '/leads',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    description: 'Track prospects from first contact to signed retainer. Kanban pipeline with conversion analytics.',
    badges: ['Kanban', 'Win Rate', 'Convert to Matter'],
    available: true,
  },
  {
    icon: I.Shield,
    label: 'Conflict Checker',
    path: '/conflicts',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    description: 'Search across all matters and contacts to detect conflicts of interest before taking a new client.',
    badges: ['Cross-Matter', 'Instant Report', 'Export'],
    available: true,
  },
  {
    icon: I.Layers,
    label: 'Document Automation',
    path: '/doc-automation',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.08)',
    description: 'Build templates with smart fields, fill and generate any document in seconds.',
    badges: ['Templates', 'Smart Fields', 'Download'],
    available: true,
  },
  {
    icon: I.PenTool,
    label: 'E-Signatures',
    path: '/esign',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
    description: 'Send documents for electronic signature and track signing progress with full audit trail.',
    badges: ['Multi-Signatory', 'Audit Trail', 'Reminders'],
    available: true,
  },
  {
    icon: I.MessageSquare,
    label: 'Communications',
    path: '/communications',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    description: 'Log all client calls, emails, and meetings. Link communications to matters for a complete record.',
    badges: ['Call Log', 'Email Log', 'Matter Link'],
    available: true,
  },
  {
    icon: I.Settings,
    label: 'Firm Settings',
    path: '/firm-settings',
    color: '#374151',
    bg: 'rgba(55,65,81,0.08)',
    description: 'Manage firm profile, team members, billing defaults, and notification preferences.',
    badges: ['Team', 'Billing', 'Notifications'],
    available: true,
  },
];

const card = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ─── Feature Card ───────────────────────────────────────────── */
function FeatureCard({ f, navigate }) {
  return (
    <motion.div
      variants={card}
      whileHover={f.available ? { y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.12)' } : {}}
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        border: '1.5px solid var(--border)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: f.available ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        opacity: f.available ? 1 : 0.7,
        transition: 'border-color 200ms',
        boxShadow: 'var(--shadow-card)',
      }}
      onClick={() => f.available && navigate(f.path)}
      onMouseEnter={e => { if (f.available) e.currentTarget.style.borderColor = f.color + '66'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Coming soon ribbon */}
      {!f.available && (
        <div style={{
          position: 'absolute', top: 14, right: -24,
          background: 'var(--purple)', color: '#fff',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '4px 32px',
          transform: 'rotate(45deg)',
        }}>Soon</div>
      )}

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: f.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: f.color, flexShrink: 0,
      }}>
        <f.icon size={24} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{f.label}</h3>
          {f.available && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#D1FAE5', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.description}</p>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {f.badges.map(b => (
          <span key={b} style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: f.bg, color: f.color,
          }}>{b}</span>
        ))}
      </div>

      {/* CTA */}
      {f.available && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, color: f.color,
        }}>
          Open {f.label} <I.ArrowRight size={14} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── PracticeHub ────────────────────────────────────────────── */
export default function PracticeHub() {
  const navigate = useNavigate();

  const available = FEATURES.filter(f => f.available);
  const upcoming  = FEATURES.filter(f => !f.available);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 40 }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <I.Home size={13} />
            <span>Nyaya</span>
            <I.ChevronRight size={13} />
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Practice Management</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I.Scale size={22} style={{ color: '#fff' }} />
                </div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>Practice Management</h1>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)', maxWidth: 520 }}>
                Full-featured law practice management — matters, contacts, tasks, billing, and more. Separate from your document tools.
              </p>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/matters')}
                className="btn btn-purple"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 12 }}
              >
                <I.Plus size={15} /> New Matter
              </button>
              <button
                onClick={() => navigate('/contacts')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer',
                }}
              >
                <I.Users size={15} /> Add Contact
              </button>
            </div>
          </div>
        </motion.div>

        {/* Divider with label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Available Now</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>

        {/* Available feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}
        >
          {available.map(f => (
            <FeatureCard key={f.label} f={f} navigate={navigate} />
          ))}
        </motion.div>

        {/* Coming soon divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Coming Soon — Phase 4 & 5</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>

        {/* Upcoming cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
        >
          {upcoming.map(f => (
            <FeatureCard key={f.label} f={f} navigate={navigate} />
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 48, padding: '20px 24px',
            background: 'rgba(124,58,237,0.04)',
            border: '1.5px solid rgba(124,58,237,0.12)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 16,
          }}
        >
          <I.Info size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Practice Management is built on top of Nyaya's AI document tools.
            Your existing documents, analyses, and AI tools are fully separate — access them anytime from the main sidebar.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
