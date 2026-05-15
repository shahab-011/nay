import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { I } from './Icons';

/* ─── Document Studio nav items only ─────────────────────────── */
const STUDIO_NAV = [
  { sec: 'DOCUMENTS' },
  { name: 'Upload Document',    path: '/upload',         Ic: I.Upload },
  { name: 'My Documents',       path: '/documents',      Ic: I.Folder },
  { sec: 'AI TOOLS' },
  { name: 'Ask AI',             path: '/ask',            Ic: I.MessageCircle },
  { name: 'Compare Documents',  path: '/compare',        Ic: I.Copy },
  { name: 'Obligation Web',     path: '/obligation-web', Ic: I.Network },
  { sec: 'MONITORING' },
  { name: 'Contract Lifecycle', path: '/lifecycle',      Ic: I.Clock },
  { name: 'Alerts',             path: '/alerts',         Ic: I.Bell, badge: true },
  { name: 'Client Links',       path: '/client-links',   Ic: I.Users },
];

const MOBILE_TABS = [
  { name: 'Home',   path: '/',         Ic: I.Home,          end: true },
  { name: 'Docs',   path: '/documents',Ic: I.Folder },
  { name: 'Ask AI', path: '/ask',      Ic: I.MessageCircle },
  { name: 'Alerts', path: '/alerts',   Ic: I.Bell, badge: true },
];

/* ─── Single link ─────────────────────────────────────────────── */
function NavItem({ item, onClick, unread }) {
  if (item.sec) {
    return (
      <div style={{ padding: '14px 14px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {item.sec}
      </div>
    );
  }
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      style={{ textDecoration: 'none', display: 'block', padding: '1px 8px' }}
    >
      {({ isActive }) => (
        <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
          <item.Ic size={15} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.name}</span>
          {item.badge && unread > 0 && (
            <span className="pill pill-red" style={{ padding: '2px 6px', fontSize: 9, minWidth: 18, textAlign: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

/* ─── Sidebar content (shared desktop + drawer) ───────────────── */
function SidebarContent({ onItemClick }) {
  const navigate = useNavigate();
  const { user }   = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const initial = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div
        onClick={() => { navigate('/'); onItemClick?.(); }}
        style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
      >
        <I.Logo size={26} />
        <span className="wordmark" style={{ fontSize: 18 }}>
          Nyaya<span className="wordmark-dot" style={{ fontSize: 24 }}>.</span>
        </span>
      </div>

      {/* User pill */}
      <div style={{ margin: '10px 10px 4px', padding: '10px 12px', background: 'var(--elevated)', borderRadius: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: 'var(--purple)', color: '#fff', fontWeight: 700, display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isPrivate ? '🔒 Private' : (user?.role || 'user')}</div>
          </div>
        </div>
      </div>

      {/* Home */}
      <div style={{ padding: '4px 8px 0' }}>
        <NavLink to="/" end onClick={onItemClick} style={{ textDecoration: 'none', display: 'block', padding: '1px 0' }}>
          {({ isActive }) => (
            <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <I.Home size={15} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>Home</span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Studio nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {STUDIO_NAV.map((item, i) => (
          <NavItem key={item.sec || item.path} item={item} onClick={onItemClick} unread={unread} />
        ))}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px 12px', flexShrink: 0 }}>
        <button
          onClick={() => { navigate('/upload'); onItemClick?.(); }}
          className="btn btn-purple"
          style={{ width: '100%', marginBottom: 8, height: 36, fontSize: 13, borderRadius: 10 }}
        >
          <I.Plus size={14} /> New Analysis
        </button>

        <button
          onClick={togglePrivacy}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
            background: isPrivate ? 'var(--purple-soft)' : 'transparent',
            border: `1px solid ${isPrivate ? 'var(--purple-mist)' : 'transparent'}`,
            color: isPrivate ? 'var(--purple-deep)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, transition: 'all 150ms',
          }}
        >
          <I.Lock size={13} />
          <span style={{ flex: 1 }}>{isPrivate ? 'Privacy Mode On' : 'Privacy Mode'}</span>
          {isPrivate && <span className="pill pill-purple" style={{ fontSize: 9, padding: '2px 6px' }}>ON</span>}
        </button>

        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[
            { path: '/profile', Ic: I.User, label: 'Profile' },
            { path: '/help',    Ic: I.Info, label: 'Help' },
          ].map(b => (
            <NavLink key={b.path} to={b.path} onClick={onItemClick} style={{ flex: 1, textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: isActive ? 'var(--purple-soft)' : 'var(--elevated)',
                  color: isActive ? 'var(--purple)' : 'var(--text-muted)',
                }}>
                  <b.Ic size={13} /> {b.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Exported Sidebar ────────────────────────────────────────── */
export default function Sidebar() {
  const { isOpen, open, close } = useMobileMenu();
  const { unreadCount: unread }  = useAlertCount();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 236,
        zIndex: 50, flexDirection: 'column',
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 20px rgba(11,11,20,0.04)',
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(4px)' }}
            className="md:hidden"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 0, left: 0, height: '100vh', width: 280,
              zIndex: 70, background: 'var(--surface)', borderRight: '1px solid var(--border)',
              boxShadow: 'var(--shadow-float)',
            }}
            className="md:hidden"
          >
            <SidebarContent onItemClick={close} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: 60,
        display: 'flex', alignItems: 'stretch',
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(11,11,20,0.06)',
      }}>
        {MOBILE_TABS.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.end} style={{ flex: 1, textDecoration: 'none', display: 'flex' }}>
            {({ isActive }) => (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                color: isActive ? 'var(--purple)' : 'var(--text-muted)', position: 'relative',
              }}>
                {isActive && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, borderRadius: '0 0 2px 2px', background: 'var(--purple)' }} />}
                <div style={{ position: 'relative' }}>
                  <tab.Ic size={20} />
                  {tab.badge && unread > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 6, minWidth: 14, textAlign: 'center' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.name}</span>
              </div>
            )}
          </NavLink>
        ))}
        <button onClick={open} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <I.Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>More</span>
        </button>
      </nav>
    </>
  );
}
