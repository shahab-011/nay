import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

const MIN_PASSWORD_LENGTH = 6;

const staggerItem = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const inputStyle = {
  width: '100%', height: 44, paddingLeft: 42, paddingRight: 44,
  borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--elevated)', color: 'var(--ink)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'var(--text-muted)', marginLeft: 2,
};

function PasswordStrength({ password }) {
  if (!password) return null;
  const len    = password.length;
  const hasNum = /\d/.test(password);
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  const score  = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
  const levels = [
    { label: 'Too short', color: 'var(--red)'   },
    { label: 'Weak',      color: '#f87171'       },
    { label: 'Fair',      color: 'var(--amber)'  },
    { label: 'Good',      color: '#facc15'       },
    { label: 'Strong',    color: 'var(--green)'  },
  ];
  const level = len < MIN_PASSWORD_LENGTH ? levels[0] : levels[Math.min(score + 1, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: 'var(--elevated)', overflow: 'hidden' }}>
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
    if (password !== confirm)
      return setError('Passwords do not match');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 40px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Background blobs */}
      <motion.div animate={{ y: [0, -18, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '8%', right: '8%', width: 280, height: 280, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
      <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{ position: 'absolute', bottom: '8%', left: '8%', width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}
      >
        <div className="card" style={{ padding: '32px 28px' }}>

          {/* Header */}
          <motion.div variants={{ animate: { transition: { staggerChildren: 0.09 } } }}
            initial="initial" animate="animate"
            style={{ textAlign: 'center', marginBottom: 24 }}>
            <motion.div variants={staggerItem} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--purple-soft)', border: '1px solid var(--purple-mist)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <I.Logo size={26} />
              </div>
            </motion.div>
            <motion.h1 variants={staggerItem}
              style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-headline)', color: 'var(--ink)', marginBottom: 4 }}>
              <span style={{ color: 'var(--purple)' }}>Create</span> Account
            </motion.h1>
            <motion.p variants={staggerItem} style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Set up your Nyaya workspace
            </motion.p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(220,38,96,0.07)', border: '1px solid rgba(220,38,96,0.25)',
                  color: 'var(--red)', padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden',
                }}>
                <I.Alert size={14} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form onSubmit={handleSubmit}
            variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
            initial="initial" animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Your Full Name</label>
              <div style={{ position: 'relative' }}>
                <I.User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" style={{ ...inputStyle, paddingLeft: 42, paddingRight: 14 }} />
              </div>
            </motion.div>

            {/* Firm Name */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Law Firm / Practice Name</label>
              <div style={{ position: 'relative' }}>
                <I.Briefcase size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" autoComplete="organization" value={firmName} onChange={e => setFirmName(e.target.value)}
                  placeholder="Acme Law Associates" style={{ ...inputStyle, paddingLeft: 42, paddingRight: 14 }} />
              </div>
            </motion.div>

            {/* Email + Phone */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <I.Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={{ ...inputStyle, paddingLeft: 42, paddingRight: 14 }} />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <I.Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" style={inputStyle} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </motion.div>

            {/* Confirm password */}
            <motion.div variants={staggerItem} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <I.Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, borderColor: confirm && confirm !== password ? 'rgba(220,38,96,0.5)' : undefined }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showConfirm ? <I.EyeOff size={16} /> : <I.Eye size={16} />}
                </button>
              </div>
              <AnimatePresence>
                {confirm && confirm !== password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 10, color: 'var(--red)', marginLeft: 2 }}>
                    Passwords do not match
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.button variants={staggerItem} type="submit" disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                width: '100%', height: 48, marginTop: 4, borderRadius: 12,
                background: 'var(--purple)', color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-headline)',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
              }}>
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : (
                <I.User size={16} />
              )}
              {isLoading ? 'Creating account…' : 'Create Account'}
            </motion.button>
          </motion.form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
