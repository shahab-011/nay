import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAlertCount } from '../context/AlertContext';
import { useMobileMenu } from '../context/MobileMenuContext';

const navItems = [
  { name: 'Dashboard',          icon: 'dashboard',      path: '/'                },
  { name: 'Upload Document',    icon: 'upload_file',    path: '/upload'          },
  { name: 'My Documents',       icon: 'description',    path: '/documents'       },
  { name: 'Ask AI',             icon: 'psychology',     path: '/ask'             },
  { name: 'Compare Documents',  icon: 'compare_arrows', path: '/compare'         },
  { name: 'Contract Lifecycle', icon: 'history_edu',    path: '/lifecycle'       },
  { name: 'Contract Web',       icon: 'hub',            path: '/obligation-web'  },
  { name: 'Alerts',             icon: 'notifications',  path: '/alerts', badge: true },
  { name: 'Client Links',       icon: 'handshake',      path: '/client-links'    },
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
  { name: 'Alerts',    icon: 'notifications', path: '/alerts', badge: true },
];

const sidebarVariants = {
  hidden: { x: -280, opacity: 0 },
  visible: {
    x: 0, opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: -280, opacity: 0,
    transition: { duration: 0.25, ease: [0.36, 0, 0.66, 0] },
  },
};

const navItemVariants = {
  initial: { opacity: 0, x: -12 },
  animate: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.045, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

function NavItemLink({ item, idx, onItemClick, unread }) {
  return (
    <motion.div
      custom={idx}
      variants={navItemVariants}
      initial="initial"
      animate="animate"
    >
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={onItemClick}
        className={({ isActive }) =>
          `relative flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all duration-200 group overflow-hidden ${
            isActive
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {/* Active left bar */}
            {isActive && (
              <motion.span
                layoutId="nav-active-bar"
                className="nav-active-bar"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {/* Hover shimmer */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/3 to-transparent" />

            <span
              className={`material-symbols-outlined text-[18px] flex-shrink-0 transition-all duration-200 ${isActive ? 'text-glow' : ''}`}
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="text-[13px] font-medium font-headline tracking-tight flex-1 truncate">
              {item.name}
            </span>
            {item.badge && unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary text-on-primary text-[9px] font-bold px-1.5 py-px rounded-full min-w-[17px] text-center leading-none"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

function NavItems({ onItemClick, isLawyer, unread }) {
  return (
    <>
      {navItems
        .filter(item => !(isLawyer && item.path === '/client-links'))
        .map((item, idx) => (
          <NavItemLink key={item.path} item={item} idx={idx} onItemClick={onItemClick} unread={unread} />
        ))}

      {isLawyer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.4 } }}
          className="pt-2.5"
        >
          <div className="px-3 pb-1.5 flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/50 flex-shrink-0">Legal Pro</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
          {lawyerItems.map((item, idx) => (
            <NavItemLink key={item.path} item={item} idx={idx + navItems.length} onItemClick={onItemClick} unread={0} />
          ))}
        </motion.div>
      )}
    </>
  );
}

export default function Sidebar() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { unreadCount: unread } = useAlertCount();
  const { isOpen, open, close } = useMobileMenu();
  const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';

  return (
    <>
      {/* ══════════ DESKTOP SIDEBAR ══════════ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] z-50 glass-sidebar flex-col shadow-[4px_0_40px_rgba(0,0,0,0.4)]">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 pt-5 pb-4 flex items-center justify-between border-b border-white/5 flex-shrink-0"
        >
          <div>
            <h1 className="text-xl font-black tracking-tighter gradient-text font-headline leading-none">
              Nyaya
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-label mt-0.5">
              Legal Intelligence
            </p>
          </div>
          <motion.div
            animate={isPrivate ? {
              boxShadow: ['0 0 0px rgba(68,229,194,0)', '0 0 8px rgba(68,229,194,0.8)', '0 0 0px rgba(68,229,194,0)'],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrivate ? 'bg-primary' : 'bg-on-surface-variant/20'}`}
          />
        </motion.div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto min-h-0 custom-scrollbar">
          <NavItems onItemClick={null} isLawyer={isLawyer} unread={unread} />
        </nav>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="px-2 pb-3 border-t border-white/5 flex-shrink-0"
        >
          {/* New Analysis button */}
          <div className="flex items-center gap-1.5 pt-2.5 pb-1.5">
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 relative flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-primary to-[#38debb] text-on-primary rounded-xl text-[12px] font-bold font-headline overflow-hidden group neon-btn"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="material-symbols-outlined text-[15px]">add</span>
              New Analysis
            </button>
            <button
              onClick={togglePrivacy}
              title={isPrivate ? 'Privacy Mode' : 'Cloud Mode'}
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-xl border transition-all flex-shrink-0 ${
                isPrivate
                  ? 'border-primary/40 bg-primary/10 text-primary glow-primary-sm'
                  : 'border-white/8 bg-white/3 text-on-surface-variant hover:text-white hover:border-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
                {isPrivate ? 'shield_lock' : 'cloud'}
              </span>
            </button>
          </div>

          {/* Bottom nav items */}
          <div className="space-y-0.5">
            {bottomItems.map((item, idx) => (
              <motion.div key={item.name} custom={idx} variants={navItemVariants} initial="initial" animate="animate">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all duration-200 text-[12px] ${
                      isActive
                        ? 'text-primary font-semibold bg-primary/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">{item.icon}</span>
                  <span className="font-medium font-headline tracking-tight">{item.name}</span>
                </NavLink>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </aside>

      {/* ══════════ MOBILE DRAWER OVERLAY ══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* ══════════ MOBILE DRAWER ══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden fixed top-0 left-0 h-full w-[280px] z-[70] glass-sidebar flex flex-col shadow-2xl"
          >
            {/* Drawer header */}
            <div className="px-4 pt-5 pb-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
              <div>
                <h1 className="text-xl font-black tracking-tighter gradient-text font-headline leading-none">Nyaya</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-label mt-0.5">Legal Intelligence</p>
              </div>
              <button
                onClick={close}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-white hover:bg-white/8 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
              <NavItems onItemClick={close} isLawyer={isLawyer} unread={unread} />
            </nav>

            {/* Drawer bottom */}
            <div className="px-3 pb-8 border-t border-white/5 flex-shrink-0 space-y-1">
              <button
                onClick={() => { navigate('/upload'); close(); }}
                className="w-full flex items-center justify-center gap-2 mt-3 mb-1 py-3 bg-gradient-to-r from-primary to-[#38debb] text-on-primary rounded-xl text-sm font-bold font-headline neon-btn"
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
                    `flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all text-[13px] ${
                      isActive ? 'text-primary font-semibold bg-primary/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] flex-shrink-0">{item.icon}</span>
                  <span className="font-medium font-headline tracking-tight">{item.name}</span>
                </NavLink>
              ))}
              <button
                onClick={() => { togglePrivacy(); close(); }}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl text-[13px] font-medium transition-all ${
                  isPrivate ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[17px] flex-shrink-0"
                  style={{ fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
                  {isPrivate ? 'shield_lock' : 'cloud'}
                </span>
                <span className="font-headline tracking-tight">{isPrivate ? 'Privacy Mode On' : 'Privacy Mode'}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══════════ MOBILE BOTTOM TAB BAR ══════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch h-16 safe-area-bottom"
        style={{ background: 'rgba(0,8,40,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(68,229,194,0.08)' }}>
        {BOTTOM_TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${isActive ? 'text-primary' : 'text-slate-500'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="bottom-tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full"
                    style={{ background: 'linear-gradient(90deg, #44e5c2, #66d6e7)', boxShadow: '0 0 8px rgba(68,229,194,0.6)' }}
                  />
                )}
                <div className="relative">
                  <span className="material-symbols-outlined text-[22px] leading-none"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
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
