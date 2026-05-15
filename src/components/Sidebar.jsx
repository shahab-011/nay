import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { I } from './Icons';

const NAV_ITEMS = [
  { sec: 'MAIN' },
  { name: 'Dashboard',         icon: 'home',     path: '/',               Ic: I.Home },
  { name: 'Upload Document',   icon: 'upload',   path: '/upload',         Ic: I.Upload },
  { name: 'My Documents',      icon: 'folder',   path: '/documents',      Ic: I.Folder },
  { sec: 'AI TOOLS' },
  { name: 'Ask AI',            icon: 'chat',     path: '/ask',            Ic: I.MessageCircle },
  { name: 'Compare Documents', icon: 'compare',  path: '/compare',        Ic: I.Copy },
  { name: 'Obligation Web',    icon: 'network',  path: '/obligation-web', Ic: I.Network },
  { sec: 'MONITORING' },
  { name: 'Contract Lifecycle',icon: 'lifecycle',path: '/lifecycle',      Ic: I.Clock },
  { name: 'Alerts',            icon: 'alerts',   path: '/alerts',         Ic: I.Bell, badge: true },
  { name: 'Client Links',      icon: 'links',    path: '/client-links',   Ic: I.Users },
];

const BOTTOM_ITEMS = [
  { name: 'Marketplace', path: '/marketplace', Ic: I.Scale },
  { name: 'Profile',     path: '/profile',     Ic: I.User },
  { name: 'Help',        path: '/help',        Ic: I.Info },
];

const LAWYER_ITEMS = [
  { name: 'Lawyer Dashboard', path: '/lawyer',       Ic: I.Briefcase },
  { name: 'Client Links',     path: '/client-links', Ic: I.Users },
];

const MOBILE_TABS = [
  { name: 'Home',      path: '/',         Ic: I.Home,        end: true },
  { name: 'Docs',      path: '/documents',Ic: I.Folder },
  { name: 'Ask AI',    path: '/ask',      Ic: I.MessageCircle },
  { name: 'Alerts',    path: '/alerts',   Ic: I.Bell, badge: true },
];

function SidebarLink({ item, onClick, unread }) {
  const isSection = !!item.sec;
  if (isSection) {
    return (
      <div style={{
        padding: '14px 12px 4px',
        fontSize: 10, letterSpacing: '0.12em',
        color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700,
      }}>{item.sec}</div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {({ isActive }) => (
        <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
          {item.Ic && <item.Ic size={16} />}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</span>
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

export default function Sidebar() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const { isOpen, open, close } = useMobileMenu();
  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  const userInitial = user?.name ? user.name[0].toUpperCase() : '?';

  const SidebarContent = ({ onItemClick }) => (
    <>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }} onClick={() => { navigate('/'); onItemClick?.(); }}>
        <I.Logo size={26} />
        <span className="wordmark" style={{ fontSize: 18 }}>Nyaya<span className="wordmark-dot" style={{ fontSize: 24 }}>.</span></span>
      </div>

      {/* User pill */}
      <div style={{ margin: '12px 12px 4px', padding: 12, background: 'var(--elevated)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: 'var(--purple)', color: '#fff',
            fontWeight: 700, display: 'grid', placeItems: 'center', fontSize: 13,
          }}>{userInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', truncate: true }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {isPrivate ? '🔒 Private mode' : user?.role || 'user'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {NAV_ITEMS
          .filter(item => item.sec || !(isLawyer && item.path === '/client-links'))
          .map((item, i) => (
            <SidebarLink key={item.sec || item.path} item={item} onClick={onItemClick} unread={unread} />
          ))}

        {isLawyer && (
          <>
            <div style={{ padding: '14px 12px 4px', fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              LEGAL PRO
            </div>
            {/* Single entry point to all practice management features */}
            <NavLink to="/practice" style={{ textDecoration: 'none', display: 'block' }} onClick={onItemClick}>
              {({ isActive }) => (
                <div className={`sidebar-item ${isActive ? 'active' : ''}`} style={{ margin: '2px 8px', borderRadius: 10 }}>
                  <I.Scale size={16} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Practice Management</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(124,58,237,0.1)', color: 'var(--purple)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>New</span>
                </div>
              )}
            </NavLink>
            {LAWYER_ITEMS.map(item => (
              <SidebarLink key={item.path} item={item} onClick={onItemClick} unread={0} />
            ))}
          </>
        )}
      </div>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
        {/* New Analysis CTA */}
        <button
          onClick={() => { navigate('/upload'); onItemClick?.(); }}
          className="btn btn-purple"
          style={{ width: '100%', marginBottom: 8, height: 38, fontSize: 13 }}
        >
          <I.Plus size={14} /> New Analysis
        </button>

        {/* Privacy toggle */}
        <button
          onClick={() => { togglePrivacy(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
            background: isPrivate ? 'var(--purple-soft)' : 'transparent',
            border: `1px solid ${isPrivate ? 'var(--purple-mist)' : 'transparent'}`,
            color: isPrivate ? 'var(--purple-deep)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500,
            transition: 'all 150ms',
          }}
        >
          <I.Lock size={15} />
          <span>{isPrivate ? 'Privacy Mode On' : 'Privacy Mode'}</span>
          {isPrivate && <span className="pill pill-purple" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 'auto' }}>ON</span>}
        </button>

        {/* Bottom links */}
        <div style={{ marginTop: 4 }}>
          {BOTTOM_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'block' }}>
              {({ isActive }) => (
                <div className={`sidebar-item ${isActive ? 'active' : ''}`} style={{ margin: '2px 0' }}>
                  <item.Ic size={15} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 240,
        zIndex: 50, flexDirection: 'column',
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 20px rgba(11,11,20,0.04)',
      }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ──────────────────────────────────── */}
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

      {/* ── MOBILE DRAWER ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 0, left: 0, height: '100vh', width: 280,
              zIndex: 70, display: 'flex', flexDirection: 'column',
              background: 'var(--surface)', borderRight: '1px solid var(--border)',
              boxShadow: 'var(--shadow-float)',
            }}
            className="md:hidden"
          >
            <SidebarContent onItemClick={close} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────── */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 50, height: 60,
          display: 'flex', alignItems: 'stretch',
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 20px rgba(11,11,20,0.06)',
        }}
      >
        {MOBILE_TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            style={{ flex: 1, textDecoration: 'none', display: 'flex' }}
          >
            {({ isActive }) => (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                color: isActive ? 'var(--purple)' : 'var(--text-muted)',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 2, borderRadius: '0 0 2px 2px', background: 'var(--purple)',
                  }} />
                )}
                <div style={{ position: 'relative' }}>
                  <tab.Ic size={20} />
                  {tab.badge && unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -6,
                      background: 'var(--red)', color: '#fff',
                      fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 6,
                      minWidth: 14, textAlign: 'center',
                    }}>{unread > 9 ? '9+' : unread}</span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {tab.name}
                </span>
              </div>
            )}
          </NavLink>
        ))}
        <button
          onClick={open}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <I.Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>More</span>
        </button>
      </nav>
    </>
  );
}
