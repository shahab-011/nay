import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

/* ── Motion presets ──────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];

const itemV = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

const cardV = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};

const containerV = (stagger = 0.1, delay = 0) => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger, delayChildren: delay } },
});

function Reveal({ children, variants = containerV(0.12), style, className }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={variants}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Products list ── */
const NAV_PRODUCTS = [
  {
    icon: I.Doc,
    title: 'Document Studio',
    desc: 'AI-powered document analysis & chat',
    path: '/studio',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.09)',
    tag: 'Self-Help',
  },
  {
    icon: I.Briefcase,
    title: 'Practice Management',
    desc: 'Full law firm management platform',
    path: '/practice',
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.09)',
    tag: 'For Firms',
  },
  {
    icon: I.Scale,
    title: 'Find a Lawyer',
    desc: 'Match with verified legal experts',
    path: '/find-lawyer',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.09)',
    tag: 'Marketplace',
  },
];

/* ── Navbar ── */
function PublicNav({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!productsOpen) return;
    const fn = (e) => {
      if (!e.target.closest('[data-products-menu]')) setProductsOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [productsOpen]);

  const navBtnStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '8px 14px', borderRadius: 10, border: 'none',
    background: active ? 'var(--purple-soft)' : 'transparent',
    color: active ? 'var(--purple)' : 'var(--ink)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  });

  return (
    <>
      <motion.nav
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          boxShadow: scrolled ? '0 1px 0 rgba(11,11,20,0.07), 0 8px 32px rgba(11,11,20,0.06)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'rgba(232,228,238,0.7)' : 'transparent'}`,
          transition: 'background 0.4s, box-shadow 0.4s, border-color 0.4s',
        }}
      >
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 28px',
          height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <motion.div
            className="wordmark"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <I.Logo size={28} />
            <span>Nyaya</span>
            <span className="wordmark-dot">.</span>
          </motion.div>

          {/* Centre nav */}
          <motion.div
            className="lp-pill-nav"
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.22, duration: 0.6, ease }}
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: scrolled ? 'rgba(246,244,251,0.8)' : 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(124,58,237,0.10)',
              borderRadius: 14, padding: '5px 6px',
            }}
          >
            {/* Products dropdown */}
            <div data-products-menu style={{ position: 'relative' }}>
              <motion.button
                onClick={() => setProductsOpen(v => !v)}
                whileHover={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}
                style={navBtnStyle(productsOpen)}
              >
                Products
                <motion.span animate={{ rotate: productsOpen ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ display: 'flex', color: productsOpen ? 'var(--purple)' : '#9CA3AF' }}>
                  <I.Chevron size={14} />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    data-products-menu
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.22, ease }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                      transform: 'translateX(-50%)', width: 340, background: '#fff',
                      borderRadius: 20, border: '1px solid rgba(124,58,237,0.12)',
                      boxShadow: '0 24px 60px rgba(11,11,20,0.13), 0 4px 16px rgba(124,58,237,0.08)',
                      padding: 10, zIndex: 300,
                    }}
                  >
                    {NAV_PRODUCTS.map((p, pi) => (
                      <motion.div
                        key={p.title}
                        onClick={() => { navigate(p.path); setProductsOpen(false); }}
                        whileHover={{ background: 'rgba(124,58,237,0.04)' }}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 13, cursor: 'pointer' }}
                      >
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p.icon size={19} style={{ color: p.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{p.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active For Individuals Pill */}
            <motion.button
              onClick={() => navigate('/for-individuals')}
              style={navBtnStyle(true)}
            >
              For Individuals
            </motion.button>

            {/* For Law Firms */}
            <motion.button
              onClick={() => navigate('/register')}
              whileHover={{ background: 'rgba(14,165,233,0.08)', color: '#0EA5E9' }}
              style={navBtnStyle(false)}
            >
              <I.Briefcase size={13} style={{ opacity: 0.7 }} />
              For Law Firms
            </motion.button>
          </motion.div>

          {/* Right CTAs */}
          <motion.div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <motion.button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign In
            </motion.button>
            <motion.button
              className="btn btn-purple btn-sm"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 32px rgba(124,58,237,0.42)' }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Get Started
              <I.ArrowRight size={13} />
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>
    </>
  );
}

/* ── Interactive Silence Detector Card Demo ── */
function SilenceDetectorDemo() {
  const [activeTab, setActiveTab] = useState('missing');

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 24,
      border: '1px solid rgba(124, 58, 237, 0.16)',
      boxShadow: '0 24px 60px rgba(11, 11, 20, 0.08), 0 4px 20px rgba(124, 58, 237, 0.06)',
      overflow: 'hidden',
      textAlign: 'left',
    }}>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        padding: '18px 24px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Search size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-headline)' }}>"Silence Detector" Engine</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Proactive Missing Clause & Trap Detector</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          DPDP 2023 Compliant
        </span>
      </div>

      {/* Selector Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', background: '#FAFAFC', padding: '6px 12px' }}>
        {[
          { id: 'missing', label: '🕵️ Missing Clauses (Silence)', count: 2 },
          { id: 'predatory', label: '⚠️ Predatory Terms', count: 3 },
          { id: 'counter', label: '✍️ Counter Offer Draft', count: 1 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === t.id ? '#ffffff' : 'transparent',
              color: activeTab === t.id ? '#7c3aed' : '#6B7280',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
              marginRight: 6,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 24 }}>
        {activeTab === 'missing' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#FFF5F5', border: '1px solid #FECDD3', borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#E11D48' }}>CRITICAL OMISSION DETECTED</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#E11D48', padding: '2px 8px', background: '#FFE4E6', borderRadius: 12 }}>HIGH RISK</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>No Mutual Termination Rights</div>
              <p style={{ fontSize: 12.5, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                The contract allows the employer to terminate with 0 days notice, but omits your right to exit or resign without a 90-day penalty.
              </p>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#D97706' }}>MISSING STATUTORY PROTECTION</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#D97706', padding: '2px 8px', background: '#FEF3C7', borderRadius: 12 }}>MEDIUM RISK</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>Limitation of Liability Cap Missing</div>
              <p style={{ fontSize: 12.5, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                No ceiling is defined on your personal financial indemnity. Under Indian contract law, this exposes you to unlimited damages.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'predatory' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', marginBottom: 6 }}>Clause 14.2 — Unreasonable Non-Compete</div>
              <p style={{ fontSize: 12.5, color: '#4B5563', margin: '0 0 10px', lineHeight: 1.5 }}>
                "Employee shall not work for any competitor worldwide for 24 months post-employment."
              </p>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '8px 12px', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                💡 <strong>Legal Context (Section 27 Indian Contract Act):</strong> Post-employment non-compete clauses are unenforceable in India.
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'counter' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Generated Counter Proposal Email</div>
              <div style={{ fontSize: 12.5, color: '#334155', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {`Subject: Proposed Revisions to Service Agreement - Clause 14.2 & Termination Terms\n\nDear [Hiring Manager],\n\nThank you for sharing the agreement. I am eager to join. Upon review, I would like to request two standard amendments:\n\n1. Clause 14.2 (Non-compete): Limit duration to active employment term as per Indian Contract Act Sec 27.\n2. Clause 8 (Termination): Make 30-day notice period mutual for both parties.\n\nLooking forward to the updated draft.`}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Main ForIndividuals Page ── */
export default function ForIndividuals() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          className="blob"
          animate={{ x: [0, 28, -18, 0], y: [0, -44, 22, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 580, height: 580, background: '#C4B5FD', top: -100, left: -140, opacity: 0.35 }}
        />
        <motion.div
          className="blob"
          animate={{ x: [0, -24, 18, 0], y: [0, 38, -28, 0], scale: [1, 0.94, 1.06, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{ width: 500, height: 500, background: '#DDD6FE', top: 320, right: -120, opacity: 0.4 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicNav navigate={navigate} />

        {/* ══ HERO SECTION ══════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px 80px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
          {/* Section 1 Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            style={{ display: 'inline-block', marginBottom: 28 }}
          >
            <span className="pill" style={{ fontSize: 13, padding: '8px 18px', background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.25)' }}>
              <span className="pill-dot" style={{ animation: 'pulse-purple 2s infinite' }} />
              Section 1 · Pre-Connection AI Document Intelligence
            </span>
          </motion.div>

          {/* Display Headline */}
          <div style={{ overflow: 'hidden' }}>
            <motion.h1
              className="h-display"
              style={{ fontSize: 'clamp(46px, 7vw, 102px)', maxWidth: 1100, margin: '0 auto', lineHeight: 0.98 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.35 }}
                style={{ display: 'block', color: 'var(--ink)' }}
              >
                Understand contracts before you sign.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.5 }}
                style={{ display: 'block', color: 'var(--purple)' }}
              >
                Zero traps. 100% Private.
              </motion.span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="t-secondary"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.65 }}
            style={{ fontSize: 19, maxWidth: 680, margin: '30px auto 44px', lineHeight: 1.6 }}
          >
            Protecting citizens & SMEs from predatory terms. Powered by zero-trust local WebAssembly (WASM) browser memory parsing and Gemini AI contract intelligence.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.78 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}
          >
            <motion.button
              className="btn btn-purple btn-lg"
              onClick={() => navigate('/studio')}
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 14px 38px rgba(124,58,237,0.38)' }}
              whileTap={{ scale: 0.97 }}
            >
              Analyze Document Now <I.ArrowRight size={17} />
            </motion.button>

            <motion.button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/intake')}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Take Guided Legal Quiz
            </motion.button>
          </motion.div>

          {/* Feature Highlights Strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {[
              { icon: <I.Lock size={14} />, label: 'DPDP Act 2023 Compliant' },
              { icon: <I.Shield size={14} />, label: 'Client-Side WASM Memory' },
              { icon: <I.Search size={14} />, label: 'Proactive Silence Detector' },
              { icon: <I.Sparkle size={14} />, label: 'Instant Risk Scoring' },
            ].map(({ icon, label }) => (
              <span key={label} className="pill" style={{ fontSize: 12.5, padding: '7px 15px', background: '#fff' }}>
                <span style={{ color: 'var(--purple)', display: 'flex' }}>{icon}</span>
                {label}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ══ INTERACTIVE DEMO SHOWCASE ═════════════════════════════ */}
        <section style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
          <Reveal>
            <SilenceDetectorDemo />
          </Reveal>
        </section>

        {/* ══ 4 CORE ENGINES OF SECTION 1 ═══════════════════════════ */}
        <section style={{ maxWidth: 1240, margin: '0 auto 140px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="pill" style={{ marginBottom: 14, fontSize: 12 }}>
              <span className="pill-dot" /> Engineered Capabilities
            </span>
            <h2 className="h-display" style={{ fontSize: 'clamp(32px, 5vw, 54px)', color: 'var(--ink)' }}>
              How Nyaya AI Protects Your Contracts
            </h2>
            <p className="t-secondary" style={{ fontSize: 17, maxWidth: 580, margin: '14px auto 0' }}>
              Four specialized sub-engines operating together to decode, audit, and negotiate legal contracts.
            </p>
          </div>

          <Reveal variants={containerV(0.12)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
            {[
              {
                icon: <I.Lock size={22} />,
                tag: 'DPDP 2023 Compliant',
                title: 'Zero-Trust Private Mode',
                desc: 'PDF.js & WebAssembly (WASM) parse document text strictly inside your local browser memory heap. 0 bytes uploaded to servers.',
              },
              {
                icon: <I.Search size={22} />,
                tag: 'Patent-Pending Engine',
                title: 'The "Silence Detector"',
                desc: 'Proactively identifies critical legal protections, indemnity caps, and termination rights strategically omitted from contracts.',
              },
              {
                icon: <I.Sparkle size={22} />,
                tag: 'Gemini RAG Pipeline',
                title: 'Plain-Language Translation',
                desc: 'Translates dense legal jargon into conversational English, highlighting high, medium, and low risk clauses with exact page references.',
              },
              {
                icon: <I.Edit size={22} />,
                tag: 'Automated Negotiations',
                title: 'Counter Offer Generator',
                desc: 'Instantly drafts professional, legally sound negotiation emails and counter-proposals based on contract risks found.',
              },
            ].map(f => (
              <motion.div
                key={f.title}
                variants={cardV}
                whileHover={{ y: -7, boxShadow: '0 20px 48px rgba(11,11,20,0.10)' }}
                className="card"
                style={{ padding: 32, background: 'var(--surface)', cursor: 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div className="icon-tile" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'var(--purple-soft)', color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="h-title" style={{ fontSize: 21, marginBottom: 10 }}>{f.title}</h3>
                <p className="t-secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </section>

        {/* ══ STEP-BY-STEP PROCESS ═══════════════════════════════════ */}
        <section style={{ maxWidth: 1240, margin: '0 auto 140px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 className="h-display" style={{ fontSize: 'clamp(32px, 5vw, 54px)' }}>
              3 Simple Steps to Contract Safety
            </h2>
          </div>

          <Reveal variants={containerV(0.14)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                n: 1,
                title: 'Upload Any Contract',
                desc: 'Drag & drop your employment offer, rent agreement, NDA, or service contract (PDF/Docx). Processing happens locally in WASM memory.',
                ic: <I.Upload size={22} />,
              },
              {
                n: 2,
                title: 'Review Risk Audit & Missing Clauses',
                desc: 'View your contract health score (0-100), flagged predatory terms, and missing legal protections detected by the Silence Engine.',
                ic: <I.Shield size={22} />,
              },
              {
                n: 3,
                title: 'Export Counter Offer or Connect Lawyer',
                desc: 'Generate negotiation emails with one click. If complex disputes arise, seamlessly route full context to BCI-verified lawyers.',
                ic: <I.ArrowRight size={22} />,
              },
            ].map(s => (
              <motion.div
                key={s.n}
                variants={cardV}
                whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(11,11,20,0.10)' }}
                className="card"
                style={{ padding: 32, position: 'relative' }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--purple)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                  STEP 0{s.n}
                </div>
                <h3 className="h-title" style={{ fontSize: 22, marginBottom: 12 }}>{s.title}</h3>
                <p className="t-secondary" style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </section>

        {/* ══ BRIDGE TO SECTION 2 (SMART MATCHMAKING) ═══════════════ */}
        <section style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
          <Reveal>
            <div style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
              borderRadius: 28,
              padding: '52px 40px',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.12)', color: '#c084fc', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 20 }}>
                  <I.Scale size={13} /> Seamless Transition to Section 2
                </span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, fontFamily: 'var(--font-headline)', marginBottom: 16, lineHeight: 1.15 }}>
                  Need Professional Advocate Assistance?
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.6 }}>
                  If your contract audit reveals high-risk disputes, our Algorithmic Contextual Matchmaking instantly routes your case details & AI risk findings to BCI-verified legal advocates.
                </p>

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <motion.button
                    className="btn btn-purple btn-lg"
                    onClick={() => navigate('/find-lawyer')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Find Verified Advocate <I.ArrowRight size={17} />
                  </motion.button>
                  <motion.button
                    className="btn btn-secondary btn-lg"
                    onClick={() => navigate('/studio')}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Launch Document Studio
                  </motion.button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

      </div>
    </div>
  );
}
