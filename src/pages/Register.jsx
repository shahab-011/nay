import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const MIN_PASSWORD_LENGTH = 6;

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'rgba(240,238,255,0.4)', marginLeft: 2,
};

const FEATURES = [
  { icon: <I.Sparkle size={20} />, title: 'AI Contract Analysis', desc: 'Gemini-powered document review' },
  { icon: <I.Briefcase size={20} />, title: 'Matter Management',    desc: 'Full case lifecycle in one place' },
  { icon: <I.Users size={20} />,    title: 'Client Portal',         desc: 'Secure collaboration hub' },
  { icon: <I.Shield size={20} />,   title: 'Bank-Grade Security',   desc: 'End-to-end encrypted storage' },
];

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
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 3, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: i < score ? level.color : 'transparent', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: level.color }}>{level.label}</p>
    </div>
  );
}

function GlassInput({ icon, rightAction, style: exStyle, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: focused ? '#a78bfa' : 'rgba(255,255,255,0.28)', transition: 'color 0.2s', zIndex: 1,
        display: 'flex', alignItems: 'center',
      }}>
        {icon}
      </div>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
        style={{
          width: '100%', height: 46, paddingLeft: 42, paddingRight: rightAction ? 44 : 14,
          borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
          background:   focused ? 'rgba(124,58,237,0.09)' : 'rgba(255,255,255,0.04)',
          border:       `1px solid ${focused ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.08)'}`,
          color:        '#f0eeff',
          backdropFilter: 'blur(12px)',
          boxShadow:    focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
          transition:   'all 0.2s ease',
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

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [firmName,    setFirmName]    = useState('');
  const [phone,       setPhone]       = useState('');
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
      await register({ name, email, password, firmName, phone });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0c0a18', overflow: 'hidden' }}>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: '0 0 52%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '56px 56px',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #0e0b22 0%, #180f38 55%, #0e0b22 100%)',
        }}
      >
        {/* Animated orbs */}
        <motion.div
          animate={{ y: [0, -28, 0], scale: [1, 1.07, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '2%', right: '-6%',
            width: 420, height: 420, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 68%)',
          }}
        />
        <motion.div
          animate={{ y: [0, 22, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
          style={{
            position: 'absolute', bottom: '5%', left: '-10%',
            width: 340, height: 340, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 68%)',
          }}
        />

        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(124,58,237,0.07) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 52 }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(124,58,237,0.18)',
              border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(12px)',
            }}>
              <I.Logo size={21} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>
              NyayaAI
            </span>
          </motion.div>

          {/* Headline + features */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.h1
              variants={staggerItem}
              style={{
                fontSize: 40, fontWeight: 900, lineHeight: 1.1, marginBottom: 16,
                fontFamily: 'var(--font-headline)', letterSpacing: '-0.03em', color: '#f0eeff',
              }}
            >
              Your Legal{' '}
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #c084fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Intelligence
              </span>
              <br />Platform
            </motion.h1>

            <motion.p
              variants={staggerItem}
              style={{ fontSize: 14, color: 'rgba(240,238,255,0.5)', lineHeight: 1.75, marginBottom: 44, maxWidth: 370 }}
            >
              AI-powered contract analysis, full matter lifecycle management, and a secure client portal — built for modern legal practices.
            </motion.p>

            {/* 2×2 feature grid */}
            <motion.div variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              {FEATURES.map((feat) => (
                <motion.div
                  key={feat.title}
                  variants={staggerItem}
                  whileHover={{ scale: 1.035, y: -3 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 16,
                    background: 'rgba(124,58,237,0.07)',
                    border: '1px solid rgba(124,58,237,0.14)',
                    backdropFilter: 'blur(12px)',
                    cursor: 'default',
                  }}
                >
                  <div style={{ color: '#a78bfa', marginBottom: 10, display: 'flex' }}>{feat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eeff', marginBottom: 4, lineHeight: 1.25 }}>{feat.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', lineHeight: 1.45 }}>{feat.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: '0 0 48%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 48px',
        position: 'relative',
        background: 'rgba(10,8,22,0.7)',
        borderLeft: '1px solid rgba(124,58,237,0.1)',
        overflowY: 'auto',
      }}>
        {/* Subtle corner orb */}
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, paddingTop: 12, paddingBottom: 12 }}
        >
          {/* Glass card */}
          <div style={{
            padding: '36px 32px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(28px)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.07)',
          }}>

            {/* Header */}
            <motion.div
              variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
              initial="initial" animate="animate"
              style={{ marginBottom: 26 }}
            >
              <motion.h2
                variants={staggerItem}
                style={{ fontSize: 26, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em', marginBottom: 6 }}
              >
                Create account
              </motion.h2>
              <motion.p variants={staggerItem} style={{ fontSize: 13, color: 'rgba(240,238,255,0.4)' }}>
                Set up your Nyaya workspace in seconds
              </motion.p>
            </motion.div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'rgba(220,38,96,0.1)', border: '1px solid rgba(220,38,96,0.25)',
                    color: '#f87171', padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
                  }}
                >
                  <I.Alert size={14} style={{ flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
              initial="initial" animate="animate"
              style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
            >
              {/* Name */}
              <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Full Name</label>
                <GlassInput
                  type="text" required autoComplete="name"
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  icon={<I.User size={15} />}
                />
              </motion.div>

              {/* Firm Name */}
              <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Law Firm / Practice Name</label>
                <GlassInput
                  type="text" autoComplete="organization"
                  value={firmName} onChange={e => setFirmName(e.target.value)}
                  placeholder="Acme Law Associates"
                  icon={<I.Briefcase size={15} />}
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Email Address</label>
                <GlassInput
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={<I.Mail size={15} />}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Password</label>
                <GlassInput
                  type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

              {/* Confirm password */}
              <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Confirm Password</label>
                <GlassInput
                  type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={confirm && confirm !== password ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
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

              {/* Submit */}
              <motion.button
                variants={staggerItem}
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                style={{
                  width: '100%', height: 50, marginTop: 2, borderRadius: 14,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  fontFamily: 'var(--font-headline)',
                  border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 22px rgba(124,58,237,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                  />
                ) : (
                  <I.Zap size={15} />
                )}
                {isLoading ? 'Creating workspace…' : 'Create Account'}
              </motion.button>
            </motion.form>

            {/* Divider + footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{ marginTop: 20 }}
            >
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontSize: 10, color: 'rgba(240,238,255,0.35)', marginBottom: 14 }}>
                  {['AI-Powered', 'Encrypted', 'Indian Law'].map((f) => (
                    <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <I.Check size={9} style={{ color: '#7c3aed' }} />
                      {f}
                    </span>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,238,255,0.38)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>
                    Sign in →
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
