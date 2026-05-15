import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

function PasswordStrength({ password }) {
  if (!password) return null;
  const len    = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum   = /\d/.test(password);
  const hasSym   = /[^A-Za-z0-9]/.test(password);
  const score    = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
  const levels   = [
    { label: 'Too short',  color: '#EF4444' },
    { label: 'Weak',       color: '#F97316' },
    { label: 'Fair',       color: '#F59E0B' },
    { label: 'Good',       color: '#84CC16' },
    { label: 'Strong',     color: '#10B981' },
  ];
  const level = len < 8 ? levels[0] : levels[Math.min(score, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: 'var(--elevated)', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: i < score ? level.color : 'transparent', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: level.color }}>{level.label}</p>
    </div>
  );
}

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (!token) return setError('Reset link is invalid — request a new one');
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed — the link may have expired');
    } finally {
      setLoading(false);
    }
  }

  const inp = { width: '100%', height: 44, paddingLeft: 42, paddingRight: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <div className="card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <I.Lock size={26} style={{ color: 'var(--purple)' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>Set new password</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Must be 8+ chars with uppercase, number, and symbol.</p>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #6EE7B7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <I.Check size={28} style={{ color: '#059669' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Password updated!</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Redirecting you to sign in…</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(220,38,96,0.07)', border: '1px solid rgba(220,38,96,0.25)', color: 'var(--red)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <I.Alert size={14} style={{ flexShrink: 0 }} />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* New password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <I.Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
                      <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showPass ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <I.Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                        style={{ ...inp, borderColor: confirm && confirm !== password ? 'rgba(220,38,96,0.5)' : undefined }} />
                    </div>
                    <AnimatePresence>
                      {confirm && confirm !== password && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 10, color: 'var(--red)', marginLeft: 2 }}>Passwords do not match</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                    style={{ width: '100%', height: 48, borderRadius: 12, background: 'var(--purple)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(124,58,237,0.25)', marginTop: 4 }}>
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                      : <I.Check size={16} />}
                    {loading ? 'Updating…' : 'Reset Password'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
