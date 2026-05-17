import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp   = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } };
const fadeIn   = { hidden: { opacity: 0 },         show: { opacity: 1 } };
const scaleUp  = { hidden: { opacity: 0, scale: 0.93 }, show: { opacity: 1, scale: 1 } };

const stagger  = (delay = 0) => ({
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

/* ─── Animated counter hook ──────────────────────────────────── */
function useCount(target, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return val;
}

/* ─── Stats ──────────────────────────────────────────────────── */
const STATS = [
  { value: 12000, suffix: '+', label: 'Documents Analyzed', icon: I.Doc },
  { value: 850,   suffix: '+', label: 'Law Firms',          icon: I.Briefcase },
  { value: 48,    suffix: '',  label: 'Countries',          icon: I.MapPin },
  { value: 98,    suffix: '%', label: 'Satisfaction',       icon: I.Star },
];

function StatItem({ stat, index }) {
  const count = useCount(stat.value, 1200 + index * 150);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ ...stagger(0.5 + index * 0.08).transition }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 28px',
        borderRight: index < STATS.length - 1 ? '1px solid rgba(124,58,237,0.12)' : 'none',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.06))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>
        <stat.icon size={16} style={{ color: '#7C3AED' }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#1E1B4B', lineHeight: 1 }}>
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {stat.label}
      </div>
    </motion.div>
  );
}

/* ─── Service Sections ───────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'studio',
    path: '/studio',
    gradient: 'linear-gradient(145deg, #7C3AED 0%, #4C1D95 60%, #2D1260 100%)',
    accentColor: '#7C3AED',
    glowRgb: '124,58,237',
    icon: I.Doc,
    tag: 'AI Self-Help',
    title: 'Document Studio',
    subtitle: 'Analyze, summarize & chat with your legal documents using AI',
    features: [
      { text: 'AI-powered contract summary & risk score' },
      { text: 'Ask your document any question, instantly' },
      { text: 'Side-by-side document comparison' },
      { text: 'Deadline & obligation extraction' },
      { text: 'Contract lifecycle tracking' },
    ],
    cta: 'Open Document Studio',
    metric: { value: '12k+', label: 'Docs Analyzed' },
  },
  {
    id: 'practice',
    path: '/practice',
    gradient: 'linear-gradient(145deg, #0EA5E9 0%, #0369A1 60%, #0C4A6E 100%)',
    accentColor: '#0EA5E9',
    glowRgb: '14,165,233',
    icon: I.Briefcase,
    tag: 'For Law Firms',
    title: 'Practice Management',
    subtitle: 'Run your entire firm from one place — matters to invoices',
    features: [
      { text: 'Matter management & Kanban pipeline' },
      { text: 'Client CRM with conflict detection' },
      { text: 'Time tracking & smart invoicing' },
      { text: 'Trust accounting & IOLTA compliance' },
      { text: 'AI assistant for every matter' },
    ],
    cta: 'Open Practice Management',
    metric: { value: '850+', label: 'Firms Onboarded' },
  },
  {
    id: 'marketplace',
    path: '/find-lawyer',
    gradient: 'linear-gradient(145deg, #10B981 0%, #047857 60%, #064E3B 100%)',
    accentColor: '#10B981',
    glowRgb: '16,185,129',
    icon: I.Scale,
    tag: 'Get Legal Help',
    title: 'Find a Lawyer',
    subtitle: 'Describe your case and get matched with verified experts',
    features: [
      { text: 'Smart matching across 12 practice areas' },
      { text: 'Lawyers from 8 countries worldwide' },
      { text: 'Send case request to multiple lawyers' },
      { text: 'Verified profiles with ratings & reviews' },
      { text: 'Video, phone or in-person consultations' },
    ],
    cta: 'Find My Lawyer',
    metric: { value: '480+', label: 'Verified Lawyers' },
  },
];

/* ─── Login Prompt Modal ─────────────────────────────────────── */
function LoginPromptModal({ service, onClose, navigate }) {
  return (
    <AnimatePresence>
      {service && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(15,10,40,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 910,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 420, borderRadius: 28,
              background: '#fff',
              boxShadow: `0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)`,
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}>
              {/* Gradient service header */}
              <div style={{
                background: service.gradient,
                padding: '28px 28px 24px',
                position: 'relative', overflow: 'hidden',
              }}>
                <motion.div style={{
                  position: 'absolute', right: -30, top: -30,
                  width: 160, height: 160, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />
                <motion.div style={{
                  position: 'absolute', left: -20, bottom: -40,
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <service.icon size={24} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {service.tag}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
                      {service.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '28px 28px 24px' }}>
                {/* Lock icon + message */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `rgba(${service.glowRgb},0.1)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}>
                    <I.Shield size={22} style={{ color: `rgb(${service.glowRgb})` }} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1E1B4B' }}>
                    Sign in to continue
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: '#6B7280', lineHeight: 1.55 }}>
                    You need an account to access <strong style={{ color: '#1E1B4B' }}>{service.title}</strong>.
                    It's free to get started.
                  </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onClose(); navigate('/login'); }}
                    style={{
                      width: '100%', padding: '13px 20px', borderRadius: 14,
                      background: service.gradient,
                      border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                      boxShadow: `0 6px 24px rgba(${service.glowRgb},0.32)`,
                    }}
                  >
                    Sign In to My Account
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onClose(); navigate('/register'); }}
                    style={{
                      width: '100%', padding: '13px 20px', borderRadius: 14,
                      background: 'rgba(124,58,237,0.06)',
                      border: `1.5px solid rgba(${service.glowRgb},0.2)`,
                      cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, color: `rgb(${service.glowRgb})`,
                    }}
                  >
                    Create Free Account
                  </motion.button>
                </div>

                {/* Dismiss */}
                <button
                  onClick={onClose}
                  style={{
                    display: 'block', width: '100%', marginTop: 14,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#9CA3AF', fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Service Card ───────────────────────────────────────────── */
function ServiceCard({ s, index, onCardClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={scaleUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 + index * 0.12 }}
      whileHover={{ y: -12 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onCardClick(s)}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        border: `1.5px solid ${hovered ? `rgba(${s.glowRgb},0.4)` : 'rgba(0,0,0,0.07)'}`,
        boxShadow: hovered
          ? `0 24px 64px rgba(${s.glowRgb},0.22), 0 4px 16px rgba(0,0,0,0.08)`
          : '0 4px 24px rgba(0,0,0,0.06)',
        transition: 'border-color 300ms, box-shadow 300ms',
      }}
    >
      {/* ── Gradient header ── */}
      <div style={{
        background: s.gradient,
        padding: '32px 28px 28px',
        position: 'relative', overflow: 'hidden',
        minHeight: 200,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* Animated orbs */}
        <motion.div
          animate={{ x: hovered ? 10 : 0, y: hovered ? -10 : 0, scale: hovered ? 1.15 : 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            position: 'absolute', right: -40, top: -40,
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <motion.div
          animate={{ x: hovered ? -8 : 0, y: hovered ? 8 : 0, scale: hovered ? 1.1 : 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          style={{
            position: 'absolute', right: 40, bottom: -60,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />
        <motion.div
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: -20, bottom: 10,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* Tag + Icon row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20, padding: '5px 14px',
            fontSize: 11, fontWeight: 700, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>{s.tag}</div>

          <motion.div
            animate={{ rotate: hovered ? 8 : 0, scale: hovered ? 1.12 : 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <s.icon size={24} style={{ color: '#fff' }} />
          </motion.div>
        </div>

        {/* Title + subtitle */}
        <div style={{ position: 'relative', marginTop: 20 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {s.title}
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, maxWidth: 260 }}>
            {s.subtitle}
          </p>
        </div>

        {/* Metric badge */}
        <div style={{
          position: 'absolute', bottom: 20, right: 24,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '7px 14px',
          border: '1px solid rgba(255,255,255,0.15)',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.metric.value}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>{s.metric.label}</div>
        </div>
      </div>

      {/* ── Feature list ── */}
      <div style={{ padding: '22px 24px 4px', flex: 1 }}>
        {s.features.map((f, fi) => (
          <motion.div
            key={fi}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.12 + fi * 0.06, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `rgba(${s.glowRgb},0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={s.accentColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4, fontWeight: 500 }}>{f.text}</span>
          </motion.div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '16px 24px 24px' }}>
        <motion.div
          animate={{
            background: hovered ? s.gradient : '#F9FAFB',
          }}
          transition={{ duration: 0.35 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 18px', borderRadius: 14,
            border: `1.5px solid ${hovered ? 'transparent' : 'rgba(0,0,0,0.08)'}`,
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: hovered ? '#fff' : '#1E1B4B',
            transition: 'color 0.35s',
          }}>{s.cta}</span>
          <motion.div animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
            <I.ArrowRight size={16} style={{ color: hovered ? '#fff' : s.accentColor, transition: 'color 0.35s' }} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function PortalHome() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [loginPrompt, setLoginPrompt] = useState(null);

  function handleCardClick(s) {
    if (!user) {
      setLoginPrompt(s);
    } else {
      navigate(s.path);
    }
  }

  const QUICK = [
    { label: 'My Documents', path: '/documents', ic: I.Folder },
    { label: 'Alerts',       path: '/alerts',   ic: I.Bell },
    { label: 'Profile',      path: '/profile',  ic: I.User },
    { label: 'Help',         path: '/help',     ic: I.Info },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F6F4FB', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background decoration ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Mesh gradient blobs */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -200, right: -150,
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{
            position: 'absolute', bottom: -150, left: -100,
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], y: [0, 25, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
          style={{
            position: 'absolute', top: '40%', left: '35%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          }}
        />
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', paddingTop: 72, paddingBottom: 52 }}>

          {/* Badge */}
          <motion.div
            variants={fadeIn} initial="hidden" animate="show"
            transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(124,58,237,0.07)',
              border: '1.5px solid rgba(124,58,237,0.18)',
              borderRadius: 40, padding: '6px 16px 6px 10px',
            }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }}
              />
              <I.Logo size={16} style={{ color: '#7C3AED' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.04em' }}>
                Nyaya Legal Platform
              </span>
              <div style={{
                background: 'linear-gradient(90deg, #7C3AED, #5B21B6)',
                borderRadius: 20, padding: '2px 8px',
                fontSize: 9, fontWeight: 800, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Live</div>
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ ...stagger(0.1).transition }}
            style={{
              margin: '0 0 16px',
              fontSize: 'clamp(34px, 5.5vw, 58px)',
              fontWeight: 900, lineHeight: 1.1,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #1E1B4B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {user ? `${greeting}, ${firstName}` : 'Your Legal Workspace'}
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ ...stagger(0.2).transition }}
            style={{
              margin: '0 auto 14px',
              fontSize: 18, color: '#6B7280',
              maxWidth: 480, lineHeight: 1.6, fontWeight: 400,
            }}
          >
            {user
              ? 'Your complete legal workspace. Choose a service to get started.'
              : 'AI-powered legal tools for everyone. Sign in to get started.'}
          </motion.p>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ ...stagger(0.28).transition }}
            style={{ margin: 0, fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}
          >
            AI-powered · Enterprise-grade · Trusted by legal professionals worldwide
          </motion.p>
        </div>

        {/* ── Stats bar ── */}
        <motion.div
          variants={scaleUp} initial="hidden" animate="show"
          transition={{ ...stagger(0.35).transition }}
          style={{
            display: 'inline-flex', alignItems: 'stretch',
            background: '#fff', borderRadius: 20,
            border: '1.5px solid rgba(124,58,237,0.12)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.08)',
            marginBottom: 52, width: '100%', maxWidth: 700,
            marginInline: 'auto',
            flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          {STATS.map((stat, i) => <StatItem key={stat.label} stat={stat} index={i} />)}
        </motion.div>

        {/* ── Service cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 52,
        }}>
          {SECTIONS.map((s, i) => (
            <ServiceCard key={s.id} s={s} index={i} onCardClick={handleCardClick} />
          ))}
        </div>

        {/* ── Quick links dock ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ ...stagger(0.9).transition }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#fff',
            border: '1.5px solid rgba(0,0,0,0.07)',
            borderRadius: 50, padding: '6px 8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          }}>
            {QUICK.map((q, qi) => (
              <QuickLink key={q.path} q={q} qi={qi} navigate={navigate} />
            ))}
          </div>
        </motion.div>

        {/* ── Footer note ── */}
        <motion.p
          variants={fadeIn} initial="hidden" animate="show"
          transition={{ ...stagger(1.1).transition }}
          style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#C4B5FD', fontWeight: 500 }}
        >
          © {new Date().getFullYear()} NyayaAI · Built for legal professionals · All data encrypted
        </motion.p>
      </div>

      {/* ── Login prompt modal ── */}
      <LoginPromptModal
        service={loginPrompt}
        onClose={() => setLoginPrompt(null)}
        navigate={navigate}
      />
    </div>
  );
}

/* ─── Quick Link Button ──────────────────────────────────────── */
function QuickLink({ q, qi, navigate }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      key={qi}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.95 + qi * 0.06, duration: 0.35 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onClick={() => navigate(q.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 40,
        border: 'none',
        background: hov ? 'rgba(124,58,237,0.08)' : 'transparent',
        cursor: 'pointer',
        fontSize: 13, fontWeight: 600,
        color: hov ? '#7C3AED' : '#6B7280',
        transition: 'all 200ms',
        whiteSpace: 'nowrap',
      }}
    >
      <q.ic size={14} />
      {q.label}
    </motion.button>
  );
}
