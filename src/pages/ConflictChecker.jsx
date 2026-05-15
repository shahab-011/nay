import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { conflictsApi } from '../api/conflicts.api';

/* ─── Result components ───────────────────────────────────────── */
function ConflictFlag({ conflict }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: '#FFF1F2', border: '2px solid #FECDD3', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.Alert size={16} style={{ color: '#DC2626' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626' }}>POTENTIAL CONFLICT DETECTED</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{conflict.description || '"' + conflict.name + '" appears in conflicting roles'}</div>
        </div>
      </div>
      {(conflict.clientMatters || conflict.asClientIn) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>As Client In</div>
            {(conflict.clientMatters || conflict.asClientIn || []).map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>• {typeof m === 'string' ? m : m.title || m.matterNumber}</div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>As Opposing In</div>
            {(conflict.opposingMatters || conflict.asOpposingIn || []).map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>• {typeof m === 'string' ? m : m.title || m.matterNumber}</div>
            ))}
          </div>
        </div>
      )}
      {conflict.matters && !conflict.clientMatters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {conflict.matters.map((m, i) => (
            <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#fff', border: '1px solid #FECDD3', color: '#374151' }}>
              {typeof m === 'string' ? m : m.title || m.matterNumber}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ResultSection({ title, icon: Ic, color, items, renderItem }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Ic size={15} style={{ color }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title} ({items.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(renderItem)}
      </div>
    </div>
  );
}

const RISK_COLOR = { none: '#059669', low: '#D97706', medium: '#EA580C', high: '#DC2626' };
const RISK_BG = { none: '#ECFDF5', low: '#FFF7ED', medium: '#FFF4ED', high: '#FEE2E2' };
const RISK_BORDER = { none: '#6EE7B7', low: '#FED7AA', medium: '#FDBA74', high: '#FCA5A5' };

/* ─── Main ────────────────────────────────────────────────────── */
export default function ConflictChecker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  const search = useCallback(async (q) => {
    const searchQuery = q || query.trim();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await conflictsApi.check({ name: searchQuery, email: searchQuery });
      setResult({ ...res.data.data, query: searchQuery });
      setRecent(prev => [searchQuery, ...prev.filter(x => x !== searchQuery)].slice(0, 6));
    } catch (e) {
      console.error('Conflict check failed:', e);
    } finally {
      setLoading(false);
    }
  }, [query]);

  function exportReport() {
    if (!result) return;
    const conflicts = buildConflicts(result);
    let txt = `CONFLICT CHECK REPORT\nQuery: "${result.query}"\nDate: ${new Date().toLocaleString()}\nRisk Level: ${result.riskLevel || 'unknown'}\n\n`;
    if (conflicts.length) {
      txt += `⚠ CONFLICTS DETECTED (${conflicts.length})\n`;
      conflicts.forEach(c => {
        txt += `\n• ${c.description || c.name || 'Conflict'}\n`;
      });
    } else {
      txt += '✓ NO CONFLICTS DETECTED\n';
    }
    txt += `\nContacts found: ${(result.contacts || []).length}\nMatters found: ${(result.matters || []).length}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `conflict_check_${result.query.replace(/\s+/g, '_')}.txt`;
    a.click();
  }

  function buildConflicts(res) {
    const list = [];
    if (res.directConflict && typeof res.directConflict === 'object') {
      list.push({ ...res.directConflict, description: res.directConflict.description || 'Direct conflict: same entity appears as client and opposing party' });
    }
    if (Array.isArray(res.matterConflicts)) {
      list.push(...res.matterConflicts);
    }
    return list;
  }

  const conflicts = result ? buildConflicts(result) : [];
  const hasConflict = result && (result.riskLevel === 'high' || result.riskLevel === 'medium' || conflicts.length > 0);
  const hasResult = result && ((result.contacts || []).length > 0 || (result.matters || []).length > 0);
  const riskLevel = result?.riskLevel || 'none';

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Shield size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Conflict of Interest Checker</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Search across all matters and contacts for potential conflicts before taking new clients</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #E5E7EB', padding: '24px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <I.Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Enter name, company, or email to check for conflicts…"
                style={{ width: '100%', padding: '13px 14px 13px 44px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={() => search()} disabled={loading} style={{ padding: '13px 28px', borderRadius: 12, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Checking…' : 'Run Check'}
            </button>
          </div>

          {recent.length > 0 && !result && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recent.map(r => (
                  <button key={r} onClick={() => { setQuery(r); search(r); }} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#4B5563', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    <I.Search size={10} style={{ marginRight: 4 }} />{r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: RISK_BG[riskLevel] || '#ECFDF5', border: `1.5px solid ${RISK_BORDER[riskLevel] || '#6EE7B7'}` }}>
                    {hasConflict ? <I.Alert size={16} style={{ color: RISK_COLOR[riskLevel] }} /> : <I.Check size={16} style={{ color: '#059669' }} />}
                    <span style={{ fontSize: 13, fontWeight: 800, color: RISK_COLOR[riskLevel] || '#059669' }}>
                      {hasConflict
                        ? `${conflicts.length} Conflict${conflicts.length !== 1 ? 's' : ''} Found (${riskLevel} risk)`
                        : 'No Conflicts Detected'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>for "{result.query}"</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setResult(null); setQuery(''); }} style={{ padding: '7px 14px', borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>Clear</button>
                  <button onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    <I.Download size={13} /> Export Report
                  </button>
                </div>
              </div>

              {/* Conflict flags */}
              {conflicts.map((c, i) => <ConflictFlag key={i} conflict={c} />)}

              {/* Contact matches */}
              <ResultSection
                title="Contact Matches" icon={I.Users} color="#3B82F6"
                items={result.contacts}
                renderItem={c => (
                  <div key={c._id || c.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.User size={18} style={{ color: '#3B82F6' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.email || c.phone || ''}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280' }}>Contact</span>
                  </div>
                )}
              />

              {/* Matter matches */}
              <ResultSection
                title="Matter Matches" icon={I.Briefcase} color="#7C3AED"
                items={result.matters}
                renderItem={m => (
                  <div key={m._id || m.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.Briefcase size={18} style={{ color: '#7C3AED' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>#{m.matterNumber} · {m.practiceArea || ''}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.status === 'Active' ? '#ECFDF5' : '#F3F4F6', color: m.status === 'Active' ? '#059669' : '#6B7280' }}>{m.status}</span>
                  </div>
                )}
              />

              {!hasResult && !hasConflict && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                  <I.Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No contacts or matters found for "{result.query}"</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info box */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <I.Info size={16} style={{ color: '#7C3AED' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>How Conflict Checking Works</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[
                ['Search by name or email', 'Enter any person or company name to scan all active matters, contacts, and leads.'],
                ['Risk analysis', 'The checker identifies if the same party appears as client in one matter and opposing in another, and computes a risk level.'],
                ['Instant report', 'Export a timestamped conflict check report as a text file for your records.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
