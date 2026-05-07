import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';

const navItems = [
  { name: 'Dashboard',          icon: 'dashboard',       path: '/'          },
  { name: 'Upload Document',    icon: 'upload_file',     path: '/upload'    },
  { name: 'My Documents',       icon: 'description',     path: '/documents' },
  { name: 'Ask AI',             icon: 'psychology',      path: '/ask'       },
  { name: 'Compare Documents',  icon: 'compare_arrows',  path: '/compare'   },
  { name: 'Contract Lifecycle', icon: 'history_edu',     path: '/lifecycle' },
  { name: 'Alerts',             icon: 'notifications',   path: '/alerts',   badge: true },
  { name: 'Client Links',       icon: 'handshake',       path: '/client-links', lawyerOnly: false },
];

const bottomItems = [
  { name: 'Profile',     icon: 'account_circle', path: '/profile' },
  { name: 'Help Center', icon: 'help',            path: '#'        },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();

  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] z-50 glass-sidebar flex flex-col border-r border-white/5 shadow-[24px_0_48px_rgba(0,15,59,0.08)]">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-primary-container font-headline">Nyaya</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mt-1">Legal Intelligence</p>
        </div>
        {/* Privacy mode dot indicator */}
        <div
          title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isPrivate ? 'bg-primary shadow-[0_0_8px_rgba(68,229,194,0.7)]' : 'bg-on-surface-variant/30'}`}
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
        {navItems
          // Lawyers see Client Links under Legal Pro — hide it from their main nav
          .filter(item => !(isLawyer && item.path === '/client-links'))
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10 active:scale-[0.98]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-sm font-medium font-headline tracking-tight flex-1">{item.name}</span>
              {item.badge && unread > 0 && (
                <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))
        }

        {/* Lawyer-only section */}
        {isLawyer && (
          <div className="pt-3">
            <div className="px-4 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Legal Pro
              </span>
            </div>
            {[
              { name: 'Lawyer Dashboard', icon: 'account_balance', path: '/lawyer'        },
              { name: 'Client Links',     icon: 'handshake',       path: '/client-links'  },
            ].map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium font-headline tracking-tight flex-1">{item.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-4 mt-auto border-t border-white/5 space-y-3">
        {/* New Analysis CTA */}
        <button
          onClick={() => navigate('/upload')}
          className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          New Analysis
        </button>

        {/* Privacy mode toggle */}
        <button
          onClick={togglePrivacy}
          className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl border transition-all text-sm font-semibold font-headline ${
            isPrivate
              ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
              : 'border-outline-variant/20 bg-surface-container text-on-surface-variant hover:text-white hover:border-primary/20'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px] flex-shrink-0"
            style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isPrivate ? 'shield_lock' : 'cloud'}
          </span>
          <span className="flex-1 text-left">{isPrivate ? 'Privacy Mode' : 'Cloud Mode'}</span>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPrivate ? 'bg-primary' : 'bg-on-surface-variant/40'}`} />
        </button>

        {/* Bottom nav items */}
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2 px-4 rounded-lg transition-all duration-200 text-sm ${
                  isActive && item.path !== '#'
                    ? 'text-[#00C9A7] font-semibold bg-[#00C9A7]/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span className="font-medium font-headline tracking-tight">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
