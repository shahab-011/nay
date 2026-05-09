import React, { useState } from 'react';
import { runSilenceDetector as apiRunSilence } from '../api/analysis.api';

/* ── Severity config ─────────────────────────────────────────────── */
const SEV = {
  critical: {
    border:  'border-l-red-500',
    bg:      'bg-red-500/5',
    badge:   'bg-red-500/15 text-red-400 border-red-500/30',
    dot:     'bg-red-500',
    label:   'CRITICAL',
    ring:    'border-red-500/20',
    outcome: 'bg-red-500/8 border-red-500/20 text-red-300',
    icon:    'text-red-400',
  },
  high: {
    border:  'border-l-orange-400',
    bg:      'bg-orange-400/5',
    badge:   'bg-orange-400/15 text-orange-300 border-orange-400/30',
    dot:     'bg-orange-400',
    label:   'HIGH',
    ring:    'border-orange-400/20',
    outcome: 'bg-orange-400/8 border-orange-400/20 text-orange-300',
    icon:    'text-orange-400',
  },
  medium: {
    border:  'border-l-amber-400',
    bg:      'bg-amber-400/5',
    badge:   'bg-amber-400/15 text-amber-300 border-amber-400/30',
    dot:     'bg-amber-400',
    label:   'MEDIUM',
    ring:    'border-amber-400/20',
    outcome: 'bg-amber-400/8 border-amber-400/20 text-amber-300',
    icon:    'text-amber-400',
  },
  low: {
    border:  'border-l-primary',
    bg:      'bg-primary/5',
    badge:   'bg-primary/15 text-primary border-primary/30',
    dot:     'bg-primary',
    label:   'LOW',
    ring:    'border-primary/20',
    outcome: 'bg-primary/8 border-primary/20 text-primary',
    icon:    'text-primary',
  },
};

function silenceScoreConfig(score) {
  if (score <= 25) return { color: 'text-primary',    bg: 'bg-primary/15 border-primary/30',      label: 'Low Risk — Most protections present'  };
  if (score <= 50) return { color: 'text-amber-400',  bg: 'bg-amber-400/15 border-amber-400/30',  label: 'Moderate — Some gaps found'           };
  if (score <= 75) return { color: 'text-orange-400', bg: 'bg-orange-400/15 border-orange-400/30',label: 'High — Important gaps missing'        };
  return              { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',      label: 'Critical — Major protections absent'  };
}

/* ── Single missing-protection card ─────────────────────────────── */
function ProtectionCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const s = SEV[item.severity] || SEV.medium;

  return (
    <div className={`rounded-2xl border border-l-4 ${s.border} ${s.ring} ${s.bg} overflow-hidden transition-all`}>
      {/* Header — always visible, click to toggle */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={`text-lg font-extrabold font-headline w-6 flex-shrink-0 ${s.icon}`}>{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border font-label ${s.badge}`}>
              {s.label}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high border border-white/8 text-on-surface-variant font-label uppercase tracking-widest">
              {item.category}
            </span>
          </div>
          <p className="font-headline font-bold text-sm text-on-surface mt-1 leading-snug">{item.title}</p>
        </div>
        <span className={`material-symbols-outlined text-base flex-shrink-0 text-on-surface-variant transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5">
          {/* What is missing */}
          <div className="pt-4">
            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">search_off</span>
              What is missing
            </p>
            <p className="text-sm text-on-surface leading-relaxed">{item.whatIsMissing}</p>
          </div>

          {/* Why it matters */}
          <div>
            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">priority_high</span>
              Why it matters
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{item.whyItMatters}</p>
          </div>

          {/* Default outcome — alarming box */}
          <div className={`rounded-xl border px-4 py-3 ${s.outcome}`}>
            <p className="text-[10px] font-label font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 opacity-80">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              Default outcome under Indian law
            </p>
            <p className="text-sm leading-relaxed font-semibold">{item.defaultOutcome}</p>
          </div>

          {/* Suggested clause — reassuring box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-[10px] font-label font-bold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              Suggested clause to request
            </p>
            <p className="text-sm text-primary/90 leading-relaxed italic">"{item.suggestedClause}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function SilenceDetector({ analysis, documentId, onSilenceComplete }) {
  const [running,   setRunning]  = useState(false);
  const [error,     setError]    = useState('');
  const [expanded,  setExpanded] = useState(new Set());

  // Derive silence data from analysis prop (may be null if not yet run)
  const hasRun           = analysis?.silenceScore != null;
  const score            = analysis?.silenceScore ?? 0;
  const summary          = analysis?.silenceSummary || '';
  const mostCritical     = analysis?.mostCriticalGap || '';
  const protections      = analysis?.missingProtections || [];

  const scoreCfg = silenceScoreConfig(score);

  // Severity order for grouping
  const ORDER = ['critical', 'high', 'medium', 'low'];
  const grouped = ORDER.map(sev => ({
    sev,
    items: protections.filter(p => p.severity === sev),
  })).filter(g => g.items.length > 0);

  const totalExpanded = expanded.size;

  /* ── Run silence detector ────────────────────────────────────── */
  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await apiRunSilence(documentId);
      const result = res.data.data.silenceResult;
      onSilenceComplete({
        missingProtections: result.missingProtections || [],
        silenceScore:       result.silenceScore ?? 0,
        silenceSummary:     result.summary || '',
        mostCriticalGap:    result.mostCriticalGap || '',
        silenceAnalyzedAt:  new Date().toISOString(),
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Silence detection failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  /* ── Copy to clipboard ───────────────────────────────────────── */
  const handleCopy = () => {
    let text = 'Missing Protections found by NyayaAI:\n\n';
    let n = 1;
    for (const { sev, items } of grouped) {
      text += `${sev.toUpperCase()}:\n`;
      for (const item of items) {
        text += `${n}. ${item.title} — ${item.whatIsMissing}\n   Risk: ${item.defaultOutcome}\n\n`;
        n++;
      }
    }
    navigator.clipboard.writeText(text.trim()).catch(() => {});
  };

  /* ── Not yet run ─────────────────────────────────────────────── */
  if (!hasRun) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-surface-container-low p-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>
            hearing_disabled
          </span>
        </div>
        <div>
          <h3 className="text-xl font-headline font-extrabold text-on-surface mb-2">Silence Detector</h3>
          <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
            Find what this contract <span className="text-red-400 font-bold">deliberately omits</span>. Missing clauses are often more dangerous than bad ones — they leave you with no legal protection at all.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl w-full max-w-md">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            {error}
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-red-500 hover:bg-red-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-headline font-bold text-base rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
        >
          {running ? (
            <>
              <span className="material-symbols-outlined text-lg animate-pulse">radar</span>
              Scanning for missing protections…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hearing_disabled</span>
              Run Silence Detector
            </>
          )}
        </button>

        {running && (
          <div className="flex items-center gap-3 text-sm text-on-surface-variant">
            <div className="flex gap-1">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-red-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span>Checking for missing protections under Indian law…</span>
          </div>
        )}
      </div>
    );
  }

  /* ── Results view ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>hearing_disabled</span>
          </div>
          <div>
            <h3 className="text-xl font-headline font-extrabold text-on-surface">Silence Detector</h3>
            <p className="text-xs text-on-surface-variant">{protections.length} missing protection{protections.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 text-xs font-bold font-label transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-sm ${running ? 'animate-spin' : ''}`}>
            {running ? 'progress_activity' : 'refresh'}
          </span>
          Re-run
        </button>
      </div>

      {/* Silence score pill */}
      <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`text-5xl font-headline font-extrabold ${scoreCfg.color}`}>{score}</span>
            <div>
              <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Silence Score</p>
              <p className="text-[10px] text-on-surface-variant">(0 = safe, 100 = dangerous)</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full border text-sm font-bold font-headline ${scoreCfg.bg} ${scoreCfg.color}`}>
            {scoreCfg.label}
          </span>
        </div>
        {summary && <p className="text-sm text-on-surface-variant leading-relaxed">{summary}</p>}
      </div>

      {/* Most critical gap — hero callout */}
      {mostCritical && (
        <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 px-6 py-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-2xl text-red-400 flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div>
            <p className="text-[10px] font-label font-bold text-red-400 uppercase tracking-widest mb-2">Most Critical Missing Protection</p>
            <p className="text-base font-headline font-bold text-on-surface leading-relaxed">{mostCritical}</p>
          </div>
        </div>
      )}

      {/* Grouped protection cards */}
      {grouped.length > 0 && (
        <div className="space-y-6">
          {/* Expand-all hint */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant font-label">
              Click any card to expand details
              {totalExpanded > 0 && ` · ${totalExpanded} of ${protections.length} expanded`}
            </p>
            {totalExpanded > 0 && (
              <button
                onClick={() => setExpanded(new Set())}
                className="text-xs text-on-surface-variant hover:text-white transition-colors font-label"
              >
                Collapse all
              </button>
            )}
          </div>

          {grouped.map(({ sev, items }) => (
            <div key={sev}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${SEV[sev].dot}`} />
                <p className={`text-[10px] font-label font-bold uppercase tracking-widest ${SEV[sev].icon}`}>
                  {SEV[sev].label} ({items.length})
                </p>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="space-y-3">
                {items.map((item, i) => {
                  const globalIdx = protections.indexOf(item);
                  return (
                    <ProtectionCard
                      key={globalIdx}
                      item={item}
                      index={globalIdx}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copy to clipboard */}
      {protections.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <p className="text-xs text-on-surface-variant">
            Share this report with your lawyer
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 text-xs font-bold font-label transition-colors"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Copy Missing Protections List
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl">
          <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
