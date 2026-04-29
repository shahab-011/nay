import React, { useEffect } from 'react';

/**
 * Slide-up consent drawer shown before every AI call.
 * Props:
 *   isOpen        boolean
 *   onConfirm     () => void
 *   onCancel      () => void
 *   title         string   — e.g. "Analyze Document"
 *   confirmLabel  string   — button label, e.g. "Confirm & Analyze"
 *   preview       string   — text excerpt to show (or null while loading)
 *   previewLoading boolean
 *   wordCount     number
 *   charCount     number
 *   details       string[] — bullet list of what's included
 */
export default function ConsentPanel({
  isOpen,
  onConfirm,
  onCancel,
  title        = 'Send to AI',
  confirmLabel = 'Confirm & Send',
  preview      = null,
  previewLoading = false,
  wordCount    = 0,
  charCount    = 0,
  details      = [],
}) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Drawer */}
      <div className="w-full max-w-2xl mx-4 mb-4 bg-surface-container-low rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_lock
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-white text-base leading-tight">{title}</h3>
              <p className="text-[11px] text-on-surface-variant">Review what will be sent to Gemini AI</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Text preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
                Text Preview (first 300 characters)
              </p>
              {(wordCount > 0 || charCount > 0) && (
                <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-label">
                  {wordCount > 0 && <span>{wordCount.toLocaleString()} words</span>}
                  {charCount > 0 && <span>{charCount.toLocaleString()} chars</span>}
                </div>
              )}
            </div>

            <div className="bg-surface-container rounded-xl p-4 border border-white/5 min-h-[80px]">
              {previewLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-surface-container-high rounded w-full" />
                  <div className="h-3 bg-surface-container-high rounded w-5/6" />
                  <div className="h-3 bg-surface-container-high rounded w-4/6" />
                </div>
              ) : preview ? (
                <p className="text-sm text-on-surface font-mono leading-relaxed">
                  {preview}
                  {charCount > 300 && (
                    <span className="text-on-surface-variant">… ({(charCount - 300).toLocaleString()} more chars)</span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant italic">No preview available.</p>
              )}
            </div>
          </div>

          {/* What's included */}
          {details.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
                What NyayaAI sends to Gemini
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {details.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">check_circle</span>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's NOT sent */}
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <span
              className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            <p className="text-xs text-primary leading-relaxed">
              <span className="font-bold">Not sent:</span> Your name, email, account details, and file metadata are
              never included in AI requests. Only the extracted text is transmitted.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={previewLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
