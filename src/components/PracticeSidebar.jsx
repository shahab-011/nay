import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from './Icons';
import NotificationBell from './NotificationBell';

/* ── Design tokens ────────────────────────────────────────────── */
const SBG   = '#ffffff';          // sidebar background
const SBDR  = '#E8E4EE';          // border right
const T     = '#0B0B14';          // text primary
const TM    = '#5A5A6E';          // text secondary
const TS    = '#8A8A9E';          // section label
const HBG   = '#F1ECF7';          // hover bg
const ABG   = '#F0EAFC';          // active bg
const PURP  = '#7c3aed';

/* ── Nav structure ────────────────────────────────────────────── */
const NAV = [
  {
    sec: 'Overview',
    items: [
      { label: 'Practice Hub',  path: '/practice',  Ic: I.Home },
    ],
  },
  {
    sec: 'Matters',
    items: [
      { label: 'All Matters',     path: '/matters',   Ic: I.Briefcase },
      { label: 'Contacts',        path: '/contacts',  Ic: I.Users },
      { label: 'Lead Pipeline',   path: '/leads',     Ic: I.Target },
      { label: 'Conflict Check',  path: '/conflicts', Ic: I.Shield },
    ],
  },
  {
    sec: 'Work',
    items: [
      { label: 'Tasks',           path: '/tasks',          Ic: I.CheckSquare },
      { label: 'Calendar',        path: '/cal',            Ic: I.Calendar },
      { label: 'Communications',  path: '/communications', Ic: I.MessageSquare },
    ],
  },
  {
    sec: 'Billing',
    items: [
      { label: 'Time Tracking', path: '/time',    Ic: I.Timer },
      { label: 'Invoices',      path: '/billing', Ic: I.DollarSign },
      { label: 'Accounting',    path: '/accounting', Ic: I.Receipt },
    ],
  },
  {
    sec: 'Documents',
    items: [
      { label: 'Doc Automation', path: '/doc-automation', Ic: I.Layers },
      { label: 'E-Signatures',   path: '/esign',          Ic: I.PenTool },
    ],
  },
  {
    sec: 'Analytics',
    items: [
      { label: 'Reports', path: '/reports',   Ic: I.Chart },
      { label: 'AI Assistant', path: '/manage-ai', Ic: I.Zap },
    ],
  },
];

const LAWYER_SECTION = {
  sec: 'Firm',
  items: [
    { label: 'Lawyer Dashboard', path: '/lawyer',        Ic: I.Scale },
    { label: 'Client Links',     path: '/client-links',  Ic: I.Network },
    { label: 'Firm Settings',    path: '/firm-settings', Ic: I.Settings },
  ],
};

/* ── NavItem ──────────────────────────────────────────────────── */
function PLink({ item, onClick }) {
  return (
    <NavLink to={item.path} end={item.path === '/practice'} onClick={onClick}
      style={{ textDecoration: 'none', display: 'block', margin: '1px 8px' }}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: isActive ? ABG : 'transparent',
            color: isActive ? PURP : TM,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = HBG; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {/* Active left bar */}
          {isActive && (
            <motion.div
              layoutId="pm-active"
              style={{
                position: 'absolute', left: 0, top: '18%', bottom: '18%',
                width: 3, borderRadius: '0 3px 3px 0',
                background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
              }}
            />
          )}
          <item.Ic size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
          <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: isActive ? '-0.01em' : 0 }}>
            {item.label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}

/* ── Section label ────────────────────────────────────────────── */
function SecLabel({ label }) {
  return (
    <div style={{
      padding: '16px 20px 5px',
      fontSize: 9, fontWeight: 800,
      letterSpacing: '0.13em', color: TS,
      textTransform: 'uppercase',
    }}>{label}</div>
  );
}

/* ── Sidebar content ──────────────────────────────────────────── */
function SidebarContent({ onItemClick }) {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isLawyer  = ['lawyer', 'admin', 'owner', 'attorney'].includes(user?.role);
  const initial   = user?.name ? user.name[0].toUpperCase() : '?';
  const sections  = isLawyer ? [...NAV, LAWYER_SECTION] : NAV;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: SBG }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 16px 16px',
        background: 'linear-gradient(150deg, var(--purple-soft) 0%, var(--surface) 100%)',
        borderBottom: `1px solid ${SBDR}`,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orb decoration */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Scale size={17} style={{ color: PURP }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Practice</div>
            <div style={{ fontSize: 9, color: TS, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Management</div>
          </div>
          <NotificationBell />
        </div>

        {/* User pill */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: 'var(--bg)', borderRadius: 11, border: '1px solid var(--border)', cursor: 'default' }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: TM, textTransform: 'capitalize', marginTop: 1 }}>{user?.role || 'owner'}</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        </motion.div>
      </div>

      {/* ── Back to portal ──────────────────────────────────────── */}
      <div style={{ padding: '10px 8px 0', flexShrink: 0 }}>
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => { navigate('/services'); onItemClick?.(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 10, background: 'var(--bg)', border: `1px solid ${SBDR}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TM, transition: 'all 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = PURP; e.currentTarget.style.background = HBG; }}
          onMouseLeave={e => { e.currentTarget.style.color = TM; e.currentTarget.style.background = 'var(--bg)'; }}
        >
          <I.ArrowLeft size={13} />
          Back to Portal
        </motion.button>
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div style={{ margin: '10px 8px 0', height: 1, background: SBDR }} />

      {/* ── Nav ─────────────────────────────────────────────────── */}
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

      {/* ── Bottom actions ──────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${SBDR}`, padding: '12px 8px 16px', flexShrink: 0, background: 'var(--bg)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { navigate('/matters'); onItemClick?.(); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 11, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginBottom: 8, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
          <I.Plus size={14} /> New Matter
        </motion.button>

        <NavLink to="/practice-profile" style={{ textDecoration: 'none', display: 'block' }}>
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: 2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: isActive ? ABG : 'transparent', color: isActive ? '#c4b5fd' : TM, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'background 150ms' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = HBG; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <I.User size={14} />
              My Profile
            </motion.div>
          )}
        </NavLink>
      </div>
    </div>
  );
}

/* ── Mobile drawer ────────────────────────────────────────────── */
function MobileDrawer({ isOpen, onClose }) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: 256, zIndex: 70, borderRight: `1px solid ${SBDR}`, boxShadow: '4px 0 32px rgba(11,11,20,0.06)' }}
          >
            <SidebarContent onItemClick={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Mobile top bar ───────────────────────────────────────────── */
function MobileBar({ onOpen }) {
  const location = useLocation();
  const labels = {
    '/practice': 'Practice Hub', '/matters': 'Matters', '/contacts': 'Contacts',
    '/tasks': 'Tasks', '/cal': 'Calendar', '/time': 'Time Tracking', '/billing': 'Invoices',
    '/lawyer': 'Lawyer Dashboard', '/reports': 'Reports', '/doc-automation': 'Doc Automation',
    '/leads': 'Lead Pipeline', '/conflicts': 'Conflict Check', '/firm-settings': 'Firm Settings',
    '/esign': 'E-Signatures', '/communications': 'Communications', '/manage-ai': 'AI Assistant',
    '/notifications': 'Notifications', '/accounting': 'Accounting',
    '/practice-profile': 'My Profile',
    '/client-links': 'Client Links',
  };
  const label = Object.entries(labels).find(([p]) => location.pathname.startsWith(p))?.[1] || 'Practice';
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 50,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
      background: 'linear-gradient(135deg, var(--purple-soft) 0%, var(--surface) 100%)',
      borderBottom: `1px solid ${SBDR}`, boxShadow: '0 2px 20px rgba(11,11,20,0.06)',
    }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onOpen}
        style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)', borderRadius: 8, cursor: 'pointer', color: PURP, padding: '6px', display: 'flex' }}>
        <I.Menu size={18} />
      </motion.button>
      <span style={{ fontSize: 15, fontWeight: 700, color: T, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

/* ── Export ───────────────────────────────────────────────────── */
export default function PracticeSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 240,
        borderRight: `1px solid ${SBDR}`,
        boxShadow: '1px 0 0 rgba(0,0,0,0.05), 4px 0 24px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
      }} className="hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileBar onOpen={() => setMobileOpen(true)} />
        <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </>
  );
}
