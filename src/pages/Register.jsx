import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_PASSWORD_LENGTH = 6;

const staggerItem = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function PasswordStrength({ password }) {
  if (!password) return null;
  const len    = password.length;
  const hasNum = /\d/.test(password);
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  const score  = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
  const levels = [
    { label: 'Too short', color: 'bg-error',      text: 'text-error'      },
    { label: 'Weak',      color: 'bg-red-400',    text: 'text-red-400'    },
    { label: 'Fair',      color: 'bg-amber-400',  text: 'text-amber-400'  },
    { label: 'Good',      color: 'bg-yellow-400', text: 'text-yellow-400' },
    { label: 'Strong',    color: 'bg-primary',    text: 'text-primary'    },
  ];
  const level = len < MIN_PASSWORD_LENGTH ? levels[0] : levels[Math.min(score + 1, 4)];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-white/5">
            <motion.div
              className={`h-full ${i < score ? level.color : 'bg-transparent'}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i < score ? 1 : 0 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </motion.div>
        ))}
      </div>
      <p className={`text-[10px] font-label ${level.text}`}>{level.label}</p>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [role,        setRole]        = useState('user');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    if (password !== confirm)
      return setError('Passwords do not match');
    setIsLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden">
      {/* Orbs */}
      <motion.div animate={{ y: [0,-18,0] }} transition={{ duration: 9, repeat: Infinity, ease:'easeInOut' }}
        className="absolute top-[10%] right-[8%] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(68,229,194,0.1) 0%, transparent 70%)' }} />
      <motion.div animate={{ y: [0,14,0] }} transition={{ duration: 11, repeat: Infinity, ease:'easeInOut', delay:1.5 }}
        className="absolute bottom-[10%] left-[8%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="gradient-border rounded-3xl">
          <div className="rounded-3xl p-8 md:p-10"
            style={{ background: 'rgba(5, 15, 50, 0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Header */}
            <motion.div variants={{ animate: { transition: { staggerChildren: 0.09 } } }}
              initial="initial" animate="animate" className="text-center mb-7">
              <motion.div variants={staggerItem} className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/5 border border-secondary/30 flex items-center justify-center"
                    style={{ boxShadow: '0 0 24px rgba(102,214,231,0.15)' }}>
                    <span className="material-symbols-outlined text-3xl text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}>app_registration</span>
                  </div>
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-1 rounded-2xl border border-dashed border-secondary/15" />
                </div>
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-black tracking-tight font-headline mb-1">
                <span className="gradient-text">Create</span> <span className="text-white">Account</span>
              </motion.h1>
              <motion.p variants={staggerItem} className="text-on-surface-variant text-sm">
                Set up your NyayaAI workspace
              </motion.p>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:-10, height:0 }} animate={{ opacity:1, y:0, height:'auto' }} exit={{ opacity:0, height:0 }}
                  className="bg-error/10 border border-error/25 text-error px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form onSubmit={handleSubmit}
              variants={{ animate: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
              initial="initial" animate="animate" className="space-y-4">

              {/* Name */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">person</span>
                  <input type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                    className="nyaya-input pl-11" placeholder="Jane Doe" />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">mail</span>
                  <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="nyaya-input pl-11" placeholder="counsel@firm.com" />
                </div>
              </motion.div>

              {/* Role selector */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'user',   icon: 'person', label: 'Individual', sub: 'Manage your own documents' },
                    { value: 'lawyer', icon: 'gavel',  label: 'Legal Pro',  sub: 'Manage clients & cases'    },
                  ].map((opt) => (
                    <motion.button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                        role === opt.value
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/8 bg-white/3 text-on-surface-variant hover:border-white/15'
                      }`}
                      style={role === opt.value ? { boxShadow: '0 0 12px rgba(68,229,194,0.1)' } : {}}
                    >
                      <span className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: role === opt.value ? "'FILL' 1" : "'FILL' 0" }}>
                        {opt.icon}
                      </span>
                      <span className="text-[13px] font-bold font-headline">{opt.label}</span>
                      <span className="text-[10px] leading-tight opacity-60">{opt.sub}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">lock</span>
                  <input type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="nyaya-input pl-11 pr-11" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <PasswordStrength password={password} />
              </motion.div>

              {/* Confirm password */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">lock_reset</span>
                  <input type={showConfirm ? 'text' : 'password'} required autoComplete="new-password"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    className={`nyaya-input pl-11 pr-11 ${confirm && confirm !== password ? '!border-error/50' : ''}`}
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <AnimatePresence>
                  {confirm && confirm !== password && (
                    <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      className="text-[10px] text-error font-label ml-1">
                      Passwords do not match
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.button variants={staggerItem} type="submit" disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full h-12 mt-2 relative overflow-hidden rounded-xl font-headline font-bold text-[15px] text-on-primary disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #44e5c2, #38debb)',
                  boxShadow: '0 0 24px rgba(68,229,194,0.3), 0 4px 20px rgba(68,229,194,0.12)',
                }}>
                {isLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                      className="material-symbols-outlined text-xl">progress_activity</motion.span>
                    Creating account…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                    Create Account
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
              className="mt-5 text-center text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign in →</Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
