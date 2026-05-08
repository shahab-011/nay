import React, { useState, useRef } from 'react';
import { createAnnotation, deleteAnnotation, resolveAnnotation } from '../../api/documents.api';
import { useSocket } from '../../context/SocketContext';

/* ── helpers ──────────────────────────────────────────────────────── */

const TYPE_META = {
  annotation: { icon: 'chat_bubble',  label: 'Note',      color: 'text-blue-400'    },
  risk_flag:  { icon: 'flag',         label: 'Risk Flag', color: 'text-error'       },
  question:   { icon: 'help',         label: 'Question',  color: 'text-amber-400'   },
  approval:   { icon: 'check_circle', label: 'Approved',  color: 'text-primary'     },
  reply:      { icon: 'reply',        label: 'Reply',     color: 'text-slate-400'   },
};

const SEVERITY_META = {
  low:      { label: 'Low',      cls: 'bg-primary/15 text-primary'                          },
  medium:   { label: 'Medium',   cls: 'bg-amber-400/15 text-amber-400'                      },
  high:     { label: 'High',     cls: 'bg-orange-400/15 text-orange-400'                    },
  critical: { label: 'Critical', cls: 'bg-error/15 text-error'                              },
};

const ANNOTATION_COLORS = {
  yellow: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/25', dot: 'bg-yellow-400' },
  blue:   { bg: 'bg-blue-400/10',   border: 'border-blue-400/25',   dot: 'bg-blue-400'   },
  green:  { bg: 'bg-primary/10',    border: 'border-primary/25',    dot: 'bg-primary'     },
  red:    { bg: 'bg-error/10',      border: 'border-error/25',      dot: 'bg-error'       },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ── AnnotationCard ───────────────────────────────────────────────── */

function AnnotationCard({ ann, currentUser, docId, onDelete, onResolve }) {
  const tm  = TYPE_META[ann.type]  || TYPE_META.annotation;
  const ac  = ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow;
  const sm  = ann.severity ? SEVERITY_META[ann.severity] : null;
  const isOwn = String(ann.userId) === String(currentUser?._id || currentUser?.id);
  const isLawyer = ann.authorRole === 'lawyer' || ann.authorRole === 'admin';

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${ac.bg} ${ac.border} ${ann.isResolved ? 'opacity-60' : ''}`}>

      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isLawyer ? 'bg-primary/30 text-primary' : 'bg-violet-500/30 text-violet-300'}`}>
          {ann.userName.charAt(0).toUpperCase()}
        </div>
        <span className="text-[11px] font-bold text-on-surface font-headline flex-1 truncate">{ann.userName}</span>
        {isLawyer && (
          <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/15 flex-shrink-0">
            Lawyer
          </span>
        )}
      </div>

      {/* Type + severity */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1">
          <span className={`material-symbols-outlined text-[13px] ${tm.color}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>{tm.icon}</span>
          <span className={`text-[10px] font-bold ${tm.color}`}>{tm.label}</span>
        </div>
        {sm && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sm.cls}`}>
            {sm.label}
          </span>
        )}
        {ann.clauseName && (
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full truncate max-w-[110px]">
            {ann.clauseName || `Clause ${ann.clauseIndex + 1}`}
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-[12px] text-on-surface leading-relaxed mb-2">{ann.text}</p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-on-surface-variant flex-1">{timeAgo(ann.createdAt)}</span>

        {ann.isResolved && (
          <span className="flex items-center gap-1 text-[10px] text-primary font-semibold">
            <span className="material-symbols-outlined text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Resolved
          </span>
        )}

        {/* Resolve toggle — visible to everyone */}
        <button
          onClick={() => onResolve(String(ann._id))}
          title={ann.isResolved ? 'Mark unresolved' : 'Mark resolved'}
          className={`transition-colors ${ann.isResolved ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: ann.isResolved ? "'FILL' 1" : "'FILL' 0" }}>
            check_circle
          </span>
        </button>

        {/* Delete — only author */}
        {isOwn && (
          <button
            onClick={() => onDelete(String(ann._id))}
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main CollaborationPanel ──────────────────────────────────────── */

export default function CollaborationPanel({
  isOpen,
  onClose,
  documentId,
  currentUser,
  annotations,
  onAnnotationsChange,
  typingUsers,
  collaborators,
  analysis,
}) {
  const { emitTypingStart, emitTypingStop } = useSocket();

  const [noteText,      setNoteText]      = useState('');
  const [noteType,      setNoteType]      = useState('annotation');
  const [noteSeverity,  setNoteSeverity]  = useState('');
  const [noteClause,    setNoteClause]    = useState('');
  const [saving,        setSaving]        = useState(false);
  const typingTimer = useRef(null);

  const clauses = analysis?.clauses || [];

  /* ── handlers ─────────────────────────────────────────────────── */

  const handleNoteChange = (e) => {
    setNoteText(e.target.value);
    emitTypingStart(documentId, noteClause);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTypingStop(documentId), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const clauseIdx = noteClause !== '' ? Number(noteClause) : 0;
      const clauseNameStr = clauses[clauseIdx]?.type || `Clause ${clauseIdx + 1}`;
      const res = await createAnnotation(documentId, {
        clauseIndex: clauseIdx,
        clauseName:  clauseNameStr,
        text:        noteText.trim(),
        type:        noteType,
        severity:    noteType === 'risk_flag' ? noteSeverity || 'medium' : null,
        color:       noteType === 'risk_flag' ? 'red' : noteType === 'approval' ? 'green' : noteType === 'question' ? 'blue' : 'yellow',
      });
      const saved = res.data.data.annotation;
      onAnnotationsChange((prev) => {
        const exists = prev.some((a) => String(a._id) === String(saved._id));
        return exists ? prev : [...prev, saved];
      });
      setNoteText('');
      setNoteType('annotation');
      setNoteSeverity('');
      emitTypingStop(documentId);
    } catch {
      // silent — socket broadcast will sync other clients
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (annotationId) => {
    onAnnotationsChange((prev) => prev.filter((a) => String(a._id) !== annotationId));
    try {
      await deleteAnnotation(documentId, annotationId);
    } catch {
      // revert on error — refetch would be ideal but keep it simple
    }
  };

  const handleResolve = async (annotationId) => {
    try {
      const res = await resolveAnnotation(documentId, annotationId);
      const updated = res.data.data.annotation;
      onAnnotationsChange((prev) => prev.map((a) => String(a._id) === annotationId ? updated : a));
    } catch {
      // socket broadcast will sync
    }
  };

  /* ── render ────────────────────────────────────────────────────── */

  const sorted = [...annotations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className={`md:hidden fixed inset-0 z-[75] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[360px] z-[80] bg-[#000f3b]/97 backdrop-blur-xl border-l border-white/8 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-on-surface font-headline">Live Collaboration</h3>
            <p className="text-[10px] text-on-surface-variant">
              {annotations.length} note{annotations.length !== 1 ? 's' : ''} · {collaborators.length + 1} viewer{collaborators.length !== 0 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ── Presence bar ── */}
        <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
          <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant font-bold mb-2">Currently Viewing</p>
          <div className="space-y-1.5">
            {/* Current user */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span className="text-[12px] text-on-surface font-medium">{currentUser?.name || 'You'}</span>
              <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-auto capitalize">
                {currentUser?.role || 'user'}
              </span>
            </div>
            {/* Other collaborators */}
            {collaborators.map((c, i) => (
              <div key={c.userId || i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-[12px] text-on-surface font-medium flex-1 truncate">{c.name || c.userName}</span>
                <span className="text-[9px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full capitalize">
                  {c.role || c.userRole || 'user'}
                </span>
              </div>
            ))}
            {collaborators.length === 0 && (
              <p className="text-[11px] text-on-surface-variant/50 italic">No one else here yet</p>
            )}
          </div>
        </div>

        {/* ── Typing indicator ── */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 flex-shrink-0 bg-surface-container/30">
            <div className="flex gap-0.5 items-end">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant">
              <span className="text-primary font-semibold">{typingUsers[0].userName}</span> is writing a note…
            </p>
          </div>
        )}

        {/* ── Quick add form ── */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-white/5 space-y-2 flex-shrink-0 bg-surface-container/20">
          {/* Type selector */}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(TYPE_META).filter(([k]) => k !== 'reply').map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setNoteType(key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  noteType === key
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-surface-container border-white/8 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                {meta.label}
              </button>
            ))}
          </div>

          {/* Clause selector */}
          {clauses.length > 0 && (
            <select
              value={noteClause}
              onChange={(e) => setNoteClause(e.target.value)}
              className="w-full bg-surface-container-high border border-white/8 text-on-surface text-[12px] px-3 py-1.5 rounded-lg outline-none focus:border-primary transition-colors"
            >
              <option value="">General note (no clause)</option>
              {clauses.map((c, i) => (
                <option key={i} value={i}>{`Clause ${i + 1} — ${c.type}`}</option>
              ))}
            </select>
          )}

          {/* Severity selector — only for risk flags */}
          {noteType === 'risk_flag' && (
            <div className="flex gap-1.5">
              {Object.entries(SEVERITY_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNoteSeverity(key)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    noteSeverity === key
                      ? `${meta.cls} border-current`
                      : 'bg-surface-container border-white/8 text-on-surface-variant hover:text-white'
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            rows={2}
            value={noteText}
            onChange={handleNoteChange}
            onBlur={() => emitTypingStop(documentId)}
            placeholder={noteType === 'risk_flag' ? 'Describe the risk…' : noteType === 'question' ? 'Ask your question…' : 'Add your note…'}
            className="w-full bg-surface-container-high border border-white/8 focus:border-primary text-white text-[12px] py-2 px-3 rounded-lg outline-none resize-none transition-colors placeholder:text-on-surface-variant/40"
          />

          <button
            type="submit"
            disabled={saving || !noteText.trim()}
            className="w-full py-2 bg-primary-container text-on-primary-container rounded-lg text-[12px] font-bold font-headline hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5"
          >
            {saving
              ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined text-sm">add_comment</span>Add Note</>
            }
          </button>
        </form>

        {/* ── Annotation feed ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">add_comment</span>
              <p className="text-on-surface-variant/40 text-sm text-center font-headline">No notes yet</p>
              <p className="text-on-surface-variant/30 text-[11px] text-center">Add a note using the form above</p>
            </div>
          ) : (
            sorted.map((ann) => (
              <AnnotationCard
                key={ann._id}
                ann={ann}
                currentUser={currentUser}
                docId={documentId}
                onDelete={handleDelete}
                onResolve={handleResolve}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
