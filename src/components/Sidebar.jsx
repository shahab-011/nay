import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';

/* ── Nav item definitions ───────────────────────────────────────────── */

const navItems = [
  { name: 'Dashboard',          icon: 'dashboard',      path: '/'             },
  { name: 'Upload Document',    icon: 'upload_file',    path: '/upload'       },
  { name: 'My Documents',       icon: 'description',    path: '/documents'    },
  { name: 'Ask AI',             icon: 'psychology',     path: '/ask'          },
  { name: 'Compare Documents',  icon: 'compare_arrows', path: '/compare'      },
  { name: 'Contract Lifecycle', icon: 'history_edu',    path: '/lifecycle'       },
  { name: 'Contract Web',       icon: 'hub',            path: '/obligation-web'  },
  { name: 'Alerts',             icon: 'notifications',  path: '/alerts',      badge: true },
  { name: 'Client Links',       icon: 'handshake',      path: '/client-links' },
];

const bottomItems = [
  { name: 'Profile',     icon: 'account_circle', path: '/profile' },
  { name: 'Help Center', icon: 'help',            path: '/help'    },
  { name: 'About',       icon: 'info',            path: '/about'   },
];

const lawyerItems = [
  { name: 'Lawyer Dashboard', icon: 'account_balance', path: '/lawyer'       },
  { name: 'Client Links',     icon: 'handshake',       path: '/client-links' },
];

const BOTTOM_TABS = [
  { name: 'Home',      icon: 'dashboard',     path: '/'          },
  { name: 'Documents', icon: 'description',   path: '/documents' },
  { name: 'Ask AI',    icon: 'psychology',    path: '/ask'       },
  { name: 'Alerts',    icon: 'notifications', path: '/alerts',   badge: true },
];

const linkCls = (isActive) =>
  `flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-150 group ${
    isActive
      ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
  }`;

/* ══════════════════════════════════════════════════════════════════════
   SHARED NAV ITEMS (used by desktop sidebar + mobile drawer)
══════════════════════════════════════════════════════════════════════ */

function NavItems({ onItemClick, isLawyer, unread }) {
  return (
    <>
      {navItems
        .filter(item => !(isLawyer && item.path === '/client-links'))
        .map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={({ isActive }) => linkCls(isActive)}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">{item.icon}</span>
            <span className="text-[13px] font-medium font-headline tracking-tight flex-1 truncate">{item.name}</span>
            {item.badge && unread > 0 && (
              <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-px rounded-full min-w-[17px] text-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))
      }

      {isLawyer && (
        <div className="pt-2.5">
          <div className="px-3 pb-1.5 flex items-center gap-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 flex-shrink-0">Legal Pro</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {lawyerItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) => linkCls(isActive)}
            >
              <span className="material-symbols-outlined text-[18px] flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {item.icon}
              </span>
              <span className="text-[13px] font-medium font-headline tracking-tight flex-1 truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════ */

export default function Sidebar() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const { isOpen, open, close } = useMobileMenu();

  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  return (
    <>
      {/* ══════════ DESKTOP SIDEBAR (md+) ══════════ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] z-50 glass-sidebar flex-col border-r border-white/5 shadow-[24px_0_48px_rgba(0,15,59,0.08)]">

        {/* Logo */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-primary-container font-headline leading-none">Nyaya</h1>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant font-label mt-1">Legal Intelligence</p>
          </div>
          <div
            title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrivate ? 'bg-primary shadow-[0_0_7px_rgba(68,229,194,0.75)]' : 'bg-on-surface-variant/25'}`}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto min-h-0">
          <NavItems onItemClick={null} isLawyer={isLawyer} unread={unread} />
        </nav>

        {/* Bottom */}
        <div className="px-2.5 pb-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-1.5 pt-2.5 pb-1.5">
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 flex items-center justify-center gap-1.5 py-[7px] bg-primary-container text-on-primary-container rounded-lg text-[12px] font-bold font-headline hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              New Analysis
            </button>
            <button
              onClick={togglePrivacy}
              title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition-all flex-shrink-0 ${
                isPrivate
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-outline-variant/20 bg-surface-container text-on-surface-variant hover:text-white hover:border-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
                {isPrivate ? 'shield_lock' : 'cloud'}
              </span>
            </button>
          </div>

          <div className="space-y-0.5">
            {bottomItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-150 text-[13px] ${
                    isActive
                      ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[17px] flex-shrink-0">{item.icon}</span>
                <span className="font-medium font-headline tracking-tight">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </aside>

      {/* ══════════ MOBILE DRAWER OVERLAY ══════════ */}
      <div
        className={`md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* ══════════ MOBILE DRAWER ══════════ */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-[280px] z-[70] glass-sidebar flex flex-col border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-primary-container font-headline leading-none">Nyaya</h1>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant font-label mt-1">Legal Intelligence</p>
          </div>
          <button
            onClick={close}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          <NavItems onItemClick={close} isLawyer={isLawyer} unread={unread} />
        </nav>

        {/* Drawer bottom */}
        <div className="px-3 pb-8 border-t border-white/5 flex-shrink-0 space-y-1">
          <button
            onClick={() => { navigate('/upload'); close(); }}
            className="w-full flex items-center justify-center gap-2 mt-3 mb-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold font-headline hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Analysis
          </button>

          {bottomItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-150 text-[13px] ${
                  isActive
                    ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[17px] flex-shrink-0">{item.icon}</span>
              <span className="font-medium font-headline tracking-tight">{item.name}</span>
            </NavLink>
          ))}

          <button
            onClick={() => { togglePrivacy(); close(); }}
            className={`w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg text-[13px] font-medium transition-all ${
              isPrivate
                ? 'text-primary bg-primary/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] flex-shrink-0"
              style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
              {isPrivate ? 'shield_lock' : 'cloud'}
            </span>
            <span className="font-headline tracking-tight">{isPrivate ? 'Privacy Mode On' : 'Privacy Mode'}</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MOBILE BOTTOM TAB BAR ══════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000d35]/95 backdrop-blur-lg border-t border-white/8 flex items-stretch h-16 safe-area-bottom">

        {BOTTOM_TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-b-full" />
                )}
                <div className="relative">
                  <span
                    className="material-symbols-outlined text-[22px] leading-none"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                  {tab.badge && unread > 0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-on-primary text-[8px] font-bold px-1 py-px rounded-full min-w-[14px] text-center leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold font-headline leading-none tracking-wide">{tab.name}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More tab */}
        <button
          onClick={open}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px] leading-none">menu</span>
          <span className="text-[9px] font-bold font-headline leading-none tracking-wide">More</span>
        </button>
      </nav>
    </>
  );
}
