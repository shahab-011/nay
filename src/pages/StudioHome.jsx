import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';

const card = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 240, damping: 22 },
  }),
};

const TOOLS = [
  {
    Ic: I.Upload,
    label: 'Upload & Analyze',
    desc: 'Upload a contract, agreement or legal document and get an instant AI-powered summary, risk flags, and clause breakdown.',
    path: '/upload',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    cta: 'Upload Document',
    primary: true,
  },
  {
    Ic: I.Folder,
    label: 'My Documents',
    desc: 'View and manage all your previously uploaded documents and their AI analyses.',
    path: '/documents',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    cta: 'Open Documents',
  },
  {
    Ic: I.MessageCircle,
    label: 'Ask AI',
    desc: 'Chat with an AI trained on legal concepts. Ask anything about your documents, clauses, or legal situations.',
    path: '/ask',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    cta: 'Start Chatting',
  },
  {
    Ic: I.Copy,
    label: 'Compare Documents',
    desc: 'Upload two versions of a document and get a side-by-side diff highlighting every change.',
    path: '/compare',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    cta: 'Compare Now',
  },
  {
    Ic: I.Clock,
    label: 'Contract Lifecycle',
    desc: 'Track contract renewal dates, expiry deadlines, and key milestones automatically.',
    path: '/lifecycle',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    cta: 'View Lifecycle',
  },
  {
    Ic: I.Network,
    label: 'Obligation Web',
    desc: 'Visualize how obligations, parties, and clauses connect across your documents.',
    path: '/obligation-web',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    cta: 'View Web',
  },
];

export default function StudioHome() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 72px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 40 }}
        >
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 20 }}
          >
            <I.ArrowLeft size={14} /> Back to Portal
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <I.Doc size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--ink)' }}>Document Studio</h1>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                AI-powered legal document analysis — summarize, compare, and understand any document
              </p>
            </div>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/upload')}
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            borderRadius: 20, padding: '28px 32px', marginBottom: 28,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 20, boxShadow: '0 12px 40px rgba(124,58,237,0.25)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              Analyze a Document
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 420 }}>
              Upload any contract or legal document — get instant AI summary, risk highlights, and clause explanations in seconds.
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.06 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '13px 24px',
              borderRadius: 12, background: '#fff', color: 'var(--purple)',
              fontSize: 14, fontWeight: 800, flexShrink: 0, position: 'relative',
            }}
          >
            <I.Upload size={16} /> Upload Now
          </motion.div>
        </motion.div>

        {/* Tool grid */}
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>All Tools</h2>
        <motion.div
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}
        >
          {TOOLS.map((t, i) => (
            <motion.div
              key={t.path}
              custom={i}
              variants={card}
              whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' }}
              onClick={() => navigate(t.path)}
              style={{
                background: 'var(--surface)', borderRadius: 16, padding: '22px 22px 18px',
                cursor: 'pointer', border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border-color 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + '55'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <t.Ic size={20} style={{ color: t.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 5 }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{t.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: t.color, marginTop: 4 }}>
                {t.cta} <I.ArrowRight size={13} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
