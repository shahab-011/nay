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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, padding: '10px 24px',
            background: 'rgba(15, 12, 38, 0.92)',
            borderBottom: '1px solid rgba(167, 139, 250, 0.2)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.08)',
          }}>

            {/* Left badge & lock icon group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.35)', pointerEvents: 'none' }}
                />
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(124,58,237,0.5)',
                }}>
                  <I.Lock size={15} style={{ color: '#fff' }} />
                </div>
              </div>

              {/* Active pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.3)', flexShrink: 0 }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}
                />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Privacy Shield
                </span>
              </div>
            </div>

            {/* Message */}
            <p style={{
              color: 'rgba(240, 238, 255, 0.7)', fontSize: 13, fontWeight: 500,
              flex: '1 1 280px', margin: 0, lineHeight: 1.45, minWidth: 0,
            }}>
              Files are processed in your browser only —{' '}
              <span style={{ color: '#ffffff', fontWeight: 700 }}>nothing is uploaded to our servers.</span>
            </p>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.12)' }} />
              <motion.button
                whileHover={{ scale: 1.03, background: 'rgba(239, 68, 68, 0.18)' }}
                whileTap={{ scale: 0.96 }}
                onClick={togglePrivacy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  color: '#f87171', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'background 150ms',
                }}
              >
                <I.EyeOff size={13} /> Disable
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
