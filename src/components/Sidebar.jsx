import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', icon: 'dashboard', path: '/' },
  { name: 'Upload Document', icon: 'upload_file', path: '/upload' },
  { name: 'My Documents', icon: 'description', path: '/documents' },
  { name: 'AI Analysis', icon: 'analytics', path: '/analysis' },
  { name: 'Ask AI', icon: 'psychology', path: '/ask' },
  { name: 'Compare Documents', icon: 'compare_arrows', path: '/compare' },
  { name: 'Contract Lifecycle', icon: 'history_edu', path: '/lifecycle' },
  { name: 'Alerts', icon: 'notifications', path: '/alerts' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] z-50 glass-sidebar flex flex-col border-r border-white/5 shadow-[24px_0_48px_rgba(0,15,59,0.08)]">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tighter text-primary-container font-headline">Nyaya</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mt-1">Legal Intelligence</p>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
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
            <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>{item.icon}</span>
            <span className="text-sm font-medium font-headline tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-3 rounded-xl mb-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl" data-icon="add">add</span>
            New Analysis
        </button>
        <div className="space-y-1">
          <a className="text-slate-400 flex items-center gap-3 py-2 px-4 hover:text-slate-200 transition-colors text-sm" href="#">
            <span className="material-symbols-outlined text-[18px]" data-icon="settings">settings</span>
            Settings
          </a>
          <a className="text-slate-400 flex items-center gap-3 py-2 px-4 hover:text-slate-200 transition-colors text-sm" href="#">
            <span className="material-symbols-outlined text-[18px]" data-icon="help">help</span>
            Help Center
          </a>
        </div>
      </div>
    </aside>
  );
}
