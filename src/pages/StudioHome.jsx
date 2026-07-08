import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';

/* ── Design tokens ────────────────────────────────────────────────── */
const BG     = '#07091f';
const SUR    = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const T      = '#f0f0ff';
const TM     = 'rgba(240,240,255,0.5)';
const INDIGO = '#6366f1';
const CYAN   = '#22d3ee';

/* ── Tool cards ────────────────────────────────────────────────────── */
const TOOLS = [
  {
    Ic: I.Upload, label: 'Upload & Analyze', path: '/upload',
    desc: 'Upload any contract or legal document for instant AI-powered summary, risk flags, and clause breakdown.',
    color: '#6366f1', glow: 'rgba(99,102,241,0.18)', cta: 'Upload Document',
  },
  {
    Ic: I.Folder, label: 'My Documents', path: '/documents',
    desc: 'View and manage all your uploaded documents, analysis reports, and health scores in one place.',
    color: '#3b82f6', glow: 'rgba(59,130,246,0.18)', cta: 'Open Repository',
  },
  {
    Ic: I.MessageCircle, label: 'Ask AI', path: '/ask',
    desc: 'Chat with an AI trained on legal concepts. Ask anything about documents, clauses, or legal situations.',
    color: '#22d3ee', glow: 'rgba(34,211,238,0.18)', cta: 'Start Chatting',
  },
  {
    Ic: I.Copy, label: 'Compare Documents', path: '/compare',
    desc: 'Upload two versions of a document and get a side-by-side diff highlighting every change.',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', cta: 'Compare Now',
  },
  {
    Ic: I.Clock, label: 'Contract Lifecycle', path: '/lifecycle',
    desc: 'Track renewal dates, expiry deadlines, and key contract milestones automatically.',
    color: '#f43f5e', glow: 'rgba(244,63,94,0.18)', cta: 'View Lifecycle',
  },
  {
    Ic: I.Network, label: 'Obligation Web', path: '/obligation-web',
    desc: 'Visualize how obligations, parties, and clauses connect across your entire document portfolio.',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.18)', cta: 'Explore Web',
  },
];

const STATS = [
  { value: '850+',  label: 'Documents Analyzed' },
  { value: '99.2%', label: 'AI Accuracy' },
  { value: '12k+',  label: 'Active Users' },
  { value: '40+',   label: 'Jurisdictions' },
];

const cardV = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 260, damping: 22 },
  }),
};

export default function StudioHome() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: BG, position: 'relative', overflow: 'hidden' }}>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: -120, left: '30%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: 200, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -100, left: -100, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 24px 72px', position: 'relative', zIndex: 1 }}>

        {/* ── Back button ─────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          onClick={() => navigate('/services')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', color: TM, fontSize: 13,
            fontWeight: 600, padding: '4px 0', marginBottom: 32,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; }}
          onMouseLeave={e => { e.currentTarget.style.color = TM; }}
        >
          <I.ArrowLeft size={14} /> Back to Portal
        </motion.button>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 48 }}
        >
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 20 }}>
            <I.Sparkle size={13} style={{ color: CYAN }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.04em' }}>AI-Powered Legal Analysis Platform</span>
          </div>

          <h1 style={{
            margin: '0 0 16px', fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
            color: T,
          }}>
            Document{' '}
            <span style={{
              background: `linear-gradient(135deg, ${INDIGO} 0%, ${CYAN} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Studio
            </span>
          </h1>

          <p style={{ fontSize: 17, color: TM, maxWidth: 560, lineHeight: 1.65, margin: '0 0 32px' }}>
            Analyze, compare, and understand any legal document instantly. AI-powered insights for contracts, NDAs, agreements and more.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: T, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: TM, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Primary CTA banner ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/upload')}
          style={{
            background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)`,
            borderRadius: 20, padding: '28px 32px', marginBottom: 40,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 20, border: '1px solid rgba(99,102,241,0.4)',
            boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,211,238,0.06)' }} />
          <div style={{ position: 'absolute', right: 80, bottom: -50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Zap size={18} style={{ color: CYAN }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Analyze a Document</div>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 420 }}>
              Upload any contract or legal document — get AI summary, risk highlights, and clause explanations in seconds.
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.06 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '13px 24px',
              borderRadius: 12, background: `linear-gradient(135deg, ${INDIGO}, #4f46e5)`,
              color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
              position: 'relative',
            }}
          >
            <I.Upload size={16} /> Upload Now
          </motion.div>
        </motion.div>

        {/* ── Tool grid ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: TM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>All Tools</span>
          <div style={{ height: 1, flex: 1, background: BORDER }} />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}
        >
          {TOOLS.map((t, i) => (
            <motion.div
              key={t.path}
              custom={i}
              variants={cardV}
              onClick={() => navigate(t.path)}
              style={{
                background: SUR, borderRadius: 18, padding: '24px 24px 20px',
                cursor: 'pointer', border: `1px solid ${BORDER}`,
                display: 'flex', flexDirection: 'column', gap: 14,
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 200ms, transform 200ms, box-shadow 200ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = t.color + '55';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${t.color}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Corner glow */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: t.glow, border: `1px solid ${t.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <t.Ic size={21} style={{ color: t.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T, marginBottom: 6 }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: TM, lineHeight: 1.6 }}>{t.desc}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: t.color }}>
                {t.cta} <I.ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Trust strip ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 56, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}
        >
          {[
            { Ic: I.Shield, label: 'AES-256 Encrypted' },
            { Ic: I.Lock,   label: 'Offline-First for PDFs' },
            { Ic: I.Globe,  label: '40+ Jurisdictions' },
            { Ic: I.Zap,    label: 'Powered by Claude AI' },
          ].map(({ Ic, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.35 }}>
              <Ic size={16} style={{ color: T }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T }}>{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
