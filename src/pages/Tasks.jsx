import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { tasksApi } from '../api/tasks.api';

/* ─── Constants ─────────────────────────────────────────────────── */
const STATUSES = [
  { value: 'to_do',       label: 'To Do',       color: '#6B7280', bg: '#F3F4F6' },
  { value: 'in_progress', label: 'In Progress',  color: '#3B82F6', bg: '#DBEAFE' },
  { value: 'in_review',   label: 'In Review',    color: '#8B5CF6', bg: '#EDE9FE' },
  { value: 'blocked',     label: 'Blocked',      color: '#EF4444', bg: '#FEE2E2' },
  { value: 'completed',   label: 'Completed',    color: '#10B981', bg: '#D1FAE5' },
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: '#EF4444', bg: '#FEE2E2' },
  { value: 'high',   label: 'High',   color: '#F97316', bg: '#FFEDD5' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'low',    label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
];

const ACTIVITY_TYPES = [
  { value: 'research',       label: 'Research' },
  { value: 'drafting',       label: 'Drafting' },
  { value: 'review',         label: 'Review' },
  { value: 'court',          label: 'Court' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'calls',          label: 'Calls' },
  { value: 'admin',          label: 'Admin' },
  { value: 'other',          label: 'Other' },
];

const statusMeta  = v => STATUSES.find(s => s.value === v)  || STATUSES[0];
const priorityMeta = v => PRIORITIES.find(p => p.value === v) || PRIORITIES[2];

function isOverdue(task) {
  return task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date();
}

/* ─── Shared UI ──────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = statusMeta(status);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:999, fontSize:11, fontWeight:600, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  const m = priorityMeta(priority);
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:4, background: m.color, flexShrink:0 }} />;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Task Modal ─────────────────────────────────────────────────── */
const BLANK = { title:'', description:'', priority:'medium', status:'to_do', activityType:'admin', dueDate:'', estimatedHours:'', matterId:'' };

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    ...BLANK, ...task,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    matterId: task.matterId?._id || task.matterId || '',
  } : { ...BLANK });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required'); return; }
    setSaving(true);
    try {
      if (task?._id) {
        await tasksApi.update(task._id, form);
      } else {
        await tasksApi.create(form);
      }
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(11,11,20,0.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        style={{ width:'100%', maxWidth:540, background:'var(--surface)', borderRadius:20, boxShadow:'var(--shadow-float)', maxHeight:'90vh', overflowY:'auto' }}>

        <div style={{ padding:'24px 28px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{task?._id ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}><I.X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:28 }}>
          {err && <div style={{ background:'#FEE2E2', color:'#991B1B', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{err}</div>}

          <Field label="Title *">
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" autoFocus />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What needs to be done…" style={{ resize:'vertical' }} />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Priority">
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Activity Type">
              <select className="input" value={form.activityType} onChange={e => set('activityType', e.target.value)}>
                {ACTIVITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </Field>
            <Field label="Due Date">
              <input className="input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </Field>
            <Field label="Est. Hours">
              <input className="input" type="number" min="0" step="0.25" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} placeholder="2.5" />
            </Field>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : task?._id ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Task List Modal ────────────────────────────────────────────── */
function TaskListModal({ list, onClose, onSave }) {
  const [form, setForm] = useState({ name: list?.name || '', description: list?.description || '', isTemplate: list?.isTemplate || false });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (list?._id) await tasksApi.updateTaskList(list._id, form);
      else await tasksApi.createTaskList(form);
      onSave();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(11,11,20,0.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
        style={{ width:'100%', maxWidth:440, background:'var(--surface)', borderRadius:20, boxShadow:'var(--shadow-float)', padding:28 }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700 }}>{list?._id ? 'Edit Task List' : 'New Task List'}</h3>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Name *">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Discovery Checklist" autoFocus />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize:'vertical' }} />
          </Field>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={form.isTemplate} onChange={e => set('isTemplate', e.target.checked)} />
            <span style={{ fontSize:13 }}>Save as reusable template</span>
          </label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : list?._id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Task Row ───────────────────────────────────────────────────── */
function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const overdue = isOverdue(task);
  const pm = priorityMeta(task.priority);
  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-16 }}
      style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 18px', borderBottom:'1px solid var(--border)' }}>
      <button onClick={() => onToggle(task)} style={{
        width:20, height:20, borderRadius:6, flexShrink:0, marginTop:2, transition:'all 0.15s',
        border: `2px solid ${task.status === 'completed' ? 'var(--purple)' : 'var(--border)'}`,
        background: task.status === 'completed' ? 'var(--purple)' : 'transparent',
        display:'grid', placeItems:'center',
      }}>
        {task.status === 'completed' && <I.Check size={11} style={{ color:'#fff' }} />}
      </button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
          <PriorityDot priority={task.priority} />
          <span style={{ fontSize:14, fontWeight:600, color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--ink)', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</span>
          <StatusBadge status={task.status} />
          {task.status === 'blocked' && <span style={{ fontSize:11, color:'#EF4444', fontWeight:700 }}>⚠ Blocked</span>}
        </div>
        {task.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</div>}
        <div style={{ display:'flex', gap:14, fontSize:11, color:'var(--text-muted)', flexWrap:'wrap' }}>
          {task.matterId?.title && <span><I.Briefcase size={10} style={{ marginRight:4, verticalAlign:'middle' }} />{task.matterId.title}</span>}
          {task.dueDate && (
            <span style={{ color: overdue ? '#EF4444' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
              <I.Calendar size={10} style={{ marginRight:4, verticalAlign:'middle' }} />
              {overdue ? 'Overdue · ' : ''}{new Date(task.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
            </span>
          )}
          {task.estimatedHours > 0 && <span><I.Clock size={10} style={{ marginRight:4, verticalAlign:'middle' }} />{task.estimatedHours}h est.</span>}
          {task.assignedTo?.length > 0 && <span>→ {task.assignedTo.map(u => u.name || u).join(', ')}</span>}
        </div>
      </div>

      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={() => onEdit(task)} style={{ width:28, height:28, borderRadius:7, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--purple-soft)'; e.currentTarget.style.color='var(--purple)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--elevated)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <I.Settings size={12} />
        </button>
        <button onClick={() => onDelete(task._id)} style={{ width:28, height:28, borderRadius:7, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background='#FEE2E2'; e.currentTarget.style.color='#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--elevated)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <I.X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Kanban Card ────────────────────────────────────────────────── */
function KanbanCard({ task, onEdit, onDragStart }) {
  const overdue = isOverdue(task);
  const pm = priorityMeta(task.priority);
  return (
    <motion.div layout draggable onDragStart={() => onDragStart(task)}
      whileHover={{ y:-2, boxShadow:'0 8px 24px rgba(11,11,20,0.10)' }}
      className="card" onClick={() => onEdit(task)}
      style={{ padding:14, marginBottom:8, cursor:'grab', borderLeft: task.status === 'blocked' ? '3px solid #EF4444' : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <PriorityDot priority={task.priority} />
        <span style={{ fontSize:13, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</span>
      </div>
      {task.description && (
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{task.description}</div>
      )}
      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, background: pm.bg, color: pm.color, fontWeight:600 }}>{pm.label}</span>
        {task.matterId?.title && <span style={{ fontSize:10, color:'var(--text-muted)' }}>{task.matterId.title}</span>}
        {task.dueDate && (
          <span style={{ fontSize:10, color: overdue ? '#EF4444' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400, marginLeft:'auto' }}>
            {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Kanban Board ───────────────────────────────────────────────── */
function KanbanBoard({ tasks, onMove, onEdit }) {
  const [dragTask, setDragTask] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, alignItems:'start' }}>
      {STATUSES.map(col => (
        <div key={col.value}
          onDragOver={e => { e.preventDefault(); setDragOver(col.value); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => { if (dragTask && dragTask.status !== col.value) onMove(dragTask, col.value); setDragTask(null); setDragOver(null); }}
          style={{ background: dragOver === col.value ? col.bg : 'var(--bg)', borderRadius:14, padding:12, border:`2px dashed ${dragOver === col.value ? col.color : 'transparent'}`, transition:'all 0.15s', minHeight:180 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ width:9, height:9, borderRadius:5, background: col.color }} />
            <span style={{ fontWeight:700, fontSize:12 }}>{col.label}</span>
            <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--text-muted)', background:'var(--surface)', padding:'1px 7px', borderRadius:7 }}>
              {tasks.filter(t => t.status === col.value).length}
            </span>
          </div>
          <AnimatePresence>
            {tasks.filter(t => t.status === col.value).map(t => (
              <KanbanCard key={t._id} task={t} onEdit={onEdit} onDragStart={setDragTask} />
            ))}
          </AnimatePresence>
          {tasks.filter(t => t.status === col.value).length === 0 && (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:12 }}>Drop here</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Task Lists Panel ───────────────────────────────────────────── */
function TaskListsPanel({ onSelectList }) {
  const [lists, setLists]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await tasksApi.listTaskLists(); setLists(r.data.data || []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this task list and all its tasks?')) return;
    await tasksApi.deleteTaskList(id);
    load();
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Task Lists</h2>
        <button className="btn btn-purple" onClick={() => { setEditing(null); setModal(true); }} style={{ fontSize:13, padding:'8px 16px' }}>
          <I.Plus size={13} /> New List
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading…</div>
      ) : lists.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <p>No task lists yet. Create one to group related tasks.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {lists.map(list => {
            const pct = list.progress?.total > 0 ? Math.round((list.progress.completed / list.progress.total) * 100) : 0;
            return (
              <div key={list._id} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, cursor:'pointer' }}
                onClick={() => onSelectList(list)}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:15, fontWeight:600 }}>{list.name}</span>
                    {list.isTemplate && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, background:'#EDE9FE', color:'#7C3AED', fontWeight:700 }}>TEMPLATE</span>}
                  </div>
                  {list.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{list.description}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'var(--purple)', borderRadius:3, transition:'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                      {list.progress?.completed || 0} / {list.progress?.total || 0} tasks
                    </span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={e => { e.stopPropagation(); setEditing(list); setModal(true); }}
                    style={{ width:30, height:30, borderRadius:8, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}>
                    <I.Settings size={13} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(list._id); }}
                    style={{ width:30, height:30, borderRadius:8, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}>
                    <I.X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <TaskListModal
            list={editing}
            onClose={() => { setModal(null); setEditing(null); }}
            onSave={() => { setModal(null); setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Tasks Page ────────────────────────────────────────────── */
const TABS = ['Tasks', 'Task Lists'];
const VIEWS = ['list', 'board'];

export default function Tasks() {
  const [tab, setTab]               = useState('Tasks');
  const [view, setView]             = useState('list');
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDue, setFilterDue]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedList, setSelectedList] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority  = filterPriority;
      if (filterDue)      params.due       = filterDue;
      if (selectedList)   params.taskListId = selectedList._id;
      const r = await tasksApi.list(params);
      setTasks(r.data.data?.tasks || []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, filterDue, selectedList]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(task) {
    const newStatus = task.status === 'completed' ? 'to_do' : 'completed';
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      if (newStatus === 'completed') await tasksApi.complete(task._id);
      else await tasksApi.reopen(task._id);
    } catch { load(); }
  }

  async function handleMove(task, newStatus) {
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(task._id, { status: newStatus }); }
    catch { load(); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return;
    setTasks(ts => ts.filter(t => t._id !== id));
    try { await tasksApi.remove(id); } catch { load(); }
  }

  const today   = new Date(); today.setHours(0,0,0,0);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.matterId?.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDue === 'overdue' && !isOverdue(t)) return false;
    if (filterDue === 'today'   && !(t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString())) return false;
    if (filterDue === 'week'    && !(t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= weekEnd)) return false;
    return true;
  });

  const byStatus = v => tasks.filter(t => t.status === v).length;
  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div style={{ padding:'80px 28px 100px', maxWidth:1400, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'var(--ink)' }}>Tasks</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted)' }}>Track and manage tasks across all matters</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {tab === 'Tasks' && (
            <>
              <div style={{ display:'flex', gap:3, background:'var(--elevated)', borderRadius:10, padding:3 }}>
                {[{ id:'list', icon:<I.Doc size={13} />, label:'List' }, { id:'board', icon:<I.Chart size={13} />, label:'Board' }].map(v => (
                  <button key={v.id} onClick={() => setView(v.id)} style={{
                    display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:600,
                    background: view === v.id ? 'var(--surface)' : 'transparent',
                    color: view === v.id ? 'var(--purple)' : 'var(--text-muted)',
                    border:'none', cursor:'pointer', transition:'all 0.15s',
                    boxShadow: view === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>{v.icon} {v.label}</button>
                ))}
              </div>
              <button className="btn btn-purple" onClick={() => { setEditingTask(null); setShowModal(true); }} style={{ fontSize:13 }}>
                <I.Plus size={14} /> New Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'10px 20px', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:'none',
            color: tab === t ? 'var(--purple)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--purple)' : '2px solid transparent',
            marginBottom:-2, transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'Task Lists' ? (
        <TaskListsPanel onSelectList={list => { setSelectedList(list); setTab('Tasks'); }} />
      ) : (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
            {[
              { l:'Total',       v: tasks.length,         c:'var(--ink)' },
              { l:'To Do',       v: byStatus('to_do'),    c:'#6B7280' },
              { l:'In Progress', v: byStatus('in_progress'), c:'#3B82F6' },
              { l:'In Review',   v: byStatus('in_review'),   c:'#8B5CF6' },
              { l:'Blocked',     v: byStatus('blocked'),      c:'#EF4444' },
              { l:'Overdue',     v: overdueCount,             c:'#EF4444' },
            ].map(({ l, v, c }) => (
              <div key={l} className="card" style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          {selectedList && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, background:'var(--purple-soft)', padding:'10px 16px', borderRadius:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--purple)' }}>Filtered by: {selectedList.name}</span>
              <button onClick={() => setSelectedList(null)} style={{ marginLeft:'auto', fontSize:12, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear</button>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <I.Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
              <input className="input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:38 }} />
            </div>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:140, cursor:'pointer' }}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width:130, cursor:'pointer' }}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select className="input" value={filterDue} onChange={e => setFilterDue(e.target.value)} style={{ width:130, cursor:'pointer' }}>
              <option value="">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="card" style={{ overflow:'hidden' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display:'flex', gap:12, padding:'13px 18px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                  <div className="skeleton" style={{ width:20, height:20, borderRadius:6 }} />
                  <div style={{ flex:1 }}>
                    <div className="skeleton" style={{ height:13, width:'45%', marginBottom:8 }} />
                    <div className="skeleton" style={{ height:10, width:'25%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'56px 24px' }}>
              <div style={{ width:60, height:60, borderRadius:16, background:'var(--purple-soft)', color:'var(--purple)', display:'grid', placeItems:'center', margin:'0 auto 16px' }}>
                <I.Check size={28} />
              </div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{tasks.length === 0 ? 'No tasks yet' : 'No matches'}</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters.'}</p>
              {tasks.length === 0 && <button className="btn btn-purple" onClick={() => setShowModal(true)}>Create First Task</button>}
            </div>
          ) : view === 'list' ? (
            <div className="card" style={{ overflow:'hidden' }}>
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
            <KanbanBoard tasks={filtered} onMove={handleMove} onEdit={t => { setEditingTask(t); setShowModal(true); }} />
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <TaskModal
            task={editingTask}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
            onSave={() => { setShowModal(false); setEditingTask(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
