import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { contactsApi } from '../api/contacts.api';

const ease = [0.22, 1, 0.36, 1];

const CONTACT_TYPES = [
  'client','prospect','opposing_party','opposing_counsel',
  'witness','court','expert','vendor','company','other',
];
const TYPE_LABEL = {
  client: 'Client', prospect: 'Prospect', opposing_party: 'Opposing Party',
  opposing_counsel: 'Opposing Counsel', witness: 'Witness', court: 'Court',
  expert: 'Expert', vendor: 'Vendor', company: 'Company', other: 'Other',
};
const TYPE_COLOR = {
  client: 'var(--purple)', prospect: 'var(--amber)', company: '#2563EB',
  opposing_party: 'var(--red)', opposing_counsel: '#DC6803',
  witness: '#0891B2', court: '#7C3AED', expert: '#16A34A',
  vendor: '#6B7280', other: 'var(--text-muted)',
};

const DETAIL_TABS = ['Overview','Matters','Financials','Timeline'];

/* ── helpers ─────────────────────────────────────────────────── */
function fullName(c) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company || 'Unknown';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtCurrency(n) {
  return n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ contact, size = 40 }) {
  const name = contact.company || contact.firstName || contact.lastName || '?';
  const initials = contact.firstName
    ? `${(contact.firstName || '')[0]}${(contact.lastName || '')[0] || ''}`.toUpperCase()
    : (name[0] || '?').toUpperCase();
  const palette = ['#7C3AED','#2563EB','#16A36A','#D97706','#DC2660','#0891B2'];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color + '18', color, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0, letterSpacing: '-0.02em' }}>
      {initials}
    </div>
  );
}

/* ── TypeBadge ───────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const color = TYPE_COLOR[type] || 'var(--text-muted)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: color + '14', color }}>
      {TYPE_LABEL[type] || type}
    </span>
  );
}

/* ── EmptyState ──────────────────────────────────────────────── */
function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>{icon}</div>
      <div className="h-title" style={{ fontSize: 19, marginBottom: 8 }}>{title}</div>
      <p className="t-secondary" style={{ fontSize: 14, marginBottom: 20 }}>{sub}</p>
      {action && <button className="btn btn-purple" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* ── ContactModal ─────────────────────────────────────────────── */
function ContactModal({ contact, onClose, onSave }) {
  const isCompany = contact?.type === 'company';
  const [form, setForm] = useState({
    type:                   contact?.type || 'client',
    firstName:              contact?.firstName || '',
    lastName:               contact?.lastName || '',
    company:                contact?.company || '',
    jobTitle:               contact?.jobTitle || '',
    email:                  contact?.email || '',
    alternateEmail:         contact?.alternateEmail || '',
    phone:                  contact?.phone || '',
    mobile:                 contact?.mobile || '',
    barNumber:              contact?.barNumber || '',
    website:                contact?.website || '',
    preferredContactMethod: contact?.preferredContactMethod || 'email',
    preferredLanguage:      contact?.preferredLanguage || 'English',
    notes:                  contact?.notes || '',
    tags:                   (contact?.tags || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    const needsName = form.type === 'company' ? !form.company.trim() : !form.firstName.trim();
    if (needsName) { setError(form.type === 'company' ? 'Company name required' : 'First name required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      const r = contact
        ? await contactsApi.update(contact._id, payload)
        : await contactsApi.create(payload);
      onSave(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact');
    } finally { setSaving(false); }
  }

  const Fld = ({ label, children, half }) => (
    <div style={{ marginBottom: half ? 0 : 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(11,11,20,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25, ease }}
        style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 24, boxShadow: '0 32px 80px rgba(11,11,20,0.18)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="h-title" style={{ fontSize: 22 }}>{contact ? 'Edit Contact' : 'New Contact'}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}><I.X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && <div style={{ background: 'rgba(220,38,96,0.07)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid rgba(220,38,96,0.2)' }}>{error}</div>}

          {/* Type selector */}
          <Fld label="Contact Type">
            <select className="input" value={form.type} onChange={e => set('type', e.target.value)} style={{ cursor: 'pointer' }}>
              {CONTACT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </Fld>

          {form.type === 'company' ? (
            <Fld label="Company Name *">
              <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" />
            </Fld>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Fld label="First Name *" half><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" /></Fld>
                <Fld label="Last Name" half><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" /></Fld>
              </div>
              <Fld label="Company / Employer">
                <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Employer or organization" />
              </Fld>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Fld label="Job Title" half><input className="input" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="CEO, Partner…" /></Fld>
            <Fld label="Bar Number" half><input className="input" value={form.barNumber} onChange={e => set('barNumber', e.target.value)} placeholder="For lawyers" /></Fld>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Fld label="Email" half><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" /></Fld>
            <Fld label="Alternate Email" half><input className="input" type="email" value={form.alternateEmail} onChange={e => set('alternateEmail', e.target.value)} placeholder="other@example.com" /></Fld>
            <Fld label="Phone" half><input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 300 000 0000" /></Fld>
            <Fld label="Mobile" half><input className="input" type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+92 300 000 0000" /></Fld>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Fld label="Preferred Contact" half>
              <select className="input" value={form.preferredContactMethod} onChange={e => set('preferredContactMethod', e.target.value)} style={{ cursor: 'pointer' }}>
                {['email','phone','text','any'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="Language" half>
              <input className="input" value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value)} placeholder="English" />
            </Fld>
          </div>

          <Fld label="Website">
            <input className="input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" />
          </Fld>

          <Fld label="Tags (comma-separated)">
            <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="vip, litigation, corporate" />
          </Fld>

          <Fld label="Notes">
            <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" style={{ resize: 'vertical' }} />
          </Fld>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : contact ? 'Update' : 'Create Contact'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── MergeModal ──────────────────────────────────────────────── */
function MergeModal({ primary, allContacts, onClose, onMerge }) {
  const [secondaryId, setSecondaryId] = useState('');
  const [merging, setMerging] = useState(false);
  const secondary = allContacts.find(c => c._id === secondaryId);

  async function handleMerge() {
    if (!secondaryId) return;
    setMerging(true);
    try { await onMerge(secondaryId); onClose(); }
    catch { /* silent */ } finally { setMerging(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,11,20,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.2, ease }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(11,11,20,0.18)', padding: '28px 28px 24px' }}>
        <div className="h-title" style={{ fontSize: 20, marginBottom: 6 }}>Merge Contacts</div>
        <p className="t-secondary" style={{ fontSize: 13, marginBottom: 20 }}>
          <strong>{fullName(primary)}</strong> will keep all data. The duplicate will be soft-deleted and all linked records re-assigned.
        </p>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select duplicate to merge into this contact</label>
        <select className="input" value={secondaryId} onChange={e => setSecondaryId(e.target.value)} style={{ cursor: 'pointer', marginBottom: 16 }}>
          <option value="">— Select contact —</option>
          {allContacts.filter(c => c._id !== primary._id).map(c => (
            <option key={c._id} value={c._id}>{fullName(c)} ({c.email || c.phone || c.type})</option>
          ))}
        </select>
        {secondary && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{fullName(secondary)}</div>
            {secondary.email && <div className="t-secondary">{secondary.email}</div>}
            {secondary.phone && <div className="t-secondary">{secondary.phone}</div>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-purple" onClick={handleMerge} disabled={!secondaryId || merging}>
            {merging ? 'Merging…' : 'Merge'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── ContactDetail ───────────────────────────────────────────── */
function ContactDetail({ contact, allContacts, onEdit, onBack, onDelete, onMerge }) {
  const [activeTab, setActiveTab]   = useState('Overview');
  const [financials, setFinancials] = useState(null);
  const [timeline, setTimeline]     = useState([]);
  const [finLoaded, setFinLoaded]   = useState(false);
  const [tlLoaded, setTlLoaded]     = useState(false);
  const [showMerge, setShowMerge]   = useState(false);

  useEffect(() => { setFinLoaded(false); setTlLoaded(false); }, [contact._id]);

  useEffect(() => {
    if (activeTab === 'Financials' && !finLoaded) {
      contactsApi.financials(contact._id)
        .then(r => setFinancials(r.data.data))
        .catch(() => {})
        .finally(() => setFinLoaded(true));
    }
  }, [activeTab, finLoaded, contact._id]);

  useEffect(() => {
    if (activeTab === 'Timeline' && !tlLoaded) {
      contactsApi.timeline(contact._id)
        .then(r => setTimeline(r.data.data || []))
        .catch(() => {})
        .finally(() => setTlLoaded(true));
    }
  }, [activeTab, tlLoaded, contact._id]);

  const name = fullName(contact);
  const primaryAddress = contact.addresses?.find(a => a.isPrimary) || contact.addresses?.[0];

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
        <I.ArrowLeft size={15} /> All Contacts
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        <Avatar contact={contact} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 className="h-title" style={{ fontSize: 26 }}>{name}</h1>
            <TypeBadge type={contact.type} />
            {!contact.isActive && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--active)', padding: '3px 8px', borderRadius: 6 }}>Inactive</span>}
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
            {contact.jobTitle && contact.company && <span>{contact.jobTitle} at {contact.company}</span>}
            {contact.jobTitle && !contact.company && <span>{contact.jobTitle}</span>}
            {!contact.jobTitle && contact.company && <span>{contact.company}</span>}
            {contact.email && <span><I.Mail size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{contact.email}</span>}
            {contact.phone && <span><I.Bell size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{contact.phone}</span>}
          </div>
          {contact.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {contact.tags.map(t => (
                <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="btn btn-secondary btn-sm"><I.Mail size={14} /> Email</a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="btn btn-secondary btn-sm"><I.Bell size={14} /> Call</a>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMerge(true)}><I.Users size={14} /> Merge</button>
          <button className="btn btn-purple btn-sm" onClick={onEdit}><I.Settings size={14} /> Edit</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {DETAIL_TABS.map(t => (
          <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>

          {/* Overview */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
              <div className="card" style={{ padding: 28 }}>
                <div className="h-title" style={{ fontSize: 16, marginBottom: 18 }}>Contact Information</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    ['Type', TYPE_LABEL[contact.type] || contact.type],
                    contact.email         && ['Email',           contact.email],
                    contact.alternateEmail && ['Alt. Email',      contact.alternateEmail],
                    contact.phone         && ['Phone',           contact.phone],
                    contact.mobile        && ['Mobile',          contact.mobile],
                    contact.fax           && ['Fax',             contact.fax],
                    contact.website       && ['Website',         contact.website],
                    contact.barNumber     && ['Bar Number',      contact.barNumber],
                    contact.taxId         && ['Tax ID',          contact.taxId],
                    contact.ledesClientId && ['LEDES Client ID', contact.ledesClientId],
                    contact.preferredLanguage && ['Language',    contact.preferredLanguage],
                    contact.preferredContactMethod && ['Preferred Contact', contact.preferredContactMethod],
                    contact.lastContactDate && ['Last Contacted', fmtDate(contact.lastContactDate)],
                    ['Added', fmtDate(contact.createdAt)],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {primaryAddress && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Address</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>
                      {[primaryAddress.street, primaryAddress.city, primaryAddress.state, primaryAddress.country, primaryAddress.postalCode].filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}

                {contact.notes && (
                  <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Notes</div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{contact.notes}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Quick actions */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contact.email && <a href={`mailto:${contact.email}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 10 }}><I.Mail size={14} /> Send Email</a>}
                    {contact.phone && <a href={`tel:${contact.phone}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 10 }}><I.Bell size={14} /> Call</a>}
                    <button onClick={onDelete} className="btn btn-sm" style={{ justifyContent: 'flex-start', gap: 10, background: 'rgba(220,38,96,0.07)', color: 'var(--red)', border: '1px solid rgba(220,38,96,0.2)' }}>
                      <I.Trash size={14} /> Delete Contact
                    </button>
                  </div>
                </div>

                {/* Related matters */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="h-title" style={{ fontSize: 15, marginBottom: 12 }}>Linked Matters ({contact.relatedMatters?.length || 0})</div>
                  {!contact.relatedMatters?.length ? (
                    <div className="t-secondary" style={{ fontSize: 13 }}>No matters linked yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {contact.relatedMatters.slice(0, 4).map(m => (
                        <div key={m._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.matterNumber} · {m.status}</div>
                        </div>
                      ))}
                      {contact.relatedMatters.length > 4 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('Matters')}>
                          View all {contact.relatedMatters.length} matters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Matters tab */}
          {activeTab === 'Matters' && (
            <div style={{ maxWidth: 720 }}>
              {!contact.relatedMatters?.length ? (
                <EmptyState icon={<I.Briefcase size={26} />} title="No linked matters" sub="This contact has no associated matters yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {contact.relatedMatters.map(m => (
                    <div key={m._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{m.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.practiceArea} · Opened {fmtDate(m.openDate)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{m.matterNumber}</span>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: m.status === 'active' ? 'var(--green-bg)' : 'var(--active)', color: m.status === 'active' ? 'var(--green)' : 'var(--text-muted)' }}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Financials tab */}
          {activeTab === 'Financials' && (
            <div style={{ maxWidth: 720 }}>
              {!finLoaded ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
                </div>
              ) : financials ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
                    {[
                      { l: 'Total Billed',    v: fmtCurrency(financials.totalBilled),    col: 'var(--ink)'    },
                      { l: 'Total Collected', v: fmtCurrency(financials.totalCollected), col: 'var(--green)'  },
                      { l: 'Outstanding',     v: fmtCurrency(financials.outstanding),    col: financials.outstanding > 0 ? 'var(--amber)' : 'var(--ink)' },
                      { l: 'Overdue',         v: financials.overdueCount,                col: financials.overdueCount > 0 ? 'var(--red)' : 'var(--ink)' },
                    ].map(({ l, v, col }) => (
                      <div key={l} className="card" style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
                        <div className="h-title" style={{ fontSize: 22, color: col }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {financials.invoices?.length > 0 ? (
                    <div className="card" style={{ padding: '8px 20px' }}>
                      {financials.invoices.map(inv => (
                        <div key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.invoiceNumber}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Due {fmtDate(inv.dueDate)}</div>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtCurrency(inv.total)}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: inv.status === 'paid' ? 'var(--green-bg)' : inv.status === 'overdue' ? 'rgba(220,38,96,0.08)' : 'var(--amber-bg)', color: inv.status === 'paid' ? 'var(--green)' : inv.status === 'overdue' ? 'var(--red)' : 'var(--amber)' }}>{inv.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<I.Receipt size={26} />} title="No invoices" sub="No invoices have been issued to this contact yet." />
                  )}
                </>
              ) : (
                <EmptyState icon={<I.Receipt size={26} />} title="No financial data" sub="Issue invoices linked to this contact to see their financial summary." />
              )}
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'Timeline' && (
            <div style={{ maxWidth: 640 }}>
              {!tlLoaded ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
                </div>
              ) : timeline.length === 0 ? (
                <EmptyState icon={<I.Clock size={26} />} title="No activity yet" sub="Events and interactions with this contact will appear here." />
              ) : (
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
                  {timeline.map((ev, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: 20 }}>
                      <div style={{ position: 'absolute', left: -18, top: 4, width: 12, height: 12, borderRadius: '50%', background: ev.type === 'matter' ? 'var(--purple)' : ev.type === 'invoice' ? 'var(--green)' : 'var(--amber)', border: '2px solid var(--surface)' }} />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{fmtDate(ev.date)}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{ev.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showMerge && (
          <MergeModal primary={contact} allContacts={allContacts} onClose={() => setShowMerge(false)}
            onMerge={async (secondaryId) => {
              const r = await contactsApi.merge(contact._id, { secondaryId });
              onMerge(r.data.data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── ContactCard ─────────────────────────────────────────────── */
function ContactCard({ contact, onClick }) {
  return (
    <motion.div className="card" style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
      onClick={onClick} whileHover={{ y: -2, boxShadow: '0 10px 32px rgba(11,11,20,0.10)' }}>
      <Avatar contact={contact} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-title" style={{ fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName(contact)}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email || contact.phone || contact.company || '—'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <TypeBadge type={contact.type} />
        {contact.tags?.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{contact.tags.slice(0, 2).join(', ')}{contact.tags.length > 2 ? ` +${contact.tags.length - 2}` : ''}</span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Contacts() {
  const [contacts,        setContacts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [search,          setSearch]          = useState('');
  const [filterType,      setFilterType]      = useState('all');
  const [showModal,       setShowModal]       = useState(false);
  const [editingContact,  setEditingContact]  = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [duplicates,      setDuplicates]      = useState([]);
  const [showDupBanner,   setShowDupBanner]   = useState(false);
  const importRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contactsApi.list();
      setContacts(r.data.data?.contacts || []);
    } catch {
      setError('Failed to load contacts. Make sure the backend is running.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Check for duplicates on load
  useEffect(() => {
    contactsApi.duplicates()
      .then(r => { const dups = r.data.data || []; setDuplicates(dups); if (dups.length) setShowDupBanner(true); })
      .catch(() => {});
  }, []);

  async function handleSave(saved) {
    setShowModal(false);
    setEditingContact(null);
    if (selectedContact) {
      // Refresh the selected contact detail
      const fresh = await contactsApi.get(saved._id || selectedContact._id);
      setSelectedContact(fresh.data.data);
      setContacts(cs => cs.map(c => c._id === fresh.data.data._id ? fresh.data.data : c));
    } else {
      await load();
      if (saved?._id) setSelectedContact(saved);
    }
  }

  async function handleDelete() {
    if (!selectedContact || !window.confirm('Delete this contact? This action can be undone by an admin.')) return;
    try {
      await contactsApi.remove(selectedContact._id);
      setSelectedContact(null);
      setContacts(cs => cs.filter(c => c._id !== selectedContact._id));
    } catch { /* silent */ }
  }

  function handleMerge(updated) {
    setSelectedContact(updated);
    setContacts(cs => cs.filter(c => c._id !== updated._id ? true : true).map(c => c._id === updated._id ? updated : c));
    load();
  }

  async function handleExport() {
    try {
      const r = await contactsApi.exportCSV();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'contacts.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await contactsApi.importCSV(file);
      const { created } = r.data.data || {};
      await load();
      alert(`Import complete: ${created || 0} contacts created.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    }
    e.target.value = '';
  }

  const filtered = contacts.filter(c => {
    const name = fullName(c);
    const matchSearch = !search
      || name.toLowerCase().includes(search.toLowerCase())
      || c.email?.toLowerCase().includes(search.toLowerCase())
      || c.phone?.includes(search)
      || c.company?.toLowerCase().includes(search.toLowerCase())
      || c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total:    contacts.length,
    clients:  contacts.filter(c => c.type === 'client').length,
    prospects:contacts.filter(c => c.type === 'prospect').length,
    active:   contacts.filter(c => c.isActive).length,
  };

  /* Detail view */
  if (selectedContact) {
    return (
      <div style={{ padding: '80px 28px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <ContactDetail
          contact={selectedContact}
          allContacts={contacts}
          onBack={() => setSelectedContact(null)}
          onEdit={() => { setEditingContact(selectedContact); setShowModal(true); }}
          onDelete={handleDelete}
          onMerge={handleMerge}
        />
        <AnimatePresence>
          {showModal && (
            <ContactModal
              contact={editingContact}
              onClose={() => { setShowModal(false); setEditingContact(null); }}
              onSave={handleSave}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* List view */
  return (
    <div style={{ padding: '80px 28px 100px', maxWidth: 1280, margin: '0 auto' }}>
      <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="h-title" style={{ fontSize: 30, marginBottom: 4 }}>Contacts</h1>
          <p className="t-secondary" style={{ fontSize: 14 }}>Clients, opposing counsel, witnesses, and all related parties</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => importRef.current?.click()}><I.Upload size={14} /> Import CSV</button>
          <button className="btn btn-secondary" onClick={handleExport}><I.Download size={14} /> Export CSV</button>
          <button className="btn btn-purple" onClick={() => { setEditingContact(null); setShowModal(true); }}><I.User size={14} /> New Contact</button>
        </div>
      </div>

      {/* Duplicates banner */}
      <AnimatePresence>
        {showDupBanner && duplicates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, border: '1px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><I.Alert size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} detected — open a contact to merge.
            </span>
            <button onClick={() => setShowDupBanner(false)} style={{ color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer' }}><I.X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { l: 'Total',     v: stats.total,     col: 'var(--purple)' },
          { l: 'Clients',   v: stats.clients,   col: 'var(--green)'  },
          { l: 'Prospects', v: stats.prospects, col: 'var(--amber)'  },
          { l: 'Active',    v: stats.active,    col: 'var(--ink)'    },
        ].map(({ l, v, col }) => (
          <div key={l} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 28, color: col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search by name, email, phone, tags…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 180, cursor: 'pointer' }}>
          <option value="all">All Types</option>
          {CONTACT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </div>

      {error && (
        <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, border: '1px solid rgba(217,119,6,0.2)' }}>
          <I.Alert size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />{error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 88, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 15, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<I.Users size={30} />}
          title={contacts.length === 0 ? 'No contacts yet' : 'No matches found'}
          sub={contacts.length === 0 ? 'Add your first client or contact to get started.' : 'Try adjusting your search or type filter.'}
          action={contacts.length === 0 ? 'Add First Contact' : undefined}
          onAction={() => { setEditingContact(null); setShowModal(true); }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {filtered.map(c => (
            <ContactCard key={c._id} contact={c} onClick={async () => {
              const r = await contactsApi.get(c._id);
              setSelectedContact(r.data.data);
            }} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ContactModal
            contact={editingContact}
            onClose={() => { setShowModal(false); setEditingContact(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
