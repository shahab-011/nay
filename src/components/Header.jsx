import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 md:left-[220px] right-0 h-16 z-40 flex justify-between items-center px-4 md:px-6 border-b"
      style={{
        background: 'rgba(0, 8, 40, 0.82)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderColor: 'rgba(68,229,194,0.07)',
      }}
    >
      {/* Subtle scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMenu}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/8 transition-all"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden md:block w-px h-4 bg-white/8" />
          <motion.h2
            key={title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="font-headline text-[15px] font-semibold text-on-surface truncate"
          >
            {title}
          </motion.h2>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">{children}</div>

        {/* Privacy toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={togglePrivacy}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-widest uppercase transition-all ${
            isPrivate
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white/3 border-white/8 text-on-surface-variant hover:text-white hover:border-primary/20'
          }`}
        >
          <span className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
            {isPrivate ? 'shield_lock' : 'cloud'}
          </span>
          <span className="hidden md:inline">{isPrivate ? 'Private' : 'Cloud'}</span>
        </motion.button>

        {/* Notification bell */}
        <motion.div className="relative" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/8 transition-all"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-on-primary text-[9px] font-bold px-1 py-px rounded-full min-w-[15px] text-center leading-none"
                style={{ boxShadow: '0 0 8px rgba(68,229,194,0.5)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="hidden sm:block h-5 w-px bg-white/8" />

        {/* Avatar */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="text-right hidden lg:block">
            <div className="text-xs font-bold text-on-surface leading-tight">{user?.name || '—'}</div>
            <div className="text-[10px] text-slate-500 capitalize tracking-widest">{user?.role || 'user'}</div>
          </div>
          <div className="relative">
            <AvatarDisplay user={user} size={34} className="border-2 border-primary/25" />
            <span className="absolute -bottom-0.5 -right-0.5 status-online" style={{ width: 8, height: 8 }} />
          </div>
        </motion.button>
      </div>
    </motion.header>
  );
}
