import React from 'react';

/**
 * Computes the lifecycle/contract status for a document.
 * This is the single source of truth — import from here in every page.
 *
 * Priority order:
 *   1. status = uploaded | processing  → Pending Review (purple)
 *   2. status = error                  → Error (red)
 *   3. expiryDate missing              → Active (teal)
 *   4. daysLeft < 0                    → Expired (red)
 *   5. daysLeft 0–30                   → Expiring Soon (amber)
 *   6. daysLeft > 30                   → Active (teal)
 */
export function getContractStatus(doc) {
  if (doc.status === 'uploaded' || doc.status === 'processing') return 'pending';
  if (doc.status === 'error') return 'error';
  if (!doc.expiryDate) return 'active';
  const daysLeft = Math.floor((new Date(doc.expiryDate) - Date.now()) / 86400000);
  if (daysLeft < 0)   return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'active';
}

/** Number of days until expiryDate (negative = already expired). Returns null if no date. */
export function daysUntilExpiry(doc) {
  if (!doc.expiryDate) return null;
  return Math.floor((new Date(doc.expiryDate) - Date.now()) / 86400000);
}

export const CONTRACT_STATUS = {
  active: {
    key:    'active',
    label:  'Active',
    bg:     'bg-primary/10',
    text:   'text-primary',
    border: 'border-primary/20',
    dot:    'bg-primary',
  },
  expiring: {
    key:    'expiring',
    label:  'Expiring Soon',
    bg:     'bg-amber-500/10',
    text:   'text-amber-400',
    border: 'border-amber-400/20',
    dot:    'bg-amber-400',
  },
  expired: {
    key:    'expired',
    label:  'Expired',
    bg:     'bg-error/10',
    text:   'text-error',
    border: 'border-error/20',
    dot:    'bg-error',
  },
  pending: {
    key:    'pending',
    label:  'Pending Review',
    bg:     'bg-purple-500/10',
    text:   'text-purple-400',
    border: 'border-purple-400/20',
    dot:    'bg-purple-400',
    pulse:  true,
  },
  error: {
    key:    'error',
    label:  'Error',
    bg:     'bg-error/10',
    text:   'text-error',
    border: 'border-error/20',
    dot:    'bg-error',
  },
};

/** Renders an inline contract status badge (span). */
export function ContractStatusBadge({ doc, size = 'sm' }) {
  const key = getContractStatus(doc);
  const s   = CONTRACT_STATUS[key] || CONTRACT_STATUS.active;
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${pad} ${s.bg} ${s.text} border ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}
