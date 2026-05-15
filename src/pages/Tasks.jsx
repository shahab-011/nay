import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { tasksApi } from '../api/tasks.api';

const ease = [0.22, 1, 0.36, 1];

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES   = ['Pending', 'In Progress', 'Completed'];
const TASK_TYPES = ['Research', 'Drafting', 'Filing', 'Call', 'Meeting', 'Review', 'Hearing', 'Admin', 'Other'];

const PRIORITY_STYLE = {
  Low:    { color: 'var(--green)',  bg: 'var(--green-bg)' },
  Medium: { color: 'var(--amber)',  bg: 'var(--amber-bg)' },
  High:   { color: 'var(--red)',    bg: 'var(--red-bg)' },
};
const STATUS_STYLE = {
  Pending:     { color: 'var(--amber)',       bg: 'var(--amber-bg)' },
  'In Progress':{ color: 'var(--blue)',       bg: 'var(--blue-bg)' },
  Completed:   { color: 'var(--green)',       bg: 'var(--green-bg)' },
};

function PriorityDot({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low;
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: s.color, flexShrink: 0 }} />;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function isOverdue(task) {
  return task.due_date && task.status !== 'Completed' && new Date(task.due_date) < new Date();
}

/* ── Task Form Modal ─────────────────────────────────────── */
function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title:         task?.title || '',
    description:   task?.description || '',
    matter_name:   task?.matter_name || '',
    priority:      task?.priority || 'Medium',
    status:        task?.status || 'Pending',
    task_type:     task?.task_type || 'Research',
    due_date:      task?.due_date ? task.due_date.slice(0, 10) : '',
    time_estimate: task?.time_estimate || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required'); return; }
    setSaving(true);
    try {
      const result = task
        ? await tasksApi.update(task._id, form)
        : await tasksApi.create(form);
      onSave(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally { setSaving(false); }
  }

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(11,11,20,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease }}
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: 24, boxShadow: '0 32px 80px rgba(11,11,20,0.18)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="h-title" style={{ fontSize: 22 }}>{task ? 'Edit Task' : 'New Task'}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}><I.X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <Field label="Task Title *">
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Draft employment contract" autoFocus />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What needs to be done…" style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Related Matter">
            <input className="input" value={form.matter_name} onChange={e => set('matter_name', e.target.value)} placeholder="Matter name (optional)" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)} style={{ cursor: 'pointer' }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)} style={{ cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Task Type">
              <select className="input" value={form.task_type} onChange={e => set('task_type', e.target.value)} style={{ cursor: 'pointer' }}>
                {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Due Date">
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </Field>
            <Field label="Time Estimate (hrs)">
              <input className="input" type="number" min="0" step="0.25" value={form.time_estimate} onChange={e => set('time_estimate', e.target.value)} placeholder="2.5" />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : task ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Task Row (list view) ────────────────────────────────── */
function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const overdue = isOverdue(task);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        style={{
          width: 20, height: 20, borderRadius: 6, border: `2px solid ${task.status === 'Completed' ? 'var(--purple)' : 'var(--border-active)'}`,
          background: task.status === 'Completed' ? 'var(--purple)' : 'transparent',
          display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.15s',
        }}
      >
        {task.status === 'Completed' && <I.Check size={11} style={{ color: '#fff' }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <PriorityDot priority={task.priority} />
          <span style={{
            fontSize: 14, fontWeight: 600,
            textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
            color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--ink)',
          }}>{task.title}</span>
          <StatusBadge status={task.status} />
          {task.task_type && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--active)', color: 'var(--text-secondary)', fontWeight: 500 }}>{task.task_type}</span>
          )}
        </div>
        {task.description && (
          <div className="t-secondary" style={{ fontSize: 13, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {task.matter_name && <span><I.Briefcase size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{task.matter_name}</span>}
          {task.due_date && (
            <span style={{ color: overdue ? 'var(--red)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
              <I.Calendar size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {overdue ? 'Overdue · ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.time_estimate && <span><I.Clock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{task.time_estimate}h est.</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(task)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-soft)'; e.currentTarget.style.color = 'var(--purple)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--active)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <I.Settings size={13} />
        </button>
        <button onClick={() => onDelete(task._id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--active)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <I.X size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Kanban Card ─────────────────────────────────────────── */
function KanbanCard({ task, onEdit, onDragStart }) {
  const overdue = isOverdue(task);
  return (
    <motion.div
      layout
      draggable
      onDragStart={() => onDragStart(task)}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(11,11,20,0.10)' }}
      className="card"
      style={{ padding: 16, marginBottom: 10, cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onClick={() => onEdit(task)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <PriorityDot priority={task.priority} />
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{task.title}</span>
      </div>
      {task.description && (
        <div className="t-secondary" style={{ fontSize: 12, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {task.task_type && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'var(--active)', color: 'var(--text-muted)', fontWeight: 600 }}>{task.task_type}</span>}
        {task.due_date && (
          <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400, marginLeft: 'auto' }}>
            {overdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Kanban Board ────────────────────────────────────────── */
function KanbanBoard({ tasks, onMove, onEdit }) {
  const [dragTask, setDragTask] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const columns = STATUSES.map(s => ({
    id: s,
    tasks: tasks.filter(t => t.status === s),
  }));

  const COLUMN_COLORS = {
    Pending: 'var(--amber)',
    'In Progress': 'var(--blue)',
    Completed: 'var(--green)',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
      {columns.map(col => (
        <div
          key={col.id}
          onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => {
            if (dragTask && dragTask.status !== col.id) onMove(dragTask, col.id);
            setDragTask(null); setDragOver(null);
          }}
          style={{
            background: dragOver === col.id ? 'var(--purple-soft)' : 'var(--bg)',
            borderRadius: 16, padding: 14,
            border: `2px dashed ${dragOver === col.id ? 'var(--purple)' : 'transparent'}`,
            transition: 'all 0.15s', minHeight: 200,
          }}
        >
          {/* Column header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: COLUMN_COLORS[col.id] }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>{col.id}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 8 }}>{col.tasks.length}</span>
          </div>

          {/* Cards */}
          <AnimatePresence>
            {col.tasks.map(t => (
              <KanbanCard key={t._id} task={t} onEdit={onEdit} onDragStart={setDragTask} />
            ))}
          </AnimatePresence>
          {col.tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Drop tasks here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main Tasks Page ─────────────────────────────────────── */
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'kanban'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterDue, setFilterDue] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await tasksApi.list();
      setTasks(r.data || []);
    } catch {
      setError('Failed to load tasks. Make sure the backend is running.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(saved) {
    setShowModal(false);
    setEditingTask(null);
    await load();
  }

  async function handleToggle(task) {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(task._id, { status: newStatus }); } catch { await load(); }
  }

  async function handleMove(task, newStatus) {
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(task._id, { status: newStatus }); } catch { await load(); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return;
    setTasks(ts => ts.filter(t => t._id !== id));
    try { await tasksApi.remove(id); } catch { await load(); }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.matter_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
    let matchDue = true;
    if (filterDue === 'Overdue') matchDue = isOverdue(t);
    else if (filterDue === 'Today') matchDue = t.due_date && new Date(t.due_date).toDateString() === today.toDateString();
    else if (filterDue === 'This Week') matchDue = t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= weekEnd;
    return matchSearch && matchStatus && matchPriority && matchDue;
  });

  const overdue = tasks.filter(isOverdue).length;
  const byStatus = s => tasks.filter(t => t.status === s).length;

  return (
    <div style={{ padding: '80px 28px 100px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="h-title" style={{ fontSize: 30, marginBottom: 4 }}>Tasks</h1>
          <p className="t-secondary" style={{ fontSize: 14 }}>Track and manage tasks across all your matters</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--active)', borderRadius: 10, padding: 4 }}>
            {[{ id: 'list', icon: <I.Doc size={14} />, label: 'List' }, { id: 'kanban', icon: <I.Chart size={14} />, label: 'Board' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: view === v.id ? 'var(--surface)' : 'transparent',
                  color: view === v.id ? 'var(--purple)' : 'var(--text-muted)',
                  boxShadow: view === v.id ? '0 1px 4px rgba(11,11,20,0.08)' : 'none',
                }}
              >{v.icon} {v.label}</button>
            ))}
          </div>
          <button className="btn btn-purple" onClick={() => { setEditingTask(null); setShowModal(true); }}>
            <I.Check size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { l: 'Total Tasks', v: tasks.length, col: 'var(--ink)' },
          { l: 'Pending',     v: byStatus('Pending'), col: 'var(--amber)' },
          { l: 'In Progress', v: byStatus('In Progress'), col: 'var(--blue)' },
          { l: 'Completed',   v: byStatus('Completed'), col: 'var(--green)' },
          { l: 'Overdue',     v: overdue, col: 'var(--red)' },
        ].map(({ l, v, col }) => (
          <div key={l} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 26, color: col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search tasks or matters…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        {[
          { label: 'Status', value: filterStatus, set: setFilterStatus, options: ['All', ...STATUSES] },
          { label: 'Priority', value: filterPriority, set: setFilterPriority, options: ['All', ...PRIORITIES] },
          { label: 'Due', value: filterDue, set: setFilterDue, options: ['All', 'Overdue', 'Today', 'This Week'] },
        ].map(f => (
          <select key={f.label} className="input" value={f.value} onChange={e => f.set(e.target.value)} style={{ width: 130, cursor: 'pointer' }}>
            {f.options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {error && <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14 }}>{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <I.Check size={30} />
          </div>
          <div className="h-title" style={{ fontSize: 20, marginBottom: 8 }}>{tasks.length === 0 ? 'No tasks yet' : 'No matches found'}</div>
          <p className="t-secondary" style={{ fontSize: 14, marginBottom: 24 }}>{tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters.'}</p>
          {tasks.length === 0 && <button className="btn btn-purple" onClick={() => { setEditingTask(null); setShowModal(true); }}>Create First Task</button>}
        </div>
      ) : view === 'list' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <AnimatePresence>
            {filtered.map(t => (
              <TaskRow key={t._id} task={t}
                onToggle={handleToggle}
                onEdit={t => { setEditingTask(t); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onMove={handleMove}
          onEdit={t => { setEditingTask(t); setShowModal(true); }}
        />
      )}

      <AnimatePresence>
        {showModal && (
          <TaskModal
            task={editingTask}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
