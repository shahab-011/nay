import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const MIN_PASSWORD_LENGTH = 6;

function PasswordStrength({ password }) {
  if (!password) return null;
  const len    = password.length;
  const hasNum = /\d/.test(password);
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  const score  = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);

  const levels = [
    { label: 'Too short', color: 'bg-error',      text: 'text-error'      },
    { label: 'Weak',      color: 'bg-red-400',    text: 'text-red-400'    },
    { label: 'Fair',      color: 'bg-amber-400',  text: 'text-amber-400'  },
    { label: 'Good',      color: 'bg-yellow-400', text: 'text-yellow-400' },
    { label: 'Strong',    color: 'bg-primary',    text: 'text-primary'    },
  ];

  const level = len < MIN_PASSWORD_LENGTH ? levels[0] : levels[Math.min(score + 1, 4)];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < score ? level.color : 'bg-surface-container-high'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-label ${level.text}`}>{level.label}</p>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [role,        setRole]        = useState('user');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (password !== confirm) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-surface to-surface pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-surface-container-low p-10 rounded-3xl border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 mb-6 hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              app_registration
            </span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-on-surface-variant font-body">Set up your NyayaAI workspace.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-label text-on-surface-variant ml-1 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                person
              </span>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary text-white py-3 pl-12 pr-4 rounded-t-xl outline-none transition-colors"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-label text-on-surface-variant ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                mail
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary text-white py-3 pl-12 pr-4 rounded-t-xl outline-none transition-colors"
                placeholder="counsel@firm.com"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-sm font-label text-on-surface-variant ml-1 uppercase tracking-wider">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'user',   icon: 'person',    label: 'Individual',  sub: 'Manage your own documents' },
                { value: 'lawyer', icon: 'gavel',     label: 'Legal Pro',   sub: 'Manage clients & cases'    },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                    role === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: role === opt.value ? "'FILL' 1" : "'FILL' 0" }}>
                    {opt.icon}
                  </span>
                  <span className="text-sm font-bold font-headline">{opt.label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-label text-on-surface-variant ml-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                lock
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary text-white py-3 pl-12 pr-12 rounded-t-xl outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label className="text-sm font-label text-on-surface-variant ml-1 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                lock_reset
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full bg-surface-container border-b text-white py-3 pl-12 pr-12 rounded-t-xl outline-none transition-colors ${
                  confirm && confirm !== password
                    ? 'border-error focus:border-error'
                    : 'border-outline-variant/30 focus:border-primary'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs text-error font-label ml-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-surface-container-highest text-white border border-outline-variant font-headline font-bold text-lg rounded-xl shadow-lg hover:border-primary/50 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                Creating account…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-8 text-center text-sm font-body text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
