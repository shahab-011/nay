import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';

/* ─── Mock data for conflict checking ────────────────────────── */
const MOCK_CONTACTS = [
  { id: 1, name: 'Ahmed Al-Rashid', role: 'Client', matter: 'Al-Rashid v. Hassan — Family', phone: '+92 300 1234567', email: 'ahmed@email.com' },
  { id: 2, name: 'Hassan Al-Rashid', role: 'Opposing Party', matter: 'Al-Rashid v. Hassan — Family', phone: '+92 321 1111111', email: 'hassan@email.com' },
  { id: 3, name: 'Sarah Khan', role: 'Client', matter: 'Khan Corp Restructuring', phone: '+92 321 9876543', email: 'sarah@corp.pk' },
  { id: 4, name: 'Khan Industries Ltd', role: 'Opposing Party', matter: 'Malik v. Khan Industries', phone: '+92 51 8887766', email: 'legal@khan.pk' },
  { id: 5, name: 'Farhan Malik', role: 'Client', matter: 'Malik Property Dispute', phone: '+92 333 5551234', email: 'farhan@gmail.com' },
  { id: 6, name: 'Bilal Hussain', role: 'Client', matter: 'Hussain Fraud Defense', phone: '+92 311 2223344', email: 'bilal@email.com' },
  { id: 7, name: 'Hussain & Sons', role: 'Witness', matter: 'Commercial Lease Dispute', phone: '+92 42 5559999', email: 'info@hussain.pk' },
  { id: 8, name: 'Nadia Sheikh', role: 'Client', matter: 'Sheikh IP Registration', phone: '+92 322 6667788', email: 'nadia@tech.com' },
  { id: 9, name: 'Sheikh Law Associates', role: 'Opposing Counsel', matter: 'Property Rights Case', phone: '+92 51 1234567', email: 'info@sheikh-law.pk' },
];

const MOCK_MATTERS = [
  { id: 1, title: 'Al-Rashid v. Hassan — Family Proceedings', number: 'M-2024-001', client: 'Ahmed Al-Rashid', parties: ['Ahmed Al-Rashid', 'Hassan Al-Rashid'], status: 'Active' },
  { id: 2, title: 'Khan Corp Restructuring', number: 'M-2024-002', client: 'Sarah Khan', parties: ['Sarah Khan', 'Khan Industries Ltd'], status: 'Active' },
  { id: 3, title: 'Malik Property Dispute', number: 'M-2024-003', client: 'Farhan Malik', parties: ['Farhan Malik', 'City Council'], status: 'Active' },
  { id: 4, title: 'Malik v. Khan Industries', number: 'M-2024-004', client: 'Farhan Malik', parties: ['Farhan Malik', 'Khan Industries Ltd'], status: 'Active' },
  { id: 5, title: 'Hussain Fraud Defense', number: 'M-2024-005', client: 'Bilal Hussain', parties: ['Bilal Hussain', 'Federal Board of Revenue'], status: 'Active' },
  { id: 6, title: 'Sheikh IP Registration', number: 'M-2024-006', client: 'Nadia Sheikh', parties: ['Nadia Sheikh'], status: 'Closed' },
];

function normalize(s) { return s.toLowerCase().trim(); }

function runCheck(query) {
  if (!query || query.length < 2) return null;
  const q = normalize(query);

  const contactMatches = MOCK_CONTACTS.filter(c =>
    normalize(c.name).includes(q) || normalize(c.email).includes(q)
  );

  const matterMatches = MOCK_MATTERS.filter(m =>
    normalize(m.title).includes(q) ||
    normalize(m.client).includes(q) ||
    m.parties.some(p => normalize(p).includes(q))
  );

  // Detect conflicts: same name appears as client in one matter and opposing in another
  const conflicts = [];
  contactMatches.forEach(c => {
    const asClient = MOCK_CONTACTS.filter(x => normalize(x.name).includes(normalize(c.name)) && x.role === 'Client');
    const asOpposing = MOCK_CONTACTS.filter(x => normalize(x.name).includes(normalize(c.name)) && x.role === 'Opposing Party');
    if (asClient.length > 0 && asOpposing.length > 0) {
      conflicts.push({
        name: c.name,
        clientMatters: asClient.map(x => x.matter),
        opposingMatters: asOpposing.map(x => x.matter),
      });
    }
    // Check if query name appears as both client and opposing across matters
    const asClientInMatter = MOCK_MATTERS.filter(m => normalize(m.client).includes(q));
    const asOpposingInMatter = MOCK_MATTERS.filter(m => m.parties.slice(1).some(p => normalize(p).includes(q)));
    if (asClientInMatter.length > 0 && asOpposingInMatter.length > 0) {
      const key = query;
      if (!conflicts.find(x => x.name === key)) {
        conflicts.push({
          name: query,
          clientMatters: asClientInMatter.map(m => m.title),
          opposingMatters: asOpposingInMatter.map(m => m.title),
        });
      }
    }
  });

  return { contactMatches, matterMatches, conflicts, query };
}

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
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>"{conflict.name}" appears in conflicting roles</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>As Client In</div>
          {conflict.clientMatters.map((m, i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>• {m}</div>)}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>As Opposing In</div>
          {conflict.opposingMatters.map((m, i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>• {m}</div>)}
        </div>
      </div>
    </motion.div>
  );
}

function ResultSection({ title, icon: Ic, color, items, renderItem }) {
  if (!items.length) return null;
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

/* ─── Main ────────────────────────────────────────────────────── */
export default function ConflictChecker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState(['Ahmed Al-Rashid', 'Khan Industries', 'Hussain']);

  const search = useCallback(() => {
    if (!query.trim()) return;
    const r = runCheck(query.trim());
    setResult(r);
    setRecent(prev => [query.trim(), ...prev.filter(x => x !== query.trim())].slice(0, 6));
  }, [query]);

  function exportReport() {
    if (!result) return;
    let txt = `CONFLICT CHECK REPORT\nQuery: "${result.query}"\nDate: ${new Date().toLocaleString()}\n\n`;
    if (result.conflicts.length) {
      txt += `⚠ CONFLICTS DETECTED (${result.conflicts.length})\n`;
      result.conflicts.forEach(c => {
        txt += `\n• ${c.name}\n  Client in: ${c.clientMatters.join(', ')}\n  Opposing in: ${c.opposingMatters.join(', ')}\n`;
      });
    } else {
      txt += '✓ NO CONFLICTS DETECTED\n';
    }
    txt += `\nContact matches: ${result.contactMatches.length}\nMatter matches: ${result.matterMatches.length}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `conflict_check_${result.query.replace(/\s+/g, '_')}.txt`;
    a.click();
  }

  const hasConflict = result && result.conflicts.length > 0;
  const hasResult = result && (result.contactMatches.length > 0 || result.matterMatches.length > 0);

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
            <button onClick={search} style={{ padding: '13px 28px', borderRadius: 12, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Run Check
            </button>
          </div>

          {recent.length > 0 && !result && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recent.map(r => (
                  <button key={r} onClick={() => { setQuery(r); setResult(runCheck(r)); }} style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#4B5563', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: hasConflict ? '#FEE2E2' : '#ECFDF5', border: `1.5px solid ${hasConflict ? '#FCA5A5' : '#6EE7B7'}` }}>
                    {hasConflict ? <I.Alert size={16} style={{ color: '#DC2626' }} /> : <I.Check size={16} style={{ color: '#059669' }} />}
                    <span style={{ fontSize: 13, fontWeight: 800, color: hasConflict ? '#DC2626' : '#059669' }}>
                      {hasConflict ? `${result.conflicts.length} Conflict${result.conflicts.length > 1 ? 's' : ''} Found` : 'No Conflicts Detected'}
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
              {result.conflicts.map((c, i) => <ConflictFlag key={i} conflict={c} />)}

              {/* Contact matches */}
              <ResultSection
                title="Contact Matches" icon={I.Users} color="#3B82F6"
                items={result.contactMatches}
                renderItem={c => (
                  <div key={c.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.User size={18} style={{ color: '#3B82F6' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.matter}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.role === 'Client' ? '#ECFDF5' : c.role === 'Opposing Party' ? '#FEF2F2' : '#F3F4F6', color: c.role === 'Client' ? '#059669' : c.role === 'Opposing Party' ? '#DC2626' : '#6B7280' }}>{c.role}</span>
                  </div>
                )}
              />

              {/* Matter matches */}
              <ResultSection
                title="Matter Matches" icon={I.Briefcase} color="#7C3AED"
                items={result.matterMatches}
                renderItem={m => (
                  <div key={m.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.Briefcase size={18} style={{ color: '#7C3AED' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>#{m.number} · Client: {m.client}</div>
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
        {!result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <I.Info size={16} style={{ color: '#7C3AED' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>How Conflict Checking Works</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[['Search by name or email', 'Enter any person or company name to scan all active matters and contacts.'], ['Role analysis', 'The checker identifies if the same party appears as client in one matter and opposing in another.'], ['Instant report', 'Export a timestamped conflict check report as a text file for your records.']].map(([title, desc]) => (
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
