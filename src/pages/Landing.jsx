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

/* ── Scroll-triggered animated section ───────────────────── */
function Reveal({ children, variants = containerV(0.12), style, className }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-70px' }}
      variants={variants}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated Glassy Navbar ──────────────────────────────── */
function PublicNav({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Services',    to: '/intake' },
    { label: 'Methodology', to: null },
    { label: 'For Lawyers', to: '/login' },
    { label: 'Contact',     to: '/intake' },
  ];

  return (
    <>
      {/* ── Fixed glass navbar ── */}
      <motion.nav
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: scrolled ? 'rgba(255,255,255,0.78)' : 'transparent',
          backdropFilter: scrolled ? 'blur(22px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(22px) saturate(180%)' : 'none',
          boxShadow: scrolled ? '0 1px 0 rgba(11,11,20,0.06), 0 8px 32px rgba(11,11,20,0.06)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'rgba(232,228,238,0.7)' : 'transparent'}`,
          transition: 'background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
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
            style={{ cursor: 'pointer', userSelect: 'none' }}
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

          {/* Desktop pill nav */}
          <motion.div
            className="nav-pill lp-pill-nav"
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.22, duration: 0.6, ease }}
          >
            {links.map((link, i) => (
              <motion.div
                key={link.label}
                className="nav-pill-item"
                onClick={() => link.to && navigate(link.to)}
                whileHover={{ color: 'var(--purple)', background: 'var(--purple-soft)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.07, duration: 0.4 }}
              >
                {link.label}
              </motion.div>
            ))}
          </motion.div>

          {/* Right: CTA + hamburger */}
          <motion.div
            style={{ display: 'flex', gap: 10, alignItems: 'center' }}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22, duration: 0.55, ease }}
          >
            <motion.button
              className="btn btn-secondary btn-sm lp-signin"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign In
            </motion.button>
            <motion.button
              className="btn btn-purple btn-sm"
              onClick={() => navigate('/intake')}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 32px rgba(124,58,237,0.42)' }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>

            {/* Hamburger — shown on mobile via .lp-hamburger CSS class */}
            <motion.button
              className="lp-hamburger"
              onClick={() => setMobileOpen(v => !v)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--purple-soft)', color: 'var(--purple)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'x' : 'm'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  style={{ display: 'flex' }}
                >
                  {mobileOpen ? <I.X size={18} /> : <I.Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.24, ease }}
            style={{
              position: 'fixed', top: 82, left: 12, right: 12, zIndex: 199,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: 22, border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(11,11,20,0.14)',
              padding: '12px 8px 16px',
              overflow: 'hidden',
            }}
          >
            {links.map((link, i) => (
              <motion.div
                key={link.label}
                onClick={() => { link.to && navigate(link.to); setMobileOpen(false); }}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.055, duration: 0.3, ease }}
                whileHover={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}
                style={{
                  padding: '14px 18px', borderRadius: 14,
                  fontSize: 15, fontWeight: 500,
                  cursor: 'pointer', color: 'var(--ink)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {link.label}
              </motion.div>
            ))}
            <div style={{ margin: '10px 10px 4px', display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                onClick={() => { navigate('/login'); setMobileOpen(false); }}>Sign In</button>
              <button className="btn btn-purple btn-sm" style={{ flex: 1 }}
                onClick={() => { navigate('/intake'); setMobileOpen(false); }}>Get Started</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function FeatureMini({ icon, title, sub, filled }) {
  return (
    <motion.div
      variants={cardV}
      whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(11,11,20,0.10)' }}
      className="card"
      style={{
        padding: 28, textAlign: 'left', cursor: 'default',
        background: filled ? 'var(--ink)' : 'var(--surface)',
        color: filled ? '#fff' : 'var(--ink)',
        border: filled ? 'none' : '1px solid var(--border)',
        transition: 'box-shadow 0.25s, transform 0.25s',
      }}
    >
      <div className="icon-tile" style={{
        background: filled ? 'rgba(255,255,255,0.10)' : 'var(--purple-soft)',
        color: filled ? '#fff' : 'var(--purple)',
        marginBottom: 28,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: filled ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)' }}>{sub}</div>
    </motion.div>
  );
}

function StepCard({ n, icon, title, desc, kind, children }) {
  const dark = kind === 'purple';
  return (
    <motion.div
      variants={cardV}
      whileHover={{ y: -5, boxShadow: dark ? '0 28px 64px rgba(124,58,237,0.30)' : '0 20px 48px rgba(11,11,20,0.10)' }}
      style={{
        background: dark ? 'var(--purple)' : 'var(--surface)',
        color: dark ? '#fff' : 'var(--ink)',
        border: dark ? 'none' : '1px solid var(--border)',
        borderRadius: 22, padding: 32,
        boxShadow: dark ? '0 24px 60px rgba(124,58,237,0.22)' : 'var(--shadow-card)',
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.25s, transform 0.25s',
      }}
    >
      <div className="icon-tile" style={{
        background: dark ? 'rgba(255,255,255,0.16)' : 'var(--purple-soft)',
        color: dark ? '#fff' : 'var(--purple)',
        marginBottom: 24,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 10 }}>{n}. {title}</div>
      <p style={{
        fontSize: 14.5, lineHeight: 1.6,
        color: dark ? 'rgba(255,255,255,0.82)' : 'var(--text-secondary)',
        marginBottom: 28,
      }}>{desc}</p>
      <div style={{ marginTop: 'auto' }}>{children}</div>
    </motion.div>
  );
}

function PersonaCard({ icon, title, desc, onClick, tint }) {
  const filled = tint === 'filled';
  return (
    <motion.div
      variants={cardV}
      whileHover={{ y: -6, boxShadow: '0 20px 52px rgba(11,11,20,0.10)' }}
      className="card"
      style={{ padding: 32, cursor: 'pointer', transition: 'box-shadow 0.25s, transform 0.25s' }}
      onClick={onClick}
    >
      <div className="icon-tile" style={{
        background: filled ? 'var(--purple)' : 'var(--purple-soft)',
        color: filled ? '#fff' : 'var(--purple)',
        marginBottom: 32,
      }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 22, marginBottom: 14 }}>{title}</div>
      <p className="t-secondary" style={{ fontSize: 14.5, lineHeight: 1.65, marginBottom: 24 }}>{desc}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
        Learn More <I.ArrowRight size={16} />
      </div>
    </motion.div>
  );
}

/* ── Dashboard mock preview ──────────────────────────────── */
function HeroPreview() {
  return (
    <div className="card-elev" style={{
      borderRadius: 24, padding: 18,
      background: 'linear-gradient(180deg,#FFFFFF 0%,#FBFAFC 100%)',
      textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingLeft: 6 }}>
        {['#FF5F57','#FEBC2E','#28C840'].map(c => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />
        ))}
      </div>
      <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 28, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, minHeight: 340 }}>
        {/* Sidebar */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
          <div className="wordmark" style={{ fontSize: 16, marginBottom: 20 }}>
            <span>Nyaya</span><span className="wordmark-dot" style={{ fontSize: 22 }}>.</span>
          </div>
          {[
            { t: 'Dashboard', active: true },
            { t: 'Documents' },
            { t: 'Ask AI' },
            { t: 'Marketplace' },
            { t: 'Billing' },
          ].map((x, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, marginBottom: 4,
              background: x.active ? 'var(--purple-soft)' : 'transparent',
              color: x.active ? 'var(--purple-deep)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: x.active ? 'var(--purple)' : 'var(--border)' }} />
              {x.t}
            </div>
          ))}
        </div>
        {/* Main */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div className="h-title" style={{ fontSize: 20 }}>Good morning</div>
            <span className="pill"><span className="pill-dot" /> 12 active cases</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { l: 'Documents',    v: '14',  tone: 'soft' },
              { l: 'Health Score', v: '87%', tone: 'purple' },
              { l: 'Alerts',       v: '3',   tone: 'soft' },
            ].map((s, i) => (
              <div key={i} style={{
                background: s.tone === 'purple' ? 'var(--purple)' : 'var(--surface)',
                color:      s.tone === 'purple' ? '#fff' : 'var(--ink)',
                border:     s.tone === 'purple' ? 'none' : '1px solid var(--border)',
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{s.l}</div>
                <div className="h-title" style={{ fontSize: 22 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Recent Documents</div>
            {[
              ['Employment Contract', 'HIGH RISK',   'red'],
              ['NDA Agreement',       'LOW RISK',    'green'],
              ['Vendor Agreement',    'MEDIUM RISK', 'amber'],
            ].map(([name, risk, col], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                alignItems: 'center', padding: '8px 0',
                borderTop: i ? '1px solid var(--border)' : 'none', fontSize: 12,
              }}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span className={`pill pill-${col}`} style={{ fontSize: 9 }}>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStep1() {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {[1,2,3].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--border-active)' }} />)}
        <span className="t-muted t-mono" style={{ marginLeft: 'auto', fontSize: 10 }}>STEP 1</span>
      </div>
      <div className="skeleton" style={{ height: 8, marginBottom: 8, width: '92%' }} />
      <div className="skeleton" style={{ height: 8, marginBottom: 8, width: '74%' }} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)' }}>
        Describe your issue…
      </div>
    </div>
  );
}

function PreviewStep2() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.20)' }}>
      {[['Case Type','Employment Dispute'],['Jurisdiction','Auto-detected'],['Suggested Steps','3 actions']].map(([k,v],i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,0.18)' : 'none', fontSize: 12 }}>
          <span style={{ opacity: 0.78 }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewStep3() {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', color: 'var(--purple)' }}>
        <I.User size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <svg width="100%" height="22" viewBox="0 0 200 22" fill="none">
          <line x1="12" y1="11" x2="188" y2="11" stroke="var(--purple)" strokeWidth="1.6" strokeDasharray="4 4" />
          <circle cx="100" cy="11" r="5" fill="var(--purple)" />
        </svg>
      </div>
      <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <I.Lock size={11} /> ENCRYPTED
      </div>
    </div>
  );
}

/* ── Main Landing ────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Ambient animated blobs ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          className="blob"
          animate={{ x: [0, 28, -18, 0], y: [0, -44, 22, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 560, height: 560, background: '#C4B5FD', top: -100, left: -140, opacity: 0.32 }}
        />
        <motion.div
          className="blob"
          animate={{ x: [0, -24, 18, 0], y: [0, 38, -28, 0], scale: [1, 0.94, 1.06, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{ width: 480, height: 480, background: '#DDD6FE', top: 280, right: -120, opacity: 0.38 }}
        />
        <motion.div
          className="blob"
          animate={{ x: [0, 18, -12, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 9 }}
          style={{ width: 320, height: 320, background: '#EDE9FE', bottom: 100, left: '30%', opacity: 0.22 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicNav navigate={navigate} />

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px 140px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            style={{ display: 'inline-block', marginBottom: 40 }}
          >
            <span className="pill" style={{ fontSize: 13, padding: '8px 16px' }}>
              <span className="pill-dot" style={{ animation: 'pulse-purple 2s infinite' }} />
              AI-Powered Legal Intelligence
            </span>
          </motion.div>

          {/* Headline */}
          <div style={{ overflow: 'hidden' }}>
            <motion.h1
              className="h-display"
              style={{ fontSize: 'clamp(52px, 8vw, 118px)', maxWidth: 1050, margin: '0 auto', lineHeight: 0.96 }}
            >
              <motion.span
                display="block"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.42 }}
                style={{ display: 'block', color: 'var(--ink)', marginBottom: 4 }}
              >
                Legal help for every
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease, delay: 0.58 }}
                style={{ display: 'block', color: 'var(--purple)' }}
              >
                person. Everywhere.
              </motion.span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="t-secondary"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.72 }}
            style={{ fontSize: 19, maxWidth: 600, margin: '32px auto 52px', lineHeight: 1.55 }}
          >
            Understand any legal document instantly. Find the right lawyer. Manage your case.
            A unified platform that covers every step of your legal journey.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.86 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/intake')}
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 12px 36px rgba(11,11,20,0.28)' }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started Free
            </motion.button>
            <motion.button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Try NyayaAI
            </motion.button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center', marginTop: 40, flexWrap: 'wrap' }}
          >
            {[
              { v: '50K+', l: 'Documents Analyzed' },
              { v: '99.2%', l: 'Uptime' },
              { v: '120+', l: 'Jurisdictions' },
              { v: 'GDPR', l: 'Compliant' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </motion.div>

          {/* Dashboard preview — floats in + subtle continuous float */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease, delay: 1.0 }}
            style={{ marginTop: 96, maxWidth: 1100, margin: '96px auto 0' }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HeroPreview />
            </motion.div>
          </motion.div>
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px 80px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Reveal variants={containerV(0, 0)}>
            <motion.h2
              variants={itemV}
              className="h-display"
              style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 28 }}
            >
              <span style={{ display: 'block' }}>Everything you need to</span>
              <span className="t-grad">resolve a legal issue.</span>
            </motion.h2>
            <motion.p
              variants={itemV}
              className="t-secondary"
              style={{ fontSize: 18, maxWidth: 640, margin: '0 auto 64px' }}
            >
              Replace fragmented research, guesswork, and costly middlemen with one transparent,
              intelligent platform built for the modern legal landscape.
            </motion.p>
          </Reveal>

          <Reveal variants={containerV(0.12, 0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            <FeatureMini icon={<I.Lock size={28} />}     title="Privacy First"    sub="On-device AI processing" />
            <FeatureMini icon={<I.Sparkle size={28} />}  title="Smart Matching"   sub="AI-Powered Lawyer Triage" />
            <FeatureMini icon={<I.Users size={28} />}    title="Verified Lawyers" sub="No paid placements" />
            <FeatureMini icon={<I.Activity size={28} />} title="Always Improving" sub="GDPR Compliant" filled />
          </Reveal>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
        <section style={{ padding: '80px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Reveal variants={containerV(0, 0)}>
            <motion.h2
              variants={itemV}
              className="h-display"
              style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 24 }}
            >
              How does it <span className="t-grad">work?</span>
            </motion.h2>
            <motion.p
              variants={itemV}
              className="t-secondary"
              style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 64px' }}
            >
              A simple three-step journey from your legal problem to a confident resolution.
            </motion.p>
          </Reveal>

          <Reveal
            variants={containerV(0.13, 0.05)}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20, textAlign: 'left' }}
          >
            <StepCard n="1" icon={<I.MessageCircle size={22} />} title="Guided Submission" kind="light"
              desc="Answer a few structured questions about your situation. No legal jargon. No guesswork.">
              <PreviewStep1 />
            </StepCard>
            <StepCard n="2" icon={<I.Scale size={22} />} title="Intelligent Analysis" kind="purple"
              desc="Our AI analyzes your document or case, surfaces risks, explains your rights, and maps the path forward.">
              <PreviewStep2 />
            </StepCard>
            <StepCard n="3" icon={<I.Lock size={22} />} title="Secure Connection" kind="light"
              desc="Connect with verified lawyers through an encrypted, confidential digital workflow — on your terms.">
              <PreviewStep3 />
            </StepCard>
          </Reveal>
        </section>

        {/* ══ PERSONAS ══════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Reveal variants={containerV(0, 0)}>
            <motion.h2
              variants={itemV}
              className="h-display"
              style={{ fontSize: 'clamp(38px, 5.5vw, 80px)', marginBottom: 24 }}
            >
              Built for <span className="t-grad">every scale.</span>
            </motion.h2>
            <motion.p
              variants={itemV}
              className="t-secondary"
              style={{ fontSize: 18, maxWidth: 580, margin: '0 auto 64px' }}
            >
              Whether you are navigating your first legal issue or managing a full law firm, Nyaya adapts to your workflow.
            </motion.p>
          </Reveal>

          <Reveal
            variants={containerV(0.13, 0.05)}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 20, textAlign: 'left' }}
          >
            <PersonaCard
              icon={<I.User size={26} />}
              title="Individuals & Freelancers"
              desc="Understand any contract before you sign. Know your rights. Negotiate with confidence."
              onClick={() => navigate('/register')}
              tint="soft"
            />
            <PersonaCard
              icon={<I.Briefcase size={26} />}
              title="Small Businesses"
              desc="Manage vendor contracts, employee agreements, and compliance obligations in one place."
              onClick={() => navigate('/register')}
              tint="filled"
            />
            <PersonaCard
              icon={<I.Building size={26} />}
              title="Law Firms & Lawyers"
              desc="A complete practice management system — cases, time tracking, billing, client portal, and more."
              onClick={() => navigate('/login')}
              tint="soft"
            />
          </Reveal>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════ */}
        <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
          <motion.div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div style={{ height: '100%', background: 'linear-gradient(180deg,transparent,var(--purple-soft) 60%,transparent)' }} />
          </motion.div>
          <Reveal variants={containerV(0.12)} style={{ position: 'relative', maxWidth: 880, margin: '0 auto' }}>
            <motion.h2
              variants={itemV}
              className="h-display"
              style={{ fontSize: 'clamp(46px, 6.5vw, 108px)', marginBottom: 24 }}
            >
              Ready to <span className="t-grad">modernize?</span>
            </motion.h2>
            <motion.p
              variants={itemV}
              className="t-secondary"
              style={{ fontSize: 18, maxWidth: 500, margin: '0 auto 40px' }}
            >
              Join thousands of users and legal professionals on the platform built for the future of law.
            </motion.p>
            <motion.div
              variants={itemV}
              style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <motion.button
                className="btn btn-purple btn-lg"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 12px 36px rgba(124,58,237,0.40)' }}
                whileTap={{ scale: 0.97 }}
              >
                Start for Free
              </motion.button>
              <motion.button
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/marketplace')}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Find a Lawyer
              </motion.button>
            </motion.div>
          </Reveal>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════ */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ padding: '60px 24px 36px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div className="wordmark" style={{ marginBottom: 16 }}>
                <I.Logo size={22} />
                <span>Nyaya</span><span className="wordmark-dot">.</span>
              </div>
              <p className="t-secondary" style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6, marginBottom: 20 }}>
                AI-powered legal intelligence for everyone. Understand, decide, and act with confidence.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[I.Network, I.Users, I.MessageCircle, I.Mail].map((Ic, i) => (
                  <motion.button
                    key={i}
                    className="icon-tile"
                    style={{ width: 38, height: 38, borderRadius: 10 }}
                    whileHover={{ scale: 1.1, background: 'var(--purple-soft)', color: 'var(--purple)' }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <Ic size={16} />
                  </motion.button>
                ))}
              </div>
            </div>
            {[
              ['Product', ['AI Analysis', 'Marketplace', 'For Lawyers', 'Pricing']],
              ['Company', ['About', 'Careers', 'Privacy', 'Terms']],
            ].map(([h, items]) => (
              <div key={h}>
                <div className="h-title" style={{ fontSize: 15, marginBottom: 18 }}>{h}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map(x => (
                    <motion.div
                      key={x}
                      className="t-secondary"
                      style={{ fontSize: 14, cursor: 'pointer' }}
                      whileHover={{ color: 'var(--purple)', x: 3 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => x === 'AI Analysis' ? navigate('/register') : x === 'Marketplace' ? navigate('/marketplace') : null}
                    >
                      {x}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div className="h-title" style={{ fontSize: 15, marginBottom: 18 }}>Stay Updated</div>
              <p className="t-secondary" style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                Subscribe for the latest in legal tech.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="your@email.com" style={{ flex: 1 }} />
                <motion.button
                  className="btn btn-purple"
                  whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(124,58,237,0.36)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  Join
                </motion.button>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            © 2026 Nyaya Technologies. All rights reserved.
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
