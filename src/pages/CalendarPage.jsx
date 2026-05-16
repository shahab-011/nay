import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { calendarApi } from '../api/calendar.api';

/* ─── Constants ─────────────────────────────────────────────────── */
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const VIEWS  = ['Month','Week','Day','Agenda'];
const HOURS  = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  return `${h}:00 ${i < 12 ? 'AM' : 'PM'}`;
});

const EVENT_TYPES = [
  { value: 'court_date',     label: 'Court Date' },
  { value: 'hearing',        label: 'Hearing' },
  { value: 'deposition',     label: 'Deposition' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'filing_deadline',label: 'Filing Deadline' },
  { value: 'conference_call',label: 'Conference Call' },
  { value: 'appointment',    label: 'Appointment' },
  { value: 'reminder',       label: 'Reminder' },
  { value: 'sol',            label: 'SOL' },
  { value: 'other',          label: 'Other' },
];

const TYPE_COLORS = {
  court_date:      { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  hearing:         { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  deposition:      { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  client_meeting:  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  filing_deadline: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  conference_call: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  appointment:     { bg: '#F5F3FF', border: '#7C3AED', text: '#4C1D95' },
  reminder:        { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
  sol:             { bg: '#FFF7ED', border: '#F97316', text: '#9A3412' },
  other:           { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
};

const typeLabel = v => EVENT_TYPES.find(t => t.value === v)?.label || v;
const typeColor = v => TYPE_COLORS[v] || TYPE_COLORS.other;

/* ─── Date Helpers ───────────────────────────────────────────────── */
const todayDate  = () => new Date();
const startOfMonth = (y, m) => new Date(y, m, 1);
const daysInMonth  = (y, m) => new Date(y, m + 1, 0).getDate();

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatTime24(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatTime12(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
}

function weekDates(anchor) {
  const d = new Date(anchor);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}

function eventsOnDay(events, date) {
  return events.filter(e => {
    const start = e.startDate ? new Date(e.startDate) : null;
    return start && isSameDay(start, date);
  });
}

/* ─── Event Modal ─────────────────────────────────────────────────── */
const BLANK = {
  title: '', eventType: 'other', startDate: '', endDate: '',
  startTime: '09:00', endTime: '10:00', allDay: false,
  matterId: '', location: '', description: '',
  reminders: [{ method: 'email', minutesBefore: 30 }],
};

function EventModal({ event, onClose, onSave, onDelete }) {
  const [form, setForm]   = useState(event ? { ...BLANK, ...event } : { ...BLANK });
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
    await onDelete(event._id);
    onClose();
  }

  const colors = typeColor(form.eventType);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(11,11,20,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale:0.96, opacity:0, y:16 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.96, opacity:0 }}
        style={{ background:'var(--surface)', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-float)' }}
      >
        <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{event?._id ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            <I.X size={18} />
          </button>
        </div>

        <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          {/* Type pills */}
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {EVENT_TYPES.map(t => {
              const c = typeColor(t.value);
              const active = form.eventType === t.value;
              return (
                <button key={t.value} onClick={() => set('eventType', t.value)} style={{
                  padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                  background: active ? c.bg : 'transparent',
                  border: `1.5px solid ${active ? c.border : 'var(--border)'}`,
                  color: active ? c.text : 'var(--text-muted)',
                  transition:'all 150ms',
                }}>{t.label}</button>
              );
            })}
          </div>

          {/* Title */}
          <input
            value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Event title *"
            autoFocus
            style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:15, fontWeight:600, outline:'none', boxSizing:'border-box', background:'var(--bg)' }}
          />

          {/* All day toggle */}
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
            <div onClick={() => set('allDay', !form.allDay)}
              style={{ width:38, height:20, borderRadius:10, background: form.allDay ? 'var(--purple)' : 'var(--border)', position:'relative', transition:'background 200ms', cursor:'pointer' }}>
              <div style={{ position:'absolute', top:2, left: form.allDay ? 20 : 2, width:16, height:16, borderRadius:8, background:'#fff', transition:'left 200ms', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>All day</span>
          </label>

          {/* Dates */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Start Date</label>
              <input type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)}
                style={{ width:'100%', marginTop:4, padding:'8px 10px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>End Date</label>
              <input type="date" value={form.endDate || ''} onChange={e => set('endDate', e.target.value)}
                style={{ width:'100%', marginTop:4, padding:'8px 10px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', boxSizing:'border-box' }} />
            </div>
          </div>

          {!form.allDay && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Start Time</label>
                <input type="time" value={form.startTime || '09:00'} onChange={e => set('startTime', e.target.value)}
                  style={{ width:'100%', marginTop:4, padding:'8px 10px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>End Time</label>
                <input type="time" value={form.endTime || '10:00'} onChange={e => set('endTime', e.target.value)}
                  style={{ width:'100%', marginTop:4, padding:'8px 10px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', boxSizing:'border-box' }} />
              </div>
            </div>
          )}

          {/* Location */}
          <input value={form.location || ''} onChange={e => set('location', e.target.value)}
            placeholder="Location or meeting URL (optional)"
            style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', boxSizing:'border-box' }} />

          {/* Description */}
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
            placeholder="Notes / description" rows={3}
            style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />

          {/* Reminder */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <I.Bell size={15} style={{ color:'var(--text-muted)' }} />
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Remind me</span>
            <select
              value={form.reminders?.[0]?.minutesBefore ?? 30}
              onChange={e => set('reminders', [{ method:'email', minutesBefore: Number(e.target.value) }])}
              style={{ padding:'5px 8px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', cursor:'pointer' }}
            >
              <option value={0}>At event time</option>
              <option value={10}>10 min before</option>
              <option value={30}>30 min before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
              <option value={10080}>1 week before</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4, borderTop:'1px solid var(--border)', marginTop:4 }}>
            {event?._id && (
              <button onClick={handleDelete} style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid #EF4444', color:'#EF4444', background:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                Delete
              </button>
            )}
            <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid var(--border)', color:'var(--text-muted)', background:'none', cursor:'pointer', fontSize:13 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ padding:'9px 20px', borderRadius:10, background:'var(--purple)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : event?._id ? 'Update' : 'Create Event'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Event Chip ─────────────────────────────────────────────────── */
function EventChip({ event, onClick }) {
  const c = typeColor(event.eventType);
  return (
    <div onClick={e => { e.stopPropagation(); onClick(event); }} style={{
      background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text,
      borderRadius:5, padding:'2px 7px', fontSize:11, fontWeight:600,
      cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:2,
    }}>{event.title}</div>
  );
}

/* ─── Month View ─────────────────────────────────────────────────── */
function MonthView({ year, month, events, onDayClick, onEventClick }) {
  const firstDay = startOfMonth(year, month).getDay();
  const numDays  = daysInMonth(year, month);
  const todayD   = todayDate();
  const cells    = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding:'8px 0', textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)', minHeight:110 }}>
          {week.map((date, di) => {
            if (!date) return <div key={di} style={{ background:'var(--elevated)', borderRight: di < 6 ? '1px solid var(--border)' : 'none' }} />;
            const isToday  = isSameDay(date, todayD);
            const dayEvts  = eventsOnDay(events, date);
            return (
              <div key={di} onClick={() => onDayClick(date)} style={{
                padding:'6px 6px 4px', borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                background: isToday ? 'rgba(124,58,237,0.04)' : 'transparent',
                cursor:'pointer', transition:'background 120ms', minHeight:110,
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(124,58,237,0.04)' : 'transparent'; }}
              >
                <div style={{
                  width:26, height:26, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight: isToday ? 700 : 500,
                  background: isToday ? 'var(--purple)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--ink)', marginBottom:4,
                }}>{date.getDate()}</div>
                {dayEvts.slice(0, 3).map(ev => <EventChip key={ev._id} event={ev} onClick={onEventClick} />)}
                {dayEvts.length > 3 && (
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, paddingLeft:4 }}>+{dayEvts.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Week View ──────────────────────────────────────────────────── */
function WeekView({ anchor, events, onSlotClick, onEventClick }) {
  const days   = weekDates(anchor);
  const todayD = todayDate();

  return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'grid', gridTemplateColumns:'56px repeat(7,1fr)', borderBottom:'2px solid var(--border)', background:'var(--surface)', position:'sticky', top:0, zIndex:10 }}>
        <div />
        {days.map((d, i) => {
          const isToday = isSameDay(d, todayD);
          return (
            <div key={i} style={{ textAlign:'center', padding:'10px 4px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{DAYS[d.getDay()]}</div>
              <div style={{
                width:30, height:30, borderRadius:15, margin:'4px auto 0', display:'flex', alignItems:'center', justifyContent:'center',
                background: isToday ? 'var(--purple)' : 'transparent',
                color: isToday ? '#fff' : 'var(--ink)', fontSize:15, fontWeight:700,
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
        {HOURS.map((label, hour) => (
          <div key={hour} style={{ display:'grid', gridTemplateColumns:'56px repeat(7,1fr)', borderBottom:'1px solid var(--border)', minHeight:52 }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', padding:'4px 6px', fontWeight:600, borderRight:'1px solid var(--border)' }}>{label}</div>
            {days.map((d, di) => {
              const slotEvts = eventsOnDay(events, d).filter(e => {
                if (!e.startDate) return hour === 9;
                return new Date(e.startDate).getHours() === hour;
              });
              return (
                <div key={di} onClick={() => onSlotClick(d, hour)} style={{ borderRight: di < 6 ? '1px solid var(--border)' : 'none', padding:'2px 3px', cursor:'pointer', transition:'background 100ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {slotEvts.map(ev => <EventChip key={ev._id} event={ev} onClick={onEventClick} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Day View ───────────────────────────────────────────────────── */
function DayView({ date, events, onSlotClick, onEventClick }) {
  const dayEvts = eventsOnDay(events, date);
  const isToday = isSameDay(date, todayDate());

  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <div style={{ textAlign:'center', padding:16, borderBottom:'1px solid var(--border)', background:'var(--surface)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{DAYS[date.getDay()]}</div>
        <div style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:44, height:44, borderRadius:22, marginTop:6,
          background: isToday ? 'var(--purple)' : 'transparent',
          color: isToday ? '#fff' : 'var(--ink)', fontSize:26, fontWeight:700,
        }}>{date.getDate()}</div>
      </div>
      {HOURS.map((label, hour) => {
        const slotEvts = dayEvts.filter(e => {
          if (!e.startDate) return hour === 9;
          return new Date(e.startDate).getHours() === hour;
        });
        return (
          <div key={hour} onClick={() => onSlotClick(date, hour)} style={{ display:'flex', gap:12, padding:'8px 20px', borderBottom:'1px solid var(--border)', minHeight:58, cursor:'pointer', transition:'background 100ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width:70, fontSize:11, color:'var(--text-muted)', fontWeight:600, paddingTop:2, flexShrink:0 }}>{label}</div>
            <div style={{ flex:1 }}>
              {slotEvts.map(ev => <EventChip key={ev._id} event={ev} onClick={onEventClick} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Agenda View ────────────────────────────────────────────────── */
function AgendaView({ events, onEventClick }) {
  const now = new Date(); now.setHours(0,0,0,0);
  const upcoming = [...events]
    .filter(e => e.startDate && new Date(e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (!upcoming.length) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text-muted)', padding:40 }}>
        <I.Calendar size={40} style={{ opacity:0.25 }} />
        <p style={{ margin:0, fontSize:15 }}>No upcoming events</p>
      </div>
    );
  }

  let lastDate = null;
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
      {upcoming.map(ev => {
        const d = new Date(ev.startDate);
        const dateStr = formatDate(d);
        const showHeader = dateStr !== lastDate;
        lastDate = dateStr;
        const c = typeColor(ev.eventType);
        const timeStr = ev.allDay
          ? 'All day'
          : `${formatTime12(d)}${ev.endDate ? ` – ${formatTime12(new Date(ev.endDate))}` : ''}`;
        return (
          <React.Fragment key={ev._id}>
            {showHeader && (
              <div style={{ padding:'16px 24px 6px', fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', background:'var(--elevated)' }}>
                {DAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}{isSameDay(d, todayDate()) ? ' — Today' : ''}
              </div>
            )}
            <div onClick={() => onEventClick(ev)} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 24px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width:4, height:36, borderRadius:2, background: c.border, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>{ev.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  {timeStr}
                  {ev.matterId?.title ? ` · ${ev.matterId.title}` : ''}
                  {ev.location ? ` · ${typeof ev.location === 'object' ? (ev.location.address || ev.location.virtualUrl || '') : ev.location}` : ''}
                </div>
              </div>
              <span style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                {typeLabel(ev.eventType)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Main CalendarPage ──────────────────────────────────────────── */
export default function CalendarPage() {
  const now = todayDate();
  const [view, setView]     = useState('Month');
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [anchor, setAnchor] = useState(now);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [prefill, setPrefill] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const r = await calendarApi.list({ from, to });
      setEvents(r.data.data || []);
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
    const t = todayDate();
    setYear(t.getFullYear()); setMonth(t.getMonth()); setAnchor(t);
  }

  function headerLabel() {
    if (view === 'Month') return `${MONTHS[month]} ${year}`;
    if (view === 'Week') {
      const days = weekDates(anchor);
      const f = days[0], l = days[6];
      if (f.getMonth() === l.getMonth())
        return `${MONTHS[f.getMonth()]} ${f.getDate()}–${l.getDate()}, ${f.getFullYear()}`;
      return `${MONTHS[f.getMonth()]} ${f.getDate()} – ${MONTHS[l.getMonth()]} ${l.getDate()}, ${f.getFullYear()}`;
    }
    return `${DAYS[anchor.getDay()]}, ${MONTHS[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
  }

  /* event actions */
  function openNew(dateOverride, hourOverride) {
    const d = dateOverride || todayDate();
    const h = hourOverride !== undefined ? String(hourOverride).padStart(2,'0') : '09';
    const nextH = hourOverride !== undefined ? String((hourOverride + 1) % 24).padStart(2,'0') : '10';
    setPrefill({ startDate: formatDate(d), startTime: `${h}:00`, endTime: `${nextH}:00` });
    setModal('new');
  }

  function openEdit(ev) {
    const start = ev.startDate ? new Date(ev.startDate) : null;
    const end   = ev.endDate   ? new Date(ev.endDate)   : null;
    setPrefill({
      ...ev,
      startDate: start ? formatDate(start) : '',
      startTime: start ? formatTime24(start) : '09:00',
      endDate:   end   ? formatDate(end)   : '',
      endTime:   end   ? formatTime24(end) : '10:00',
    });
    setModal('edit');
  }

  async function handleSave(form) {
    const startDate = form.startDate
      ? new Date(`${form.startDate}T${form.startTime || '00:00'}:00`).toISOString()
      : undefined;
    const endDate = form.endDate
      ? new Date(`${form.endDate}T${form.endTime || '00:00'}:00`).toISOString()
      : undefined;

    const { startTime, endTime, ...rest } = form;
    const payload = { ...rest, startDate, endDate };

    if (form._id) {
      await calendarApi.update(form._id, payload);
    } else {
      await calendarApi.create(payload);
    }
    load();
  }

  async function handleDelete(id) {
    await calendarApi.remove(id);
    load();
  }

  /* stats */
  const todayEvts  = eventsOnDay(events, todayDate()).length;
  const weekEvts   = weekDates(todayDate()).reduce((a, d) => a + eventsOnDay(events, d).length, 0);
  const courtDates = events.filter(e => e.eventType === 'court_date').length;
  const deadlines  = events.filter(e => e.eventType === 'filing_deadline').length;

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ maxWidth:1300, margin:'0 auto', width:'100%', padding:'0 24px', flex:1, display:'flex', flexDirection:'column', gap:20 }}>

        {/* Page header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'var(--ink)' }}>Calendar</h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted)' }}>Deadlines, court dates, and client meetings</p>
          </div>
          <button onClick={() => openNew()} className="btn btn-purple" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', fontSize:14, fontWeight:600, borderRadius:12 }}>
            <I.Plus size={16} /> New Event
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Today',       value: todayEvts,  sub:'events',     color:'var(--purple)' },
            { label:'This Week',   value: weekEvts,   sub:'events',     color:'#3B82F6' },
            { label:'Court Dates', value: courtDates, sub:'this month', color:'#EF4444' },
            { label:'Deadlines',   value: deadlines,  sub:'this month', color:'#F59E0B' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'16px 20px' }}>
              <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginTop:2 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', padding:0, overflow:'hidden', minHeight:600 }}>
          {/* Toolbar */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={prevPeriod} style={{ padding:7, borderRadius:8, border:'1.5px solid var(--border)', background:'none', cursor:'pointer', display:'flex', alignItems:'center', color:'var(--ink)' }}>
                <I.ArrowLeft size={15} />
              </button>
              <button onClick={goToday} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid var(--border)', background:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--ink)' }}>
                Today
              </button>
              <button onClick={nextPeriod} style={{ padding:7, borderRadius:8, border:'1.5px solid var(--border)', background:'none', cursor:'pointer', display:'flex', alignItems:'center', color:'var(--ink)' }}>
                <I.ArrowRight size={15} />
              </button>
            </div>

            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'var(--ink)', flex:1, textAlign:'center' }}>{headerLabel()}</h2>

            <div style={{ display:'flex', background:'var(--elevated)', borderRadius:10, padding:3 }}>
              {VIEWS.map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                  background: view === v ? 'var(--surface)' : 'transparent',
                  color: view === v ? 'var(--purple)' : 'var(--text-muted)',
                  boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition:'all 150ms',
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* View area */}
          {loading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:28, height:28, border:'3px solid var(--purple-mist)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'nyaya-spin 0.75s linear infinite' }} />
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
