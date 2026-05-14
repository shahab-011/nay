import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { I } from '../components/Icons';

const QUESTIONS = [
  {
    key: 'situation',
    q: 'What best describes your situation?',
    options: [
      { ic: '📄', t: 'I received a document to sign', v: 'doc' },
      { ic: '⚖️', t: 'I have a legal dispute or problem', v: 'dispute' },
      { ic: '🏠', t: 'It is related to property or rent', v: 'property' },
      { ic: '👔', t: 'It is a work or employment issue', v: 'work' },
      { ic: '👨‍👩‍👧', t: 'It involves family or personal matters', v: 'family' },
      { ic: '💼', t: 'It is a business or contract issue', v: 'business' },
      { ic: '🆘', t: 'Something else', v: 'other' },
    ],
  },
  {
    key: 'urgency',
    q: 'How urgent is this?',
    options: [
      { ic: '🔴', t: 'I need to sign or respond very soon', v: 'urgent' },
      { ic: '🟡', t: 'I have some time (days or weeks)', v: 'medium' },
      { ic: '🟢', t: "I'm just trying to understand it", v: 'low' },
    ],
  },
  {
    key: 'document',
    q: 'Do you have a document to upload?',
    options: [
      { ic: '📎', t: 'Yes, I have a PDF or image', v: 'yes' },
      { ic: '💬', t: "No, I'll describe the situation", v: 'no' },
    ],
  },
];

function OptionCard({ ic, t, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: hover ? 'var(--elevated)' : 'var(--surface)',
        border: `1px solid ${hover ? 'var(--purple)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px 20px', textAlign: 'left',
        transition: 'all 150ms ease',
        boxShadow: hover ? '0 0 20px var(--purple-glow)' : 'none',
        cursor: 'pointer', width: '100%',
      }}
    >
      <span style={{ fontSize: 24 }}>{ic}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{t}</span>
      <span style={{ color: hover ? 'var(--purple)' : 'var(--text-muted)' }}>
        <I.ArrowRight size={16} />
      </span>
    </button>
  );
}

function recommend(answers) {
  if (answers.document === 'yes' && answers.urgency !== 'urgent') return 'ai';
  if (answers.urgency === 'urgent' || answers.situation === 'dispute' || answers.situation === 'family') return 'lawyer';
  return 'ai';
}

export default function Intake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const total = QUESTIONS.length + 1;
  const done = step >= QUESTIONS.length;

  const handleAnswer = (key, v) => {
    const next = { ...answers, [key]: v };
    setAnswers(next);
    setTimeout(() => setStep(s => s + 1), 220);
  };

  const rec = recommend(answers);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <div className="navbar" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="wordmark" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <I.Logo size={26} /><span>Nyaya</span><span className="wordmark-dot">.</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
          <I.ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === step ? 32 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--purple)' : 'var(--border)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>

        {!done && (
          <div key={step} className="fade-up">
            <div className="t-muted" style={{ fontSize: 12, marginBottom: 10, textAlign: 'center', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question {step + 1} of {QUESTIONS.length}
            </div>
            <h2 className="h-display" style={{ fontSize: 28, textAlign: 'center', marginBottom: 32, lineHeight: 1.2 }}>
              {QUESTIONS[step].q}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUESTIONS[step].options.map(o => (
                <OptionCard key={o.v} ic={o.ic} t={o.t} onClick={() => handleAnswer(QUESTIONS[step].key, o.v)} />
              ))}
            </div>
            {step > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>
                  <I.ArrowLeft size={14} /> Previous
                </button>
              </div>
            )}
          </div>
        )}

        {done && (
          <div className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: 28,
                background: 'var(--purple-soft)', color: 'var(--purple)', marginBottom: 16,
              }}>
                <I.Check size={28} />
              </div>
              <h2 className="h-display" style={{ fontSize: 26, marginBottom: 8 }}>Here's what we recommend</h2>
              <p className="t-secondary">Based on your answers, this is the best place to start.</p>
            </div>

            {rec === 'ai' ? (
              <div className="card" style={{ padding: 28, borderColor: 'rgba(124,58,237,0.35)', boxShadow: '0 0 32px var(--purple-glow)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span className="pill pill-purple"><I.Check size={12} /> Our AI can help</span>
                </div>
                <h3 className="h-title" style={{ fontSize: 22, marginBottom: 10 }}>NyayaAI can analyze your document instantly.</h3>
                <p className="t-secondary" style={{ marginBottom: 20, fontSize: 14 }}>
                  Free, private, takes about 30 seconds. See every clause, every risk, and what to negotiate — in plain language.
                </p>
                <button className="btn btn-purple btn-lg" onClick={() => navigate('/register')} style={{ width: '100%' }}>
                  Analyze My Document <I.ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: 28, borderColor: 'rgba(124,58,237,0.35)', boxShadow: '0 0 32px var(--purple-glow)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span className="pill pill-purple"><I.Scale size={12} /> This needs a lawyer</span>
                </div>
                <h3 className="h-title" style={{ fontSize: 22, marginBottom: 10 }}>We'll match you with the right specialist.</h3>
                <p className="t-secondary" style={{ marginBottom: 20, fontSize: 14 }}>
                  AI will surface verified lawyers who specialize in exactly this type of case — matched to your situation.
                </p>
                <button className="btn btn-purple btn-lg" onClick={() => navigate('/marketplace')} style={{ width: '100%' }}>
                  Find My Lawyer <I.ArrowRight size={16} />
                </button>
              </div>
            )}

            <div className="t-muted" style={{ textAlign: 'center', fontSize: 13, marginBottom: 12 }}>Or try the other path:</div>
            {rec === 'ai' ? (
              <button className="btn btn-secondary" onClick={() => navigate('/marketplace')} style={{ width: '100%' }}>
                Browse lawyers instead
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => navigate('/register')} style={{ width: '100%' }}>
                Analyze a document first
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setStep(0); setAnswers({}); }}>
                <I.ArrowLeft size={14} /> Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
