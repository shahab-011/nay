import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { I } from './Icons';

/* ── Design tokens ──────────────────────────────────────────────── */
const BG    = '#07091f';
const SBDR  = 'rgba(99,102,241,0.18)';
const T     = '#f0f0ff';
const TM    = 'rgba(240,240,255,0.45)';
const TS    = 'rgba(240,240,255,0.18)';
const HBG   = 'rgba(255,255,255,0.04)';
const ABG   = 'rgba(99,102,241,0.14)';
const INDIGO = '#6366f1';
const CYAN   = '#22d3ee';

/* ── Nav structure ───────────────────────────────────────────────── */
const STUDIO_NAV = [
  { sec: 'Documents' },
  { name: 'Upload Document',    path: '/upload',         Ic: I.Upload },
  { name: 'My Documents',       path: '/documents',      Ic: I.Folder },
  { sec: 'AI Tools' },
  { name: 'Ask AI',             path: '/ask',            Ic: I.MessageCircle },
  { name: 'Compare Documents',  path: '/compare',        Ic: I.Copy },
  { name: 'Obligation Web',     path: '/obligation-web', Ic: I.Network },
  { sec: 'Monitoring' },
  { name: 'Contract Lifecycle', path: '/lifecycle',      Ic: I.Clock },
  { name: 'Alerts',             path: '/alerts',         Ic: I.Bell, badge: true },
  { name: 'Client Links',       path: '/client-links',   Ic: I.Users },
];

const MOBILE_TABS = [
  { name: 'Studio', path: '/studio',    Ic: I.DocAI,         end: true },
  { name: 'Docs',   path: '/documents', Ic: I.Folder },
  { name: 'Ask AI', path: '/ask',       Ic: I.MessageCircle },
  { name: 'Alerts', path: '/alerts',    Ic: I.Bell, badge: true },
];

/* ── NavItem ─────────────────────────────────────────────────────── */
function NavItem({ item, onClick, unread }) {
  if (item.sec) {
    return (
      <div style={{
        padding: '16px 20px 5px',
        fontSize: 9, fontWeight: 800, letterSpacing: '0.13em',
        color: TS, textTransform: 'uppercase',
      }}>
        {item.sec}
      </div>
    );
  }
  return (
    <NavLink to={item.path} end={item.path === '/'} onClick={onClick}
      style={{ textDecoration: 'none', display: 'block', margin: '1px 8px' }}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: isActive ? ABG : 'transparent',
            color: isActive ? '#a5b4fc' : TM,
            cursor: 'pointer', position: 'relative',
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = HBG; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {isActive && (
            <motion.div
              layoutId="studio-active"
              style={{
                position: 'absolute', left: 0, top: '18%', bottom: '18%',
                width: 3, borderRadius: '0 3px 3px 0',
                background: `linear-gradient(180deg, ${CYAN} 0%, ${INDIGO} 100%)`,
              }}
            />
          )}
          <item.Ic size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: isActive ? '-0.01em' : 0 }}>
            {item.name}
          </span>
          {item.badge && unread > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff',
              fontSize: 9, fontWeight: 700, padding: '2px 6px',
              borderRadius: 6, minWidth: 18, textAlign: 'center',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

/* ── Sidebar content ─────────────────────────────────────────────── */
function SidebarContent({ onItemClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const initial = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 16px 16px',
        background: 'linear-gradient(150deg, #111535 0%, #0b0e26 100%)',
        borderBottom: `1px solid ${SBDR}`,
        flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand */}
        <motion.div
          onClick={() => { navigate('/studio'); onItemClick?.(); }}
          whileHover={{ scale: 1.01 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px rgba(99,102,241,0.4)`,
          }}>
            <I.DocAI size={17} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Document</div>
            <div style={{ fontSize: 9, color: TM, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Studio · AI</div>
          </div>
          <div style={{
            padding: '3px 7px', borderRadius: 6,
            background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)',
            fontSize: 9, fontWeight: 700, color: CYAN, letterSpacing: '0.05em',
          }}>AI</div>
        </motion.div>

        {/* User pill */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px',
            background: 'rgba(255,255,255,0.06)', borderRadius: 11,
            border: '1px solid rgba(255,255,255,0.07)', cursor: 'default',
          }}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: `linear-gradient(135deg, ${INDIGO}, #818cf8)`,
              color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: TM, marginTop: 1 }}>{isPrivate ? '🔒 Private Mode' : (user?.role || 'user')}</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        </motion.div>
      </div>

      {/* ── Back to Portal ──────────────────────────────────────────── */}
      <div style={{ padding: '10px 8px 0', flexShrink: 0 }}>
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => { navigate('/services'); onItemClick?.(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${SBDR}`,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TM, transition: 'color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.background = ABG; }}
          onMouseLeave={e => { e.currentTarget.style.color = TM; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <I.ArrowLeft size={13} /> Back to Portal
        </motion.button>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div style={{ margin: '10px 8px 0', height: 1, background: SBDR }} />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {STUDIO_NAV.map(item => (
          <NavItem key={item.sec || item.path} item={item} onClick={onItemClick} unread={unread} />
        ))}
      </div>

      {/* ── Bottom actions ───────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${SBDR}`, padding: '12px 8px 16px', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { navigate('/upload'); onItemClick?.(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px', borderRadius: 11,
            background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            marginBottom: 8, boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          <I.Plus size={14} /> New Analysis
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={togglePrivacy}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
            background: isPrivate ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isPrivate ? 'rgba(99,102,241,0.4)' : SBDR}`,
            color: isPrivate ? '#a5b4fc' : TM,
            fontSize: 12, fontWeight: 600, marginBottom: 6,
          }}
        >
          <I.Lock size={13} />
          <span style={{ flex: 1 }}>{isPrivate ? 'Privacy Mode On' : 'Privacy Mode'}</span>
          {isPrivate && (
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', fontWeight: 800 }}>ON</span>
          )}
        </motion.button>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { path: '/profile', Ic: I.User,  label: 'Profile' },
            { path: '/help',    Ic: I.Info,   label: 'Help'    },
          ].map(b => (
            <NavLink key={b.path} to={b.path} onClick={onItemClick} style={{ flex: 1, textDecoration: 'none' }}>
              {({ isActive }) => (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: isActive ? ABG : HBG,
                    color: isActive ? '#a5b4fc' : TM,
                    cursor: 'pointer', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = ABG; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = HBG; }}
                >
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

/* ── Mobile drawer ───────────────────────────────────────────────── */
/* ── Exported Sidebar ────────────────────────────────────────────── */
export default function Sidebar() {
  const { isOpen, open, close } = useMobileMenu();
  const { unreadCount: unread } = useAlertCount();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: 236,
        zIndex: 50, flexDirection: 'column',
        borderRight: `1px solid ${SBDR}`,
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            className="md:hidden"
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
              zIndex: 70, borderRight: `1px solid ${SBDR}`,
              boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
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
        background: '#09102a', borderTop: `1px solid ${SBDR}`,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}>
        {MOBILE_TABS.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.end} style={{ flex: 1, textDecoration: 'none', display: 'flex' }}>
            {({ isActive }) => (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                color: isActive ? '#a5b4fc' : TM, position: 'relative',
              }}>
                {isActive && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, borderRadius: '0 0 2px 2px', background: INDIGO }} />}
                <div style={{ position: 'relative' }}>
                  <tab.Ic size={20} />
                  {tab.badge && unread > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -6, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 6, minWidth: 14, textAlign: 'center' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.name}</span>
              </div>
            )}
          </NavLink>
        ))}
        <button
          onClick={open}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: TM, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <I.Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>More</span>
        </button>
      </nav>
    </>
  );
}
