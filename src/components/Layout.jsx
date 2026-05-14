import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { usePrivacy } from '../context/PrivacyContext';
import { MobileMenuProvider } from '../context/MobileMenuContext';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

/* Public routes render without the app sidebar/shell */
const PUBLIC_PATHS = ['/', '/landing', '/intake', '/marketplace'];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/marketplace/')) return true;
  return false;
}

const AUTH_PATHS = ['/login', '/register'];

export default function Layout({ children }) {
  const location = useLocation();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const isAuth   = AUTH_PATHS.includes(location.pathname);
  const isPublic = isPublicPath(location.pathname);

  /* Auth pages (login/register) — plain white background, no sidebar */
  if (isAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  /* Public pages (landing, intake, marketplace) — no sidebar */
  if (isPublic) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  /* Authenticated app — sidebar + main content area */
  return (
    <MobileMenuProvider>
      <Sidebar />

      <main className="md:ml-[240px] min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Privacy banner */}
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
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                background: 'var(--purple-soft)',
                borderBottom: '1px solid var(--purple-mist)',
              }}>
                <span style={{ color: 'var(--purple)', fontSize: 18 }}>🔒</span>
                <p style={{ color: 'var(--purple-deep)', fontSize: 13, fontWeight: 600, flex: 1 }}>
                  Privacy Mode Active — files are processed in your browser only. Nothing is uploaded.
                </p>
                <button
                  onClick={togglePrivacy}
                  style={{ color: 'var(--purple)', fontSize: 12, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Disable
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </main>
    </MobileMenuProvider>
  );
}
