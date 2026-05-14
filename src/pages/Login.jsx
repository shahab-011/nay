import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const staggerItem = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Background blobs */}
      <motion.div animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '10%', left: '5%', width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
      <motion.div animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', bottom: '10%', right: '5%', width: 360, height: 360, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}
      >
        <div className="card" style={{ padding: '36px 32px' }}>

          {/* Logo + Title */}
          <motion.div
            variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
            initial="initial" animate="animate"
            style={{ textAlign: 'center', marginBottom: 28 }}
          >
            <motion.div variants={staggerItem} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <I.Logo size={28} />
              </div>
            </motion.div>
            <motion.h1 variants={staggerItem}
              style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-headline)', color: 'var(--ink)', marginBottom: 4 }}>
              <span style={{ color: 'var(--purple)' }}>Nyaya</span>
            </motion.h1>
            <motion.p variants={staggerItem} style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Sign in to your legal intelligence workspace
            </motion.p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(220,38,96,0.07)', border: '1px solid rgba(220,38,96,0.25)',
                  color: 'var(--red)', padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
                }}
              >
                <I.Alert size={14} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form onSubmit={handleSubmit}
            variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            initial="initial" animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Email */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginLeft: 2 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <I.Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%', height: 44, paddingLeft: 42, paddingRight: 14,
                    borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginLeft: 2 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <I.Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', height: 44, paddingLeft: 42, paddingRight: 44,
                    borderRadius: 10, border: '1px solid var(--border)',
                    background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                  {showPass ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button variants={staggerItem}
              type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                width: '100%', height: 48, marginTop: 4, borderRadius: 12,
                background: 'var(--purple)', color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-headline)',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
              }}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : (
                <I.Lock size={16} />
              )}
              {isLoading ? 'Signing in…' : 'Sign In Securely'}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
              {['AI-Powered Analysis', 'End-to-End Encrypted', 'Global Legal Coverage'].map((f) => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <I.Check size={10} style={{ color: 'var(--purple)' }} />
                  {f}
                </span>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>
                Create workspace →
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
