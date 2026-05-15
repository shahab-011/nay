import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { I } from './Icons';

/* ─── Nav structure ───────────────────────────────────────────── */

const SECTION_1 = [
  { name: 'Upload Document',    path: '/upload',         Ic: I.Upload },
  { name: 'My Documents',       path: '/documents',      Ic: I.Folder },
  { name: 'Ask AI',             path: '/ask',            Ic: I.MessageCircle },
  { name: 'Compare Documents',  path: '/compare',        Ic: I.Copy },
  { name: 'Contract Lifecycle', path: '/lifecycle',      Ic: I.Clock },
  { name: 'Obligation Web',     path: '/obligation-web', Ic: I.Network },
  { name: 'Alerts',             path: '/alerts',         Ic: I.Bell, badge: true },
  { name: 'Client Links',       path: '/client-links',   Ic: I.Users },
];

const SECTION_2 = [
  { name: 'Practice Hub',   path: '/practice', Ic: I.Scale },
];

const SECTION_3 = [
  { name: 'Find a Lawyer',  path: '/find-lawyer', Ic: I.Search },
  { name: 'Marketplace',    path: '/marketplace', Ic: I.Star },
];

const SECTION_3_LAWYER = [
  { name: 'Find a Lawyer',     path: '/find-lawyer', Ic: I.Search },
  { name: 'Lawyer Dashboard',  path: '/lawyer',      Ic: I.Briefcase },
  { name: 'Marketplace',       path: '/marketplace', Ic: I.Star },
];

const MOBILE_TABS = [
  { name: 'Home',     path: '/',         Ic: I.Home,        end: true },
  { name: 'Docs',     path: '/documents',Ic: I.Folder },
  { name: 'Ask AI',   path: '/ask',      Ic: I.MessageCircle },
  { name: 'Lawyer',   path: '/find-lawyer', Ic: I.Scale },
];

/* ─── Section header ──────────────────────────────────────────── */
function SecHeader({ icon: Ic, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '16px 14px 5px' }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic size={11} style={{ color }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.11em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

/* ─── Single nav link ─────────────────────────────────────────── */
function NavItem({ item, onClick, unread }) {
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

/* ─── Sidebar content (shared desktop + mobile drawer) ────────── */
function SidebarContent({ onItemClick }) {
  const navigate = useNavigate();
  const { user }   = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const isLawyer  = user?.role === 'lawyer' || user?.role === 'admin';
  const initial   = user?.name ? user.name[0].toUpperCase() : '?';

  const section3 = isLawyer ? SECTION_3_LAWYER : SECTION_3;

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
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isPrivate ? '🔒 Private' : user?.role || 'user'}</div>
          </div>
        </div>
      </div>

      {/* Home link */}
      <div style={{ padding: '4px 8px 0' }}>
        <NavItem item={{ name: 'Home', path: '/', Ic: I.Home }} onClick={onItemClick} unread={0} />
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>

        {/* ── SECTION 1: Document Studio ── */}
        <SecHeader icon={I.Doc} label="Document Studio" color="#7C3AED" />
        {SECTION_1.map(item => (
          <NavItem key={item.path} item={item} onClick={onItemClick} unread={unread} />
        ))}

        {/* ── SECTION 2: Practice Management (lawyer/admin) ── */}
        {isLawyer && (
          <>
            <SecHeader icon={I.Briefcase} label="Practice Management" color="#0EA5E9" />
            {SECTION_2.map(item => (
              <NavItem key={item.path} item={item} onClick={onItemClick} unread={0} />
            ))}
          </>
        )}

        {/* ── SECTION 3: Legal Marketplace ── */}
        <SecHeader icon={I.Scale} label="Find a Lawyer" color="#10B981" />
        {section3.map(item => (
          <NavItem key={item.path} item={item} onClick={onItemClick} unread={0} />
        ))}

      </div>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px 12px', flexShrink: 0 }}>
        {/* Upload CTA */}
        <button
          onClick={() => { navigate('/upload'); onItemClick?.(); }}
          className="btn btn-purple"
          style={{ width: '100%', marginBottom: 8, height: 36, fontSize: 13, borderRadius: 10 }}
        >
          <I.Plus size={14} /> New Analysis
        </button>

        {/* Privacy */}
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

        {/* Profile + Settings */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[
            { path: '/profile', Ic: I.User, label: 'Profile' },
            { path: '/help', Ic: I.Info, label: 'Help' },
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

/* ─── Sidebar ─────────────────────────────────────────────────── */
export default function Sidebar() {
  const { isOpen, open, close } = useMobileMenu();
  const { unreadCount: unread } = useAlertCount();

  return (
    <>
      {/* ── DESKTOP ─── */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 236,
        zIndex: 50, flexDirection: 'column',
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 20px rgba(11,11,20,0.04)',
      }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
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

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: 60,
          display: 'flex', alignItems: 'stretch',
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(11,11,20,0.06)',
        }}
      >
        {MOBILE_TABS.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.end} style={{ flex: 1, textDecoration: 'none', display: 'flex' }}>
            {({ isActive }) => (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                color: isActive ? 'var(--purple)' : 'var(--text-muted)', position: 'relative',
              }}>
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, borderRadius: '0 0 2px 2px', background: 'var(--purple)' }} />
                )}
                <tab.Ic size={20} />
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.name}</span>
              </div>
            )}
          </NavLink>
        ))}
        <button
          onClick={open}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <I.Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>More</span>
        </button>
      </nav>
    </>
  );
}
