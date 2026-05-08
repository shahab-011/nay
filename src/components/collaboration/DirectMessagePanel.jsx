import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMessages } from '../../api/messages.api';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
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
  const { user }         = useAuth();
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const roomId    = `msg_${linkId}`;

  /* ── 1. Load history via REST ─────────────────────────────────────── */
  useEffect(() => {
    if (!linkId) return;
    setLoading(true);
    getMessages(linkId)
      .then(r => setMessages(r.data.data.messages || []))
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [linkId]);

  /* ── 2. Join WS room + listen for messages ────────────────────────── */
  useEffect(() => {
    if (!socket || !linkId) return;

    socket.emit('join-msg-room', roomId);

    const onMessage = (msg) => {
      setMessages(prev => {
        // Dedup by _id (server always sends real _id)
        if (prev.some(m => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      setSending(false);
    };

    const onError = ({ error: errMsg }) => {
      setError(errMsg || 'Failed to send message.');
      setSending(false);
    };

    socket.on('direct-message', onMessage);
    socket.on('message-error',  onError);

    return () => {
      socket.off('direct-message', onMessage);
      socket.off('message-error',  onError);
      socket.emit('leave-msg-room', roomId);
    };
  }, [socket, linkId, roomId]);

  /* ── 3. Auto-scroll on new message ───────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── 4. Focus input on open ───────────────────────────────────────── */
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  /* ── 5. Send via WebSocket ────────────────────────────────────────── */
  const handleSend = useCallback((e) => {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    if (!isConnected || !socket) {
      setError('Not connected — please wait a moment and try again.');
      return;
    }
    setSending(true);
    socket.emit('send-message', { linkId, text: text.trim() });
    setText('');
  }, [text, sending, socket, linkId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── 6. Group by day ─────────────────────────────────────────────── */
  const grouped = [];
  let lastDay = null;
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    if (day !== lastDay) { grouped.push({ type: 'separator', label: day }); lastDay = day; }
    grouped.push({ type: 'message', msg });
  }

  const myId = String(user?._id || '');

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" onClick={onClose}>
      <div
        className="relative flex flex-col w-full max-w-[400px] h-full bg-surface-container shadow-2xl border-l border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm font-headline flex-shrink-0">
            {(otherName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-on-surface text-sm leading-tight truncate">{otherName || 'Chat'}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {isConnected ? 'Connected' : 'Connecting…'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ── Message list ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {loading && (
            <div className="flex items-center justify-center h-24 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
              Loading…
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
            const isMine  = String(msg.senderId?._id || msg.senderId) === myId;

            return (
              <div
                key={String(msg._id)}
                className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMine && (
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0 mb-1">
                    {(msg.senderName || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <span className="text-[10px] text-on-surface-variant ml-1">{msg.senderName}</span>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMine
                        ? 'bg-primary text-on-primary rounded-br-sm'
                        : 'bg-surface-container-high text-on-surface rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className={`text-[9px] text-on-surface-variant/50 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-primary/20 text-primary text-xs">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-1 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* ── Input ───────────────────────────────────────────────────── */}
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
              disabled={!text.trim() || sending || !isConnected}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
