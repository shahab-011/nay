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
            }}
          >
            {/* Home */}
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}
              style={navBtnStyle(false)}
            >
              <I.Home size={13} style={{ opacity: 0.8 }} />
              Home
            </motion.button>

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

            {/* For Individuals */}
            <motion.button
              onClick={() => navigate('/for-individuals')}
              whileHover={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}
              style={navBtnStyle(false)}
            >
              For Individuals
            </motion.button>

            {/* Active For Law Firms Pill */}
            <motion.button
              onClick={() => navigate('/for-law-firms')}
              style={navBtnStyle(true)}
            >
              <I.Briefcase size={13} style={{ color: 'var(--purple)' }} />
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

/* ── Interactive SaaS Workstation Demo Component ── */
function SaaSWorkstationDemo() {
  const [activeModule, setActiveModule] = useState('matters');

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 24,
      border: '1px solid rgba(14, 165, 233, 0.2)',
      boxShadow: '0 24px 60px rgba(14, 165, 233, 0.08), 0 4px 20px rgba(11, 11, 20, 0.05)',
      overflow: 'hidden',
      textAlign: 'left',
    }}>
      {/* SaaS Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        padding: '18px 24px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Briefcase size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-headline)' }}>Enterprise Practice Management SaaS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>15 Integrated BCI-Compliant Law Practice Modules</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          BCI & GST Compliant
        </span>
      </div>

      {/* Module Selector Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', background: '#FAFAFC', padding: '6px 12px', overflowX: 'auto' }}>
        {[
          { id: 'matters', label: '⚖️ Matter Kanban Pipeline' },
          { id: 'limitation', label: '⏱️ Limitation Act 1963 Alerts' },
          { id: 'conflict', label: '🛡️ Conflict Checker (BCI Rule 33)' },
          { id: 'billing', label: '💳 Native INR & 18% GST Invoicing' },
          { id: 'trust', label: '🔒 Append-Only Trust Ledgers' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveModule(t.id)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeModule === t.id ? '#ffffff' : 'transparent',
              color: activeModule === t.id ? '#0284c7' : '#6B7280',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: activeModule === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
              marginRight: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Module View */}
      <div style={{ padding: 24 }}>
        {activeModule === 'matters' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0369A1', marginBottom: 8, textTransform: 'uppercase' }}>INTAKE (3)</div>
                <div style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #E0F2FE', marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B' }}>Sharma Property Dispute</div>
                  <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>Delhi High Court · civil</div>
                </div>
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#B45309', marginBottom: 8, textTransform: 'uppercase' }}>DISCOVERY (2)</div>
                <div style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #FEF3C7', marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B' }}>TechCorp Employment Audit</div>
                  <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>Silence Detector Audit Done</div>
                </div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', marginBottom: 8, textTransform: 'uppercase' }}>ACTIVE COURT HEARING (4)</div>
                <div style={{ background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #D1FAE5' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B' }}>Apex Infra Arbitration</div>
                  <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>Hearing Date: Aug 12, 2026</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeModule === 'limitation' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#E11D48' }}>LIMITATION ACT 1963 STATUTORY DEADLINE</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#E11D48', padding: '2px 8px', background: '#FFE4E6', borderRadius: 12 }}>3 DAYS REMAINING</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 4 }}>Article 54 — Suit for Specific Performance</div>
              <p style={{ fontSize: 12.5, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Statutory limitation period of 3 years expires on August 9, 2026. Cron engine automatically notified lead counsel & paralegal team.
              </p>
            </div>
          </motion.div>
        )}

        {activeModule === 'conflict' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', marginBottom: 6 }}>BCI Rule 33 — Conflict of Interest Engine</div>
              <p style={{ fontSize: 12.5, color: '#4B5563', margin: '0 0 10px', lineHeight: 1.5 }}>
                Automated cryptographic scan across historical firm matters flagged a prior representation of opposing party "Nexus Retail Private Limited" in 2024.
              </p>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '8px 12px', borderRadius: 8, border: '1px solid #FDE68A' }}>
                ⚠️ <strong>Advocate Action Required:</strong> Ethical wall required or decline representation to maintain Bar Council of India compliance.
              </div>
            </div>
          </motion.div>
        )}

        {activeModule === 'billing' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0284C7' }}>INVOICE #INV-2026-089</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>PAID (UPI)</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                <div>Legal Research & Drafting: ₹25,000.00</div>
                <div>Automated GST (18%): ₹4,500.00</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>Total Billed: ₹29,500.00</div>
              </div>
            </div>
          </motion.div>
        )}

        {activeModule === 'trust' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#047857', marginBottom: 6 }}>BCI Double-Ledger Append-Only Trust Accounting</div>
              <p style={{ fontSize: 12.5, color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                Cryptographic immutable audit trail for client retainers. Funds isolated from firm operating accounts with zero co-mingling.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Main ForLawFirms Page Component ── */
export default function ForLawFirms() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          className="blob"
          animate={{ x: [0, 28, -18, 0], y: [0, -44, 22, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 580, height: 580, background: '#BAE6FD', top: -100, left: -140, opacity: 0.35 }}
        />
        <motion.div
          className="blob"
          animate={{ x: [0, -24, 18, 0], y: [0, 38, -28, 0], scale: [1, 0.94, 1.06, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{ width: 500, height: 500, background: '#E0F2FE', top: 320, right: -120, opacity: 0.4 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicNav navigate={navigate} />

        {/* ══ HERO SECTION ══════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px 80px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
          {/* Section 3 Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            style={{ display: 'inline-block', marginBottom: 28 }}
          >
            <span className="pill" style={{ fontSize: 13, padding: '8px 18px', background: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.25)', color: '#0369A1' }}>
              <span className="pill-dot" style={{ background: '#0EA5E9', animation: 'pulse-blue 2s infinite' }} />
              Section 3 · BCI-Compliant Enterprise Practice Management SaaS
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
                Modern operations for solo advocates & law firms.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.5 }}
                style={{ display: 'block', color: '#0284C7' }}
              >
                15 Modules. BCI & GST Ready.
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
            Eliminate administrative overload. Automated Limitation Act 1963 deadline tracking, append-only trust accounting, native INR/18% GST invoicing, and dedicated AI per active matter.
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
              onClick={() => navigate('/register')}
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 14px 38px rgba(14,165,233,0.35)' }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Law Firm Free Trial <I.ArrowRight size={17} />
            </motion.button>

            <motion.button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/practice')}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Practice Hub
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
              { icon: <I.Briefcase size={14} />, label: '15 Integrated SaaS Modules' },
              { icon: <I.Clock size={14} />, label: 'Limitation Act 1963 Cron Engine' },
              { icon: <I.Shield size={14} />, label: 'BCI Rule 33 Conflict Checker' },
              { icon: <I.Lock size={14} />, label: 'Multi-Tenant RBAC Cryptographic Isolation' },
            ].map(({ icon, label }) => (
              <span key={label} className="pill" style={{ fontSize: 12.5, padding: '7px 15px', background: '#fff', color: '#0369A1' }}>
                <span style={{ color: '#0284C7', display: 'flex' }}>{icon}</span>
                {label}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ══ INTERACTIVE DEMO SHOWCASE ═════════════════════════════ */}
        <section style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
          <Reveal>
            <SaaSWorkstationDemo />
          </Reveal>
        </section>

        {/* ══ 15 MODULES & ENTERPRISE CAPABILITIES ══════════════════ */}
        <section style={{ maxWidth: 1240, margin: '0 auto 140px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="pill" style={{ marginBottom: 14, fontSize: 12, color: '#0369A1' }}>
              <span className="pill-dot" style={{ background: '#0284C7' }} /> Built For Indian Jurisdictions
            </span>
            <h2 className="h-display" style={{ fontSize: 'clamp(32px, 5vw, 54px)', color: 'var(--ink)' }}>
              15 SaaS Modules for End-to-End Practice Operations
            </h2>
            <p className="t-secondary" style={{ fontSize: 17, maxWidth: 640, margin: '14px auto 0' }}>
              Designed to replace fragmented tools (WhatsApp, Excel, disconnected billing) with a unified BCI-compliant workstation.
            </p>
          </div>

          <Reveal variants={containerV(0.12)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
            {[
              {
                icon: <I.Briefcase size={22} />,
                tag: 'Core SaaS Module',
                title: 'Kanban Matter Management',
                desc: 'Track case lifecycles from intake to verdict. Manage client parties, court dates, and matter documents in one central view.',
              },
              {
                icon: <I.Clock size={22} />,
                tag: 'Statutory Engine',
                title: 'Limitation Act 1963 Tracker',
                desc: 'Automated statutory limitation period calculations and court deadline cron alerts to prevent missed filing dates.',
              },
              {
                icon: <I.Shield size={22} />,
                tag: 'BCI Compliance',
                title: 'Conflict of Interest Checker',
                desc: 'Scans firm records and opposing parties to flag ethical representation conflicts before onboarding new clients (BCI Rule 33).',
              },
              {
                icon: <I.Receipt size={22} />,
                tag: 'Financial Compliance',
                title: 'Native INR & 18% GST Invoicing',
                desc: 'Generate automated Rupee invoices with LEDES activity coding, automated GST calculations, and instant UPI/bank payment links.',
              },
              {
                icon: <I.Lock size={22} />,
                tag: 'Double-Ledger',
                title: 'Append-Only Trust Accounting',
                desc: 'Separate client retainer trust ledgers ensuring strict compliance with Bar Council of India client money rules.',
              },
              {
                icon: <I.Zap size={22} />,
                tag: 'Contextual AI',
                title: 'Matter-Specific AI Assistant',
                desc: 'Dedicated Gemini AI instance trained on your matter documents for Q&A, clause drafting, and document comparisons.',
              },
              {
                icon: <I.MessageSquare size={22} />,
                tag: 'Real-Time WebSockets',
                title: 'Encrypted Client Portal & Chat',
                desc: 'Bi-directional real-time messaging, document requests, and e-signatures handled via secure Socket.io channels.',
              },
              {
                icon: <I.Users size={22} />,
                tag: 'Cryptographic RBAC',
                title: 'Multi-Tenant Firm Security',
                desc: 'JWT-authenticated Role-Based Access Control ensuring strict cryptographic data isolation between competing law firms.',
              },
            ].map(f => (
              <motion.div
                key={f.title}
                variants={cardV}
                whileHover={{ y: -7, boxShadow: '0 20px 48px rgba(14,165,233,0.12)' }}
                className="card"
                style={{ padding: 32, background: 'var(--surface)', cursor: 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div className="icon-tile" style={{ background: 'rgba(14,165,233,0.1)', color: '#0284C7' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="h-title" style={{ fontSize: 21, marginBottom: 10 }}>{f.title}</h3>
                <p className="t-secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </section>

        {/* ══ STEP-BY-STEP ONBOARDING ═══════════════════════════════ */}
        <section style={{ maxWidth: 1240, margin: '0 auto 140px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 className="h-display" style={{ fontSize: 'clamp(32px, 5vw, 54px)' }}>
              Onboard Your Law Firm in 3 Minutes
            </h2>
          </div>

          <Reveal variants={containerV(0.14)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                n: 1,
                title: 'Create Your Cryptographic Firm Vault',
                desc: 'Set up your multi-tenant firm workspace with custom user roles (Lawyer, Paralegal, Partner, Staff).',
                ic: <I.Building size={22} />,
              },
              {
                n: 2,
                title: 'Import Matters & Active Clients',
                desc: 'Migrate active court cases, set statutory limitation dates, and run instant BCI Rule 33 conflict checks.',
                ic: <I.Briefcase size={22} />,
              },
              {
                n: 3,
                title: 'Automate Invoicing & AI Research',
                desc: 'Generate GST-compliant Rupee invoices, track billable hours, and utilize matter-specific Gemini AI.',
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
                <div style={{ fontSize: 12, fontWeight: 900, color: '#0284C7', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                  STEP 0{s.n}
                </div>
                <h3 className="h-title" style={{ fontSize: 22, marginBottom: 12 }}>{s.title}</h3>
                <p className="t-secondary" style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </section>

        {/* ══ FINAL CTA ═════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
          <Reveal>
            <div style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              borderRadius: 28,
              padding: '52px 40px',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 30px 80px rgba(2, 132, 199, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', marginBottom: 20 }}>
                  <I.Briefcase size={13} /> Elevate Your Legal Practice
                </span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, fontFamily: 'var(--font-headline)', marginBottom: 16, lineHeight: 1.15 }}>
                  Ready to Transform Your Law Practice?
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.6 }}>
                  Join top solo advocates and law firms managing their matters, clients, GST invoicing, and BCI compliance on NyayaAI.
                </p>

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <motion.button
                    className="btn btn-purple btn-lg"
                    onClick={() => navigate('/register')}
                    style={{ background: '#fff', color: '#0369A1', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Free Law Firm Account <I.ArrowRight size={17} />
                  </motion.button>
                  <motion.button
                    className="btn btn-secondary btn-lg"
                    onClick={() => navigate('/practice')}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Open Practice Hub Demo
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
