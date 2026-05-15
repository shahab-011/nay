import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { calendarApi } from '../api/calendar.api';

/* ─── Constants ─────────────────────────────────────────────── */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVENT_TYPES = ['Court Date','Client Meeting','Deadline','Deposition','Hearing','Mediation','Internal','Other'];

const TYPE_COLORS = {
  'Court Date':    { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  'Client Meeting':{ bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  'Deadline':      { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  'Deposition':    { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  'Hearing':       { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  'Mediation':     { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  'Internal':      { bg: 'var(--purple-soft)', border: 'var(--purple)', text: 'var(--purple-deep)' },
  'Other':         { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  return `${h}:00 ${i < 12 ? 'AM' : 'PM'}`;
});

/* ─── Helpers ────────────────────────────────────────────────── */
function today() { return new Date(); }

function startOfMonth(y, m) { return new Date(y, m, 1); }

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(str) { return str ? new Date(str + 'T00:00:00') : null; }

function weekDates(anchor) {
  const d = new Date(anchor);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}

function eventsOnDay(events, date) {
  return events.filter(e => {
    const start = parseDate(e.start_date || e.date);
    return start && isSameDay(start, date);
  });
}

/* ─── Event Modal ─────────────────────────────────────────────── */
const BLANK = { title: '', event_type: 'Client Meeting', start_date: '', end_date: '', start_time: '09:00', end_time: '10:00', all_day: false, matter_name: '', location: '', description: '', reminder_minutes: 30 };

function EventModal({ event, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(event ? { ...event } : { ...BLANK });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this event?')) return;
    await onDelete(event.id);
    onClose();
  }

  const colors = TYPE_COLORS[form.event_type] || TYPE_COLORS['Other'];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-float)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <I.X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type pill */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EVENT_TYPES.map(t => {
              const c = TYPE_COLORS[t] || TYPE_COLORS['Other'];
              return (
                <button
                  key={t}
                  onClick={() => set('event_type', t)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: form.event_type === t ? c.bg : 'transparent',
                    border: `1.5px solid ${form.event_type === t ? c.border : 'var(--border)'}`,
                    color: form.event_type === t ? c.text : 'var(--text-muted)',
                    transition: 'all 150ms',
                  }}
                >{t}</button>
              );
            })}
          </div>

          {/* Title */}
          <input
            value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Event title *"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box', background: 'var(--bg)' }}
            autoFocus
          />

          {/* All day toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <div
              onClick={() => set('all_day', !form.all_day)}
              style={{
                width: 38, height: 20, borderRadius: 10, background: form.all_day ? 'var(--purple)' : 'var(--border)',
                position: 'relative', transition: 'background 200ms', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: form.all_day ? 20 : 2,
                width: 16, height: 16, borderRadius: 8, background: '#fff',
                transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>All day</span>
          </label>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start Date</label>
              <input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>End Date</label>
              <input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
            </div>
          </div>

          {!form.all_day && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start Time</label>
                <input type="time" value={form.start_time || '09:00'} onChange={e => set('start_time', e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>End Time</label>
                <input type="time" value={form.end_time || '10:00'} onChange={e => set('end_time', e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {/* Matter + Location */}
          <input
            value={form.matter_name || ''} onChange={e => set('matter_name', e.target.value)}
            placeholder="Linked matter (optional)"
            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }}
          />
          <input
            value={form.location || ''} onChange={e => set('location', e.target.value)}
            placeholder="Location (optional)"
            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box' }}
          />

          {/* Description */}
          <textarea
            value={form.description || ''} onChange={e => set('description', e.target.value)}
            placeholder="Notes / description"
            rows={3}
            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />

          {/* Reminder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <I.Bell size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Remind me</span>
            <select value={form.reminder_minutes || 30} onChange={e => set('reminder_minutes', Number(e.target.value))}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', cursor: 'pointer' }}>
              <option value={0}>At event time</option>
              <option value={10}>10 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            {event?.id && (
              <button onClick={handleDelete}
                style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #EF4444', color: '#EF4444', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Delete
              </button>
            )}
            <button onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--purple)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : event?.id ? 'Update' : 'Create Event'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Event Chip ───────────────────────────────────────────────── */
function EventChip({ event, onClick }) {
  const c = TYPE_COLORS[event.event_type] || TYPE_COLORS['Other'];
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(event); }}
      style={{
        background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text,
        borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: 2,
      }}
    >{event.title}</div>
  );
}

/* ─── Month View ─────────────────────────────────────────────── */
function MonthView({ year, month, events, onDayClick, onEventClick }) {
  const firstDay = startOfMonth(year, month).getDay();
  const numDays  = daysInMonth(year, month);
  const todayD   = today();
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d));

  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
        ))}
      </div>
      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)', minHeight: 110 }}>
          {week.map((date, di) => {
            if (!date) return <div key={di} style={{ background: 'var(--elevated)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />;
            const isToday = isSameDay(date, todayD);
            const dayEvents = eventsOnDay(events, date);
            return (
              <div
                key={di}
                onClick={() => onDayClick(date)}
                style={{
                  padding: '6px 6px 4px',
                  borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                  background: isToday ? 'rgba(124,58,237,0.04)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 120ms',
                  minHeight: 110,
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: isToday ? 700 : 500,
                  background: isToday ? 'var(--purple)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--ink)',
                  marginBottom: 4,
                }}>{date.getDate()}</div>
                {dayEvents.slice(0, 3).map(ev => (
                  <EventChip key={ev.id} event={ev} onClick={onEventClick} />
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Week View ──────────────────────────────────────────────── */
function WeekView({ anchor, events, onSlotClick, onEventClick }) {
  const days   = weekDates(anchor);
  const todayD = today();

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Day header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', borderBottom: '2px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div />
        {days.map((d, i) => {
          const isToday = isSameDay(d, todayD);
          return (
            <div key={i} style={{ textAlign: 'center', padding: '10px 4px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{DAYS[d.getDay()]}</div>
              <div style={{
                width: 30, height: 30, borderRadius: 15, margin: '4px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isToday ? 'var(--purple)' : 'transparent',
                color: isToday ? '#fff' : 'var(--ink)',
                fontSize: 15, fontWeight: 700,
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Hour rows */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {HOURS.map((label, hour) => (
          <div key={hour} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', borderBottom: '1px solid var(--border)', minHeight: 52 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 6px', fontWeight: 600, borderRight: '1px solid var(--border)' }}>{label}</div>
            {days.map((d, di) => {
              const slotEvents = eventsOnDay(events, d).filter(e => {
                if (!e.start_time) return hour === 9;
                const h = parseInt(e.start_time.split(':')[0], 10);
                return h === hour;
              });
              return (
                <div
                  key={di}
                  onClick={() => onSlotClick(d, hour)}
                  style={{
                    borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                    padding: '2px 3px', cursor: 'pointer', transition: 'background 100ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {slotEvents.map(ev => <EventChip key={ev.id} event={ev} onClick={onEventClick} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Day View ───────────────────────────────────────────────── */
function DayView({ date, events, onSlotClick, onEventClick }) {
  const dayEvents = eventsOnDay(events, date);
  const todayD = today();
  const isToday = isSameDay(date, todayD);

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{DAYS[date.getDay()]}</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 22, marginTop: 6,
          background: isToday ? 'var(--purple)' : 'transparent',
          color: isToday ? '#fff' : 'var(--ink)',
          fontSize: 26, fontWeight: 700,
        }}>{date.getDate()}</div>
      </div>
      {HOURS.map((label, hour) => {
        const slotEvents = dayEvents.filter(e => {
          if (!e.start_time) return hour === 9;
          return parseInt(e.start_time.split(':')[0], 10) === hour;
        });
        return (
          <div
            key={hour}
            onClick={() => onSlotClick(date, hour)}
            style={{ display: 'flex', gap: 12, padding: '8px 20px', borderBottom: '1px solid var(--border)', minHeight: 58, cursor: 'pointer', transition: 'background 100ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 70, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1 }}>
              {slotEvents.map(ev => <EventChip key={ev.id} event={ev} onClick={onEventClick} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Agenda View ────────────────────────────────────────────── */
function AgendaView({ events, onEventClick }) {
  const upcoming = [...events]
    .filter(e => {
      const d = parseDate(e.start_date || e.date);
      return d && d >= new Date(today().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => {
      const da = parseDate(a.start_date || a.date);
      const db = parseDate(b.start_date || b.date);
      return da - db;
    });

  if (!upcoming.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
        <I.Calendar size={40} style={{ opacity: 0.25 }} />
        <p style={{ margin: 0, fontSize: 15 }}>No upcoming events</p>
      </div>
    );
  }

  let lastDate = null;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
      {upcoming.map(ev => {
        const d = parseDate(ev.start_date || ev.date);
        const dateStr = formatDate(d);
        const showHeader = dateStr !== lastDate;
        lastDate = dateStr;
        const c = TYPE_COLORS[ev.event_type] || TYPE_COLORS['Other'];
        return (
          <React.Fragment key={ev.id}>
            {showHeader && (
              <div style={{ padding: '16px 24px 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--elevated)' }}>
                {DAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}{isSameDay(d, today()) ? ' — Today' : ''}
              </div>
            )}
            <div
              onClick={() => onEventClick(ev)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px',
                borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 4, height: 36, borderRadius: 2, background: c.border, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {ev.all_day ? 'All day' : `${ev.start_time || '—'} – ${ev.end_time || '—'}`}
                  {ev.matter_name ? ` · ${ev.matter_name}` : ''}
                  {ev.location ? ` · ${ev.location}` : ''}
                </div>
              </div>
              <span style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {ev.event_type}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Main CalendarPage ──────────────────────────────────────── */
const VIEWS = ['Month', 'Week', 'Day', 'Agenda'];

export default function CalendarPage() {
  const now = today();
  const [view, setView]       = useState('Month');
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [anchor, setAnchor]   = useState(now);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [prefill, setPrefill] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarApi.list({ year, month: month + 1 });
      setEvents(res.data?.data || res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  /* navigation */
  function prevPeriod() {
    if (view === 'Month') {
      if (month === 0) { setYear(y => y - 1); setMonth(11); }
      else setMonth(m => m - 1);
    } else if (view === 'Week') {
      const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d);
    } else if (view === 'Day') {
      const d = new Date(anchor); d.setDate(d.getDate() - 1); setAnchor(d);
    }
  }

  function nextPeriod() {
    if (view === 'Month') {
      if (month === 11) { setYear(y => y + 1); setMonth(0); }
      else setMonth(m => m + 1);
    } else if (view === 'Week') {
      const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d);
    } else if (view === 'Day') {
      const d = new Date(anchor); d.setDate(d.getDate() + 1); setAnchor(d);
    }
  }

  function goToday() {
    const t = today();
    setYear(t.getFullYear()); setMonth(t.getMonth()); setAnchor(t);
  }

  /* header label */
  function headerLabel() {
    if (view === 'Month') return `${MONTHS[month]} ${year}`;
    if (view === 'Week') {
      const days = weekDates(anchor);
      const f = days[0], l = days[6];
      if (f.getMonth() === l.getMonth()) return `${MONTHS[f.getMonth()]} ${f.getDate()}–${l.getDate()}, ${f.getFullYear()}`;
      return `${MONTHS[f.getMonth()]} ${f.getDate()} – ${MONTHS[l.getMonth()]} ${l.getDate()}, ${f.getFullYear()}`;
    }
    return `${DAYS[anchor.getDay()]}, ${MONTHS[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
  }

  /* event actions */
  function openNew(dateOverride, hourOverride) {
    const d = dateOverride || today();
    const h = hourOverride !== undefined ? String(hourOverride).padStart(2, '0') : '09';
    setPrefill({ start_date: formatDate(d), start_time: `${h}:00`, end_time: `${h === '23' ? '23' : String(Number(h) + 1).padStart(2, '0')}:00` });
    setModal('new');
  }

  function openEdit(ev) { setPrefill(ev); setModal('edit'); }

  async function handleSave(form) {
    if (form.id) {
      await calendarApi.update(form.id, form);
    } else {
      await calendarApi.create(form);
    }
    load();
  }

  async function handleDelete(id) {
    await calendarApi.remove(id);
    load();
  }

  /* stats */
  const todayEvents  = eventsOnDay(events, today()).length;
  const weekEvts     = weekDates(today()).reduce((acc, d) => acc + eventsOnDay(events, d).length, 0);
  const courtDates   = events.filter(e => e.event_type === 'Court Date').length;
  const deadlines    = events.filter(e => e.event_type === 'Deadline').length;

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', width: '100%', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Calendar</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Deadlines, court dates, and client meetings</p>
          </div>
          <button
            onClick={() => openNew()}
            className="btn btn-purple"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, borderRadius: 12 }}
          >
            <I.Plus size={16} /> New Event
          </button>
        </div>

        {/* Stats strip */}
        {[
          { label: 'Today', value: todayEvents, sub: 'events' },
          { label: 'This Week', value: weekEvts, sub: 'events' },
          { label: 'Court Dates', value: courtDates, sub: 'this month' },
          { label: 'Deadlines', value: deadlines, sub: 'this month' },
        ].map(s => (
          <div key={s.label} style={{ display: 'none' }} />
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Today', value: todayEvents, sub: 'events', color: 'var(--purple)' },
            { label: 'This Week', value: weekEvts, sub: 'events', color: '#3B82F6' },
            { label: 'Court Dates', value: courtDates, sub: 'this month', color: '#EF4444' },
            { label: 'Deadlines', value: deadlines, sub: 'this month', color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: 600 }}>
          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={prevPeriod} style={{ padding: 7, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ink)' }}>
                <I.ArrowLeft size={15} />
              </button>
              <button onClick={goToday} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                Today
              </button>
              <button onClick={nextPeriod} style={{ padding: 7, borderRadius: 8, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ink)' }}>
                <I.ArrowRight size={15} />
              </button>
            </div>

            {/* Title */}
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>{headerLabel()}</h2>

            {/* View switcher */}
            <div style={{ display: 'flex', background: 'var(--elevated)', borderRadius: 10, padding: 3 }}>
              {VIEWS.map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: view === v ? 'var(--surface)' : 'transparent',
                    color: view === v ? 'var(--purple)' : 'var(--text-muted)',
                    boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 150ms',
                  }}
                >{v}</button>
              ))}
            </div>
          </div>

          {/* View area */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
            </div>
          ) : (
            <>
              {view === 'Month'  && <MonthView year={year} month={month} events={events} onDayClick={d => { setAnchor(d); openNew(d); }} onEventClick={openEdit} />}
              {view === 'Week'   && <WeekView anchor={anchor} events={events} onSlotClick={(d, h) => { setAnchor(d); openNew(d, h); }} onEventClick={openEdit} />}
              {view === 'Day'    && <DayView date={anchor} events={events} onSlotClick={(d, h) => openNew(d, h)} onEventClick={openEdit} />}
              {view === 'Agenda' && <AgendaView events={events} onEventClick={openEdit} />}
            </>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {modal && (
          <EventModal
            event={modal === 'edit' ? prefill : { ...BLANK, ...prefill }}
            onClose={() => { setModal(null); setPrefill(null); }}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
