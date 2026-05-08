import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import AvatarDisplay from './AvatarDisplay';

export default function Header({ title, children }) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount } = useAlertCount();
  const { toggle: toggleMenu } = useMobileMenu();

  return (
    <header className="fixed top-0 left-0 md:left-[220px] right-0 h-16 z-40 bg-[#000f3b]/80 backdrop-blur-md flex justify-between items-center px-4 md:px-8 border-b border-white/5">

      {/* Left — hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleMenu}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        <h2 className="font-headline text-base md:text-lg font-semibold text-on-surface truncate">{title}</h2>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

        {/* Page-specific actions */}
        <div className="flex items-center gap-2 [&>button]:hidden [&>button]:md:flex [&>a]:hidden [&>a]:md:flex">
          {children}
        </div>

        {/* Privacy toggle — hidden on smallest screens */}
        <button
          onClick={togglePrivacy}
          title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase transition-all ${
            isPrivate
              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
              : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-primary/30'
          }`}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isPrivate ? 'shield_lock' : 'cloud'}
          </span>
          <span className="hidden md:inline">{isPrivate ? 'Private' : 'Cloud'}</span>
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-on-primary text-[9px] font-bold px-1 py-px rounded-full min-w-[15px] text-center leading-none pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* User avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden lg:block">
            <div className="text-xs font-bold text-on-surface leading-tight">{user?.name || '—'}</div>
            <div className="text-[10px] text-slate-500 capitalize tracking-widest">{user?.role || 'user'}</div>
          </div>
          <AvatarDisplay user={user} size={34} className="border-2 border-primary/20" />
        </button>
      </div>
    </header>
  );
}
