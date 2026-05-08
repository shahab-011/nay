import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';

const navItems = [
  { name: 'Dashboard',          icon: 'dashboard',      path: '/'             },
  { name: 'Upload Document',    icon: 'upload_file',    path: '/upload'       },
  { name: 'My Documents',       icon: 'description',    path: '/documents'    },
  { name: 'Ask AI',             icon: 'psychology',     path: '/ask'          },
  { name: 'Compare Documents',  icon: 'compare_arrows', path: '/compare'      },
  { name: 'Contract Lifecycle', icon: 'history_edu',    path: '/lifecycle'    },
  { name: 'Alerts',             icon: 'notifications',  path: '/alerts',      badge: true },
  { name: 'Client Links',       icon: 'handshake',      path: '/client-links' },
];

const bottomItems = [
  { name: 'Profile',     icon: 'account_circle', path: '/profile' },
  { name: 'Help Center', icon: 'help',            path: '/help'    },
];

const lawyerItems = [
  { name: 'Lawyer Dashboard', icon: 'account_balance', path: '/lawyer'       },
  { name: 'Client Links',     icon: 'handshake',       path: '/client-links' },
];

/* ── Shared nav-link style ──────────────────────────────────────────── */
const linkCls = (isActive) =>
  `flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-150 group ${
    isActive
      ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
  }`;

export default function Sidebar() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();

  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] z-50 glass-sidebar flex flex-col border-r border-white/5 shadow-[24px_0_48px_rgba(0,15,59,0.08)]">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-primary-container font-headline leading-none">Nyaya</h1>
          <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant font-label mt-1">Legal Intelligence</p>
        </div>
        {/* Privacy dot */}
        <div
          title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrivate ? 'bg-primary shadow-[0_0_7px_rgba(68,229,194,0.75)]' : 'bg-on-surface-variant/25'}`}
        />
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-hidden min-h-0">

        {/* Main items */}
        {navItems
          .filter(item => !(isLawyer && item.path === '/client-links'))
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
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

        {/* Legal Pro section */}
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
                className={({ isActive }) => linkCls(isActive)}
              >
                <span
                  className="material-symbols-outlined text-[18px] flex-shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium font-headline tracking-tight flex-1 truncate">{item.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── Bottom ───────────────────────────────────────────────────── */}
      <div className="px-2.5 pb-3 border-t border-white/5 flex-shrink-0">

        {/* New Analysis + Privacy — compact side-by-side row */}
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
            title={isPrivate ? 'Privacy Mode — click to switch to Cloud' : 'Cloud Mode — click to enable Privacy'}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition-all flex-shrink-0 ${
              isPrivate
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-outline-variant/20 bg-surface-container text-on-surface-variant hover:text-white hover:border-primary/20'
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isPrivate ? 'shield_lock' : 'cloud'}
            </span>
          </button>
        </div>

        {/* Profile + Help */}
        <div className="space-y-0.5">
          {bottomItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-150 text-[13px] ${
                  isActive && item.path !== '#'
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
  );
}
