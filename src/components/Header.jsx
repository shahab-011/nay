import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { I } from './Icons';

export default function Header({ title, children }) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount } = useAlertCount();
  const { toggle: toggleMenu } = useMobileMenu();

  const userInitial = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        marginLeft: 0,
        height: 60,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(11,11,20,0.04)',
      }}
      className="md:ml-[240px]"
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          onClick={toggleMenu}
          className="md:hidden"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="Open menu"
        >
          <I.Menu size={20} />
        </button>
        <motion.h2
          key={title}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-headline)' }}
        >
          {title}
        </motion.h2>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>

        {/* Privacy toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={togglePrivacy}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 20,
            border: `1px solid ${isPrivate ? 'var(--purple-mist)' : 'var(--border)'}`,
            background: isPrivate ? 'var(--purple-soft)' : 'transparent',
            color: isPrivate ? 'var(--purple)' : 'var(--text-muted)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 150ms',
          }}
          className="hidden sm:flex"
        >
          <I.Lock size={14} />
          <span className="hidden md:inline">{isPrivate ? 'Private' : 'Cloud'}</span>
        </motion.button>

        {/* Notification bell */}
        <motion.div style={{ position: 'relative' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <button
            onClick={() => navigate('/alerts')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <I.Bell size={18} />
          </button>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                style={{
                  position: 'absolute', top: -2, right: -2,
                  background: 'var(--red)', color: '#fff',
                  fontSize: 9, fontWeight: 700, padding: '1px 4px',
                  borderRadius: 6, minWidth: 15, textAlign: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} className="hidden sm:block" />

        {/* Avatar */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="hidden lg:block" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>{user?.name || '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role || 'user'}</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 17,
            background: 'var(--purple)', color: '#fff',
            fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--purple-mist)',
          }}>
            {userInitial}
          </div>
        </motion.button>
      </div>
    </motion.header>
  );
}
