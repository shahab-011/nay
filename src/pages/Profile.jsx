import React, { useContext, useState } from 'react';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { updatePassword } from '../api/auth.api';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [privacyMode, setPrivacyMode] = useState('private');
  const [emailSummaries, setEmailSummaries] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const displayName  = user?.name  || '—';
  const displayEmail = user?.email || '—';
  const displayRole  = user?.role  || 'user';
  const displayPlan  = user?.plan  || 'free';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPw) return setPwError('Please enter your current password.');
    if (newPw.length < 6) return setPwError('New password must be at least 6 characters.');
    if (newPw !== confirmPw) return setPwError('New passwords do not match.');
    if (newPw === currentPw) return setPwError('New password must differ from current password.');

    setPwLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      setPwSuccess('Password updated successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <Header title="Profile & Settings">
        <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">account_circle</span>
      </Header>

      <div className="p-8 pb-24 space-y-8">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold font-[Epilogue] tracking-tight text-on-surface mb-1">
            Profile &amp; Settings
          </h1>
          <p className="text-sm text-on-surface-variant">
            Manage your account credentials, preferences, and privacy controls.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left Column ─────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Profile Card */}
            <section className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden group border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-outline-variant flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-[56px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      account_circle
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold font-[Epilogue] tracking-tight text-on-surface truncate">
                    {displayName}
                  </h2>
                  <p className="text-sm font-[DM_Mono] text-on-surface-variant mb-3 truncate">
                    {displayEmail}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-outline-variant bg-surface-container text-xs text-on-surface-variant capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1.5" />
                      {displayRole}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs capitalize ${
                      displayPlan === 'pro'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-outline-variant bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[12px] mr-1">
                        {displayPlan === 'pro' ? 'verified' : 'person'}
                      </span>
                      {displayPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Card */}
            <section className="bg-surface-container-low rounded-xl p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <span className="material-symbols-outlined text-primary">lock</span>
                <h3 className="text-lg font-bold font-[Epilogue] tracking-tight text-on-surface">Security</h3>
              </div>

              <form className="space-y-5" onSubmit={handlePasswordChange}>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-slate-600"
                    />
                  </div>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm">
                    <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl text-sm">
                    <span className="material-symbols-outlined text-base flex-shrink-0">check_circle</span>
                    {pwSuccess}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="bg-primary-container text-on-primary-container font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(0,201,167,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pwLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        Saving…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* ── Right Column ────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Preferences Card */}
            <section className="bg-surface-container-low rounded-xl p-8 flex-1 border border-white/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="text-lg font-bold font-[Epilogue] tracking-tight text-on-surface">Preferences</h3>
              </div>

              <div className="space-y-6">
                {/* Notification toggles */}
                <div>
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                    Notifications
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-on-surface">Email Summaries</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Weekly digest of analysis activity</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={emailSummaries}
                          onChange={(e) => setEmailSummaries(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-container-high border border-outline-variant rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-on-surface">In-app Alerts</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Real-time clause detection warnings</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={inAppAlerts}
                          onChange={(e) => setInAppAlerts(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-container-high border border-outline-variant rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Privacy Mode selector */}
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                    Default Privacy Mode
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPrivacyMode('private')}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2 active:scale-[0.98] ${
                        privacyMode === 'private'
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant bg-surface-container hover:border-primary/40'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-primary text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        vpn_lock
                      </span>
                      <span className="text-sm font-semibold text-on-surface">Private Vault</span>
                      <span className="text-[11px] text-on-surface-variant leading-tight">
                        Local processing, max security
                      </span>
                    </button>

                    <button
                      onClick={() => setPrivacyMode('cloud')}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2 active:scale-[0.98] ${
                        privacyMode === 'cloud'
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant bg-surface-container hover:border-primary/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[24px] ${privacyMode === 'cloud' ? 'text-primary' : 'text-on-surface-variant'}`}>
                        cloud
                      </span>
                      <span className="text-sm font-semibold text-on-surface">Cloud Sync</span>
                      <span className="text-[11px] text-on-surface-variant leading-tight">
                        Cross-device, standard AI
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-surface-container/20 border border-error/30 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2/3 h-0.5 bg-gradient-to-r from-error to-transparent opacity-50 pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center border border-error/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-[Epilogue] text-error mb-2">Danger Zone</h3>
                  <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
                    Permanently delete your account and all associated legal analysis data.
                    This action cannot be reversed.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Sign Out
                    </button>
                    <button className="w-full px-4 py-2.5 rounded-lg border border-error text-error font-bold text-sm hover:bg-error/10 transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
