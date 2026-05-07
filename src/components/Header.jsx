import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import AvatarDisplay from './AvatarDisplay';

export default function Header({ title, children }) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount } = useAlertCount();


  return (
    <header className="fixed top-0 right-0 w-[calc(100%-220px)] h-16 z-40 bg-[#000f3b]/50 backdrop-blur-md flex justify-between items-center px-8 border-b border-white/5">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-lg font-semibold text-on-surface">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Page-specific actions passed as children */}
        {children}

        {/* Global privacy toggle */}
        <button
          onClick={togglePrivacy}
          title={isPrivate ? 'Privacy Mode — click to switch to Cloud' : 'Cloud Mode — click to enable Privacy'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold font-label tracking-wider uppercase transition-all ${
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
          {isPrivate ? 'Private' : 'Cloud'}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <span
            onClick={() => navigate('/alerts')}
            className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors"
          >
            notifications
          </span>
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] font-bold px-1 py-px rounded-full min-w-[16px] text-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary/30 rounded-full" />
          )}
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* User avatar + name */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-on-surface leading-tight">
              {user?.name || '—'}
            </div>
            <div className="text-[10px] text-slate-500 capitalize tracking-widest">
              {user?.role || 'user'}
            </div>
          </div>
          <AvatarDisplay user={user} size={36} className="border-2 border-primary/20" />
        </button>
      </div>
    </header>
  );
}
