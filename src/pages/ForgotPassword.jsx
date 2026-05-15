import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <I.Lock size={26} style={{ color: 'var(--purple)' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>Forgot password?</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {sent ? "Check your inbox — we've sent a reset link." : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {error && (
                  <div style={{ background: 'rgba(220,38,96,0.07)', border: '1px solid rgba(220,38,96,0.25)', color: 'var(--red)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I.Alert size={14} style={{ flexShrink: 0 }} />{error}
                  </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <I.Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ width: '100%', height: 44, paddingLeft: 42, paddingRight: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                    style={{ width: '100%', height: 48, borderRadius: 12, background: 'var(--purple)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(124,58,237,0.25)' }}>
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                      : <I.Send size={16} />}
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #6EE7B7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <I.Check size={28} style={{ color: '#059669' }} />
                </div>
                <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 8 }}>Reset link sent to</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', marginBottom: 20 }}>{email}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Didn't get it? Check spam or{' '}
                  <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--purple)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>try again</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
