import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import PracticeSidebar from './PracticeSidebar';
import { usePrivacy } from '../context/PrivacyContext';
import { MobileMenuProvider } from '../context/MobileMenuContext';
import { I } from './Icons';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

/* ─── Route classifiers ───────────────────────────────────────── */

// Auth pages — plain background only
const AUTH_PATHS = ['/login', '/register'];

// Public/no-sidebar pages (public marketing OR portal home OR find-lawyer)
function isNoSidebarPath(pathname) {
  if ([
    '/', '/landing', '/intake', '/find-lawyer', '/services',
  ].includes(pathname)) return true;
  if (pathname.startsWith('/marketplace')) return true;
  if (pathname.startsWith('/client-portal')) return true;
  return false;
}

// Practice management section — gets PracticeSidebar
const PRACTICE_ROOTS = [
  '/practice', '/matters', '/contacts', '/tasks',
  '/cal', '/time', '/billing', '/lawyer', '/reports',
  '/doc-automation', '/leads', '/conflicts', '/firm-settings',
  '/esign', '/communications', '/manage-ai', '/notifications', '/accounting',
  '/practice-profile',
];
function isPracticePath(pathname) {
  return PRACTICE_ROOTS.some(root =>
    pathname === root || pathname.startsWith(root + '/')
  );
}

/* ─── Content with page transition ───────────────────────────── */
function PageContent({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Privacy banner ──────────────────────────────────────────── */
function PrivacyBanner() {
  const { isPrivate, togglePrivacy } = usePrivacy();
  return (
    <AnimatePresence>
      {isPrivate && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: '12px 16px 4px 16px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            boxSizing: 'border-box',
            zIndex: 100,
            position: 'relative',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            padding: '8px 18px',
            borderRadius: 50,
            background: 'rgba(16, 12, 40, 0.88)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            maxWidth: 780,
            width: '100%',
            position: 'relative',
          }}>
            {/* Top specular glow line */}
            <div style={{
              position: 'absolute', top: 0, left: 30, right: 30, height: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(192, 132, 252, 0.7) 50%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {/* Left Lock Icon & Privacy Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.4)', pointerEvents: 'none' }}
                />
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(124, 58, 237, 0.6)',
                }}>
                  <I.Lock size={14} style={{ color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.35)', flexShrink: 0 }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}
                />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PRIVACY SHIELD
                </span>
              </div>
            </div>

            {/* Message */}
            <p style={{
              color: 'rgba(240, 238, 255, 0.75)', fontSize: 12.5, fontWeight: 500,
              margin: 0, lineHeight: 1.35,
              flex: '1 1 auto', minWidth: 0,
            }}>
              Files processed in browser only — <strong style={{ color: '#ffffff', fontWeight: 700 }}>nothing is uploaded to servers.</strong>
            </p>

            {/* Disable Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 1, height: 18, background: 'rgba(255, 255, 255, 0.14)' }} />
              <motion.button
                whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePrivacy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171', fontSize: 11.5, fontWeight: 800,
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <I.EyeOff size={12} /> Disable
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Layout ──────────────────────────────────────────────────── */
export default function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;

  // 1. Auth pages — bare
  if (AUTH_PATHS.includes(path)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  // 2. Portal home / public / find-lawyer — no sidebar at all
  if (isNoSidebarPath(path)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <PageContent>{children}</PageContent>
      </div>
    );
  }

  // 3. Practice Management — Clio-style PracticeSidebar, no main sidebar
  if (isPracticePath(path)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <PracticeSidebar />
        {/* desktop: offset by sidebar width; mobile: offset by top bar */}
        <main
          className="practice-main-content"
          style={{ minHeight: '100vh', background: 'var(--bg)' }}
        >
          <PageContent>{children}</PageContent>
        </main>
      </div>
    );
  }

  // 4. Document Studio — main Sidebar
  return (
    <MobileMenuProvider>
      <Sidebar />
      <main className="md:ml-[236px] min-h-screen" style={{ background: '#07091f' }}>
        <PrivacyBanner />
        <PageContent>{children}</PageContent>
      </main>
    </MobileMenuProvider>
  );
}
