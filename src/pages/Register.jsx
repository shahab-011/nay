import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const MIN_PASSWORD_LENGTH = 6;

const si = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const sc = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
  </svg>
);

function GlassInput({ icon, rightAction, style: exStyle, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: focused ? '#a78bfa' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s',
        zIndex: 1, display: 'flex', alignItems: 'center', pointerEvents: 'none',
      }}>{icon}</div>
      <input
        {...props}
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e  => { setFocused(false); onBlur?.(e); }}
        style={{
          width: '100%', height: 48, paddingLeft: 44, paddingRight: rightAction ? 46 : 16,
          borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
          background:   focused ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
          border:       `1.5px solid ${focused ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.09)'}`,
          color: '#f0eeff', backdropFilter: 'blur(8px)',
          boxShadow: focused ? '0 0 0 4px rgba(124,58,237,0.1)' : 'none',
          transition: 'all 0.2s ease',
          ...exStyle,
        }}
      />
      {rightAction && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
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
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  const score  = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
  const levels = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak',      color: '#f87171' },
    { label: 'Fair',      color: '#f59e0b' },
    { label: 'Good',      color: '#facc15' },
    { label: 'Strong',    color: '#22c55e' },
  ];
  const level = len < MIN_PASSWORD_LENGTH ? levels[0] : levels[Math.min(score + 1, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: 3, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: i < score ? level.color : 'transparent', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: level.color }}>{level.label}</p>
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
    if (password !== confirm) return setError('Passwords do not match');
    setIsLoading(true);
    try {
      await register({ name, email, password, firmName });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    const api = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    window.location.href = `${api}/api/auth/google`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#09071a' }}>

      {/* ══ LEFT PANEL ══ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: '0 0 52%', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '56px 56px',
          background: 'linear-gradient(150deg, #0d0a22 0%, #1a0f40 55%, #0d0a22 100%)',
        }}
      >
        {/* Orbs */}
        <motion.div animate={{ y: [0, -28, 0], scale: [1, 1.07, 1] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-4%', right: '-7%', width: 440, height: 440, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 68%)' }} />
        <motion.div animate={{ y: [0, 22, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
          style={{ position: 'absolute', bottom: '0%', left: '-12%', width: 360, height: 360, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 68%)' }} />
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ position: 'absolute', top: '60%', right: '15%', width: 180, height: 180, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(124,58,237,0.07) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 44 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
              <I.Logo size={21} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={sc} initial="initial" animate="animate">
            <motion.h1 variants={si} style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, marginBottom: 14, fontFamily: 'var(--font-headline)', letterSpacing: '-0.03em', color: '#f0eeff' }}>
              The future of{' '}
              <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                legal practice
              </span>
              {' '}starts here.
            </motion.h1>
            <motion.p variants={si} style={{ fontSize: 14, color: 'rgba(240,238,255,0.48)', lineHeight: 1.75, marginBottom: 36, maxWidth: 370 }}>
              AI-powered tools for modern lawyers — from contract analysis to client management, all in one secure workspace.
            </motion.p>

            {/* Feature cards 2×2 */}
            <motion.div variants={{ animate: { transition: { staggerChildren: 0.09 } } }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
              {FEATURES.map(feat => (
                <motion.div key={feat.title} variants={si}
                  whileHover={{ scale: 1.03, y: -3 }} transition={{ duration: 0.2 }}
                  style={{ padding: '18px 18px', borderRadius: 16, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.14)', backdropFilter: 'blur(12px)', cursor: 'default' }}>
                  <div style={{ color: '#a78bfa', marginBottom: 10, display: 'flex' }}>{feat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eeff', marginBottom: 4, lineHeight: 1.25 }}>{feat.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(240,238,255,0.38)', lineHeight: 1.5 }}>{feat.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust strip */}
            <motion.div variants={si} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {TRUST.map((t, i) => (
                <React.Fragment key={t.label}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa', fontFamily: 'var(--font-headline)', lineHeight: 1 }}>{t.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,238,255,0.35)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.label}</div>
                  </div>
                  {i < TRUST.length - 1 && <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />}
                </React.Fragment>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ══ RIGHT PANEL (full height, no card) ══ */}
      <div style={{
        flex: '0 0 48%', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 64px',
        background: '#0d0b1e',
        borderLeft: '1px solid rgba(124,58,237,0.12)',
        position: 'relative', overflowY: 'auto',
      }}>
        {/* Accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.5) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 360, height: 360, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, paddingTop: 12, paddingBottom: 12 }}
        >
          {/* Heading */}
          <motion.div variants={sc} initial="initial" animate="animate" style={{ marginBottom: 28 }}>
            <motion.h2 variants={si} style={{ fontSize: 27, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Create your account
            </motion.h2>
            <motion.p variants={si} style={{ fontSize: 14, color: 'rgba(240,238,255,0.42)', lineHeight: 1.6 }}>
              Set up your Nyaya workspace in under a minute
            </motion.p>
          </motion.div>

          {/* Google button */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} style={{ marginBottom: 4 }}>
            <motion.button onClick={handleGoogle}
              whileHover={{ scale: 1.015, background: '#f8f8f8' }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', height: 48, borderRadius: 12, background: '#fff', border: '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', transition: 'background 0.2s' }}>
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(240,238,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(220,38,96,0.1)', border: '1px solid rgba(220,38,96,0.25)', color: '#f87171', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <I.Alert size={14} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form onSubmit={handleSubmit}
            variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
            initial="initial" animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

            {/* Name + Firm in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Full Name</label>
                <GlassInput type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" icon={<I.User size={15} />} />
              </motion.div>
              <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Firm Name</label>
                <GlassInput type="text" autoComplete="organization" value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="Acme Law" icon={<I.Briefcase size={15} />} />
              </motion.div>
            </div>

            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Email Address</label>
              <GlassInput type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<I.Mail size={15} />} />
            </motion.div>

            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Password</label>
              <GlassInput
                type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                icon={<I.Lock size={15} />}
                rightAction={
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPass ? <I.EyeOff size={15} /> : <I.Eye size={15} />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </motion.div>

            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Confirm Password</label>
              <GlassInput
                type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                style={confirm && confirm !== password ? { borderColor: 'rgba(239,68,68,0.55)' } : {}}
                icon={<I.Lock size={15} />}
                rightAction={
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showConfirm ? <I.EyeOff size={15} /> : <I.Eye size={15} />}
                  </button>
                }
              />
              <AnimatePresence>
                {confirm && confirm !== password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 10, color: '#f87171', marginLeft: 2 }}>
                    Passwords do not match
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button variants={si} type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{ width: '100%', height: 50, marginTop: 4, borderRadius: 13, background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-headline)', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 22px rgba(124,58,237,0.4)', letterSpacing: '-0.01em' }}>
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : <I.Zap size={15} />}
              {isLoading ? 'Creating workspace…' : 'Create Account'}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 14 }}>
              {['AI-Powered', 'Encrypted', 'Indian Law'].map(f => (
                <span key={f} style={{ fontSize: 10, color: 'rgba(240,238,255,0.3)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <I.Check size={9} style={{ color: '#7c3aed' }} />{f}
                </span>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,238,255,0.38)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
