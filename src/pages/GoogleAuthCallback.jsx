import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthCallback() {
  const navigate          = useNavigate();
  const { loginWithToken } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const refresh = params.get('refresh');
    const isNew   = params.get('new') === '1';
    const err     = params.get('error');

    const ERROR_MESSAGES = {
      google_cancelled:       'Google sign-in was cancelled.',
      google_token_failed:    'Could not get credentials from Google. Please try again.',
      google_unverified_email:'Your Google account email is not verified.',
      google_server_error:    'A server error occurred during sign-in. Please try again.',
    };

    if (err || !token) {
      const msg = ERROR_MESSAGES[err] || 'Google authentication failed. Please try again.';
      setErrorMsg(msg);
      setTimeout(() => navigate('/login'), 3500);
      return;
    }

    loginWithToken(token, refresh)
      .then(() => navigate(isNew ? '/onboarding' : '/', { replace: true }))
      .catch(() => {
        setErrorMsg('Sign-in failed — could not load your account. Please try again.');
        setTimeout(() => navigate('/login'), 3500);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#09071a', gap: 20,
    }}>
      {errorMsg ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 15, color: '#f87171', marginBottom: 8 }}>{errorMsg}</p>
          <p style={{ fontSize: 12, color: 'rgba(240,238,255,0.35)' }}>Redirecting to login…</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40, height: 40, margin: '0 auto 20px',
              border: '3px solid rgba(124,58,237,0.2)',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
            }}
          />
          <p style={{ fontSize: 15, color: 'rgba(240,238,255,0.7)', fontWeight: 600 }}>
            Signing you in with Google…
          </p>
          <p style={{ fontSize: 12, color: 'rgba(240,238,255,0.35)', marginTop: 8 }}>
            Just a moment
          </p>
        </motion.div>
      )}
    </div>
  );
}
