import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp   = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
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

/* ─── Stats Data ─────────────────────────────────────────────── */
const STATS = [
  { value: 12000, suffix: '+', label: 'Docs Processed', icon: I.Doc },
  { value: 850,   suffix: '+', label: 'Active Law Firms', icon: I.Briefcase },
  { value: 48,    suffix: '',  label: 'Jurisdictions', icon: I.Globe },
  { value: 99.8,  suffix: '%', label: 'AI Precision', icon: I.Shield },
];

function StatItem({ stat, index }) {
  const count = useCount(stat.value, 1200 + index * 120);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ ...stagger(0.35 + index * 0.07).transition }}
      whileHover={{ y: -4, scale: 1.02 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px 16px',
        borderRadius: 20,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 10px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 14,
        background: 'rgba(124, 58, 237, 0.16)',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10, color: '#c084fc',
        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
      }}>
        <stat.icon size={20} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#f0eeff', lineHeight: 1, fontFamily: 'var(--font-headline)' }}>
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div style={{ fontSize: 10.5, color: 'rgba(240, 238, 255, 0.48)', fontWeight: 700, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {stat.label}
      </div>
    </motion.div>
  );
}

/* ─── Services Catalog ───────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: I.Layers },
  { id: 'ai', label: 'AI Intelligence', icon: I.Sparkle },
  { id: 'firm', label: 'Firm Practice', icon: I.Building },
  { id: 'help', label: 'Legal Network', icon: I.Scale },
];

const SECTIONS = [
  {
    id: 'studio',
    category: 'ai',
    path: '/studio',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
    accentColor: '#c084fc',
    glowRgb: '124, 58, 237',
    icon: I.Doc,
    tag: 'AI Self-Help',
    badge: 'Popular',
    title: 'Document Studio',
    subtitle: 'Analyze, summarize & chat with complex legal contracts using Gemini AI',
    features: [
      { text: 'AI-powered contract summary & risk scoring' },
      { text: 'Instant Q&A with full source references' },
      { text: 'Side-by-side legal document comparison' },
      { text: 'Automated obligation & deadline extraction' },
      { text: 'Contract lifecycle tracking & alerts' },
    ],
    cta: 'Launch Document Studio',
    metric: { value: '12k+', label: 'Docs Processed' },
  },
  {
    id: 'practice',
    category: 'firm',
    path: '/practice',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
    accentColor: '#38bdf8',
    glowRgb: '14, 165, 233',
    icon: I.Briefcase,
    tag: 'For Law Practice',
    badge: 'Enterprise',
    title: 'Practice Management',
    subtitle: 'Manage case lifecycle, billing, matters, and clients in one central hub',
    features: [
      { text: 'Matter management with Kanban pipeline' },
      { text: 'Client CRM & instant conflict checking' },
      { text: 'Automated time tracking & LEDES invoicing' },
      { text: 'Trust accounting & IOLTA compliance' },
      { text: 'Dedicated AI assistant per active matter' },
    ],
    cta: 'Open Practice Hub',
    metric: { value: '850+', label: 'Firms Onboarded' },
  },
  {
    id: 'marketplace',
    category: 'help',
    path: '/find-lawyer',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
    accentColor: '#34d399',
    glowRgb: '16, 185, 129',
    icon: I.Scale,
    tag: 'Verified Network',
    badge: '24/7 Access',
    title: 'Find a Lawyer',
    subtitle: 'Describe your case and get matched with top rated legal advocates',
    features: [
      { text: 'Smart matching across 12 legal specializations' },
      { text: 'Verified advocate profiles with ratings' },
      { text: 'Direct case inquiry to multiple lawyers' },
      { text: 'Secure video, phone & in-person consultations' },
      { text: 'Transparent fee structures & retainer terms' },
    ],
    cta: 'Find Verified Lawyer',
    metric: { value: '480+', label: 'Verified Lawyers' },
  },
  {
    id: 'ask-ai',
    category: 'ai',
    path: '/ask',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 50%, #831843 100%)',
    accentColor: '#f472b6',
    glowRgb: '219, 39, 119',
    icon: I.Sparkle,
    tag: 'Instant Assistant',
    badge: 'New AI',
    title: 'Legal AI Chat Assistant',
    subtitle: 'Get immediate legal research answers grounded in updated case law',
    features: [
      { text: 'Real-time citation of statute laws & precedent' },
      { text: 'Draft notice responses & formal legal letters' },
      { text: 'Multilingual support for national jurisdiction' },
      { text: 'Context-aware conversational intelligence' },
    ],
    cta: 'Chat with Legal AI',
    metric: { value: '99.4%', label: 'Query Precision' },
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
              background: 'rgba(5, 3, 15, 0.78)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          />

          {/* Modal Card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 910,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 440, borderRadius: 24,
              background: 'rgba(18, 14, 42, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: `0 30px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15)`,
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}>
              {/* Header */}
              <div style={{
                background: service.gradient,
                padding: '24px 24px 20px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <service.icon size={22} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {service.tag}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.15, fontFamily: 'var(--font-headline)' }}>
                      {service.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '24px 24px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `rgba(${service.glowRgb}, 0.15)`,
                    border: `1px solid rgba(${service.glowRgb}, 0.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', color: service.accentColor,
                  }}>
                    <I.Shield size={22} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)' }}>
                    Authentication Required
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(240,238,255,0.6)', lineHeight: 1.5 }}>
                    Please sign in or create a workspace account to access <strong style={{ color: '#fff' }}>{service.title}</strong>.
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    onClick={() => { onClose(); navigate('/login'); }}
                    style={{
                      width: '100%', height: 48, borderRadius: 13,
                      background: service.gradient,
                      border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 800, color: '#fff',
                      boxShadow: `0 6px 20px rgba(${service.glowRgb}, 0.4)`,
                    }}
                  >
                    Sign In to Continue
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    onClick={() => { onClose(); navigate('/register'); }}
                    style={{
                      width: '100%', height: 48, borderRadius: 13,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1.5px solid rgba(${service.glowRgb}, 0.4)`,
                      cursor: 'pointer',
                      fontSize: 14, fontWeight: 800, color: service.accentColor,
                    }}
                  >
                    Create Free Workspace
                  </motion.button>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    display: 'block', width: '100%', marginTop: 14,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12.5, color: 'rgba(240,238,255,0.4)', fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Service Card Component ─────────────────────────────────── */
function ServiceCard({ s, index, onCardClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={scaleUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 + index * 0.09 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onCardClick(s)}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(20, 16, 48, 0.65)',
        border: `1.5px solid ${hovered ? `rgba(${s.glowRgb}, 0.6)` : 'rgba(255, 255, 255, 0.09)'}`,
        boxShadow: hovered
          ? `0 22px 55px rgba(${s.glowRgb}, 0.3), 0 0 0 1px rgba(255,255,255,0.18)`
          : '0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      {/* Specular top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 0%, rgba(${s.glowRgb}, 0.7) 50%, transparent 100%)`,
        opacity: hovered ? 1 : 0.4, transition: 'opacity 0.3s',
      }} />

      {/* Card Header */}
      <div style={{
        background: s.gradient,
        padding: '24px 22px 20px',
        position: 'relative', overflow: 'hidden',
        minHeight: 170,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* Header Ambient Orbs */}
        <motion.div animate={{ scale: hovered ? 1.15 : 1 }} transition={{ duration: 0.8 }}
          style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        {/* Top Tag & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              borderRadius: 20, padding: '4px 12px', fontSize: 10.5, fontWeight: 800, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(255,255,255,0.25)',
            }}>{s.tag}</span>
            {s.badge && (
              <span style={{
                background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '3px 9px',
                fontSize: 9.5, fontWeight: 900, color: '#120f26', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{s.badge}</span>
            )}
          </div>

          <motion.div animate={{ rotate: hovered ? 6 : 0, scale: hovered ? 1.08 : 1 }} transition={{ duration: 0.3 }}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <s.icon size={22} style={{ color: '#fff' }} />
          </motion.div>
        </div>

        {/* Title & Subtitle */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 14 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.15, fontFamily: 'var(--font-headline)' }}>
            {s.title}
          </h2>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, maxWidth: 280 }}>
            {s.subtitle}
          </p>
        </div>
      </div>

      {/* Feature List */}
      <div style={{ padding: '20px 20px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.features.map((f, fi) => (
          <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 6, flexShrink: 0,
              background: `rgba(${s.glowRgb}, 0.18)`, border: `1px solid rgba(${s.glowRgb}, 0.35)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accentColor,
            }}>
              <I.Check size={11} />
            </div>
            <span style={{ fontSize: 12.5, color: 'rgba(240, 238, 255, 0.75)', lineHeight: 1.35, fontWeight: 500 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Metric & CTA Footer */}
      <div style={{ padding: '16px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          animate={{
            background: hovered ? s.gradient : 'rgba(255, 255, 255, 0.04)',
            boxShadow: hovered ? `0 6px 20px rgba(${s.glowRgb}, 0.4)` : 'none',
          }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', borderRadius: 14,
            border: `1.5px solid ${hovered ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
            minHeight: 48,
          }}
        >
          <span style={{
            fontSize: 13.5, fontWeight: 800,
            color: '#fff',
            fontFamily: 'var(--font-headline)',
            letterSpacing: '-0.01em',
          }}>{s.cta}</span>
          <motion.div animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
            <I.ArrowRight size={16} style={{ color: '#fff' }} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Main PortalHome Page Component ─────────────────────────── */
export default function PortalHome() {
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [loginPrompt, setLoginPrompt]       = useState(null);

  function handleCardClick(s) {
    if (!user) {
      setLoginPrompt(s);
    } else {
      navigate(s.path);
    }
  }

  /* Filter sections based on category and search query */
  const filteredSections = SECTIONS.filter(s => {
    const matchesCat = activeCategory === 'all' || s.category === activeCategory;
    const matchesQuery = !searchQuery.trim() || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.features.some(f => f.text.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const QUICK = [
    { label: 'Documents', path: '/documents', ic: I.Folder },
    { label: 'Alerts',    path: '/alerts',    ic: I.Bell },
    { label: 'Profile',   path: '/profile',   ic: I.User },
    { label: 'Help',      path: '/help',      ic: I.Info },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070514', color: '#f0eeff', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Ambient Floating Background Orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.12, 1], x: [0, 25, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -180, right: -120,
            width: 550, height: 550, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', bottom: -120, left: -80,
            width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ── Content Wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 20px 140px' }}>

        {/* ── Responsive Top Header Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 24, paddingBottom: 24,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(167, 139, 250, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
              <I.Logo size={19} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI Services</span>
          </div>

          {/* User badge or Auth controls */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: '5px 12px 5px 8px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  {firstName[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f0eeff' }}>{firstName}</span>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                style={{ background: 'none', border: 'none', color: 'rgba(240,238,255,0.4)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                title="Sign Out"
              >
                <I.LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#f0eeff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* ── Hero Section ── */}
        <div style={{ textAlign: 'center', paddingTop: 44, paddingBottom: 36 }}>
          {/* Platform Status Pill */}
          <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ duration: 0.4 }} style={{ display: 'inline-flex', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(167, 139, 250, 0.25)',
              borderRadius: 30, padding: '5px 14px',
            }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#c084fc', letterSpacing: '0.04em' }}>Legal Intelligence Platform</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ ...stagger(0.1).transition }}
            style={{
              margin: '0 0 14px',
              fontSize: 'clamp(30px, 5.2vw, 54px)',
              fontWeight: 900, lineHeight: 1.12,
              letterSpacing: '-0.035em',
              fontFamily: 'var(--font-headline)',
              color: '#f0eeff',
            }}
          >
            {user ? `${greeting}, ${firstName}` : 'Legal Workspace & Services'}
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ ...stagger(0.18).transition }}
            style={{
              margin: '0 auto 28px',
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: 'rgba(240, 238, 255, 0.55)',
              maxWidth: 520, lineHeight: 1.6, fontWeight: 400,
            }}
          >
            Empowering legal professionals, clients, and law firms with AI contract analysis, practice management, and verified legal advocates.
          </motion.p>

          {/* Search Bar & Category Segmented Tabs */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ ...stagger(0.25).transition }}
            style={{ maxWidth: 580, margin: '0 auto' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <I.Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,238,255,0.4)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search services (e.g., contract analysis, practice hub, lawyer...)"
                style={{
                  width: '100%', height: 50, paddingLeft: 46, paddingRight: 40,
                  borderRadius: 14, border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.04)', color: '#f0eeff',
                  fontSize: 14, outline: 'none', backdropFilter: 'blur(16px)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  boxSizing: 'border-box', transition: 'all 0.2s ease',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(240,238,255,0.4)', cursor: 'pointer' }}>
                  <I.X size={16} />
                </button>
              )}
            </div>

            {/* Category Segmented Tabs (No Scrollbars) */}
            <div
              className="no-scrollbar"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '4px 6px',
                justifyContent: 'center', msOverflowStyle: 'none', scrollbarWidth: 'none',
                background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      position: 'relative',
                      padding: '8px 16px', borderRadius: 12, border: 'none',
                      background: 'transparent',
                      color: active ? '#ffffff' : 'rgba(240, 238, 255, 0.55)',
                      fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6, zIndex: 1,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeCategoryPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 12,
                          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                          boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
                          zIndex: -1,
                        }}
                      />
                    )}
                    <cat.icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Stats Strip Grid (2x2 Mobile, 4x1 Desktop) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 44,
        }}>
          {STATS.map((s, i) => (
            <StatItem key={s.label} stat={s} index={i} />
          ))}
        </div>

        {/* ── Services Cards Grid ── */}
        {filteredSections.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 22,
            marginBottom: 52,
          }}>
            {filteredSections.map((s, i) => (
              <ServiceCard key={s.id} s={s} index={i} onCardClick={handleCardClick} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)', marginBottom: 52 }}>
            <I.Search size={32} style={{ color: 'rgba(240,238,255,0.3)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f0eeff', marginBottom: 4 }}>No matching services found</h3>
            <p style={{ fontSize: 13, color: 'rgba(240,238,255,0.4)', margin: 0 }}>Try clearing your search query or switching categories</p>
          </div>
        )}
      </div>

      {/* ── Ultra-Cool Floating Mobile & Desktop Glass Dock (FIXED AT BOTTOM, NO SCROLLBAR) ── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 800,
            maxWidth: '92vw',
          }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="no-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 8px',
              borderRadius: 40,
              background: 'rgba(16, 12, 40, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              overflowX: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              position: 'relative',
            }}
          >
            {/* Top specular glow line */}
            <div style={{
              position: 'absolute', top: 0, left: 20, right: 20, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.6), transparent)',
              pointerEvents: 'none',
            }} />

            {QUICK.map((q) => (
              <motion.button
                key={q.path}
                whileHover={{ scale: 1.05, background: 'rgba(124, 58, 237, 0.2)' }}
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate(q.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 30,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#f0eeff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <q.ic size={15} style={{ color: '#c084fc' }} />
                <span>{q.label}</span>
              </motion.button>
            ))}

            <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px' }} />

            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.94 }}
              onClick={async () => { await logout(); navigate('/login'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 30,
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <I.LogOut size={14} />
              <span>Out</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Login prompt modal ── */}
      <LoginPromptModal
        service={loginPrompt}
        onClose={() => setLoginPrompt(null)}
        navigate={navigate}
      />
    </div>
  );
}
