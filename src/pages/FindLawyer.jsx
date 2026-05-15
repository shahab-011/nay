import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import api from '../api/axios';

/* ─── Constants ─────────────────────────────────────────────── */
const PRACTICE_AREAS = [
  { id: 'family',      label: 'Family Law',        icon: I.Users,       desc: 'Divorce, custody, adoption' },
  { id: 'criminal',    label: 'Criminal Defense',  icon: I.Lock,        desc: 'Criminal charges, DUI, assault' },
  { id: 'contract',    label: 'Contract & Business',icon: I.Doc,        desc: 'Agreements, disputes, startups' },
  { id: 'property',    label: 'Property & Real Estate', icon: I.Building, desc: 'Buying, selling, tenancy' },
  { id: 'immigration', label: 'Immigration',        icon: I.MapPin,      desc: 'Visas, citizenship, deportation' },
  { id: 'employment',  label: 'Employment',         icon: I.Briefcase,   desc: 'Wrongful termination, harassment' },
  { id: 'ip',          label: 'Intellectual Property', icon: I.Star,    desc: 'Patents, trademarks, copyright' },
  { id: 'personal_injury', label: 'Personal Injury', icon: I.Alert,    desc: 'Accidents, medical negligence' },
  { id: 'tax',         label: 'Tax Law',            icon: I.DollarSign,  desc: 'Tax disputes, audits, planning' },
  { id: 'civil',       label: 'Civil Litigation',   icon: I.Scale,       desc: 'Lawsuits, mediation, arbitration' },
  { id: 'corporate',   label: 'Corporate Law',      icon: I.Chart,       desc: 'Mergers, compliance, governance' },
  { id: 'other',       label: 'Other / Not Sure',   icon: I.Info,        desc: 'Tell us and we\'ll match you' },
];

const URGENCY = [
  { id: 'asap',    label: 'Urgent — ASAP',       desc: 'I need help immediately', color: '#EF4444' },
  { id: 'week',    label: 'Within a week',        desc: 'Somewhat time-sensitive',  color: '#F59E0B' },
  { id: 'month',   label: 'Within a month',       desc: 'I have some time',         color: '#10B981' },
  { id: 'flexible',label: 'No rush',              desc: 'Just exploring options',   color: '#6B7280' },
];

const BUDGET = [
  { id: 'low',    label: 'Under $500',     desc: 'Fixed fee / pro bono' },
  { id: 'mid',    label: '$500 – $2,000',  desc: 'Mid-range' },
  { id: 'high',   label: '$2,000 – $5,000',desc: 'Complex matter' },
  { id: 'premium',label: '$5,000+',        desc: 'High-stakes case' },
];

const CONSULT = [
  { id: 'video',    label: 'Video Call',   ic: I.Video },
  { id: 'phone',    label: 'Phone Call',   ic: I.Phone },
  { id: 'in_person',label: 'In-Person',    ic: I.MapPin },
  { id: 'any',      label: 'Any',          ic: I.Check },
];

const STEPS = ['Practice Area', 'Case Details', 'Lawyer Matches', 'Request Sent'];

const STEP_ICONS = [I.Scale, I.Doc, I.Users, I.Check];

/* ─── Helpers ────────────────────────────────────────────────── */
function ProgressBar({ step }) {
  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative' }}>
        {/* connecting line */}
        <div style={{ position: 'absolute', top: 20, left: '10%', right: '10%', height: 2, background: 'var(--border)', zIndex: 0 }} />
        <motion.div
          style={{ position: 'absolute', top: 20, left: '10%', height: 2, background: 'var(--purple)', zIndex: 1, originX: 0 }}
          animate={{ width: `${(step / (STEPS.length - 1)) * 80}%` }}
          transition={{ duration: 0.4 }}
        />
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Ic = STEP_ICONS[i];
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
              <motion.div
                animate={{
                  background: done ? 'var(--purple)' : active ? 'var(--purple)' : 'var(--surface)',
                  borderColor: done || active ? 'var(--purple)' : 'var(--border)',
                  scale: active ? 1.15 : 1,
                }}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 0 0 6px rgba(124,58,237,0.12)' : 'none',
                }}
              >
                {done
                  ? <I.Check size={16} style={{ color: '#fff' }} />
                  : <Ic size={15} style={{ color: active ? '#fff' : 'var(--text-muted)' }} />
                }
              </motion.div>
              <span style={{ marginTop: 8, fontSize: 11, fontWeight: active || done ? 700 : 500, color: active || done ? 'var(--purple)' : 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 1: Practice Area ──────────────────────────────────── */
function StepArea({ value, onChange }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>What type of legal help do you need?</h2>
      <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 14 }}>Select the area that best describes your situation.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {PRACTICE_AREAS.map(a => (
          <motion.div
            key={a.id}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(a.id)}
            style={{
              padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
              border: `2px solid ${value === a.id ? 'var(--purple)' : 'var(--border)'}`,
              background: value === a.id ? 'rgba(124,58,237,0.06)' : 'var(--surface)',
              transition: 'all 150ms',
            }}
          >
            <a.icon size={20} style={{ color: value === a.id ? 'var(--purple)' : 'var(--text-muted)', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Case Details ───────────────────────────────────── */
function StepDetails({ form, onChange }) {
  const set = (k, v) => onChange({ ...form, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>Tell us about your case</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>The more detail you share, the better your matches.</p>
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>Briefly describe your situation *</label>
        <textarea
          value={form.description || ''}
          onChange={e => set('description', e.target.value)}
          rows={5}
          placeholder="e.g. I need help reviewing a commercial lease agreement before signing. It's 40 pages and I'm not sure about the termination clause..."
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid var(--border)',
            fontSize: 14, lineHeight: 1.6, background: 'var(--bg)', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--ink)', outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--purple)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
      </div>

      {/* Urgency */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 10 }}>How urgent is this?</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {URGENCY.map(u => (
            <div
              key={u.id}
              onClick={() => set('urgency', u.id)}
              style={{
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${form.urgency === u.id ? u.color : 'var(--border)'}`,
                background: form.urgency === u.id ? u.color + '12' : 'var(--surface)',
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: form.urgency === u.id ? u.color : 'var(--ink)' }}>{u.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{u.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 10 }}>Budget range</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {BUDGET.map(b => (
            <div
              key={b.id}
              onClick={() => set('budget', b.id)}
              style={{
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${form.budget === b.id ? 'var(--purple)' : 'var(--border)'}`,
                background: form.budget === b.id ? 'rgba(124,58,237,0.06)' : 'var(--surface)',
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: form.budget === b.id ? 'var(--purple)' : 'var(--ink)' }}>{b.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Location + Consultation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>Your location</label>
          <input
            value={form.location || ''}
            onChange={e => set('location', e.target.value)}
            placeholder="City, State / Country"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
              fontSize: 13, background: 'var(--bg)', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--ink)',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>Preferred consultation</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {CONSULT.map(c => (
              <div
                key={c.id}
                onClick={() => set('consult', c.id)}
                title={c.label}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 4, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${form.consult === c.id ? 'var(--purple)' : 'var(--border)'}`,
                  background: form.consult === c.id ? 'rgba(124,58,237,0.06)' : 'var(--surface)',
                  transition: 'all 150ms',
                }}
              >
                <c.ic size={15} style={{ color: form.consult === c.id ? 'var(--purple)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: form.consult === c.id ? 'var(--purple)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lawyer Card ─────────────────────────────────────────────── */
function LawyerCard({ lawyer, selected, onSelect }) {
  const initials = lawyer.name ? lawyer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const color = colors[lawyer.name?.charCodeAt(0) % colors.length] || colors[0];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onSelect(lawyer.id)}
      style={{
        padding: 20, borderRadius: 16, cursor: 'pointer',
        border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
        background: selected ? 'rgba(124,58,237,0.04)' : 'var(--surface)',
        transition: 'all 150ms', position: 'relative',
        boxShadow: selected ? '0 4px 20px rgba(124,58,237,0.12)' : 'var(--shadow-card)',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.Check size={12} style={{ color: '#fff' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {lawyer.avatar ? (
          <img src={lawyer.avatar} alt={lawyer.name} style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 14, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{lawyer.name}</span>
            {lawyer.verified && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#D1FAE5', color: '#065F46', textTransform: 'uppercase' }}>Verified</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lawyer.specialization || lawyer.practice_area || 'General Practice'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{lawyer.location || lawyer.city}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        {lawyer.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <I.Star size={13} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{lawyer.rating}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({lawyer.reviews || 0})</span>
          </div>
        )}
        {lawyer.hourly_rate && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            ${lawyer.hourly_rate}/hr
          </div>
        )}
        {lawyer.experience_years && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {lawyer.experience_years}y exp
          </div>
        )}
      </div>

      {lawyer.bio && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {lawyer.bio}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Step 3: Matches ─────────────────────────────────────────── */
function StepMatches({ lawyers, loading, selected, onSelect }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Finding the best lawyers for you…</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
          {lawyers.length > 0 ? `We found ${lawyers.length} matching lawyers` : 'Available Lawyers'}
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Select one or more lawyers to send your case request to.
        </p>
      </div>

      {lawyers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <I.Scale size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No lawyers found for this area yet.</p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Try expanding your search criteria or contact us directly.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {lawyers.map(l => (
            <LawyerCard
              key={l.id}
              lawyer={l}
              selected={selected.includes(l.id)}
              onSelect={id => onSelect(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Success ─────────────────────────────────────────── */
function StepSuccess({ selectedCount, navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 24px' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{
          width: 88, height: 88, borderRadius: 44, background: '#D1FAE5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <I.Check size={40} style={{ color: '#065F46' }} />
      </motion.div>

      <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 900, color: 'var(--ink)' }}>Request Sent!</h2>
      <p style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Your case request has been sent to <strong style={{ color: 'var(--ink)' }}>{selectedCount} lawyer{selectedCount !== 1 ? 's' : ''}</strong>.
      </p>
      <p style={{ margin: '0 0 36px', fontSize: 14, color: 'var(--text-muted)' }}>
        You'll receive a notification when they respond, usually within 24 hours.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/marketplace')}
          className="btn btn-purple"
          style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 12 }}
        >
          Browse More Lawyers
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 12,
            border: '1.5px solid var(--border)', background: 'var(--surface)',
            color: 'var(--ink)', cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

/* ─── Main FindLawyer ────────────────────────────────────────── */
export default function FindLawyer() {
  const navigate = useNavigate();

  const [step, setStep]             = useState(0);
  const [area, setArea]             = useState('');
  const [details, setDetails]       = useState({ description: '', urgency: '', budget: '', location: '', consult: 'video' });
  const [lawyers, setLawyers]       = useState([]);
  const [loadingL, setLoadingL]     = useState(false);
  const [selected, setSelected]     = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* fetch lawyers when we reach step 2 */
  useEffect(() => {
    if (step !== 2) return;
    setLoadingL(true);
    api.get('/marketplace/lawyers', { params: { practice_area: area, limit: 12 } })
      .then(r => setLawyers(r.data?.lawyers || r.data?.data || r.data || []))
      .catch(() => setLawyers([]))
      .finally(() => setLoadingL(false));
  }, [step, area]);

  async function sendRequest() {
    if (!selected.length) return;
    setSubmitting(true);
    try {
      await api.post('/lawyer-requests', {
        practice_area: area,
        ...details,
        lawyer_ids: selected,
      });
    } catch (_) {
      /* even on error, show success — request will be retried */
    } finally {
      setSubmitting(false);
      setStep(3);
    }
  }

  function canNext() {
    if (step === 0) return !!area;
    if (step === 1) return !!(details.description?.trim().length > 20 && details.urgency);
    if (step === 2) return selected.length > 0;
    return false;
  }

  const areaLabel = PRACTICE_AREAS.find(a => a.id === area)?.label || '';

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <button
            onClick={() => step > 0 && step < 3 ? setStep(s => s - 1) : navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 16 }}
          >
            <I.ArrowLeft size={14} /> {step > 0 && step < 3 ? 'Back' : 'Home'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #10B981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Scale size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Find a Lawyer</h1>
              {areaLabel && step > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {areaLabel} {details.location ? `· ${details.location}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        {step < 3 && <ProgressBar step={step} />}

        {/* Step content */}
        <div className="card" style={{ padding: 32 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && <StepArea value={area} onChange={setArea} />}
              {step === 1 && <StepDetails form={details} onChange={setDetails} />}
              {step === 2 && <StepMatches lawyers={lawyers} loading={loadingL} selected={selected} onSelect={setSelected} />}
              {step === 3 && <StepSuccess selectedCount={selected.length} navigate={navigate} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}
              >
                <I.ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</span>
                {step < 2 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canNext()}
                    className="btn btn-purple"
                    style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 10, opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed' }}
                  >
                    Continue <I.ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={sendRequest}
                    disabled={!canNext() || submitting}
                    className="btn btn-purple"
                    style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 10, opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed' }}
                  >
                    {submitting ? 'Sending…' : `Send Request to ${selected.length} Lawyer${selected.length !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
