import React, { useContext, useState, useEffect } from 'react';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { updatePassword, updateProfile, getUserStats, deleteAccount } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';

/* ─── Avatar SVG designs ──────────────────────────────────────────── */
function AvatarSVG({ id, size = 96 }) {
  const s = size;
  const designs = {
    av0: ( // Balance — Scales of Justice (default)
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0d1b35"/>
        <circle cx="50" cy="50" r="50" fill="#00C9A7" fillOpacity="0.06"/>
        <rect x="48.5" y="20" width="3" height="52" rx="1.5" fill="#00C9A7"/>
        <rect x="36" y="68" width="28" height="4" rx="2" fill="#00C9A7"/>
        <rect x="20" y="32" width="60" height="3" rx="1.5" fill="#44e5c2"/>
        <circle cx="50" cy="20" r="3.5" fill="#44e5c2"/>
        <line x1="24" y1="35" x2="24" y2="51" stroke="#44e5c2" strokeWidth="1.5"/>
        <line x1="76" y1="35" x2="76" y2="51" stroke="#44e5c2" strokeWidth="1.5"/>
        <path d="M14 51 Q24 64 34 51" stroke="#44e5c2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M66 51 Q76 64 86 51" stroke="#44e5c2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="51" r="2" fill="#44e5c2"/>
        <circle cx="76" cy="51" r="2" fill="#44e5c2"/>
      </svg>
    ),
    av1: ( // Cosmos — Orbital rings
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#080e24"/>
        <circle cx="50" cy="50" r="38" stroke="#00C9A7" strokeWidth="1.5" fill="none" strokeDasharray="6 4" opacity="0.8"/>
        <circle cx="50" cy="50" r="26" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="3 3"/>
        <circle cx="50" cy="50" r="15" stroke="#00C9A7" strokeWidth="0.75" fill="none" opacity="0.4"/>
        <circle cx="50" cy="50" r="6" fill="#00C9A7"/>
        <circle cx="50" cy="50" r="3" fill="white" opacity="0.95"/>
        <circle cx="88" cy="50" r="5" fill="#00C9A7"/>
        <circle cx="12" cy="50" r="3.5" fill="#44e5c2" opacity="0.8"/>
        <circle cx="50" cy="12" r="4" fill="#44e5c2"/>
        <circle cx="50" cy="88" r="3" fill="#00C9A7" opacity="0.7"/>
        <circle cx="77" cy="23" r="3" fill="#44e5c2"/>
        <circle cx="23" cy="77" r="2.5" fill="#00C9A7" opacity="0.7"/>
        <circle cx="77" cy="77" r="2" fill="#44e5c2" opacity="0.5"/>
        <circle cx="23" cy="23" r="2.5" fill="#00C9A7" opacity="0.6"/>
      </svg>
    ),
    av2: ( // Hex Grid — Geometric honeycomb
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0d1f2a"/>
        <polygon points="50,27 65,36 65,54 50,63 35,54 35,36" stroke="#00C9A7" strokeWidth="2" fill="#00C9A7" fillOpacity="0.15"/>
        <polygon points="50,8 58,13 58,23 50,28 42,23 42,13" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="69,38 77,43 77,53 69,58 61,53 61,43" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="31,38 39,43 39,53 31,58 23,53 23,43" stroke="#44e5c2" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <polygon points="69,62 77,67 77,77 69,82 61,77 61,67" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <polygon points="31,62 39,67 39,77 31,82 23,77 23,67" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <polygon points="50,72 58,77 58,87 50,92 42,87 42,77" stroke="#44e5c2" strokeWidth="1" fill="none" opacity="0.45"/>
        <circle cx="50" cy="45" r="6" fill="#00C9A7"/>
        <circle cx="50" cy="45" r="3" fill="white" opacity="0.9"/>
      </svg>
    ),
    av3: ( // Shield — Legal crest with purple accent
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#12102a"/>
        <path d="M50 17 L78 30 L78 56 Q78 74 50 86 Q22 74 22 56 L22 30 Z" stroke="#8b5cf6" strokeWidth="1.5" fill="#8b5cf6" fillOpacity="0.1"/>
        <path d="M50 24 L70 34 L70 55 Q70 69 50 79 Q30 69 30 55 L30 34 Z" stroke="#00C9A7" strokeWidth="1.5" fill="none"/>
        <path d="M50 31 L62 38 L62 55 Q62 65 50 73 Q38 65 38 55 L38 38 Z" fill="#00C9A7" fillOpacity="0.1"/>
        <rect x="48.5" y="38" width="3" height="22" rx="1.5" fill="#44e5c2"/>
        <rect x="39" y="42" width="22" height="2.5" rx="1.25" fill="#44e5c2"/>
        <path d="M38 47 Q41.5 53 45 47" stroke="#44e5c2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M55 47 Q58.5 53 62 47" stroke="#44e5c2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="50" cy="17" r="3" fill="#8b5cf6"/>
        <circle cx="78" cy="30" r="2.5" fill="#8b5cf6" opacity="0.7"/>
        <circle cx="22" cy="30" r="2.5" fill="#8b5cf6" opacity="0.7"/>
      </svg>
    ),
    av4: ( // Wave — Flowing energy lines
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ clipPath: 'circle(50%)' }}>
        <rect width="100" height="100" fill="#0a1f1a"/>
        <path d="M0 28 Q13 18 25 28 Q37 38 50 28 Q63 18 75 28 Q87 38 100 28" stroke="#00C9A7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9"/>
        <path d="M0 40 Q13 30 25 40 Q37 50 50 40 Q63 30 75 40 Q87 50 100 40" stroke="#44e5c2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75"/>
        <path d="M0 52 Q13 42 25 52 Q37 62 50 52 Q63 42 75 52 Q87 62 100 52" stroke="#00C9A7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
        <path d="M0 64 Q13 54 25 64 Q37 74 50 64 Q63 54 75 64 Q87 74 100 64" stroke="#44e5c2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M0 76 Q13 66 25 76 Q37 86 50 76 Q63 66 75 76 Q87 86 100 76" stroke="#00C9A7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        <circle cx="50" cy="50" r="13" fill="#00C9A7" fillOpacity="0.15"/>
        <circle cx="50" cy="50" r="7" fill="#00C9A7" opacity="0.7"/>
        <circle cx="50" cy="50" r="3.5" fill="white" opacity="0.9"/>
      </svg>
    ),
    av5: ( // Crystal — Diamond facets
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0e1a30"/>
        <polygon points="50,14 82,44 50,86 18,44" stroke="#00C9A7" strokeWidth="1.75" fill="none"/>
        <polygon points="50,26 72,44 50,70 28,44" stroke="#44e5c2" strokeWidth="1.5" fill="#00C9A7" fillOpacity="0.12"/>
        <polygon points="50,37 63,44 50,58 37,44" fill="#00C9A7" opacity="0.55"/>
        <line x1="50" y1="14" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.75" opacity="0.3"/>
        <line x1="18" y1="44" x2="82" y2="44" stroke="#44e5c2" strokeWidth="0.75" opacity="0.3"/>
        <line x1="50" y1="14" x2="82" y2="44" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="50" y1="14" x2="18" y2="44" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="18" y1="44" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <line x1="82" y1="44" x2="50" y2="86" stroke="#44e5c2" strokeWidth="0.6" opacity="0.25"/>
        <circle cx="50" cy="14" r="3.5" fill="#44e5c2"/>
        <circle cx="82" cy="44" r="3" fill="#00C9A7"/>
        <circle cx="50" cy="86" r="3" fill="#44e5c2"/>
        <circle cx="18" cy="44" r="3" fill="#00C9A7" opacity="0.8"/>
        <circle cx="50" cy="44" r="5" fill="white" opacity="0.92"/>
      </svg>
    ),
  };
  return designs[id] || designs['av0'];
}

const AVATAR_META = [
  { id: 'av0', label: 'Balance',  desc: 'Scales of Justice' },
  { id: 'av1', label: 'Cosmos',   desc: 'Orbital Rings'     },
  { id: 'av2', label: 'Hex Grid', desc: 'Tech Honeycomb'    },
  { id: 'av3', label: 'Shield',   desc: 'Legal Crest'       },
  { id: 'av4', label: 'Wave',     desc: 'Energy Flow'       },
  { id: 'av5', label: 'Crystal',  desc: 'Diamond Facets'    },
];

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
    <div className="bg-surface-container-low border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-4 hover:border-primary/20 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold font-headline text-on-surface leading-none">{value}</div>
        <div className="text-[11px] text-on-surface-variant mt-1">{label}</div>
      </div>
    </div>
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
  const [selected, setSelected] = useState(current || 'av0');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0e1a2e] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold font-headline text-on-surface">Choose Avatar</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">6 unique designs crafted for NyayaAI</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {AVATAR_META.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all group ${
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
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
                <AvatarSVG id={id} size={64} />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface">{label}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">{desc}</div>
              </div>
              {id === 'av0' && (
                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider">Default</span>
              )}
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
            <div className="text-sm font-bold text-on-surface mt-0.5">{AVATAR_META.find(a => a.id === selected)?.label}</div>
            <div className="text-[11px] text-on-surface-variant">{AVATAR_META.find(a => a.id === selected)?.desc}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,201,167,0.2)]"
          >
            {saving ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-base">check_circle</span>}
            {saving ? 'Saving…' : 'Apply Avatar'}
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
    setAvatarSaving(true);
    try {
      const res = await updateProfile({ avatarUrl: id });
      updateUser({ avatarUrl: res.data.data.user.avatarUrl });
      setShowPicker(false);
    } catch {
      // silently fail — picker stays open
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

      <div className="p-8 pb-24 space-y-8 max-w-6xl">

        {/* ── Hero Card ─────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-surface-container-low">
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
              <span className="material-symbols-outlined text-sm">palette</span>
              Change avatar — {AVATAR_META.find(a => a.id === currentAvatarId)?.label} selected
            </button>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="description"  label="Documents uploaded" value={statsLoading ? '—' : stats?.totalDocuments ?? 0} />
          <StatCard icon="auto_awesome" label="Analyses completed" value={statsLoading ? '—' : stats?.totalAnalyses  ?? 0} />
          <StatCard icon="warning"      label="Risks detected"     value={statsLoading ? '—' : stats?.totalRisks     ?? 0} />
          <StatCard icon="schedule"     label="Last active"        value={statsLoading ? '—' : formatRelative(user?.lastLogin)} />
        </div>

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
