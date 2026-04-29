import React, { useState, useEffect } from 'react';

const RADIUS = 80;
const CIRC   = 2 * Math.PI * RADIUS; // 502.655

/* colour helpers — 80+ green, 60-79 amber, <60 red */
const ringStroke    = (s) => s >= 80 ? '#44e5c2' : s >= 60 ? '#f59e0b' : '#f87171';
const scoreText     = (s) => s >= 80 ? 'text-primary' : s >= 60 ? 'text-yellow-400' : 'text-error';
const barFillClass  = (s) => s >= 80 ? 'bg-primary'   : s >= 60 ? 'bg-yellow-400'   : 'bg-error';

const MANDATORY_CLAUSE_COUNT = 6;

export default function HealthScoreRing({
  score          = 0,
  compliance     = {},
  risks          = [],
  confidenceScore = 0,
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const [barsActive,   setBarsActive]   = useState(false);

  /* Animate ring: two RAF frames so the browser paints the 0-state first */
  useEffect(() => {
    let outer = requestAnimationFrame(() => {
      let inner = requestAnimationFrame(() => setDisplayScore(score));
      return () => cancelAnimationFrame(inner);
    });
    return () => cancelAnimationFrame(outer);
  }, [score]);

  /* Trigger bars slightly after ring starts (150 ms) */
  useEffect(() => {
    const t = setTimeout(() => setBarsActive(true), 150);
    return () => clearTimeout(t);
  }, []);

  const dashOffset = CIRC - (CIRC * displayScore) / 100;

  /* Derived bar values */
  const missing       = compliance.missingClauses?.length ?? 0;
  const clausesPresent = Math.round(
    ((MANDATORY_CLAUSE_COUNT - Math.min(missing, MANDATORY_CLAUSE_COUNT)) / MANDATORY_CLAUSE_COUNT) * 100
  );
  const complianceScore = Math.round(compliance.score ?? 0);
  const clarityScore    = Math.round(confidenceScore);
  const highRisks       = risks.filter((r) => r.severity === 'high').length;
  const medRisks        = risks.filter((r) => r.severity === 'medium').length;
  const riskSafety      = risks.length === 0
    ? 100
    : Math.max(0, 100 - highRisks * 20 - medRisks * 8);

  const bars = [
    { label: 'Clauses Present',  value: clausesPresent  },
    { label: 'Compliance Score', value: complianceScore },
    { label: 'Clarity',          value: clarityScore    },
    { label: 'Risk Level',       value: riskSafety      },
  ];

  return (
    <>
      {/* ── SVG donut ──────────────────────────────────── */}
      <div className="relative flex justify-center mb-6">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
          {/* Track */}
          <circle
            cx="96" cy="96" r={RADIUS}
            fill="none" strokeWidth="12"
            stroke="currentColor"
            className="text-surface-container-highest"
          />
          {/* Progress arc */}
          <circle
            cx="96" cy="96" r={RADIUS}
            fill="none" strokeWidth="12"
            stroke={ringStroke(score)}
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-headline font-extrabold tabular-nums ${scoreText(score)}`}>
            {score}
          </span>
          <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mt-1">
            Health Score
          </span>
        </div>
      </div>

      {/* ── 4 animated progress bars ───────────────────── */}
      <div className="space-y-4">
        {bars.map(({ label, value }, i) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-label text-on-surface-variant uppercase tracking-wider">
                {label}
              </span>
              <span className={`text-[11px] font-bold font-headline tabular-nums ${scoreText(value)}`}>
                {value}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barFillClass(value)}`}
                style={{
                  width: barsActive ? `${value}%` : '0%',
                  transition: `width 600ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
