import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { aiApi } from '../api/ai.api';
import { mattersApi } from '../api/matters.api';

/* ─── Helpers ───────────────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const severityColor = s => ({ high: '#EF4444', medium: '#F59E0B', low: '#10B981' }[s] || '#6B7280');

function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function downloadText(filename, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = filename;
  a.click();
}

/* ─── Shared UI primitives ──────────────────────────────────────────── */
function Tab({ label, icon: Ic, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
        borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        background: active ? '#7C3AED' : 'transparent',
        color: active ? '#fff' : '#6B7280',
        transition: 'all 0.15s',
      }}
    >
      {Ic && <Ic size={16} />} {label}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...style,
    }}>
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, loading, variant = 'primary', children, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', borderRadius: 10, border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
    opacity: disabled || loading ? 0.6 : 1, ...style,
  };
  const styles = {
    primary:  { background: '#7C3AED', color: '#fff' },
    secondary:{ background: '#F3F4F6', color: '#374151' },
    danger:   { background: '#FEE2E2', color: '#DC2626' },
    success:  { background: '#D1FAE5', color: '#065F46' },
  };
  return (
    <button onClick={disabled || loading ? undefined : onClick} style={{ ...base, ...styles[variant] }}>
      {loading ? <span style={{ fontSize: 12 }}>…</span> : children}
    </button>
  );
}

function Badge({ text, color = '#7C3AED' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: `${color}18`, color,
    }}>{text}</span>
  );
}

function Alert({ msg, type = 'error' }) {
  if (!msg) return null;
  const c = type === 'error' ? '#EF4444' : '#10B981';
  return (
    <div style={{ padding: '10px 16px', borderRadius: 10, background: `${c}12`, color: c, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
      {msg}
    </div>
  );
}

/* ─── Tab 1: Document Analysis ──────────────────────────────────────── */
function AnalyzeTab() {
  const [mode, setMode]       = useState('analyze'); // analyze | deadlines
  const [text, setText]       = useState('');
  const [matterId, setMatterId] = useState('');
  const [createEvents, setCreateEvents] = useState(false);
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
    if (!text.trim() || text.trim().length < 50) {
      setError('Please paste at least 50 characters of document text.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const fn   = mode === 'analyze' ? aiApi.analyzeDocument : aiApi.extractDeadlines;
      const body = mode === 'analyze' ? { text } : { text, matterId: matterId || undefined, createEvents };
      const r    = await fn(body);
      setResult(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Input panel */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['analyze','deadlines'].map(m => (
            <Btn key={m} variant={mode === m ? 'primary' : 'secondary'} onClick={() => { setMode(m); setResult(null); }}>
              {m === 'analyze' ? 'Analyze Document' : 'Extract Deadlines'}
            </Btn>
          ))}
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          Document Text <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(paste or type)</span>
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={12}
          placeholder="Paste legal document text here…"
          style={{
            width: '100%', borderRadius: 10, border: '1.5px solid #E5E7EB',
            padding: '12px 14px', fontSize: 13, resize: 'vertical',
            fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
          }}
        />

        {mode === 'deadlines' && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Link to Matter (optional)</label>
              <select value={matterId} onChange={e => setMatterId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }}>
                <option value="">— None —</option>
                {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </div>
            {matterId && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={createEvents} onChange={e => setCreateEvents(e.target.checked)} />
                Auto-create calendar events from extracted deadlines
              </label>
            )}
          </div>
        )}

        <Alert msg={error} />
        <Btn onClick={run} loading={loading} style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
          {mode === 'analyze' ? 'Analyze with AI' : 'Extract Deadlines'}
        </Btn>
      </Card>

      {/* Result panel */}
      <div>
        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 14 }}>Paste document text and click Analyze</div>
          </div>
        )}
        {loading && <div style={{ textAlign: 'center', padding: 60, color: '#7C3AED', fontSize: 14 }}>Analyzing…</div>}
        {result && mode === 'analyze' && <AnalyzeResult result={result} />}
        {result && mode === 'deadlines' && <DeadlinesResult result={result} />}
      </div>
    </div>
  );
}

function AnalyzeResult({ result }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Summary</h3>
          <Badge text={result.documentType || 'Document'} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{result.summary}</p>
      </Card>

      {result.parties?.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Parties</h3>
          {result.parties.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <Badge text={p.role} color="#3B82F6" />
              <span style={{ fontSize: 13, color: '#374151' }}>{p.name}</span>
            </div>
          ))}
        </Card>
      )}

      {result.keyDates?.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Key Dates</h3>
          {result.keyDates.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <Badge text={d.type} color="#F59E0B" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.date}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{d.description}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {result.risks?.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Risks</h3>
          {result.risks.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: severityColor(r.severity), flexShrink: 0, marginTop: 4 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: severityColor(r.severity) }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{r.description}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {result.obligations?.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Obligations</h3>
          {result.obligations.map((o, i) => (
            <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 6, paddingLeft: 12, borderLeft: '3px solid #7C3AED' }}>{o}</div>
          ))}
        </Card>
      )}

      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
        {result.tokensUsed} tokens · {result.model}
      </div>
    </div>
  );
}

function DeadlinesResult({ result }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {result.summary && (
        <Card style={{ padding: 18 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{result.summary}</p>
        </Card>
      )}
      <Card style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>
          {result.deadlines?.length || 0} Deadline(s) Found
        </h3>
        {(result.deadlines || []).map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, padding: 12, borderRadius: 8, background: '#F9FAFB' }}>
            <div style={{ flexShrink: 0 }}>
              <Badge text={d.type?.replace('_',' ')} color="#7C3AED" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{d.date}</div>
              <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{d.description}</div>
            </div>
            <Badge text={d.confidence} color={d.confidence === 'high' ? '#10B981' : d.confidence === 'medium' ? '#F59E0B' : '#6B7280'} />
          </div>
        ))}
        {result.createdEvents?.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 600 }}>
            ✓ {result.createdEvents.length} calendar event(s) created automatically
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── Tab 2: Matter Chat ─────────────────────────────────────────────── */
function ChatTab() {
  const [matters, setMatters]           = useState([]);
  const [matterId, setMatterId]         = useState('');
  const [conversationId, setConvId]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [pastConvs, setPastConvs]       = useState([]);
  const bottomRef                        = useRef(null);

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
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true); setError('');
    try {
      const r = await aiApi.chat({ matterId: matterId || undefined, message: msg, conversationId });
      setConvId(r.data.data.conversationId);
      setMessages(r.data.data.messages);
    } catch (e) {
      setError(e.response?.data?.message || 'Chat failed');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function loadConversation(conv) {
    setConvId(conv._id);
    setMatterId(conv.matterId?._id || '');
    setMessages(conv.messages || []);
  }

  function newChat() {
    setConvId(null);
    setMessages([]);
    setInput('');
    setError('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, height: 'calc(100vh - 280px)' }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <select value={matterId} onChange={e => { setMatterId(e.target.value); newChat(); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }}>
          <option value="">No Matter (General)</option>
          {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
        </select>

        <Btn variant="secondary" onClick={newChat} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          + New Chat
        </Btn>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
          Past Conversations
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {pastConvs.map(c => (
            <button key={c._id} onClick={() => loadConversation(c)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 12, background: conversationId === c._id ? '#EDE9FE' : 'transparent',
                color: conversationId === c._id ? '#7C3AED' : '#374151', marginBottom: 4,
              }}>
              <div style={{ fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.matterId?.title || 'General Chat'}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>{fmtDate(c.updatedAt)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 14 }}>Ask anything about your matter or firm</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Select a matter from the sidebar to give AI full context</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? '#7C3AED' : '#F3F4F6',
                color: m.role === 'user' ? '#fff' : '#1F2937',
                fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <button onClick={() => copyText(m.content)}
                  style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Copy
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#F3F4F6' }}>
                <span style={{ fontSize: 20, animation: 'pulse 1s infinite' }}>…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: '1.5px solid #E5E7EB' }}>
          <Alert msg={error} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about this matter… (Enter to send)"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                fontSize: 14, outline: 'none',
              }}
            />
            <Btn onClick={send} loading={loading} disabled={!input.trim()}>Send</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Tab 3: Draft Document ──────────────────────────────────────────── */
const DOC_TYPES = [
  'Legal Notice', 'Contract Agreement', 'Demand Letter', 'Affidavit',
  'Power of Attorney', 'Bail Application', 'Writ Petition', 'Memorandum of Understanding',
  'Non-Disclosure Agreement', 'Lease Agreement', 'Employment Contract',
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
    if (!type || !facts.trim()) {
      setError('Document type and facts are required');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiApi.draftDocument({ docType: type, facts, matterId: matterId || undefined });
      setResult(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Drafting failed');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    copyText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '600px', gap: 20, alignItems: 'start' }}>
      <Card style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>Draft Legal Document</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Document Type</label>
          <select value={docType} onChange={e => setDocType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }}>
            <option value="">— Select type —</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Custom…</option>
          </select>
          {docType === '__custom__' && (
            <input value={customType} onChange={e => setCustom(e.target.value)}
              placeholder="e.g. Settlement Agreement"
              style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Link to Matter (optional)</label>
          <select value={matterId} onChange={e => setMatterId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13 }}>
            <option value="">— None —</option>
            {matters.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Key Facts & Instructions
            <span style={{ fontWeight: 400, marginLeft: 6 }}>— be specific: names, dates, amounts, terms</span>
          </label>
          <textarea value={facts} onChange={e => setFacts(e.target.value)} rows={10}
            placeholder="e.g. Landlord: Ahmed Khan, address 12 Main St Lahore. Tenant: Sara Malik. Monthly rent PKR 50,000. Lease term: 1 year from 1 June 2025. 2-month security deposit…"
            style={{
              width: '100%', borderRadius: 10, border: '1.5px solid #E5E7EB',
              padding: '12px 14px', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <Alert msg={error} />
        <Btn onClick={draft} loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
          Draft with Claude AI
        </Btn>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
          Uses Claude Sonnet · Saved to AI Suggestions automatically
        </div>
      </Card>

      {result && (
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{result.docType}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" onClick={handleCopy} style={{ fontSize: 12, padding: '6px 14px' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </Btn>
              <Btn variant="secondary" onClick={() => downloadText(`${result.docType}.txt`, result.content)} style={{ fontSize: 12, padding: '6px 14px' }}>
                Download
              </Btn>
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            <pre style={{
              margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              fontFamily: 'Georgia, serif', color: '#1F2937',
            }}>
              {result.content}
            </pre>
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
            {result.tokensUsed} tokens used
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Tab 4: Suggestions ─────────────────────────────────────────────── */
function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await aiApi.suggestions.list({ status: filter });
      setSuggestions(r.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function accept(id) {
    setActionLoading(id + '_accept');
    try {
      await aiApi.suggestions.accept(id);
      load();
    } catch {}
    finally { setActionLoading(null); }
  }

  async function dismiss(id) {
    setActionLoading(id + '_dismiss');
    try {
      await aiApi.suggestions.dismiss(id);
      load();
    } catch {}
    finally { setActionLoading(null); }
  }

  const typeColors = {
    time_entry: '#7C3AED', deadline: '#F59E0B', invoice_error: '#EF4444',
    task: '#3B82F6', document_draft: '#10B981', conflict_analysis: '#8B5CF6',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending','accepted','dismissed'].map(s => (
          <Btn key={s} variant={filter === s ? 'primary' : 'secondary'} onClick={() => setFilter(s)}
            style={{ fontSize: 13, padding: '8px 16px', textTransform: 'capitalize' }}>
            {s}
          </Btn>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>}
      {!loading && suggestions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <div>No {filter} suggestions</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestions.map(s => (
          <Card key={s._id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Badge text={s.type?.replace('_',' ')} color={typeColors[s.type] || '#7C3AED'} />
                  {s.matterId && <span style={{ fontSize: 12, color: '#6B7280' }}>{s.matterId.title}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                {s.description && <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{s.description}</div>}
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{fmtDate(s.createdAt)}</div>
              </div>
              {filter === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn variant="success" onClick={() => accept(s._id)} loading={actionLoading === s._id + '_accept'}
                    style={{ fontSize: 13, padding: '6px 14px' }}>Accept</Btn>
                  <Btn variant="danger" onClick={() => dismiss(s._id)} loading={actionLoading === s._id + '_dismiss'}
                    style={{ fontSize: 13, padding: '6px 14px' }}>Dismiss</Btn>
                </div>
              )}
              {filter !== 'pending' && (
                <Badge text={s.status} color={s.status === 'accepted' ? '#10B981' : '#EF4444'} />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab 5: Audit Log ───────────────────────────────────────────────── */
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
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const actionColors = {
    analyze_document: '#7C3AED', extract_deadlines: '#F59E0B',
    suggest_invoice: '#EF4444', draft_document: '#10B981',
    matter_chat: '#3B82F6', narrate_report: '#8B5CF6',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>{total} total AI actions logged</div>
        <Btn variant="secondary" onClick={load} style={{ fontSize: 13, padding: '7px 14px' }}>Refresh</Btn>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>}

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #E5E7EB' }}>
              {['Date/Time','Action','User','Model','Tokens','Duration','Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={l._id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                  <div>{fmtDate(l.createdAt)}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtTime(l.createdAt)}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={l.action?.replace(/_/g, ' ')} color={actionColors[l.action] || '#6B7280'} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                  {l.userId?.name || l.userId?.email || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                  {l.model?.replace('claude-','').replace('-20251001','') || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                  {l.tokensUsed?.toLocaleString() || 0}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                  {l.durationMs ? `${(l.durationMs/1000).toFixed(1)}s` : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge text={l.status} color={l.status === 'success' ? '#10B981' : '#EF4444'} />
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
                  No AI actions logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {total > 25 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Btn variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13 }}>Prev</Btn>
          <span style={{ padding: '8px 14px', fontSize: 13, color: '#374151' }}>Page {page} of {Math.ceil(total / 25)}</span>
          <Btn variant="secondary" disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13 }}>Next</Btn>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'chat',    label: 'Matter Chat' },
  { id: 'draft',   label: 'Draft Document' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'audit',   label: 'Audit Log' },
];

export default function ManageAI() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🤖</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>AI Assistant</h1>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Powered by Claude · Analyze documents, chat about matters, draft legal text</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, padding: 6, borderRadius: 14,
        background: '#F3F4F6', marginBottom: 24, width: 'fit-content',
      }}>
        {TABS.map(t => (
          <Tab key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'analyze'     && <AnalyzeTab />}
          {activeTab === 'chat'        && <ChatTab />}
          {activeTab === 'draft'       && <DraftTab />}
          {activeTab === 'suggestions' && <SuggestionsTab />}
          {activeTab === 'audit'       && <AuditTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
