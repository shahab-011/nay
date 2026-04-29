import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { usePrivacy } from '../context/PrivacyContext';

export default function Layout({ children }) {
  const location   = useLocation();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-[220px] pt-16 min-h-screen bg-background">

        {/* ── Persistent Privacy Banner ─────────────────────────── */}
        {isPrivate && (
          <div className="sticky top-16 z-30 flex items-center gap-3 px-6 py-2.5 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-primary text-base flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_lock
            </span>
            <p className="text-primary text-xs font-semibold flex-1 leading-relaxed">
              Privacy Mode Active — PDF &amp; DOCX files are processed entirely in your browser. Nothing is uploaded to our servers.
            </p>
            <button
              onClick={togglePrivacy}
              className="text-primary/60 hover:text-primary text-xs font-medium underline underline-offset-2 flex-shrink-0 transition-colors"
            >
              Switch to Cloud
            </button>
          </div>
        )}

        {children}
      </main>

      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[15%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>
    </>
  );
}
