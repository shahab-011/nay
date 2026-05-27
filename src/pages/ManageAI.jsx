import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { I } from '../components/Icons';
import { aiApi } from '../api/ai.api';
import { mattersApi } from '../api/matters.api';

/* ─── Design tokens ─────────────────────────────────────────────────── */
const T   = '#f0eeff';
const TM  = 'rgba(240,238,255,0.45)';
const TD  = 'rgba(240,238,255,0.22)';
const PRP = '#7c3aed';
const PRL = '#a78bfa';
const PRC = '#c4b5fd';
const GLS = 'rgba(255,255,255,0.04)';
const BDR = 'rgba(124,58,237,0.2)';

/* ─── Shared style objects ──────────────────────────────────────────── */
const inp = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(124,58,237,0.25)', fontSize: 13,
  color: T, background: 'rgba(255,255,255,0.06)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 200ms',
};
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: TD, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
};
const glassCard = {
  background: GLS, border: `1px solid ${BDR}`,
  borderRadius: 16, backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

/* ─── Helpers ───────────────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const SEV_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };
const SEV_GLOW  = { high: 'rgba(248,113,113,0.3)', medium: 'rgba(251,191,36,0.3)', low: 'rgba(74,222,128,0.3)' };

function copyText(t) { navigator.clipboard.writeText(t).catch(() => {}); }
function downloadText(name, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = name; a.click();
}

/* ─── NeuralGrid background ─────────────────────────────────────────── */
function NeuralGrid() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Gradient orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '8%', left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        style={{ position: 'absolute', top: '40%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)' }}
      />

      {/* SVG dot grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(124,58,237,0.35)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}

/* ─── Pulsing AI orb in header ──────────────────────────────────────── */
function AIOrb({ size = 56 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Outer pulse */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'rgba(124,58,237,0.3)' }}
      />
      {/* Middle ring */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.5)' }}
      />
      {/* Core */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 24px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}>
        <I.Zap size={size * 0.4} style={{ color: '#fff' }} />
      </div>
    </div>
  );
}

/* ─── Typing dots animation ─────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 16px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: PRL }}
        />
      ))}
    </div>
  );
}

/* ─── Futuristic badge ──────────────────────────────────────────────── */
function Badge({ text, color = PRP }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      background: `${color}18`, color, border: `1px solid ${color}35`,
    }}>{text}</span>
  );
}

/* ─── Select / Input wrappers ───────────────────────────────────────── */
function Sel({ value, onChange, children, style }) {
  return (
    <select
      value={value} onChange={onChange}
      style={{ ...inp, appearance: 'none', cursor: 'pointer', ...style }}
    >{children}</select>
  );
}

/* ─── Alert banner ──────────────────────────────────────────────────── */
function AlertBanner({ msg, type = 'error' }) {
  if (!msg) return null;
  const c = type === 'error' ? '#f87171' : '#4ade80';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '10px 14px', borderRadius: 10, background: `${c}12`, border: `1px solid ${c}30`, color: c, fontSize: 12, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <I.Alert size={13} /> {msg}
    </motion.div>
  );
}

/* ─── Glowing button ────────────────────────────────────────────────── */
function GlowBtn({ onClick, disabled, loading, children, variant = 'primary', style }) {
  const styles = {
    primary: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' },
    ghost:   { background: 'rgba(255,255,255,0.06)', color: T, border: `1px solid ${BDR}`, boxShadow: 'none' },
    danger:  { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', boxShadow: 'none' },
    success: { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', boxShadow: 'none' },
  };
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={disabled || loading ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 18px', borderRadius: 10, border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 700, opacity: disabled || loading ? 0.55 : 1,
        transition: 'all 200ms', ...styles[variant], ...style,
      }}
    >
      {loading
        ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} /> Processing…</>
        : children
      }
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — ANALYZE
═══════════════════════════════════════════════════════════════════ */
function AnalyzeTab() {
  const [mode, setMode]     = useState('analyze');
  const [text, setText]     = useState('');
  const [matterId, setMId]  = useState('');
  const [createEvents, setCE] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [matters, setMatters] = useState([]);

  useEffect(() => {
    mattersApi.list({ limit: 100, status: 'open' })
      .then(r => setMatters(r.data.data?.matters || r.data.data || []))
      .catch(() => {});
  }, []);

  async function run() {
    if (!text.trim() || text.trim().length < 50) { setError('Paste at least 50 characters of document text.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const fn   = mode === 'analyze' ? aiApi.analyzeDocument : aiApi.extractDeadlines;
      const body = mode === 'analyze' ? { text } : { text, matterId: matterId || undefined, createEvents };
      const r    = await fn(body);
      setResult(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'AI request failed'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Input panel */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ ...glassCard, padding: 24 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
          {['analyze', 'deadlines'].map(m => (
            <motion.button
              key={m}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setMode(m); setResult(null); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 200ms', background: mode === m ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent', color: mode === m ? '#fff' : TM, boxShadow: mode === m ? '0 4px 12px rgba(124,58,237,0.4)' : 'none' }}
            >
              {m === 'analyze' ? '🔍 Analyze Document' : '📅 Extract Deadlines'}
            </motion.button>
          ))}
        </div>

        <label style={lbl}>Document Text <span style={{ color: TD, textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(paste legal text)</span></label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={12}
          placeholder="Paste legal document text here…"
          style={{ ...inp, resize: 'vertical', lineHeight: 1.65, fontFamily: 'monospace', fontSize: 12 }}
          onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.25)'; }}
        />

        {mode === 'deadlines' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={lbl}>Link to Matter (optional)</label>
              <Sel value={matterId} onChange={e => setMId(e.target.value)}>
                <option value="">— None —</option>
                {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </Sel>
            </div>
            {matterId && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', color: T }}>
                <div
                  onClick={() => setCE(!createEvents)}
                  style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${createEvents ? PRP : BDR}`, background: createEvents ? PRP : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  {createEvents && <I.Check size={11} style={{ color: '#fff' }} />}
                </div>
                Auto-create calendar events from deadlines
              </label>
            )}
          </motion.div>
        )}

        <AlertBanner msg={error} />

        <GlowBtn onClick={run} loading={loading} style={{ marginTop: 16, width: '100%', justifyContent: 'center', padding: '12px' }}>
          <I.Zap size={15} /> {mode === 'analyze' ? 'Analyze with AI' : 'Extract Deadlines'}
        </GlowBtn>
        <div style={{ fontSize: 10, color: TD, textAlign: 'center', marginTop: 8 }}>Powered by Claude Haiku · Results saved automatically</div>
      </motion.div>

      {/* Result panel */}
      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '60px 20px', color: TD }}>
            <motion.div
              animate={{ rotateY: [0, 15, -15, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 64, marginBottom: 14, display: 'inline-block' }}
            >🧠</motion.div>
            <div style={{ fontSize: 15, fontWeight: 600, color: TM, marginBottom: 6 }}>Ready to analyze</div>
            <div style={{ fontSize: 12 }}>Paste your document and click Analyze</div>
          </motion.div>
        )}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 20 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: PRP, boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
            />
            <div style={{ color: PRL, fontSize: 14, fontWeight: 600 }}>AI is analyzing…</div>
            <div style={{ color: TD, fontSize: 11 }}>This usually takes 5–15 seconds</div>
          </motion.div>
        )}
        {result && mode === 'analyze' && <AnalyzeResult key="analyze" result={result} />}
        {result && mode === 'deadlines' && <DeadlinesResult key="deadlines" result={result} />}
      </AnimatePresence>
    </div>
  );
}

function AnalyzeResult({ result }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ ...glassCard, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T }}>Summary</div>
          <Badge text={result.documentType || 'Document'} color={PRP} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: TM, lineHeight: 1.7 }}>{result.summary}</p>
      </div>

      {result.risks?.length > 0 && (
        <div style={{ ...glassCard, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 12 }}>Risk Analysis</div>
          {result.risks.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: `${SEV_GLOW[r.severity] || 'rgba(107,114,128,0.1)'}`, border: `1px solid ${SEV_COLOR[r.severity] || '#6b7280'}30` }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SEV_COLOR[r.severity] || '#6b7280', flexShrink: 0, marginTop: 3, boxShadow: `0 0 8px ${SEV_COLOR[r.severity] || '#6b7280'}` }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: SEV_COLOR[r.severity] || T, marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: TM }}>{r.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {result.parties?.length > 0 && (
        <div style={{ ...glassCard, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 10 }}>Parties</div>
          {result.parties.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'center' }}>
              <Badge text={p.role} color="#60a5fa" />
              <span style={{ fontSize: 13, color: TM }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {result.keyDates?.length > 0 && (
        <div style={{ ...glassCard, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 12 }}>Key Dates</div>
          {result.keyDates.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <Badge text={d.type} color="#fbbf24" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T }}>{d.date}</div>
                <div style={{ fontSize: 12, color: TM }}>{d.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.obligations?.length > 0 && (
        <div style={{ ...glassCard, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 10 }}>Obligations</div>
          {result.obligations.map((o, i) => (
            <div key={i} style={{ fontSize: 12, color: TM, marginBottom: 7, paddingLeft: 12, borderLeft: `3px solid ${PRP}`, lineHeight: 1.55 }}>{o}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 10, color: TD, textAlign: 'right', paddingRight: 4 }}>
        {result.tokensUsed?.toLocaleString()} tokens · {result.model?.replace('claude-', '').replace('-20251001', '')}
      </div>
    </motion.div>
  );
}

function DeadlinesResult({ result }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {result.summary && (
        <div style={{ ...glassCard, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: TM, lineHeight: 1.6 }}>{result.summary}</p>
        </div>
      )}
      <div style={{ ...glassCard, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 14 }}>
          {result.deadlines?.length || 0} Deadline(s) Extracted
        </div>
        {(result.deadlines || []).map((d, i) => {
          const confColor = d.confidence === 'high' ? '#4ade80' : d.confidence === 'medium' ? '#fbbf24' : '#94a3b8';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{ display: 'flex', gap: 14, marginBottom: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BDR}` }}
            >
              <div style={{ flexShrink: 0 }}>
                <Badge text={d.type?.replace('_', ' ') || 'deadline'} color={PRP} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T }}>{d.date}</div>
                <div style={{ fontSize: 12, color: TM, marginTop: 2 }}>{d.description}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: confColor, alignSelf: 'flex-start', marginTop: 2 }}>{d.confidence}</span>
            </motion.div>
          );
        })}
        {result.createdEvents?.length > 0 && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <I.Check size={14} /> {result.createdEvents.length} calendar event(s) created
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — MATTER CHAT
═══════════════════════════════════════════════════════════════════ */
function ChatTab() {
  const [matters, setMatters]       = useState([]);
  const [matterId, setMatterId]     = useState('');
  const [conversationId, setConvId] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [pastConvs, setPastConvs]   = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    mattersApi.list({ limit: 100, status: 'open' })
      .then(r => setMatters(r.data.data?.matters || r.data.data || []))
      .catch(() => {});
    aiApi.conversations.list()
      .then(r => setPastConvs(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true); setError('');
    try {
      const r = await aiApi.chat({ matterId: matterId || undefined, message: msg, conversationId });
      setConvId(r.data.data.conversationId);
      setMessages(r.data.data.messages);
      setPastConvs(prev => {
        const existing = prev.find(c => c._id === r.data.data.conversationId);
        if (!existing) return [{ _id: r.data.data.conversationId, matterId: matters.find(m => m._id === matterId) || null, updatedAt: new Date(), messages: r.data.data.messages }, ...prev];
        return prev;
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Chat failed');
      setMessages(prev => prev.slice(0, -1));
    } finally { setLoading(false); }
  }

  function loadConversation(conv) {
    setConvId(conv._id);
    setMatterId(conv.matterId?._id || '');
    setMessages(conv.messages || []);
  }

  function newChat() {
    setConvId(null); setMessages([]); setInput(''); setError('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 20, height: 'calc(100vh - 290px)', minHeight: 500 }}>
      {/* Left sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        <Sel value={matterId} onChange={e => { setMatterId(e.target.value); newChat(); }}>
          <option value="">General — No Matter</option>
          {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
        </Sel>

        <GlowBtn variant="ghost" onClick={newChat} style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
          <I.Plus size={13} /> New Chat
        </GlowBtn>

        <div style={{ fontSize: 10, fontWeight: 800, color: TD, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
          Past Conversations
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pastConvs.length === 0 && (
            <div style={{ fontSize: 11, color: TD, fontStyle: 'italic', padding: '8px 4px' }}>No past conversations</div>
          )}
          {pastConvs.map(c => (
            <motion.button
              key={c._id}
              whileHover={{ x: 3 }}
              onClick={() => loadConversation(c)}
              style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 9, border: `1px solid ${conversationId === c._id ? BDR : 'transparent'}`, cursor: 'pointer', fontSize: 12, background: conversationId === c._id ? 'rgba(124,58,237,0.12)' : 'transparent', color: conversationId === c._id ? PRC : TM }}
            >
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {c.matterId?.title || 'General Chat'}
              </div>
              <div style={{ fontSize: 10, color: TD }}>{fmtDate(c.updatedAt)}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ ...glassCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 10px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: TD }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: 56, marginBottom: 14 }}
              >💬</motion.div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TM, marginBottom: 8 }}>Ask about your matter</div>
              <div style={{ fontSize: 12 }}>Select a matter for full context, or ask general legal questions.</div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                {/* Role label */}
                <div style={{ fontSize: 10, fontWeight: 700, color: TD, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', paddingLeft: 4, paddingRight: 4 }}>
                  {m.role === 'user' ? 'You' : '⚡ AI Assistant'}
                </div>
                <div style={{
                  maxWidth: '78%', padding: '12px 16px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg,#7c3aed,#5b21b6)'
                    : 'rgba(255,255,255,0.06)',
                  border: m.role === 'user' ? 'none' : `1px solid ${BDR}`,
                  color: T, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  boxShadow: m.role === 'user' ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                }}>
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => copyText(m.content)}
                    style={{ marginTop: 4, fontSize: 10, color: TD, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}
                  >
                    <I.Copy size={11} /> Copy
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TD, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>⚡ AI Assistant</div>
              <div style={{ ...glassCard, borderRadius: '18px 18px 18px 4px', border: `1px solid ${BDR}` }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BDR}`, background: 'rgba(0,0,0,0.2)' }}>
          <AlertBanner msg={error} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about this matter… (Enter to send)"
              style={{ ...inp, flex: 1, padding: '11px 16px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.25)'; }}
            />
            <GlowBtn onClick={send} loading={loading} disabled={!input.trim()} style={{ padding: '11px 18px', flexShrink: 0 }}>
              <I.Send size={14} />
            </GlowBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 3 — DRAFT DOCUMENT
═══════════════════════════════════════════════════════════════════ */
const DOC_TYPES = [
  'Legal Notice', 'Contract Agreement', 'Demand Letter', 'Affidavit',
  'Power of Attorney', 'Bail Application', 'Writ Petition',
  'Memorandum of Understanding', 'Non-Disclosure Agreement',
  'Lease Agreement', 'Employment Contract',
];

function DraftTab() {
  const [matters, setMatters]   = useState([]);
  const [matterId, setMatterId] = useState('');
  const [docType, setDocType]   = useState('');
  const [customType, setCustom] = useState('');
  const [facts, setFacts]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    mattersApi.list({ limit: 100, status: 'open' })
      .then(r => setMatters(r.data.data?.matters || r.data.data || []))
      .catch(() => {});
  }, []);

  async function draft() {
    const type = docType === '__custom__' ? customType : docType;
    if (!type || !facts.trim()) { setError('Document type and facts are required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiApi.draftDocument({ docType: type, facts, matterId: matterId || undefined });
      setResult(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'Drafting failed'); }
    finally { setLoading(false); }
  }

  function handleCopy() { copyText(result.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '580px', gap: 20, alignItems: 'start' }}>
      {/* Input form */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ ...glassCard, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(124,58,237,0.15)', border: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.PenTool size={15} style={{ color: PRL }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T }}>Draft Legal Document</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Document Type</label>
          <Sel value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="">— Select type —</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Custom…</option>
          </Sel>
          {docType === '__custom__' && (
            <motion.input
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              value={customType} onChange={e => setCustom(e.target.value)}
              placeholder="e.g. Settlement Agreement"
              style={{ ...inp, marginTop: 8 }}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Link to Matter (optional)</label>
          <Sel value={matterId} onChange={e => setMatterId(e.target.value)}>
            <option value="">— None —</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </Sel>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Key Facts &amp; Instructions
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, letterSpacing: 0 }}>— names, dates, amounts, terms</span>
          </label>
          <textarea
            value={facts} onChange={e => setFacts(e.target.value)} rows={9}
            placeholder="e.g. Landlord: Ahmed Khan, 12 Main St. Tenant: Sara Malik. Rent ₹50,000/month. Lease: 1 year from 1 June 2025. 2-month deposit…"
            style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }}
            onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.25)'; }}
          />
        </div>

        <AlertBanner msg={error} />

        <GlowBtn onClick={draft} loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
          <I.Zap size={15} /> Draft with Claude AI
        </GlowBtn>
        <div style={{ fontSize: 10, color: TD, textAlign: 'center', marginTop: 8 }}>Uses Claude Sonnet · Saved to AI Suggestions</div>
      </motion.div>

      {/* Generated doc */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ ...glassCard, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 'calc(100vh - 300px)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T }}>{result.docType}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <GlowBtn variant="ghost" onClick={handleCopy} style={{ fontSize: 11, padding: '6px 12px' }}>
                  {copied ? <><I.Check size={12} /> Copied</> : <><I.Copy size={12} /> Copy</>}
                </GlowBtn>
                <GlowBtn variant="ghost" onClick={() => downloadText(`${result.docType}.txt`, result.content)} style={{ fontSize: 11, padding: '6px 12px' }}>
                  <I.Download size={12} /> Download
                </GlowBtn>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: `1px solid ${BDR}` }}>
              <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', color: TM }}>
                {result.content}
              </pre>
            </div>

            <div style={{ fontSize: 10, color: TD, flexShrink: 0 }}>{result.tokensUsed?.toLocaleString()} tokens used</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 4 — SUGGESTIONS
═══════════════════════════════════════════════════════════════════ */
const TYPE_COLORS = {
  time_entry: '#a78bfa', deadline: '#fbbf24', invoice_error: '#f87171',
  task: '#60a5fa', document_draft: '#4ade80', conflict_analysis: '#c4b5fd',
};

function SuggestionsTab() {
  const [suggestions, setSugg]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [busy, setBusy]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await aiApi.suggestions.list({ status: filter }); setSugg(r.data.data || []); }
    catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function accept(id) {
    setBusy(id + '_a');
    try { await aiApi.suggestions.accept(id); load(); }
    catch {} finally { setBusy(null); }
  }

  async function dismiss(id) {
    setBusy(id + '_d');
    try { await aiApi.suggestions.dismiss(id); load(); }
    catch {} finally { setBusy(null); }
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['pending', 'accepted', 'dismissed'].map(s => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(s)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 200ms', background: filter === s ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent', color: filter === s ? '#fff' : TM, textTransform: 'capitalize', boxShadow: filter === s ? '0 4px 12px rgba(124,58,237,0.4)' : 'none' }}
          >{s}</motion.button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14, color: TM }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: PRP, borderRadius: '50%' }} />
          Loading suggestions…
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: TD }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: 52, marginBottom: 12 }}>✨</motion.div>
          <div style={{ fontSize: 14, color: TM }}>No {filter} suggestions</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {suggestions.map((s, idx) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ scale: 1.004 }}
              style={{ ...glassCard, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                  <Badge text={s.type?.replace(/_/g, ' ') || 'suggestion'} color={TYPE_COLORS[s.type] || PRP} />
                  {s.matterId && <span style={{ fontSize: 11, color: TD }}>{s.matterId.title}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T, marginBottom: 4 }}>{s.title}</div>
                {s.description && <div style={{ fontSize: 12, color: TM, lineHeight: 1.6 }}>{s.description}</div>}
                <div style={{ fontSize: 10, color: TD, marginTop: 6 }}>{fmtDate(s.createdAt)}</div>
              </div>

              {filter === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <GlowBtn variant="success" onClick={() => accept(s._id)} loading={busy === s._id + '_a'} style={{ fontSize: 12, padding: '7px 14px' }}>
                    <I.Check size={13} /> Accept
                  </GlowBtn>
                  <GlowBtn variant="danger" onClick={() => dismiss(s._id)} loading={busy === s._id + '_d'} style={{ fontSize: 12, padding: '7px 14px' }}>
                    <I.X size={13} /> Dismiss
                  </GlowBtn>
                </div>
              )}
              {filter !== 'pending' && (
                <Badge text={s.status} color={s.status === 'accepted' ? '#4ade80' : '#f87171'} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 5 — AUDIT LOG
═══════════════════════════════════════════════════════════════════ */
const ACTION_COLORS = {
  analyze_document: '#a78bfa', extract_deadlines: '#fbbf24',
  suggest_invoice: '#f87171', draft_document: '#4ade80',
  matter_chat: '#60a5fa', narrate_report: '#c4b5fd',
};

function AuditTab() {
  const [logs, setLogs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await aiApi.auditLog({ page, limit: 25 });
      setLogs(r.data.data.logs || []);
      setTotal(r.data.data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: TM }}>
          <span style={{ fontWeight: 700, color: PRC }}>{total.toLocaleString()}</span> total AI actions logged
        </div>
        <GlowBtn variant="ghost" onClick={load} style={{ fontSize: 12, padding: '7px 14px' }}>
          <I.Activity size={13} /> Refresh
        </GlowBtn>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14, color: TM }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: PRP, borderRadius: '50%' }} />
          Loading audit log…
        </div>
      )}

      {!loading && (
        <div style={{ ...glassCard, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 140px 100px 80px 70px 90px', gap: 0, borderBottom: `1px solid ${BDR}`, padding: '10px 16px' }}>
            {['Date / Time', 'Action', 'User', 'Model', 'Tokens', 'Duration', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 800, color: TD, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {logs.map((l, i) => (
              <motion.div
                key={l._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ display: 'grid', gridTemplateColumns: '160px 1fr 140px 100px 80px 70px 90px', gap: 0, padding: '12px 16px', borderBottom: i < logs.length - 1 ? `1px solid rgba(124,58,237,0.08)` : 'none', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
              >
                <div>
                  <div style={{ fontSize: 12, color: T }}>{fmtDate(l.createdAt)}</div>
                  <div style={{ fontSize: 10, color: TD }}>{fmtTime(l.createdAt)}</div>
                </div>
                <div>
                  <Badge text={l.action?.replace(/_/g, ' ') || '—'} color={ACTION_COLORS[l.action] || '#94a3b8'} />
                </div>
                <div style={{ fontSize: 12, color: TM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.userId?.name || l.userId?.email || '—'}
                </div>
                <div style={{ fontSize: 11, color: TD, fontFamily: 'monospace' }}>
                  {l.model?.replace('claude-', '').replace('-20251001', '').slice(0, 12) || '—'}
                </div>
                <div style={{ fontSize: 12, color: TM }}>{l.tokensUsed?.toLocaleString() || 0}</div>
                <div style={{ fontSize: 12, color: TM }}>{l.durationMs ? `${(l.durationMs / 1000).toFixed(1)}s` : '—'}</div>
                <div>
                  <Badge text={l.status || '—'} color={l.status === 'success' ? '#4ade80' : '#f87171'} />
                </div>
              </motion.div>
            ))}

            {logs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: TD, fontSize: 13 }}>No AI actions logged yet</div>
            )}
          </AnimatePresence>
        </div>
      )}

      {total > 25 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 18 }}>
          <GlowBtn variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 12, padding: '7px 14px' }}>
            ← Prev
          </GlowBtn>
          <span style={{ fontSize: 13, color: TM, minWidth: 100, textAlign: 'center' }}>
            Page <strong style={{ color: T }}>{page}</strong> of {Math.ceil(total / 25)}
          </span>
          <GlowBtn variant="ghost" disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(p => p + 1)} style={{ fontSize: 12, padding: '7px 14px' }}>
            Next →
          </GlowBtn>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'analyze',     label: 'Analyze',       Ic: I.DocAI        },
  { id: 'chat',        label: 'Matter Chat',    Ic: I.MessageSquare },
  { id: 'draft',       label: 'Draft',          Ic: I.PenTool      },
  { id: 'suggestions', label: 'Suggestions',    Ic: I.Sparkle      },
  { id: 'audit',       label: 'Audit Log',      Ic: I.Activity     },
];

export default function ManageAI() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', padding: '28px 28px 48px', color: T }}>
      <NeuralGrid />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1300, margin: '0 auto' }}>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}
        >
          <AIOrb size={58} />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #f0eeff 0%, #c4b5fd 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                AI Assistant
              </h1>
              {/* Live indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.04em' }}>LIVE</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: TM }}>Powered by Claude · Analyze documents, chat about matters, draft legal text &amp; more</div>
          </div>

          {/* Model badges */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: `1px solid ${BDR}`, fontSize: 11, fontWeight: 700, color: PRC }}>
              ⚡ Claude Haiku 4.5
            </div>
            <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)', fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
              🚀 Claude Sonnet 4.6
            </div>
          </div>
        </motion.div>

        {/* ── Tab bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: `1px solid ${BDR}`, borderRadius: 14, padding: 5, width: 'fit-content' }}
        >
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 200ms',
                background: activeTab === tab.id ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : TM,
                boxShadow: activeTab === tab.id ? '0 4px 20px rgba(124,58,237,0.5)' : 'none',
                position: 'relative',
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-glow"
                  style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.Ic size={14} />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === 'analyze'     && <AnalyzeTab />}
            {activeTab === 'chat'        && <ChatTab />}
            {activeTab === 'draft'       && <DraftTab />}
            {activeTab === 'suggestions' && <SuggestionsTab />}
            {activeTab === 'audit'       && <AuditTab />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
