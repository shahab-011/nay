import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';

const card = {
  hidden: { opacity: 0, y: 32 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, type: 'spring', stiffness: 220, damping: 22 },
  }),
};

const SECTIONS = [
  {
    id: 'studio',
    path: '/studio',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    glowColor: 'rgba(124,58,237,0.18)',
    icon: I.Doc,
    tag: 'Self-Help',
    title: 'Document Studio',
    subtitle: 'Analyze, summarize & chat with your legal documents using AI',
    features: [
      { ic: I.Upload,        text: 'Upload contracts, agreements & legal docs' },
      { ic: I.Sparkle,       text: 'AI-powered summary & risk analysis' },
      { ic: I.MessageCircle, text: 'Ask AI questions about your document' },
      { ic: I.Copy,          text: 'Compare two documents side-by-side' },
      { ic: I.Clock,         text: 'Contract lifecycle & obligation tracking' },
    ],
    cta: 'Open Document Studio',
    ctaIcon: I.ArrowRight,
    roleGate: null,
    badge: null,
  },
  {
    id: 'practice',
    path: '/practice',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
    glowColor: 'rgba(14,165,233,0.18)',
    icon: I.Briefcase,
    tag: 'For Firms',
    title: 'Practice Management',
    subtitle: 'Full law firm management — matters, contacts, billing & more',
    features: [
      { ic: I.Briefcase,   text: 'Manage matters from open to close' },
      { ic: I.Users,       text: 'Client & contact CRM with conflict check' },
      { ic: I.CheckSquare, text: 'Tasks, deadlines & Kanban workflow' },
      { ic: I.Calendar,    text: 'Court dates, hearings & client meetings' },
      { ic: I.DollarSign,  text: 'Time tracking, invoicing & trust accounting' },
    ],
    cta: 'Open Practice Management',
    ctaIcon: I.ArrowRight,
    roleGate: ['lawyer', 'admin'],
    badge: 'Lawyer Only',
  },
  {
    id: 'marketplace',
    path: '/find-lawyer',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    glowColor: 'rgba(16,185,129,0.18)',
    icon: I.Scale,
    tag: 'Get Legal Help',
    title: 'Find a Lawyer',
    subtitle: 'Describe your case and get matched with the right legal expert',
    features: [
      { ic: I.Search,      text: 'Answer a few questions about your case' },
      { ic: I.Star,        text: 'Get matched with verified lawyers near you' },
      { ic: I.Send,        text: 'Send your case request directly to lawyers' },
      { ic: I.MessageCircle, text: 'Chat & schedule consultations in-app' },
      { ic: I.Check,       text: 'Lawyers can accept, propose & manage cases' },
    ],
    cta: 'Find My Lawyer',
    ctaIcon: I.ArrowRight,
    roleGate: null,
    badge: null,
  },
];

export default function PortalHome() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.07)', border: '1.5px solid rgba(124,58,237,0.15)',
            borderRadius: 30, padding: '6px 18px', marginBottom: 20,
          }}>
            <I.Logo size={18} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>Nyaya Legal Platform</span>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.15 }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: 'var(--text-muted)', maxWidth: 500, marginInline: 'auto', lineHeight: 1.6 }}>
            What would you like to do today? Choose your path below.
          </p>
        </motion.div>

        {/* Three section cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24 }}>
          {SECTIONS.map((s, i) => {
            const locked = s.roleGate && !s.roleGate.includes(user?.role);
            return (
              <motion.div
                key={s.id}
                custom={i}
                variants={card}
                initial="hidden"
                animate="show"
                whileHover={locked ? {} : { y: -8, boxShadow: `0 32px 64px ${s.glowColor}` }}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 24,
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.55 : 1,
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'border-color 250ms',
                }}
                onClick={() => !locked && navigate(s.path)}
                onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* Gradient header */}
                <div style={{
                  background: s.gradient,
                  padding: '28px 28px 24px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Ambient orb */}
                  <div style={{
                    position: 'absolute', right: -30, top: -30,
                    width: 140, height: 140, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                  }} />
                  <div style={{
                    position: 'absolute', right: 20, bottom: -50,
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                    <div>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 20, padding: '4px 12px',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        marginBottom: 12,
                      }}>{s.tag}</div>
                      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.title}</h2>
                      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxWidth: 260 }}>{s.subtitle}</p>
                    </div>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <s.icon size={24} style={{ color: '#fff' }} />
                    </div>
                  </div>

                  {s.badge && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'rgba(255,255,255,0.25)',
                      borderRadius: 20, padding: '3px 10px',
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{s.badge}</div>
                  )}
                </div>

                {/* Feature list */}
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <f.ic size={13} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ padding: '0 24px 24px' }}>
                  {locked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      <I.Lock size={14} /> Requires lawyer account
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 12, background: 'var(--elevated)',
                      fontSize: 14, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer',
                    }}>
                      <span>{s.cta}</span>
                      <I.ArrowRight size={16} style={{ color: 'var(--purple)' }} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          {[
            { label: 'My Documents', path: '/documents', ic: I.Folder },
            { label: 'Alerts',       path: '/alerts',   ic: I.Bell },
            { label: 'Profile',      path: '/profile',  ic: I.User },
            { label: 'Help',         path: '/help',     ic: I.Info },
          ].map(q => (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 30,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--purple)'; e.currentTarget.style.borderColor = 'var(--purple-mist)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <q.ic size={14} /> {q.label}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
