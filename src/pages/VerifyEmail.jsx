import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { verifyEmail, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [params]  = useSearchParams();

  const emailFromParam = params.get('email') || '';
  const [email,    setEmail]    = useState(emailFromParam);
  const [otp,      setOtp]      = useState(['', '', '', '', '', '']);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleOtpChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (!val && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Enter all 6 digits');
    if (!email) return setError('Email is missing — go back and try again');
    setError('');
    setLoading(true);
    try {
      const data = await verifyEmail(email, code);
      const needsOnboarding = data.data?.needsOnboarding;
      navigate(needsOnboarding ? '/onboarding' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return setError('Email is missing');
    setResending(true);
    setError('');
    try {
      await resendOTP(email);
      setSuccess('New code sent — check your inbox');
      setCountdown(60);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <I.Mail size={28} style={{ color: 'var(--purple)' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>Check your email</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--ink)' }}>{email || 'your email'}</strong>
            </p>
          </div>

          {/* Email field if missing from URL */}
          {!emailFromParam && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(220,38,96,0.07)', border: '1px solid rgba(220,38,96,0.25)', color: 'var(--red)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <I.Alert size={14} style={{ flexShrink: 0 }} />{error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <I.Check size={14} style={{ flexShrink: 0 }} />{success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP inputs */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800,
                    borderRadius: 12, border: `2px solid ${digit ? 'var(--purple)' : 'var(--border)'}`,
                    background: digit ? 'var(--purple-soft)' : 'var(--elevated)',
                    color: 'var(--ink)', outline: 'none', transition: 'all 150ms',
                  }}
                />
              ))}
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ width: '100%', height: 48, borderRadius: 12, background: 'var(--purple)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(124,58,237,0.25)' }}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : <I.Check size={16} />}
              {loading ? 'Verifying…' : 'Verify Email'}
            </motion.button>
          </form>

          {/* Resend */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Didn't receive it?</p>
            <button onClick={handleResend} disabled={resending || countdown > 0}
              style={{ background: 'none', border: 'none', color: countdown > 0 ? 'var(--text-muted)' : 'var(--purple)', fontWeight: 700, fontSize: 13, cursor: countdown > 0 ? 'default' : 'pointer' }}>
              {resending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
