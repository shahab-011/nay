import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

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

/* ── Mock dashboard preview for left panel ── */
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
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.14)',
        borderRadius: 20, padding: '20px 22px', backdropFilter: 'blur(16px)',
        marginTop: 40,
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,238,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Today's Workspace
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }}
          />
          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { icon: <I.Briefcase size={13} />, value: '12', label: 'Matters' },
          { icon: <I.CheckSquare size={13} />, value: '4', label: 'Due Today' },
          { icon: <I.Timer size={13} />, value: '3.5h', label: 'Logged' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 10px', textAlign: 'center' }}>
            <div style={{ color: '#a78bfa', display: 'flex', justifyContent: 'center', marginBottom: 5 }}>{s.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0eeff', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(240,238,255,0.4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
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
            transition={{ delay: 0.7 + i * 0.12, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,238,255,0.85)', lineHeight: 1.2 }}>{m.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,238,255,0.35)', marginTop: 2 }}>{m.type}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: m.badgeColor, background: `${m.badgeColor}18`, padding: '3px 8px', borderRadius: 6, border: `1px solid ${m.badgeColor}30`, letterSpacing: '0.05em' }}>
              {m.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(240,238,255,0.4)', marginBottom: 6 }}>
          <span>Retainer utilization</span><span style={{ color: '#a78bfa', fontWeight: 700 }}>73%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '73%' }}
            transition={{ duration: 1.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 4 }}
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
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
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

      {/* ══ LEFT PANEL ══ */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="auth-left-panel"
      >
        {/* Orbs */}
        <motion.div animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-5%', right: '-8%', width: 440, height: 440, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 68%)' }} />
        <motion.div animate={{ y: [0, 22, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{ position: 'absolute', bottom: '0%', left: '-12%', width: 380, height: 380, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 68%)' }} />
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ position: 'absolute', top: '55%', right: '20%', width: 200, height: 200, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(124,58,237,0.07) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 48 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
              <I.Logo size={21} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.02em' }}>NyayaAI</span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={sc} initial="initial" animate="animate">
            <motion.div variants={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              </motion.div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,238,255,0.7)', letterSpacing: '0.04em' }}>850+ Law Firms Active</span>
            </motion.div>

            <motion.h1 variants={si} style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1, marginBottom: 14, fontFamily: 'var(--font-headline)', letterSpacing: '-0.03em', color: '#f0eeff' }}>
              Your legal workspace{' '}
              <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                awaits.
              </span>
            </motion.h1>

            <motion.p variants={si} style={{ fontSize: 14, color: 'rgba(240,238,255,0.48)', lineHeight: 1.75, maxWidth: 380 }}>
              Matters, clients, documents, billing — everything you need to run a modern legal practice, powered by AI.
            </motion.p>
          </motion.div>

          <DashboardPreview />
        </div>
      </motion.div>

      {/* ══ RIGHT PANEL (full height, no card) ══ */}
      <div className="auth-right-panel">
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.5) 50%, transparent 100%)' }} />
        {/* Subtle corner glow */}
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 360, height: 360, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
        >
          {/* Heading */}
          <motion.div variants={sc} initial="initial" animate="animate" style={{ marginBottom: 32 }}>
            <motion.h2 variants={si} style={{ fontSize: 28, fontWeight: 900, color: '#f0eeff', fontFamily: 'var(--font-headline)', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Welcome back
            </motion.h2>
            <motion.p variants={si} style={{ fontSize: 14, color: 'rgba(240,238,255,0.42)', lineHeight: 1.6 }}>
              Sign in to your legal intelligence workspace
            </motion.p>
          </motion.div>

          {/* Google button */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} style={{ marginBottom: 4 }}>
            <motion.button
              onClick={handleGoogle}
              whileHover={{ scale: 1.015, background: '#f8f8f8' }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', height: 48, borderRadius: 12, background: '#fff', border: '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', transition: 'background 0.2s' }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
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
          <motion.form onSubmit={handleSubmit} variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } }} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)', marginLeft: 2 }}>Email Address</label>
              <GlassInput type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<I.Mail size={16} />} />
            </motion.div>

            <motion.div variants={si} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,238,255,0.38)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <GlassInput
                type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                icon={<I.Lock size={16} />}
                rightAction={
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPass ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                  </button>
                }
              />
            </motion.div>

            <motion.button variants={si} type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{ width: '100%', height: 50, marginTop: 4, borderRadius: 13, background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-headline)', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 22px rgba(124,58,237,0.4)', letterSpacing: '-0.01em' }}>
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : <I.Lock size={15} />}
              {isLoading ? 'Signing in…' : 'Sign In Securely'}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              {['AI-Powered', 'Encrypted', 'Indian Law'].map(f => (
                <span key={f} style={{ fontSize: 10, color: 'rgba(240,238,255,0.3)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <I.Check size={9} style={{ color: '#7c3aed' }} />{f}
                </span>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,238,255,0.38)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Create workspace →</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
