import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const MIN_PASSWORD_LENGTH = 6;

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
function AuthSegmentedNav({ activeTab = 'register' }) {
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

function PasswordStrength({ password }) {
  if (!password) return null;
  const len    = password.length;
  const hasNum = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  
  const score  = (len >= 6 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
  const levels = [
    { label: 'Weak',      color: '#ef4444' },
    { label: 'Fair',      color: '#f59e0b' },
    { label: 'Good',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
  ];
  const level = levels[Math.max(0, Math.min(score - 1, 3))];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(240,238,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password Strength</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: level.color }}>{level.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: i < score ? level.color : 'transparent', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }} />
          </div>
        ))}
      </div>

      {/* Requirement Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          { req: len >= 6, text: '6+ chars' },
          { req: hasUpper, text: 'Uppercase' },
          { req: hasNum, text: 'Number' },
          { req: hasSym, text: 'Symbol' },
        ].map(r => (
          <span key={r.text} style={{
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 6,
            background: r.req ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${r.req ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            color: r.req ? '#4ade80' : 'rgba(240, 238, 255, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}>
            <I.Check size={9} style={{ opacity: r.req ? 1 : 0.3 }} />
            {r.text}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: <I.Sparkle size={20} />,  title: 'AI Contract Analysis', desc: 'Gemini-powered document review in seconds' },
  { icon: <I.Scale size={20} />,    title: 'Matter Management',    desc: 'Full case lifecycle from intake to close' },
  { icon: <I.Users size={20} />,    title: 'Client Portal',        desc: 'Secure collaboration & document sharing' },
  { icon: <I.Shield size={20} />,   title: 'Bank-Grade Security',  desc: 'End-to-end encrypted, SOC 2 compliant' },
];

const TRUST = [
  { value: '850+', label: 'Law Firms' },
  { value: '12k+', label: 'Documents' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [firmName,    setFirmName]    = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
      return setError('Password needs an uppercase letter, a number, and a special character');
    if (password !== confirm)
      return setError('Passwords do not match');

    setIsLoading(true);
    try {
      await register({ name, email, password, firmName });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account. Please try again.');
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
      <motion.div animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-8%', right: '20%', width: 480, height: 480, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <motion.div animate={{ y: [0, 25, 0], scale: [1, 1.06, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        style={{ position: 'absolute', bottom: '-12%', left: '8%', width: 440, height: 440, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />

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
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(14px)', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}>
              <I.Logo size={22} />
            </div>
            <span style={{ fontSize: 21, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={sc} initial="initial" animate="animate">
            <motion.h1 variants={si} style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.12, marginBottom: 14, fontFamily: 'var(--font-headline)', letterSpacing: '-0.035em', color: '#f0eeff' }}>
              The future of{' '}
              <span style={{ background: 'linear-gradient(135deg, #c084fc 0%, #7c3aed 60%, #e879f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                legal practice
              </span>
              {' '}starts here.
            </motion.h1>
            <motion.p variants={si} style={{ fontSize: 14.5, color: 'rgba(240,238,255,0.55)', lineHeight: 1.7, marginBottom: 32, maxWidth: 390 }}>
              AI-powered tools for modern lawyers — from contract analysis to client management, all in one secure workspace.
            </motion.p>

            {/* Feature cards 2×2 */}
            <motion.div variants={{ animate: { transition: { staggerChildren: 0.09 } } }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              {FEATURES.map(feat => (
                <motion.div key={feat.title} variants={si}
                  whileHover={{ scale: 1.03, y: -3, borderColor: 'rgba(167,139,250,0.35)' }} transition={{ duration: 0.2 }}
                  style={{ padding: '18px 18px', borderRadius: 18, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(167,139,250,0.16)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'default' }}>
                  <div style={{ color: '#c084fc', marginBottom: 10, display: 'flex' }}>{feat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f0eeff', marginBottom: 4, lineHeight: 1.25 }}>{feat.title}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(240,238,255,0.45)', lineHeight: 1.5 }}>{feat.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust strip */}
            <motion.div variants={si} style={{ display: 'flex', alignItems: 'center', gap: 24, background: 'rgba(255,255,255,0.03)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              {TRUST.map((t, i) => (
                <React.Fragment key={t.label}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-headline)', lineHeight: 1 }}>{t.value}</div>
                    <div style={{ fontSize: 9.5, color: 'rgba(240,238,255,0.4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{t.label}</div>
                  </div>
                  {i < TRUST.length - 1 && <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />}
                </React.Fragment>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ══ RIGHT PANEL (Glass Form Container) ══ */}
      <div className="auth-right-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.5) 50%, transparent 100%)' }} />

        <div className="auth-mobile-card">
          {/* Mobile Header with Logo */}
          <div className="mobile-logo-show">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                <I.Logo size={19} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(167,139,250,0.25)' }}>
              <I.Zap size={12} style={{ color: '#c084fc' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(240,238,255,0.8)', letterSpacing: '0.04em' }}>FREE TRIAL</span>
            </div>
          </div>

          {/* Segmented Tab Bar (Sign In / Register) */}
          <AuthSegmentedNav activeTab="register" />

          {/* Main Heading */}
          <motion.div variants={sc} initial="initial" animate="animate" style={{ textAlign: 'center', marginBottom: 24 }}>
            <motion.h2 variants={si} style={{ fontSize: 26, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.025em', marginBottom: 6 }}>
              Create your account
            </motion.h2>
            <motion.p variants={si} style={{ fontSize: 13.5, color: 'rgba(240,238,255,0.5)', lineHeight: 1.5 }}>
              Set up your legal workspace in under a minute
            </motion.p>
          </motion.div>

          {/* Google Button */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} style={{ marginBottom: 16 }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(240,238,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </motion.div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 14px', borderRadius: 12, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <I.Alert size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form onSubmit={handleSubmit}
            variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
            initial="initial" animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name + Firm Name responsive grid */}
            <div className="auth-grid-2">
              <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Full Name</label>
                <GlassInput type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Advocate Jane Doe" icon={<I.User size={16} />} />
              </motion.div>

              <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Firm Name</label>
                <GlassInput type="text" autoComplete="organization" value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="Apex Legal Associates" icon={<I.Briefcase size={16} />} />
              </motion.div>
            </div>

            {/* Email Field */}
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Email Address</label>
              <GlassInput type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@firm.com" icon={<I.Mail size={16} />} />
            </motion.div>

            {/* Password Field */}
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Password</label>
              <GlassInput
                type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                icon={<I.Lock size={16} />}
                rightAction={
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,238,255,0.4)', display: 'flex', alignItems: 'center', padding: 4 }}>
                    {showPass ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.5)', marginLeft: 2 }}>Confirm Password</label>
              <GlassInput
                type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                style={confirm && confirm !== password ? { borderColor: 'rgba(239,68,68,0.65)' } : {}}
                icon={<I.Lock size={16} />}
                rightAction={
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,238,255,0.4)', display: 'flex', alignItems: 'center', padding: 4 }}>
                    {showConfirm ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                  </button>
                }
              />
              <AnimatePresence>
                {confirm && confirm !== password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, color: '#f87171', marginLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Alert size={12} /> Passwords do not match
                  </motion.p>
                )}
                {confirm && confirm === password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, color: '#4ade80', marginLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Check size={12} /> Passwords match
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit Button */}
            <motion.button variants={si} type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.015, boxShadow: '0 8px 30px rgba(124,58,237,0.55)' }}
              whileTap={{ scale: isLoading ? 1 : 0.985 }}
              style={{
                width: '100%', height: 52, marginTop: 6, borderRadius: 14,
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
              ) : <I.Zap size={16} />}
              {isLoading ? 'Creating workspace…' : 'Create Account & Get Started'}
            </motion.button>
          </motion.form>

          {/* Footer Features & Link */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              {['AI Analysis', 'End-to-End Encrypted', 'Indian Law'].map(f => (
                <span key={f} style={{ fontSize: 10.5, color: 'rgba(240,238,255,0.4)', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  <I.Check size={10} style={{ color: '#a78bfa' }} />{f}
                </span>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(240,238,255,0.5)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#c084fc', fontWeight: 800, textDecoration: 'none' }}>Sign in →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
