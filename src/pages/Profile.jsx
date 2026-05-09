import React, { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { updatePassword, updateProfile, getUserStats, deleteAccount } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';
import { AvatarSVG, AVATAR_META, resizeImage } from '../components/AvatarDisplay';

/* ─── Small reusable pieces ───────────────────────────────────────── */
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

function StatCard({ icon, label, value }) {
  return (
    <motion.div whileHover={{ y:-4, scale:1.03, boxShadow:'0 12px 30px rgba(0,0,0,0.25)' }} whileTap={{ scale:0.98 }}
      className="border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-4"
      style={{ background:'rgba(12,28,73,0.55)', backdropFilter:'blur(12px)' }}>
      <motion.div whileHover={{ rotate:8 }}
        className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </motion.div>
      <div>
        <div className="text-2xl font-bold font-headline text-on-surface leading-none">{value}</div>
        <div className="text-[11px] text-on-surface-variant mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

/* ─── Avatar Picker Modal ─────────────────────────────────────────── */
function AvatarPicker({ current, onSave, onClose, saving }) {
  const [selected, setSelected]       = useState(current || 'av0');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading]     = useState(false);
  const fileRef = React.useRef(null);

  const isPhoto    = selected && selected.startsWith('data:image/');
  const previewMeta = AVATAR_META.find(a => a.id === selected);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, 220);
      setSelected(dataUrl);
    } catch (err) {
      setUploadError(err.message || 'Could not process image. Try a different file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold font-headline text-on-surface">Choose Avatar</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Pick a preset or upload your own photo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Upload your photo */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Your Photo</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              {uploading
                ? <span className="material-symbols-outlined text-primary text-xl animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_photo_alternate</span>
              }
            </div>
            <div>
              <div className="text-sm font-semibold text-on-surface">{uploading ? 'Processing…' : 'Upload a photo'}</div>
              <div className="text-[11px] text-on-surface-variant mt-0.5">JPG, PNG, WEBP · auto-resized to 220×220 px</div>
            </div>
            {isPhoto && (
              <div className="ml-auto w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0">
                <AvatarSVG id={selected} size={40} />
              </div>
            )}
          </button>
          {uploadError && (
            <p className="text-xs text-error mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>{uploadError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Or choose a preset</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {AVATAR_META.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                selected === id
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,201,167,0.2)]'
                  : 'border-white/8 bg-white/3 hover:border-primary/40 hover:bg-white/5'
              }`}
            >
              {selected === id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[11px] text-on-primary">check</span>
                </div>
              )}
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
                <AvatarSVG id={id} size={56} />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface">{label}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">{desc}</div>
              </div>
              {id === 'av0' && <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider">Default</span>}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex items-center gap-4 p-4 bg-white/3 rounded-xl border border-white/5 mb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/40">
            <AvatarSVG id={selected} size={56} />
          </div>
          <div>
            <div className="text-xs text-on-surface-variant">Preview</div>
            <div className="text-sm font-bold text-on-surface mt-0.5">
              {isPhoto ? 'Your Photo' : (previewMeta?.label || 'Avatar')}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {isPhoto ? 'Custom uploaded image' : (previewMeta?.desc || '')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,167,0.2)]"
          >
            {saving
              ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined text-base">check_circle</span>Apply Avatar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function Profile() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showPicker, setShowPicker]   = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // Edit name
  const [nameValue, setNameValue]     = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg]         = useState('');

  // Password
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [pwLoading, setPwLoading]     = useState(false);
  const [pwError, setPwError]         = useState('');
  const [pwSuccess, setPwSuccess]     = useState('');
  const [showPw, setShowPw]           = useState({ current: false, new: false, confirm: false });

  // Prefs
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [privacyMode, setPrivacyMode] = useState('private');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getUserStats()
      .then(r => setStats(r.data.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => { setNameValue(user?.name || ''); }, [user?.name]);

  const currentAvatarId = user?.avatarUrl || 'av0';

  const handleSaveAvatar = async (id) => {
    const previous = user?.avatarUrl || 'av0';
    // Optimistic update — close picker and show new avatar immediately
    setShowPicker(false);
    updateUser({ avatarUrl: id });
    setAvatarSaving(true);
    try {
      await updateProfile({ avatarUrl: id });
    } catch {
      // Revert to previous avatar if backend call fails
      updateUser({ avatarUrl: previous });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === user?.name) return;
    setNameLoading(true);
    setNameMsg('');
    try {
      const res = await updateProfile({ name: nameValue.trim() });
      updateUser({ name: res.data.data.user.name });
      setNameMsg('saved');
    } catch {
      setNameMsg('error');
    } finally {
      setNameLoading(false);
      setTimeout(() => setNameMsg(''), 2500);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (!currentPw) return setPwError('Enter your current password.');
    if (newPw.length < 6) return setPwError('New password must be at least 6 characters.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');
    if (newPw === currentPw) return setPwError('New password must differ from current.');
    setPwLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      setPwSuccess('Password updated successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password.');
    } finally { setPwLoading(false); }
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
  const roleConfig  = {
    lawyer: { label: 'Legal Professional', icon: 'gavel',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'   },
    admin:  { label: 'Administrator',      icon: 'shield', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    user:   { label: 'Standard User',      icon: 'person', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20'   },
  };
  const rc = roleConfig[displayRole] || roleConfig.user;

  return (
    <>
      <Header title="Profile & Settings">
        <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
      </Header>

      {showPicker && (
        <AvatarPicker
          current={currentAvatarId}
          onSave={handleSaveAvatar}
          onClose={() => setShowPicker(false)}
          saving={avatarSaving}
        />
      )}

      <div className="p-4 md:p-8 pb-24 space-y-8 max-w-6xl">

        {/* ── Hero Card ─────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
          className="relative rounded-2xl overflow-hidden border border-white/5" style={{ background:'rgba(12,28,73,0.6)', backdropFilter:'blur(20px)' }}>
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-[#0a1628] via-[#0d2040] to-[#003d30] pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,201,167,0.18),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(0,151,167,0.12),transparent_70%)]" />
          </div>

          <div className="relative px-8 pb-7 pt-28">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 mb-5">

              {/* Clickable avatar */}
              <button
                onClick={() => setShowPicker(true)}
                className="relative group flex-shrink-0"
                title="Change avatar"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-surface-container-low shadow-xl">
                  <AvatarSVG id={currentAvatarId} size={96} />
                </div>
                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                {/* Edit badge */}
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-surface-container-low shadow">
                  <span className="material-symbols-outlined text-[13px] text-on-primary">edit</span>
                </div>
              </button>

              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-2xl font-bold font-headline tracking-tight text-on-surface">{user?.name || '—'}</h2>
                <p className="text-sm text-on-surface-variant font-mono mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${rc.color}`}>
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{rc.icon}</span>
                    {rc.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${displayPlan === 'pro' ? 'text-primary bg-primary/10 border-primary/20' : 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
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

            {/* Avatar hint */}
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {currentAvatarId?.startsWith('data:image/') ? 'photo_camera' : 'palette'}
              </span>
              {currentAvatarId?.startsWith('data:image/')
                ? 'Custom photo — click to change'
                : `${AVATAR_META.find(a => a.id === currentAvatarId)?.label || 'Balance'} avatar — click to change or upload photo`}
            </button>
          </div>
        </motion.div>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={{ show:{ transition:{ staggerChildren:0.08 } } }} initial="hidden" animate="show">
          {[
            { icon:'description',  label:'Documents uploaded', value: statsLoading ? '—' : stats?.totalDocuments ?? 0 },
            { icon:'auto_awesome', label:'Analyses completed', value: statsLoading ? '—' : stats?.totalAnalyses  ?? 0 },
            { icon:'warning',      label:'Risks detected',     value: statsLoading ? '—' : stats?.totalRisks     ?? 0 },
            { icon:'schedule',     label:'Last active',        value: statsLoading ? '—' : formatRelative(user?.lastLogin) },
          ].map((s) => (
            <motion.div key={s.label} variants={{ hidden:{ opacity:0, y:20, scale:0.95 }, show:{ opacity:1, y:0, scale:1, transition:{ duration:0.4, ease:[0.22,1,0.36,1] } } }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            <SectionCard icon="manage_accounts" title="Account Information">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Full Name</label>
                  <div className="flex gap-2">
                    <input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
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
                  {nameMsg === 'saved' && <p className="text-xs text-primary mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Name updated</p>}
                  {nameMsg === 'error' && <p className="text-xs text-error  mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>Update failed</p>}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container rounded-xl px-4 py-3 border border-white/5">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Member Since</div>
                    <div className="text-sm text-on-surface font-medium">{formatDate(user?.createdAt)}</div>
                  </div>
                  <div className="bg-surface-container rounded-xl px-4 py-3 border border-white/5">
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Last Login</div>
                    <div className="text-sm text-on-surface font-medium">{formatRelative(user?.lastLogin)}</div>
                  </div>
                </div>
              </div>
            </SectionCard>

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

          {/* Right */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            <SectionCard icon="tune" title="Preferences">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Notifications</div>
                  <div className="space-y-4">
                    {[
                      { label: 'Email Summaries', sub: 'Weekly digest of analysis activity',  val: emailAlerts, set: setEmailAlerts },
                      { label: 'In-app Alerts',   sub: 'Real-time clause detection warnings', val: inAppAlerts, set: setInAppAlerts },
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
                      { key: 'private', icon: 'vpn_lock', label: 'Private Vault', sub: 'Local processing only' },
                      { key: 'cloud',   icon: 'cloud',    label: 'Cloud Sync',    sub: 'Cross-device, full AI' },
                    ].map(({ key, icon, label, sub }) => (
                      <button key={key} onClick={() => setPrivacyMode(key)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2 active:scale-[0.97] ${privacyMode === key ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface-container hover:border-primary/30'}`}>
                        <span className={`material-symbols-outlined text-2xl ${privacyMode === key ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        <span className="text-sm font-semibold text-on-surface">{label}</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon="apps" title="Quick Actions">
              <div className="space-y-2">
                {[
                  { label: 'Upload New Document', icon: 'upload_file',  path: '/upload',    color: 'text-primary'      },
                  { label: 'View My Documents',   icon: 'description',  path: '/documents', color: 'text-blue-400'     },
                  { label: 'Ask AI a Question',   icon: 'psychology',   path: '/ask',       color: 'text-purple-400'   },
                  { label: 'View Alerts',         icon: 'notifications',path: '/alerts',    color: 'text-amber-400'    },
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
                <p className="text-xs text-on-surface-variant leading-relaxed">Signing out ends your session. Deleting your account permanently removes all documents, analyses, and data.</p>
                <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant text-sm font-semibold hover:bg-white/5 hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-base">logout</span>Sign Out
                </button>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-error/30 text-error text-sm font-semibold hover:bg-error/10 transition-all">
                    <span className="material-symbols-outlined text-base">delete_forever</span>Delete My Account
                  </button>
                ) : (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-error font-semibold">Are you absolutely sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-white/5 transition-colors">Cancel</button>
                      <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 py-2 rounded-lg bg-error text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-1">
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
