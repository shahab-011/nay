import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const si = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const sc = { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
  </svg>
);

/* ── Segmented Switcher for Login / Register ── */
function AuthSegmentedNav({ activeTab = 'login' }) {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '4px',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      width: '100%',
      maxWidth: '320px',
      margin: '0 auto 24px auto',
    }}>
      <button
        type="button"
        onClick={() => navigate('/login')}
        style={{
          flex: 1,
          position: 'relative',
          padding: '8px 16px',
          borderRadius: '10px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'login' ? '#ffffff' : 'rgba(240, 238, 255, 0.5)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {activeTab === 'login' && (
          <motion.div
            layoutId="authTabPill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(139, 92, 246, 0.85) 100%)',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              zIndex: -1,
            }}
          />
        )}
        <I.Lock size={13} /> Sign In
      </button>

      <button
        type="button"
        onClick={() => navigate('/register')}
        style={{
          flex: 1,
          position: 'relative',
          padding: '8px 16px',
          borderRadius: '10px',
          border: 'none',
          background: 'transparent',
          color: activeTab === 'register' ? '#ffffff' : 'rgba(240, 238, 255, 0.5)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {activeTab === 'register' && (
          <motion.div
            layoutId="authTabPill"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(139, 92, 246, 0.85) 100%)',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              zIndex: -1,
            }}
          />
        )}
        <I.Zap size={13} /> Create Account
      </button>
    </div>
  );
}

function GlassInput({ icon, rightAction, style: exStyle, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        color: focused ? '#c084fc' : 'rgba(240, 238, 255, 0.35)', transition: 'color 0.25s ease',
        zIndex: 2, display: 'flex', alignItems: 'center', pointerEvents: 'none',
      }}>{icon}</div>
      <input
        {...props}
        className="auth-input-field"
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e  => { setFocused(false); onBlur?.(e); }}
        style={{
          width: '100%',
          height: 50,
          paddingLeft: 46,
          paddingRight: rightAction ? 48 : 16,
          borderRadius: 14,
          outline: 'none',
          boxSizing: 'border-box',
          background: focused ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.04)',
          border: `1.5px solid ${focused ? 'rgba(167, 139, 250, 0.7)' : 'rgba(255, 255, 255, 0.09)'}`,
          color: '#f0eeff',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: focused
            ? '0 0 0 4px rgba(124, 58, 237, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          ...exStyle,
        }}
      />
      {rightAction && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', zIndex: 2 }}>
          {rightAction}
        </div>
      )}
    </div>
  );
}

/* ── Mock dashboard preview for desktop panel ── */
const MOCK_MATTERS = [
  { title: 'Smith Corp — Contract',   type: 'Litigation',  badge: 'URGENT', badgeColor: '#ef4444' },
  { title: 'Gupta IP Filing 2025',    type: 'Trademark',   badge: 'REVIEW', badgeColor: '#f59e0b' },
  { title: 'Davis Estate Planning',   type: 'Advisory',    badge: 'OPEN',   badgeColor: '#22c55e' },
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167, 139, 250, 0.18)',
        borderRadius: 22, padding: '22px 24px', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', marginTop: 36,
        boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(240,238,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Today's Workspace
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34, 197, 94, 0.12)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(34, 197, 94, 0.25)' }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
          />
          <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>Live AI Sync</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: <I.Briefcase size={14} />, value: '12', label: 'Matters' },
          { icon: <I.CheckSquare size={14} />, value: '4', label: 'Due Today' },
          { icon: <I.Timer size={14} />, value: '3.5h', label: 'Logged' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#c084fc', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f0eeff', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(240,238,255,0.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Matter items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {MOCK_MATTERS.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,238,255,0.9)', lineHeight: 1.2 }}>{m.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>{m.type}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: m.badgeColor, background: `${m.badgeColor}1c`, padding: '3px 9px', borderRadius: 8, border: `1px solid ${m.badgeColor}35`, letterSpacing: '0.05em' }}>
              {m.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(240,238,255,0.5)', marginBottom: 6 }}>
          <span>Retainer utilization</span><span style={{ color: '#c084fc', fontWeight: 800 }}>73%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '73%' }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #c084fc)', borderRadius: 5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    const api = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    window.location.href = `${api}/api/auth/google`;
  };

  return (
    <div className="auth-container">
      {/* ══ Ambient Animated Orbs ══ */}
      <motion.div animate={{ y: [0, -35, 0], scale: [1, 1.1, 1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-10%', right: '25%', width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <motion.div animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', bottom: '-15%', left: '10%', width: 450, height: 450, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* ══ LEFT PANEL (Desktop Showcase) ══ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="auth-left-panel"
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(139,92,246,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(14px)', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}>
              <I.Logo size={22} />
            </div>
            <span style={{ fontSize: 21, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={sc} initial="initial" animate="animate">
            <motion.div variants={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 100, padding: '6px 14px', marginBottom: 20 }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              </motion.div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,238,255,0.8)', letterSpacing: '0.04em' }}>Legal Intelligence Platform</span>
            </motion.div>

            <motion.h1 variants={si} style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.12, marginBottom: 14, fontFamily: 'var(--font-headline)', letterSpacing: '-0.035em', color: '#f0eeff' }}>
              Your legal workspace{' '}
              <span style={{ background: 'linear-gradient(135deg, #c084fc 0%, #7c3aed 60%, #e879f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                awaits.
              </span>
            </motion.h1>

            <motion.p variants={si} style={{ fontSize: 15, color: 'rgba(240,238,255,0.55)', lineHeight: 1.7, maxWidth: 400 }}>
              Matters, clients, documents, billing — everything you need to run a modern legal practice, powered by AI.
            </motion.p>
          </motion.div>

          <DashboardPreview />
        </div>
      </motion.div>

      {/* ══ RIGHT PANEL (Glass Form Container) ══ */}
      <div className="auth-right-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.5) 50%, transparent 100%)' }} />

        <div className="auth-mobile-card">
          {/* Mobile Header with Logo & Segmented Switcher */}
          <div className="mobile-logo-show">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                <I.Logo size={19} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(167,139,250,0.25)' }}>
              <I.Shield size={12} style={{ color: '#c084fc' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(240,238,255,0.8)', letterSpacing: '0.04em' }}>SECURE</span>
            </div>
          </div>

          {/* Segmented Tab Bar (Sign In / Register) */}
          <AuthSegmentedNav activeTab="login" />

          {/* Main Heading */}
          <motion.div variants={sc} initial="initial" animate="animate" style={{ textAlign: 'center', marginBottom: 26 }}>
            <motion.h2 variants={si} style={{ fontSize: 26, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.025em', marginBottom: 6 }}>
              Welcome back
            </motion.h2>
            <motion.p variants={si} style={{ fontSize: 13.5, color: 'rgba(240,238,255,0.5)', lineHeight: 1.5 }}>
              Sign in to access your legal intelligence workspace
            </motion.p>
          </motion.div>

          {/* Google Button */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} style={{ marginBottom: 18 }}>
            <motion.button
              type="button"
              onClick={handleGoogle}
              whileHover={{ scale: 1.015, boxShadow: '0 8px 25px rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.985 }}
              style={{
                width: '100%', height: 50, borderRadius: 14, background: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14, fontWeight: 700, color: '#120f26',
                boxShadow: '0 4px 18px rgba(0,0,0,0.35)', transition: 'all 0.2s ease',
              }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(240,238,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </motion.div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 14px', borderRadius: 12, marginBottom: 18, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <I.Alert size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form onSubmit={handleSubmit} variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email Field */}
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Email Address</label>
              <GlassInput type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@firm.com" icon={<I.Mail size={17} />} />
            </motion.div>

            {/* Password Field */}
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#c084fc', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }}>Forgot password?</Link>
              </div>
              <GlassInput
                type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                icon={<I.Lock size={17} />}
                rightAction={
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,238,255,0.4)', display: 'flex', alignItems: 'center', padding: 4 }}>
                    {showPass ? <I.EyeOff size={17} /> : <I.Eye size={17} />}
                  </button>
                }
              />
            </motion.div>

            {/* Remember Me Checkbox */}
            <motion.div variants={si} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingLeft: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: rememberMe ? 'rgba(124, 58, 237, 0.8)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1.5px solid ${rememberMe ? '#a78bfa' : 'rgba(255, 255, 255, 0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: rememberMe ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none',
                }}>
                  {rememberMe && <I.Check size={12} style={{ color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(240, 238, 255, 0.65)', fontWeight: 500 }}>Remember me on this device</span>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.button variants={si} type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.015, boxShadow: '0 8px 30px rgba(124,58,237,0.55)' }}
              whileTap={{ scale: isLoading ? 1 : 0.985 }}
              style={{
                width: '100%', height: 52, marginTop: 8, borderRadius: 14,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
                color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-headline)',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 24px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                letterSpacing: '-0.01em', position: 'relative', overflow: 'hidden',
              }}>
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : <I.Lock size={16} />}
              {isLoading ? 'Signing in…' : 'Sign In Securely'}
            </motion.button>
          </motion.form>

          {/* Footer Features & Link */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
              {['AI Analysis', 'End-to-End Encrypted', 'Indian Law'].map(f => (
                <span key={f} style={{ fontSize: 10.5, color: 'rgba(240,238,255,0.4)', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  <I.Check size={10} style={{ color: '#a78bfa' }} />{f}
                </span>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(240,238,255,0.5)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#c084fc', fontWeight: 800, textDecoration: 'none' }}>Create workspace →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
