import React, { useContext, useState, useEffect } from 'react';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { updatePassword, updateProfile, getUserStats, deleteAccount } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-surface-container-low border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-4 hover:border-primary/20 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold font-headline text-on-surface leading-none">{value}</div>
        <div className="text-[11px] text-on-surface-variant mt-1">{label}</div>
        {sub && <div className="text-[10px] text-primary/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-surface-container-high border border-outline-variant rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );
}

function SectionCard({ icon, title, children, className = '' }) {
  return (
    <section className={`bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-7 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <h3 className="text-sm font-bold font-headline tracking-tight text-on-surface">{title}</h3>
      </div>
      <div className="px-7 py-6">{children}</div>
    </section>
  );
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getAvatarColor(name = '') {
  const colors = [
    'from-[#00C9A7] to-[#0097A7]',
    'from-[#6366f1] to-[#8b5cf6]',
    'from-[#f59e0b] to-[#ef4444]',
    'from-[#3b82f6] to-[#6366f1]',
    'from-[#10b981] to-[#059669]',
    'from-[#f97316] to-[#ef4444]',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function Profile() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Preferences (UI state only)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [privacyMode, setPrivacyMode] = useState('private');

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getUserStats()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    setNameValue(user?.name || '');
  }, [user?.name]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    setNameLoading(true);
    setNameMsg('');
    try {
      const res = await updateProfile(nameValue.trim());
      updateUser({ name: res.data.data.user.name });
      setNameMsg('saved');
    } catch {
      setNameMsg('error');
    } finally {
      setNameLoading(false);
      setEditingName(false);
      setTimeout(() => setNameMsg(''), 2500);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!currentPw) return setPwError('Enter your current password.');
    if (newPw.length < 6) return setPwError('New password must be at least 6 characters.');
    if (newPw !== confirmPw) return setPwError('New passwords do not match.');
    if (newPw === currentPw) return setPwError('New password must differ from current.');
    setPwLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      setPwSuccess('Password updated successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate('/login');
    } catch {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  const displayRole = user?.role || 'user';
  const displayPlan = user?.plan || 'free';
  const avatarGrad  = getAvatarColor(user?.name);
  const initials    = getInitials(user?.name);

  const roleConfig = {
    lawyer: { label: 'Legal Professional', icon: 'gavel', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    admin:  { label: 'Administrator',      icon: 'shield', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    user:   { label: 'Standard User',      icon: 'person', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  };
  const rc = roleConfig[displayRole] || roleConfig.user;

  return (
    <>
      <Header title="Profile & Settings">
        <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
      </Header>

      <div className="p-8 pb-24 space-y-8 max-w-6xl">

        {/* ── Hero Card ───────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-surface-container-low">
          {/* Banner — pure CSS top area, no separate div so no divider line */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-[#0a1628] via-[#0d2040] to-[#003d30] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,201,167,0.18),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(0,151,167,0.12),transparent_70%)]" />
          </div>

          {/* Profile info — sits on top of the absolute banner */}
          <div className="relative px-8 pb-7 pt-28">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 mb-5">
              {/* Avatar */}
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center border-4 border-surface-container-low shadow-xl flex-shrink-0`}>
                <span className="text-3xl font-bold text-white font-headline">{initials}</span>
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(user?.name || ''); } }}
                        className="bg-surface-container border border-primary/40 rounded-lg px-3 py-1.5 text-xl font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary/30 font-headline w-56"
                      />
                      <button onClick={handleSaveName} disabled={nameLoading} className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                        {nameLoading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                      <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-on-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 hover:gap-2.5 transition-all">
                      <h2 className="text-2xl font-bold font-headline tracking-tight text-on-surface">{user?.name || '—'}</h2>
                      <span className="material-symbols-outlined text-base text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </button>
                  )}
                  {nameMsg === 'saved' && <span className="text-xs text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Saved</span>}
                  {nameMsg === 'error' && <span className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>Failed</span>}
                </div>

                <p className="text-sm text-on-surface-variant font-mono mt-0.5">{user?.email}</p>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${rc.color}`}>
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{rc.icon}</span>
                    {rc.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                    displayPlan === 'pro'
                      ? 'text-primary bg-primary/10 border-primary/20'
                      : 'text-slate-400 bg-slate-400/10 border-slate-400/20'
                  }`}>
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{displayPlan === 'pro' ? 'verified' : 'person'}</span>
                    {displayPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    Member since {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="description"    label="Documents uploaded"  value={statsLoading ? '—' : stats?.totalDocuments ?? 0} />
          <StatCard icon="auto_awesome"   label="Analyses completed"  value={statsLoading ? '—' : stats?.totalAnalyses  ?? 0} />
          <StatCard icon="warning"        label="Risks detected"      value={statsLoading ? '—' : stats?.totalRisks     ?? 0} />
          <StatCard icon="schedule"       label="Last active"         value={statsLoading ? '—' : formatRelative(user?.lastLogin)} />
        </div>

        {/* ── Main Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Edit Profile */}
            <SectionCard icon="manage_accounts" title="Account Information">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Full Name</label>
                  <div className="flex gap-2">
                    <input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onFocus={() => setEditingName(true)}
                      placeholder="Your full name"
                      className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameLoading || nameValue.trim() === user?.name}
                      className="px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {nameLoading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                      Save
                    </button>
                  </div>
                  {nameMsg === 'saved' && <p className="text-xs text-primary mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Name updated successfully</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Email Address</label>
                  <div className="flex items-center gap-3 bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">mail</span>
                    <span className="text-sm text-on-surface-variant font-mono">{user?.email}</span>
                    <span className="ml-auto text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">Cannot change</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Account Type</div>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold ${rc.color}`}>
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{rc.icon}</span>
                      {rc.label}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Plan</div>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold ${displayPlan === 'pro' ? 'text-primary bg-primary/10 border-primary/20' : 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{displayPlan === 'pro' ? 'verified' : 'person'}</span>
                      {displayPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-surface-container rounded-xl px-4 py-3 border border-white/5">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Member Since</div>
                    <div className="text-on-surface font-medium">{formatDate(user?.createdAt)}</div>
                  </div>
                  <div className="bg-surface-container rounded-xl px-4 py-3 border border-white/5">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Last Login</div>
                    <div className="text-on-surface font-medium">{formatRelative(user?.lastLogin)}</div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Security */}
            <SectionCard icon="lock" title="Security — Change Password">
              <form className="space-y-4" onSubmit={handlePasswordChange}>
                {[
                  { label: 'Current Password', val: currentPw, set: setCurrentPw, key: 'current' },
                  { label: 'New Password',     val: newPw,     set: setNewPw,     key: 'new'     },
                  { label: 'Confirm Password', val: confirmPw, set: setConfirmPw, key: 'confirm' },
                ].map(({ label, val, set, key }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[key] ? 'text' : 'password'}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 pr-12 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-slate-600"
                      />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-lg">{showPw[key] ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {pwError   && <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm"><span className="material-symbols-outlined text-base flex-shrink-0">error</span>{pwError}</div>}
                {pwSuccess && <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl text-sm"><span className="material-symbols-outlined text-base flex-shrink-0">check_circle</span>{pwSuccess}</div>}

                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={pwLoading}
                    className="bg-primary-container text-on-primary-container font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(0,201,167,0.15)] disabled:opacity-50">
                    {pwLoading ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Saving…</> : <><span className="material-symbols-outlined text-base">lock_reset</span>Update Password</>}
                  </button>
                </div>
              </form>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Preferences */}
            <SectionCard icon="tune" title="Preferences">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Notifications</div>
                  <div className="space-y-4">
                    {[
                      { label: 'Email Summaries',    sub: 'Weekly digest of analysis activity',    val: emailAlerts, set: setEmailAlerts },
                      { label: 'In-app Alerts',      sub: 'Real-time clause detection warnings',   val: inAppAlerts, set: setInAppAlerts },
                    ].map(({ label, sub, val, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-on-surface">{label}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">{sub}</div>
                        </div>
                        <Toggle checked={val} onChange={e => set(e.target.checked)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Default Privacy Mode</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'private', icon: 'vpn_lock',  label: 'Private Vault',  sub: 'Local processing only'     },
                      { key: 'cloud',   icon: 'cloud',      label: 'Cloud Sync',     sub: 'Cross-device, full AI'     },
                    ].map(({ key, icon, label, sub }) => (
                      <button key={key} onClick={() => setPrivacyMode(key)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2 active:scale-[0.97] ${
                          privacyMode === key ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface-container hover:border-primary/30'
                        }`}>
                        <span className={`material-symbols-outlined text-2xl ${privacyMode === key ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        <span className="text-sm font-semibold text-on-surface">{label}</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Quick actions */}
            <SectionCard icon="apps" title="Quick Actions">
              <div className="space-y-2">
                {[
                  { label: 'Upload New Document', icon: 'upload_file', path: '/upload',    color: 'text-primary' },
                  { label: 'View My Documents',   icon: 'description', path: '/documents', color: 'text-blue-400' },
                  { label: 'Ask AI a Question',   icon: 'psychology',  path: '/ask',       color: 'text-purple-400' },
                  { label: 'View Alerts',         icon: 'notifications',path: '/alerts',   color: 'text-amber-400' },
                ].map(({ label, icon, path, color }) => (
                  <button key={path} onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                    <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="text-sm font-medium text-on-surface">{label}</span>
                    <span className="material-symbols-outlined text-base text-on-surface-variant ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Danger Zone */}
            <section className="rounded-2xl border border-error/25 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-error/40 to-transparent" />
              <div className="px-7 py-5 border-b border-error/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <h3 className="text-sm font-bold font-headline text-error">Danger Zone</h3>
              </div>
              <div className="px-7 py-6 space-y-3 bg-error/[0.02]">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Signing out ends your session. Deleting your account permanently removes all your documents, analyses, and data — this cannot be undone.
                </p>

                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm font-semibold hover:bg-white/5 hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out
                </button>

                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-error/30 text-error text-sm font-semibold hover:bg-error/10 transition-all">
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                    Delete My Account
                  </button>
                ) : (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-error font-semibold">Are you absolutely sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-white/5 transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleDeleteAccount} disabled={deleteLoading}
                        className="flex-1 py-2 rounded-lg bg-error text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-1">
                        {deleteLoading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">delete_forever</span>}
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
