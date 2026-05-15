import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const PRACTICE_AREAS = [
  'Corporate Law', 'Family Law', 'Criminal Defense', 'Civil Litigation',
  'Real Estate', 'Immigration', 'Intellectual Property', 'Employment Law',
  'Tax Law', 'Banking & Finance', 'Environmental Law', 'Constitutional Law',
];

const FIRM_SIZES = [
  { value: 'solo',  label: 'Solo',  sub: 'Just me' },
  { value: '2-5',   label: '2–5',   sub: 'Small team' },
  { value: '6-20',  label: '6–20',  sub: 'Mid-size' },
  { value: '20+',   label: '20+',   sub: 'Large firm' },
];

const PLANS = [
  { value: 'free',     label: 'Free',     price: '$0/mo',    features: ['5 matters', '3 users', 'Basic billing'] },
  { value: 'starter',  label: 'Starter',  price: '$49/mo',   features: ['50 matters', '5 users', 'Full billing', 'E-Sign'] },
  { value: 'advanced', label: 'Advanced', price: '$99/mo',   features: ['Unlimited matters', '15 users', 'All features', 'Reports'] },
  { value: 'expand',   label: 'Expand',   price: '$199/mo',  features: ['Unlimited everything', 'Custom roles', 'API access', 'Priority support'] },
];

const lbl = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', display: 'block', marginBottom: 6 };
const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };

/* ─── Step 1: Firm Profile ────────────────────────────────────── */
function StepFirmProfile({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[['name', 'Firm Name'], ['phone', 'Phone Number'], ['website', 'Website'], ['barNumber', 'Bar Registration Number'], ['jurisdiction', 'Primary Jurisdiction'], ['country', 'Country']].map(([k, label]) => (
          <div key={k}>
            <label style={lbl}>{label}</label>
            <input value={data[k] || ''} onChange={e => set(k, e.target.value)} style={inp} placeholder={label} />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Office Address</label>
          <input value={data.address || ''} onChange={e => set('address', e.target.value)} style={inp} placeholder="Full office address" />
        </div>
      </div>

      <div>
        <label style={lbl}>Firm Size</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {FIRM_SIZES.map(s => (
            <button key={s.value} type="button" onClick={() => set('firmSize', s.value)}
              style={{ padding: '12px 8px', borderRadius: 12, border: `2px solid ${data.firmSize === s.value ? '#7C3AED' : '#E5E7EB'}`, background: data.firmSize === s.value ? '#F5F3FF' : '#fff', cursor: 'pointer', transition: 'all 150ms' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: data.firmSize === s.value ? '#7C3AED' : '#111827' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Practice Areas & Billing ──────────────────────── */
function StepBilling({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const toggleArea = (area) => {
    const curr = data.practiceAreas || [];
    set('practiceAreas', curr.includes(area) ? curr.filter(a => a !== area) : [...curr, area]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={lbl}>Practice Areas (select all that apply)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {PRACTICE_AREAS.map(area => {
            const active = (data.practiceAreas || []).includes(area);
            return (
              <button key={area} type="button" onClick={() => toggleArea(area)}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? '#7C3AED' : '#E5E7EB'}`, background: active ? '#EDE9FE' : '#fff', color: active ? '#7C3AED' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 150ms' }}>
                {area}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Currency</label>
          <select value={data.currency || 'PKR'} onChange={e => set('currency', e.target.value)} style={inp}>
            {['PKR', 'USD', 'GBP', 'EUR', 'AED'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Default Hourly Rate</label>
          <input type="number" value={data.defaultHourlyRate || ''} onChange={e => set('defaultHourlyRate', e.target.value)} style={inp} placeholder="e.g. 15000" />
        </div>
        <div>
          <label style={lbl}>Invoice Prefix</label>
          <input value={data.invoicePrefix || 'INV'} onChange={e => set('invoicePrefix', e.target.value)} style={inp} placeholder="INV" />
        </div>
        <div>
          <label style={lbl}>Payment Terms (days)</label>
          <input type="number" value={data.paymentTermsDays || 30} onChange={e => set('paymentTermsDays', e.target.value)} style={inp} placeholder="30" />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Invite Team ────────────────────────────────────── */
function StepTeam({ data, setData }) {
  const [invite, setInvite] = useState({ name: '', email: '', role: 'lawyer' });
  const invites = data.invites || [];

  function addInvite() {
    if (!invite.email || !invite.name) return;
    setData(d => ({ ...d, invites: [...(d.invites || []), { ...invite }] }));
    setInvite({ name: '', email: '', role: 'lawyer' });
  }

  function removeInvite(i) {
    setData(d => ({ ...d, invites: (d.invites || []).filter((_, j) => j !== i) }));
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
        Invite colleagues to your firm workspace. They'll receive an email invitation. You can always add more people later from Firm Settings.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'end', marginBottom: 16 }}>
        <div>
          <label style={lbl}>Full Name</label>
          <input value={invite.name} onChange={e => setInvite(i => ({ ...i, name: e.target.value }))} style={inp} placeholder="Jane Doe" />
        </div>
        <div>
          <label style={lbl}>Email</label>
          <input type="email" value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} style={inp} placeholder="jane@firm.com" />
        </div>
        <div>
          <label style={lbl}>Role</label>
          <select value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))} style={inp}>
            {['lawyer', 'paralegal', 'staff', 'client'].map(r => <option key={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
          </select>
        </div>
        <button onClick={addInvite} style={{ padding: '10px 16px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>Add</button>
      </div>
      {invites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invites.map((inv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{inv.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{inv.email} · {inv.role}</div>
              </div>
              <button onClick={() => removeInvite(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><I.X size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {!invites.length && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', background: '#F9FAFB', borderRadius: 12, border: '1.5px dashed #E5E7EB' }}>
          <I.Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 13 }}>No invites yet — add team members above or skip this step</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Choose Plan ────────────────────────────────────── */
function StepPlan({ data, setData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {PLANS.map(plan => {
        const active = data.plan === plan.value;
        return (
          <button key={plan.value} type="button" onClick={() => setData(d => ({ ...d, plan: plan.value }))}
            style={{ padding: '20px 16px', borderRadius: 16, border: `2px solid ${active ? '#7C3AED' : '#E5E7EB'}`, background: active ? '#F5F3FF' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms', position: 'relative' }}>
            {active && (
              <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Check size={12} style={{ color: '#fff' }} />
              </div>
            )}
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{plan.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#7C3AED', marginBottom: 12 }}>{plan.price}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                  <I.Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Step 5: Calendar Connect ───────────────────────────────── */
function StepCalendar() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, margin: '0 auto' }}>
        {[
          { name: 'Google Calendar', color: '#EA4335', icon: '📅', desc: 'Sync matters and deadlines with Google Calendar' },
          { name: 'Microsoft Outlook', color: '#0078D4', icon: '📆', desc: 'Connect your Outlook calendar for seamless scheduling' },
        ].map(cal => (
          <button key={cal.name} type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color 150ms' }}
            onClick={() => {}}>
            <span style={{ fontSize: 28 }}>{cal.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{cal.name}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{cal.desc}</div>
            </div>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Connect →</span>
          </button>
        ))}
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
          Calendar integration can be set up later in Firm Settings.
        </p>
      </div>
    </div>
  );
}

/* ─── Main Wizard ────────────────────────────────────────────── */
const STEPS = [
  { id: 'profile',   label: 'Firm Profile',    icon: I.Building },
  { id: 'billing',   label: 'Billing Setup',   icon: I.DollarSign },
  { id: 'team',      label: 'Invite Team',     icon: I.Users },
  { id: 'plan',      label: 'Choose Plan',     icon: I.Briefcase },
  { id: 'calendar',  label: 'Calendar',        icon: I.CalendarIcon },
];

export default function OnboardingWizard() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [data, setData] = useState({
    name: '', phone: '', website: '', barNumber: '', jurisdiction: '', country: 'Pakistan', address: '', firmSize: 'solo',
    practiceAreas: [], currency: 'PKR', defaultHourlyRate: '', invoicePrefix: 'INV', paymentTermsDays: 30,
    invites: [], plan: 'free',
  });

  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (isLast) {
      setSaving(true);
      try {
        await completeOnboarding({
          firmProfile: {
            name: data.name, phone: data.phone, website: data.website,
            barNumber: data.barNumber, jurisdiction: data.jurisdiction,
            country: data.country, address: data.address,
            firmSize: data.firmSize, practiceAreas: data.practiceAreas,
          },
          billing: {
            currency: data.currency,
            defaultHourlyRate: parseFloat(data.defaultHourlyRate) || 0,
            invoicePrefix: data.invoicePrefix,
            paymentTermsDays: parseInt(data.paymentTermsDays) || 30,
          },
          plan: data.plan,
        });
        navigate('/practice');
      } catch (e) {
        console.error('Onboarding save failed:', e);
        navigate('/practice');
      } finally {
        setSaving(false);
      }
    } else {
      setStep(s => s + 1);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Setting up your workspace
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Welcome to Nyaya Law</h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>

          {/* Progress bar */}
          <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #6D28D9)', borderRadius: 3 }}
            />
          </div>

          {/* Step pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: i === step ? '#EDE9FE' : i < step ? '#ECFDF5' : '#F3F4F6', border: `1px solid ${i === step ? '#DDD6FE' : i < step ? '#6EE7B7' : '#E5E7EB'}` }}>
                {i < step ? <I.Check size={11} style={{ color: '#059669' }} /> : <s.icon size={11} style={{ color: i === step ? '#7C3AED' : '#9CA3AF' }} />}
                <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? '#7C3AED' : i < step ? '#059669' : '#9CA3AF' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #E5E7EB', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <StepFirmProfile data={data} setData={setData} />}
              {step === 1 && <StepBilling data={data} setData={setData} />}
              {step === 2 && <StepTeam data={data} setData={setData} />}
              {step === 3 && <StepPlan data={data} setData={setData} />}
              {step === 4 && <StepCalendar />}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button onClick={() => setStep(s => s + 1)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Skip
                </button>
              )}
            </div>

            <button onClick={handleNext} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: '#7C3AED', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              {saving
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                : isLast ? <I.Check size={15} /> : null}
              {saving ? 'Saving…' : isLast ? 'Complete Setup' : 'Continue →'}
            </button>
          </div>
        </div>

        {/* Skip all */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => navigate('/practice')}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13 }}>
            Skip setup — I'll configure this later
          </button>
        </div>
      </div>
    </div>
  );
}
