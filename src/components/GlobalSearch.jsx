import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../api/search.api';

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

const ICON_MAP = { matter:'⚖️', contact:'👤', invoice:'🧾', task:'✓', event:'📅', communication:'💬' };

function Highlight({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function GlobalSearch({ placeholder = 'Search matters, contacts, invoices…' }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSel]    = useState(-1);
  const debouncedQ = useDebounce(query, 280);
  const wrapRef    = useRef(null);
  const inputRef   = useRef(null);
  const navigate   = useNavigate();

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); setSel(-1); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // Fetch on debounced query
  useEffect(() => {
    if (debouncedQ.trim().length < 2) { setResults([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    searchApi.global(debouncedQ, { limit: 6 })
      .then(r => {
        if (!cancelled) {
          setResults(r.data.data?.flat || []);
          setOpen(true);
          setSel(-1);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ]);

  const navigate_to = useCallback((link) => {
    setOpen(false);
    setQuery('');
    setSel(-1);
    if (link) navigate(link);
  }, [navigate]);

  function handleKey(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && selected >= 0) { navigate_to(results[selected]?.link); }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.2}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ position:'absolute', left:12, flexShrink:0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 40px 9px 36px',
            borderRadius: 10, border: '1.5px solid #E5E7EB',
            fontSize: 13, outline: 'none', background: '#F9FAFB',
            color: '#1F2937', transition: 'border-color 0.15s',
          }}
          onFocusCap={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; }}
          onBlurCap={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
        />
        <span style={{ position:'absolute', right:10, fontSize:10, color:'#C4B5FD', fontWeight:700, pointerEvents:'none' }}>
          ⌘K
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
          border: '1.5px solid #E5E7EB', zIndex: 2000, overflow: 'hidden',
        }}>
          {loading && (
            <div style={{ padding:'14px 16px', fontSize:12, color:'#9CA3AF', textAlign:'center' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div style={{ padding:'24px 16px', fontSize:13, color:'#9CA3AF', textAlign:'center' }}>
              No results for <strong>"{query}"</strong>
            </div>
          )}
          {!loading && results.map((r, i) => (
            <div
              key={r._id ? String(r._id) : i}
              onClick={() => navigate_to(r.link)}
              style={{
                display:'flex', gap:12, alignItems:'flex-start',
                padding:'11px 16px', cursor:'pointer',
                background: i === selected ? '#F5F3FF' : 'transparent',
                borderBottom: '1px solid #F3F4F6',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setSel(i)}
            >
              <div style={{ width:30, height:30, borderRadius:8, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                {ICON_MAP[r.type] || '🔍'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  <Highlight html={r.title || ''} />
                </div>
                {r.sub && (
                  <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.sub}
                  </div>
                )}
                {r.excerpt && (
                  <div style={{ fontSize:11, color:'#6B7280', marginTop:2, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <Highlight html={r.excerpt} />
                  </div>
                )}
              </div>
              <span style={{ fontSize:10, color:'#C4B5FD', fontWeight:700, flexShrink:0, marginTop:2, textTransform:'uppercase' }}>{r.type}</span>
            </div>
          ))}
          {results.length > 0 && (
            <div style={{ padding:'8px 16px', borderTop:'1px solid #F3F4F6', display:'flex', gap:12, fontSize:11, color:'#9CA3AF' }}>
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
