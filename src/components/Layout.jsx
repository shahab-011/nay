import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { usePrivacy } from '../context/PrivacyContext';
import { MobileMenuProvider } from '../context/MobileMenuContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.22 } },
};

export default function Layout({ children }) {
  const location   = useLocation();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <>
        <div className="aurora-bg"><div className="aurora-orb-3" /></div>
        <div className="dot-grid" />
        {children}
      </>
    );
  }

  return (
    <MobileMenuProvider>
      {/* Aurora animated background */}
      <div className="aurora-bg"><div className="aurora-orb-3" /></div>
      <div className="dot-grid" />

      <Sidebar />

      <main className="md:ml-[220px] pt-16 pb-20 md:pb-0 min-h-screen">
        {/* Privacy banner */}
        <AnimatePresence>
          {isPrivate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="sticky top-16 z-30 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 md:px-6 py-2.5 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-primary text-base flex-shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >shield_lock</span>
                <p className="text-primary text-xs font-semibold flex-1">
                  Privacy Mode Active — files processed in your browser only.
                </p>
                <button
                  onClick={togglePrivacy}
                  className="text-primary/60 hover:text-primary text-xs font-medium underline underline-offset-2 transition-colors"
                >Disable</button>
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
