import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import PracticeSidebar from './PracticeSidebar';
import { usePrivacy } from '../context/PrivacyContext';
import { MobileMenuProvider } from '../context/MobileMenuContext';

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
    '/', '/landing', '/intake', '/find-lawyer',
  ].includes(pathname)) return true;
  if (pathname.startsWith('/marketplace')) return true;
  return false;
}

// Practice management section — gets PracticeSidebar
const PRACTICE_ROOTS = [
  '/practice', '/matters', '/contacts', '/tasks',
  '/cal', '/time', '/billing', '/lawyer',
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
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden', position: 'sticky', top: 0, zIndex: 30 }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
            background: 'var(--purple-soft)', borderBottom: '1px solid var(--purple-mist)',
          }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <p style={{ color: 'var(--purple-deep)', fontSize: 13, fontWeight: 600, flex: 1, margin: 0 }}>
              Privacy Mode Active — files processed in your browser only. Nothing is uploaded.
            </p>
            <button onClick={togglePrivacy} style={{ color: 'var(--purple)', fontSize: 12, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              Disable
            </button>
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
      <div style={{ minHeight: '100vh', background: '#F8F9FC' }}>
        <PracticeSidebar />
        {/* desktop: offset by sidebar width; mobile: offset by top bar */}
        <main
          style={{ background: '#F8F9FC', minHeight: '100vh' }}
          className="md:ml-[236px] pt-14 md:pt-0"
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
      <main className="md:ml-[236px] min-h-screen" style={{ background: 'var(--bg)' }}>
        <PrivacyBanner />
        <PageContent>{children}</PageContent>
      </main>
    </MobileMenuProvider>
  );
}
