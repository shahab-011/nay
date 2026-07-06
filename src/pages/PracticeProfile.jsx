import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { I } from '../components/Icons';
import { updateProfile } from '../api/auth.api';

/* ── Style constants ── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' };
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', backdropFilter: 'blur(12px)', marginBottom: 20 };

const PRACTICE_AREAS = [
  'Family Law', 'Criminal', 'Contract', 'Property',
  'Immigration', 'Employment', 'IP', 'Personal Injury',
  'Tax', 'Civil', 'Corporate', 'Other',
];

const ACTIVITY_TYPES = [
  { value: 'research', label: 'Research' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'review', label: 'Review' },
  { value: 'court', label: 'Court' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'calls', label: 'Calls' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
  { id: 'personal',      label: 'Personal Info',  Ic: I.User },
  { id: 'professional',  label: 'Professional',   Ic: I.Briefcase },
  { id: 'billing',       label: 'Billing',         Ic: I.DollarSign },
  { id: 'availability',  label: 'Availability',    Ic: I.Clock },
  { id: 'notifications', label: 'Notifications',   Ic: I.Bell },
];

/* ── Toggle switch ── */
function Toggle({ on, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 200ms', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 19 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      />
    </motion.button>
  );
}

export default function PracticeProfile() {
  const { user } = useAuth();

  const [activeTab, setActiveTab]   = useState('personal');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [newAdmission, setNewAdmission] = useState('');
  const fileRef = useRef();

  /* ── Form state ── */
  const [personal, setPersonal] = useState({
    name: '', email: '', phone: '', title: '', bio: '',
  });

  const [professional, setProfessional] = useState({
    barNumber: '', licenseNumber: '', jurisdiction: '',
    yearsOfExperience: '', barAdmissions: [], practiceAreas: [],
    linkedInUrl: '', website: '',
  });

  const [billing, setBilling] = useState({
    defaultHourlyRate: '', defaultActivityType: 'research', billingType: 'hourly',
  });

  const [availability, setAvailability] = useState(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: {
        active: day !== 'Saturday' && day !== 'Sunday',
        start: '09:00',
        end: '17:30',
      },
    }), {})
  );

  const [notifications, setNotifications] = useState({
    newMatter: true, taskAssigned: true, taskDue: true,
    invoicePaid: true, conflictAlert: true, solAlert: true,
    documentExpiry: true, newMessage: true,
    emailEnabled: true, inAppEnabled: true,
  });

  /* ── Hydrate from auth user ── */
  useEffect(() => {
    if (!user) return;
    setPersonal({
      name:  user.name  || '',
      email: user.email || '',
      phone: user.phone || '',
      title: user.title || '',
      bio:   user.bio   || '',
    });
    setProfessional(p => ({
      ...p,
      barNumber:        user.barNumber        || '',
      licenseNumber:    user.licenseNumber    || '',
      jurisdiction:     user.jurisdiction     || '',
      yearsOfExperience: user.yearsOfExperience || '',
      barAdmissions:    user.barAdmissions    || [],
      practiceAreas:    user.practiceAreas    || [],
      linkedInUrl:      user.linkedInUrl      || '',
      website:          user.website          || '',
    }));
    setBilling(b => ({
      ...b,
      defaultHourlyRate:   user.defaultHourlyRate   || '',
      defaultActivityType: user.defaultActivityType || 'research',
      billingType:         user.billingType         || 'hourly',
    }));
    if (user.availability)    setAvailability(user.availability);
    if (user.notificationPreferences) setNotifications(n => ({ ...n, ...user.notificationPreferences }));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        ...personal,
        ...professional,
        defaultHourlyRate:        billing.defaultHourlyRate,
        defaultActivityType:      billing.defaultActivityType,
        billingType:              billing.billingType,
        availability,
        notificationPreferences:  notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePracticeArea = area =>
    setProfessional(p => ({
      ...p,
      practiceAreas: p.practiceAreas.includes(area)
        ? p.practiceAreas.filter(a => a !== area)
        : [...p.practiceAreas, area],
    }));

  const addAdmission = () => {
    if (!newAdmission.trim()) return;
    setProfessional(p => ({ ...p, barAdmissions: [...p.barAdmissions, newAdmission.trim()] }));
    setNewAdmission('');
  };

  const initial = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', padding: '32px 28px', color: 'var(--ink)' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: 80, left: '35%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 100, right: '15%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

        {/* ── Page heading ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>My Profile</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Manage your professional details, billing preferences, and notification settings.</p>
        </div>

        {/* ── Profile header card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...card, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#a78bfa)',
              border: '2px solid rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#fff', overflow: 'hidden',
            }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial}
            </div>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} />
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              title="Change avatar"
              style={{ position: 'absolute', bottom: -6, right: -6, width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: '2px solid #0c0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <I.Edit size={11} style={{ color: '#fff' }} />
            </motion.button>
          </div>

          {/* Name / role / areas */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', marginBottom: 2 }}>
              {user?.name || 'Your Name'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,238,255,0.5)', marginBottom: 10, textTransform: 'capitalize' }}>
              {personal.title || user?.role || 'Attorney'} · {user?.email}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {professional.practiceAreas.slice(0, 4).map(a => (
                <span key={a} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', fontSize: 11, fontWeight: 600, color: '#c4b5fd' }}>{a}</span>
              ))}
              {professional.practiceAreas.length === 0 && (
                <span style={{ fontSize: 12, color: 'rgba(240,238,255,0.3)', fontStyle: 'italic' }}>No practice areas set — update in Professional tab</span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            {[
              { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
              { label: 'Bar No.', value: professional.barNumber || '—' },
              { label: 'Experience', value: professional.yearsOfExperience ? `${professional.yearsOfExperience} yrs` : '—' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#c4b5fd', letterSpacing: '-0.01em' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(240,238,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 12, padding: 4 }}>
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 200ms',
                background: activeTab === tab.id ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(240,238,255,0.5)',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <tab.Ic size={13} /> {tab.label}
            </motion.button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >

            {/* PERSONAL INFO */}
            {activeTab === 'personal' && (
              <div style={card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I.User size={16} style={{ color: '#a78bfa' }} /> Personal Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={lbl}>Full Name</label>
                    <input style={inp} value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Priya Sharma" />
                  </div>
                  <div>
                    <label style={lbl}>Email Address</label>
                    <input style={{ ...inp, opacity: 0.55, cursor: 'not-allowed' }} value={personal.email} disabled />
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.3)', marginTop: 4 }}>Contact support to change email</div>
                  </div>
                  <div>
                    <label style={lbl}>Phone Number</label>
                    <input style={inp} value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label style={lbl}>Job Title</label>
                    <input style={inp} value={personal.title} onChange={e => setPersonal(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Partner" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Professional Bio</label>
                    <textarea
                      style={{ ...inp, height: 120, resize: 'vertical', lineHeight: 1.65, fontFamily: 'inherit' }}
                      value={personal.bio}
                      onChange={e => setPersonal(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Brief professional summary shown to clients in the portal and public profile..."
                    />
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.3)', marginTop: 4 }}>{personal.bio.length} / 500 characters</div>
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL */}
            {activeTab === 'professional' && (
              <>
                {/* Bar & license */}
                <div style={card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I.Scale size={16} style={{ color: '#a78bfa' }} /> Bar &amp; License Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={lbl}>Bar Number</label>
                      <input style={inp} value={professional.barNumber} onChange={e => setProfessional(p => ({ ...p, barNumber: e.target.value }))} placeholder="BAR-1234567" />
                    </div>
                    <div>
                      <label style={lbl}>License Number</label>
                      <input style={inp} value={professional.licenseNumber} onChange={e => setProfessional(p => ({ ...p, licenseNumber: e.target.value }))} placeholder="LIC-XXXXXXXX" />
                    </div>
                    <div>
                      <label style={lbl}>Primary Jurisdiction</label>
                      <input style={inp} value={professional.jurisdiction} onChange={e => setProfessional(p => ({ ...p, jurisdiction: e.target.value }))} placeholder="e.g. Maharashtra, India" />
                    </div>
                    <div>
                      <label style={lbl}>Years of Experience</label>
                      <input style={inp} type="number" min="0" max="60" value={professional.yearsOfExperience} onChange={e => setProfessional(p => ({ ...p, yearsOfExperience: e.target.value }))} placeholder="10" />
                    </div>
                    <div>
                      <label style={lbl}>LinkedIn Profile</label>
                      <input style={inp} value={professional.linkedInUrl} onChange={e => setProfessional(p => ({ ...p, linkedInUrl: e.target.value }))} placeholder="linkedin.com/in/your-name" />
                    </div>
                    <div>
                      <label style={lbl}>Personal Website</label>
                      <input style={inp} value={professional.website} onChange={e => setProfessional(p => ({ ...p, website: e.target.value }))} placeholder="yourname.com" />
                    </div>
                  </div>

                  {/* Bar admissions */}
                  <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid rgba(124,58,237,0.12)' }}>
                    <label style={{ ...lbl, marginBottom: 10 }}>Bar Admissions</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        style={{ ...inp, flex: 1 }}
                        value={newAdmission}
                        onChange={e => setNewAdmission(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addAdmission()}
                        placeholder="e.g. Delhi High Court, Supreme Court of India"
                      />
                      <motion.button whileTap={{ scale: 0.96 }} onClick={addAdmission} style={{ ...btnPurple, flexShrink: 0 }}>
                        <I.Plus size={14} /> Add
                      </motion.button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {professional.barAdmissions.map((a, i) => (
                        <motion.span
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)', fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}
                        >
                          {a}
                          <button
                            onClick={() => setProfessional(p => ({ ...p, barAdmissions: p.barAdmissions.filter((_, j) => j !== i) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,238,255,0.4)', padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}
                          >
                            <I.X size={12} />
                          </button>
                        </motion.span>
                      ))}
                      {professional.barAdmissions.length === 0 && (
                        <span style={{ fontSize: 12, color: 'rgba(240,238,255,0.28)', fontStyle: 'italic' }}>No admissions added yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Practice areas */}
                <div style={card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I.Briefcase size={16} style={{ color: '#a78bfa' }} /> Practice Areas
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.38)', marginBottom: 16 }}>Select all areas you practise in. These appear on your profile and in matter filtering.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {PRACTICE_AREAS.map(area => {
                      const selected = professional.practiceAreas.includes(area);
                      return (
                        <motion.label
                          key={area}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: selected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.1)'}`, cursor: 'pointer', transition: 'all 150ms' }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: 5, border: `2px solid ${selected ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: selected ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}>
                            {selected && <I.Check size={10} style={{ color: '#fff' }} />}
                          </div>
                          <input type="checkbox" checked={selected} onChange={() => togglePracticeArea(area)} style={{ display: 'none' }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: selected ? '#c4b5fd' : 'rgba(240,238,255,0.6)' }}>{area}</span>
                        </motion.label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* BILLING PREFERENCES */}
            {activeTab === 'billing' && (
              <div style={card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I.DollarSign size={16} style={{ color: '#a78bfa' }} /> Billing Preferences
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={lbl}>Default Hourly Rate (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>₹</span>
                      <input
                        style={{ ...inp, paddingLeft: 28 }}
                        type="number" min="0" step="100"
                        value={billing.defaultHourlyRate}
                        onChange={e => setBilling(b => ({ ...b, defaultHourlyRate: e.target.value }))}
                        placeholder="5000"
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginTop: 5 }}>Applied to new time entries unless the matter or contact overrides it.</div>
                  </div>

                  <div>
                    <label style={lbl}>Default Billing Type</label>
                    <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }} value={billing.billingType} onChange={e => setBilling(b => ({ ...b, billingType: e.target.value }))}>
                      <option value="hourly">Hourly</option>
                      <option value="flat_fee">Flat Fee</option>
                      <option value="contingency">Contingency</option>
                      <option value="retainer">Retainer</option>
                      <option value="pro_bono">Pro Bono</option>
                    </select>
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginTop: 5 }}>Pre-fills when creating a new matter.</div>
                  </div>

                  <div>
                    <label style={lbl}>Default Activity Type</label>
                    <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }} value={billing.defaultActivityType} onChange={e => setBilling(b => ({ ...b, defaultActivityType: e.target.value }))}>
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginTop: 5 }}>Pre-fills the activity type when logging time.</div>
                  </div>
                </div>

                {/* Rate priority info */}
                <div style={{ marginTop: 24, padding: '14px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#c4b5fd', marginBottom: 6 }}>
                    <I.Info size={14} /> Billing Rate Priority
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.55)', lineHeight: 1.65 }}>
                    <strong style={{ color: 'rgba(240,238,255,0.8)' }}>Contact override</strong> &rarr; <strong style={{ color: 'rgba(240,238,255,0.8)' }}>Matter rate</strong> &rarr; <strong style={{ color: 'rgba(240,238,255,0.8)' }}>Your default rate (set above)</strong>.
                    The rate here is the lowest fallback — it's used when no matter-specific or contact-specific rate exists.
                  </div>
                </div>
              </div>
            )}

            {/* AVAILABILITY */}
            {activeTab === 'availability' && (
              <div style={card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I.Clock size={16} style={{ color: '#a78bfa' }} /> Working Hours
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.4)', marginBottom: 22 }}>
                  Define your default weekly schedule. This is used for client booking and calendar blocking.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DAYS.map(day => {
                    const avail = availability[day];
                    return (
                      <motion.div
                        key={day}
                        layout
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: avail.active ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${avail.active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 200ms' }}
                      >
                        {/* Toggle */}
                        <Toggle
                          on={avail.active}
                          onClick={() => setAvailability(a => ({ ...a, [day]: { ...a[day], active: !a[day].active } }))}
                        />

                        {/* Day label */}
                        <span style={{ width: 90, fontSize: 13, fontWeight: 600, color: avail.active ? '#f0eeff' : 'rgba(240,238,255,0.32)' }}>{day}</span>

                        {/* Hours */}
                        {avail.active ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="time"
                              value={avail.start}
                              onChange={e => setAvailability(a => ({ ...a, [day]: { ...a[day], start: e.target.value } }))}
                              style={{ ...inp, width: 'auto', padding: '6px 10px', colorScheme: 'dark' }}
                            />
                            <span style={{ color: 'rgba(240,238,255,0.35)', fontSize: 12 }}>to</span>
                            <input
                              type="time"
                              value={avail.end}
                              onChange={e => setAvailability(a => ({ ...a, [day]: { ...a[day], end: e.target.value } }))}
                              style={{ ...inp, width: 'auto', padding: '6px 10px', colorScheme: 'dark' }}
                            />
                            <span style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginLeft: 4 }}>
                              {(() => {
                                const [sh, sm] = avail.start.split(':').map(Number);
                                const [eh, em] = avail.end.split(':').map(Number);
                                const diff = (eh * 60 + em) - (sh * 60 + sm);
                                if (diff <= 0) return '';
                                return `${Math.floor(diff / 60)}h ${diff % 60 ? diff % 60 + 'm' : ''}`.trim();
                              })()}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'rgba(240,238,255,0.28)', fontStyle: 'italic' }}>Unavailable</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <>
                {/* Channels */}
                <div style={card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I.Bell size={16} style={{ color: '#a78bfa' }} /> Notification Channels
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'inAppEnabled', label: 'In-App Notifications', desc: 'Show notification bell updates in the sidebar' },
                      { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive digest and alert emails for important events' },
                    ].map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eeff' }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <Toggle on={notifications[item.key]} onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event toggles */}
                <div style={card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0eeff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I.Activity size={16} style={{ color: '#a78bfa' }} /> Event Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { key: 'newMatter',       label: 'New Matter Assigned',          desc: 'When a matter is assigned to you',             Ic: I.Briefcase },
                      { key: 'taskAssigned',    label: 'Task Assigned',                desc: 'When a task is assigned to you',               Ic: I.CheckSquare },
                      { key: 'taskDue',         label: 'Task Due Reminders',           desc: '24 hours before a task deadline',              Ic: I.Clock },
                      { key: 'invoicePaid',     label: 'Invoice Paid',                 desc: 'When a client pays an invoice',                Ic: I.DollarSign },
                      { key: 'conflictAlert',   label: 'Conflict Alerts',              desc: 'When a potential conflict is detected',        Ic: I.Shield },
                      { key: 'solAlert',        label: 'Statute of Limitations Alerts', desc: 'When a matter SOL date is approaching',      Ic: I.Alert },
                      { key: 'documentExpiry',  label: 'Document Expiry Alerts',       desc: 'When a document nears expiry or renewal',     Ic: I.Doc },
                      { key: 'newMessage',      label: 'New Messages',                 desc: 'When you receive a direct or matter message', Ic: I.MessageCircle },
                    ].map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${notifications[item.key] ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}`, transition: 'border-color 200ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: notifications[item.key] ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms', flexShrink: 0 }}>
                            <item.Ic size={15} style={{ color: notifications[item.key] ? '#a78bfa' : 'rgba(240,238,255,0.25)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: notifications[item.key] ? '#f0eeff' : 'rgba(240,238,255,0.45)' }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.32)', marginTop: 1 }}>{item.desc}</div>
                          </div>
                        </div>
                        <Toggle on={notifications[item.key]} onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Save bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 14, backdropFilter: 'blur(12px)' }}
        >
          <AnimatePresence>
            {error && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 12, fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                <I.Alert size={13} /> {error}
              </motion.span>
            )}
            {saved && !error && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                <I.Check size={14} /> Changes saved successfully
              </motion.span>
            )}
            {!saved && !error && <span />}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <>
                <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
                Saving…
              </>
            ) : (
              <><I.Check size={14} /> Save Changes</>
            )}
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
