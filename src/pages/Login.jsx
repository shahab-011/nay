import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const staggerItem = {
  initial: { opacity: 0, y: 20 },
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(68,229,194,0.12) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,214,231,0.08) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-[60%] left-[5%] w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Gradient border wrapper */}
        <div className="gradient-border rounded-3xl">
          <div className="rounded-3xl p-8 md:p-10"
            style={{ background: 'rgba(5, 15, 50, 0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Logo + Title */}
            <motion.div
              variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
              initial="initial" animate="animate"
              className="text-center mb-8"
            >
              <motion.div variants={staggerItem} className="inline-flex items-center justify-center mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center"
                    style={{ boxShadow: '0 0 30px rgba(68,229,194,0.2)' }}>
                    <span className="material-symbols-outlined text-4xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-1 rounded-2xl border border-dashed border-primary/20"
                  />
                </div>
              </motion.div>

              <motion.h1 variants={staggerItem}
                className="text-3xl font-black tracking-tight font-headline mb-1">
                <span className="gradient-text">Nyaya</span>
                <span className="text-white">AI</span>
              </motion.h1>
              <motion.p variants={staggerItem} className="text-on-surface-variant text-sm">
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
                  className="bg-error/10 border border-error/25 text-error px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
              initial="initial" animate="animate"
              className="space-y-4"
            >
              {/* Email */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="nyaya-input pl-11"
                    placeholder="counsel@firm.com"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={staggerItem} className="space-y-1.5">
                <label className="text-[10px] font-bold font-label text-on-surface-variant uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="nyaya-input pl-11 pr-11"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.button
                variants={staggerItem}
                type="submit" disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full h-12 mt-2 relative overflow-hidden rounded-xl font-headline font-bold text-[15px] text-on-primary disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #44e5c2, #38debb, #2dd4bf)',
                  boxShadow: '0 0 24px rgba(68,229,194,0.35), 0 4px 20px rgba(68,229,194,0.15)',
                }}
              >
                <span className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
                {isLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="material-symbols-outlined text-xl">progress_activity</motion.span>
                    Authenticating…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                    Sign In Securely
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Divider + features */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-6 pt-5 border-t border-white/5 space-y-3"
            >
              <div className="flex items-center justify-center gap-6 text-[10px] text-on-surface-variant/50">
                {['AI-Powered Analysis', 'End-to-End Encrypted', 'Indian Legal Compliance'].map((f) => (
                  <span key={f} className="flex items-center gap-1">
                    <span className="text-primary/60 text-[10px] material-symbols-outlined">check_circle</span>
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-center text-sm text-on-surface-variant">
                No account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  Create workspace →
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
