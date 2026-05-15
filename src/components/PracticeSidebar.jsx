import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from './Icons';

/* ─── Nav structure ───────────────────────────────────────────── */
const NAV = [
  {
    sec: 'OVERVIEW',
    items: [
      { label: 'Practice Hub',  path: '/practice',  Ic: I.Home },
    ],
  },
  {
    sec: 'MATTERS',
    items: [
      { label: 'All Matters',   path: '/matters',   Ic: I.Briefcase },
      { label: 'Contacts',      path: '/contacts',  Ic: I.Users },
    ],
  },
  {
    sec: 'WORK',
    items: [
      { label: 'Tasks',         path: '/tasks',     Ic: I.CheckSquare },
      { label: 'Calendar',      path: '/cal',       Ic: I.Calendar },
    ],
  },
  {
    sec: 'BILLING',
    items: [
      { label: 'Time Tracking', path: '/time',      Ic: I.Timer },
      { label: 'Invoices',      path: '/billing',   Ic: I.DollarSign },
    ],
  },
  {
    sec: 'REPORTS',
    items: [
      { label: 'Reports & Analytics', path: '/reports', Ic: I.Chart },
    ],
  },
];

const LAWYER_SECTION = {
  sec: 'FIRM',
  items: [
    { label: 'Lawyer Dashboard', path: '/lawyer',       Ic: I.Scale },
    { label: 'Client Links',     path: '/client-links', Ic: I.Users },
  ],
};

/* ─── Link ────────────────────────────────────────────────────── */
function PLink({ item, onClick }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/practice'}
      onClick={onClick}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 2 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', borderRadius: 9, margin: '1px 8px',
            background: isActive ? 'rgba(124,58,237,0.10)' : 'transparent',
            color: isActive ? 'var(--purple)' : '#4B5563',
            cursor: 'pointer', transition: 'background 140ms, color 140ms',
            position: 'relative',
          }}
        >
          {isActive && (
            <motion.div
              layoutId="practice-active-pill"
              style={{
                position: 'absolute', left: 0, top: '20%', bottom: '20%',
                width: 3, borderRadius: '0 3px 3px 0', background: 'var(--purple)',
              }}
            />
          )}
          <item.Ic size={15} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
        </motion.div>
      )}
    </NavLink>
  );
}

/* ─── Section header ──────────────────────────────────────────── */
function SecLabel({ label }) {
  return (
    <div style={{
      padding: '14px 22px 5px',
      fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
      color: '#9CA3AF', textTransform: 'uppercase',
    }}>{label}</div>
  );
}

/* ─── Content ─────────────────────────────────────────────────── */
function PracticeSidebarContent({ onItemClick }) {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const isLawyer   = user?.role === 'lawyer' || user?.role === 'admin';
  const initial    = user?.name ? user.name[0].toUpperCase() : '?';

  const sections = isLawyer ? [...NAV, LAWYER_SECTION] : NAV;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '18px 16px 14px',
        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Scale size={17} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Practice</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Management</div>
          </div>
        </div>

        {/* User pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.3)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{user?.role || 'user'}</div>
          </div>
        </div>
      </div>

      {/* Back to portal */}
      <button
        onClick={() => { navigate('/'); onItemClick?.(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '10px 10px 4px', padding: '8px 12px', borderRadius: 9,
          background: 'none', border: '1.5px solid #E5E7EB', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: '#6B7280', width: 'calc(100% - 20px)',
          transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
      >
        <I.ArrowLeft size={13} />
        Back to Portal
      </button>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {sections.map(sec => (
          <div key={sec.sec}>
            <SecLabel label={sec.sec} />
            {sec.items.map(item => (
              <PLink key={item.path} item={item} onClick={onItemClick} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 10px 14px', flexShrink: 0 }}>
        <button
          onClick={() => { navigate('/matters'); onItemClick?.(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px', borderRadius: 10, background: 'var(--purple)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            marginBottom: 8,
          }}
        >
          <I.Plus size={14} /> New Matter
        </button>

        <NavLink to="/profile" style={{ textDecoration: 'none', display: 'block' }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
              background: isActive ? 'rgba(124,58,237,0.07)' : 'transparent',
              color: isActive ? 'var(--purple)' : '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              <I.Settings size={14} /> Settings & Profile
            </div>
          )}
        </NavLink>
      </div>
    </div>
  );
}

/* ─── Mobile overlay sidebar for practice ─────────────────────── */
function PracticeMobileDrawer({ isOpen, onClose }) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 0, left: 0, height: '100vh', width: 256,
              zIndex: 70, background: '#fff', borderRight: '1px solid #E5E7EB',
              boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
            }}
          >
            <PracticeSidebarContent onItemClick={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Mobile top bar (hamburger + section label) ──────────────── */
function PracticeMobileBar({ onOpen }) {
  const location = useLocation();
  const labels = {
    '/practice': 'Practice Hub', '/matters': 'Matters', '/contacts': 'Contacts',
    '/tasks': 'Tasks', '/cal': 'Calendar', '/time': 'Time Tracking', '/billing': 'Invoices',
    '/lawyer': 'Lawyer Dashboard', '/reports': 'Reports & Analytics',
  };
  const label = Object.entries(labels).find(([p]) => location.pathname.startsWith(p))?.[1] || 'Practice';
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 50,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
      background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
      boxShadow: '0 2px 12px rgba(124,58,237,0.25)',
    }}>
      <button onClick={onOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, display: 'flex' }}>
        <I.Menu size={20} />
      </button>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{label}</span>
    </div>
  );
}

/* ─── Exported sidebar (desktop fixed + mobile) ───────────────── */
export default function PracticeSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 236,
        background: '#fff', borderRight: '1px solid #E5E7EB',
        boxShadow: '4px 0 16px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
      }} className="hidden md:flex">
        <PracticeSidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden">
        <PracticeMobileBar onOpen={() => setMobileOpen(true)} />
        <PracticeMobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </>
  );
}
