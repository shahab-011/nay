import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMessages, sendMessage } from '../../api/messages.api';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] font-semibold text-on-surface-variant/60 px-2">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export default function DirectMessagePanel({ linkId, otherName, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [text,     setText]       = useState('');
  const [sending,  setSending]    = useState(false);
  const [error,    setError]      = useState('');

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const roomId     = `msg_${linkId}`;

  /* ── Load history ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!linkId) return;
    setLoading(true);
    getMessages(linkId)
      .then(r => setMessages(r.data.data.messages || []))
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [linkId]);

  /* ── Join socket room ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!socket || !linkId) return;
    socket.emit('join-msg-room', roomId);

    const handleIncoming = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('direct-message', handleIncoming);

    return () => {
      socket.off('direct-message', handleIncoming);
      socket.emit('leave-msg-room', roomId);
    };
  }, [socket, linkId, roomId]);

  /* ── Auto-scroll to bottom on new message ─────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input on open ──────────────────────────────────────────── */
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  /* ── Send message ─────────────────────────────────────────────────── */
  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    const optimistic = {
      _id:        `opt_${Date.now()}`,
      senderId:   user._id,
      senderName: user.name,
      senderRole: user.role,
      text:       text.trim(),
      createdAt:  new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    try {
      const r = await sendMessage(linkId, optimistic.text);
      const saved = r.data.data.message;
      setMessages(prev => prev.map(m => m._id === optimistic._id ? saved : m));
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setError('Failed to send. Please try again.');
      setText(optimistic.text);
    } finally {
      setSending(false);
    }
  }, [text, sending, linkId, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Group messages by day for day-separator display ─────────────── */
  const grouped = [];
  let lastDay = null;
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    if (day !== lastDay) { grouped.push({ type: 'separator', label: day }); lastDay = day; }
    grouped.push({ type: 'message', msg });
  }

  const myId = String(user?._id || '');

  return (
    /* Overlay backdrop */
    <div className="fixed inset-0 z-[90] flex justify-end" onClick={onClose}>
      {/* Panel — stop propagation so clicks inside don't close */}
      <div
        className="relative flex flex-col w-full max-w-[400px] h-full bg-surface-container shadow-2xl border-l border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm font-headline">
            {(otherName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-on-surface text-sm leading-tight truncate">{otherName || 'Chat'}</div>
            <div className="text-[10px] text-on-surface-variant">Direct message</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ── Message list ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {loading && (
            <div className="flex items-center justify-center h-24 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
              Loading messages…
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">chat_bubble_outline</span>
              <p className="text-sm text-on-surface-variant/60">No messages yet.<br />Say hello!</p>
            </div>
          )}

          {!loading && grouped.map((item, i) => {
            if (item.type === 'separator') {
              return <DaySeparator key={`sep_${i}`} label={item.label} />;
            }
            const { msg } = item;
            const isMine = String(msg.senderId?._id || msg.senderId) === myId;
            return (
              <div
                key={msg._id}
                className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar — only for other party */}
                {!isMine && (
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0 mb-1">
                    {(msg.senderName || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMine && (
                    <span className="text-[10px] text-on-surface-variant ml-1">{msg.senderName}</span>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMine
                        ? 'bg-primary text-on-primary rounded-br-sm'
                        : 'bg-surface-container-high text-on-surface rounded-bl-sm'
                    } ${msg._optimistic ? 'opacity-70' : ''}`}
                  >
                    {msg.text}
                  </div>
                  <span className={`text-[9px] text-on-surface-variant/50 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(msg.createdAt)}
                    {isMine && msg.read && !msg._optimistic && (
                      <span className="ml-1 text-primary">✓✓</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── Error banner ──────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-1 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* ── Input area ────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm bg-surface-container-high text-on-surface placeholder-on-surface-variant/40 border border-white/10 focus:outline-none focus:border-primary/40 transition-colors max-h-32 overflow-y-auto"
              style={{ minHeight: '40px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
