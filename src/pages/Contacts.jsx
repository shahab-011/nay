import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { contactsApi } from '../api/contacts.api';

const ease = [0.22, 1, 0.36, 1];

const CONTACT_TYPES = ['Individual', 'Company'];
const REFERRAL_SOURCES = ['Website', 'Referral', 'Advertisement', 'Social Media', 'Cold Outreach', 'Bar Association', 'Other'];

function Avatar({ contact, size = 40 }) {
  const initials = contact.type === 'Company'
    ? (contact.company || '?')[0].toUpperCase()
    : `${(contact.first_name || '?')[0]}${(contact.last_name || '')[0] || ''}`.toUpperCase();
  const colors = ['#7C3AED', '#2563EB', '#16A36A', '#D97706', '#DC2660'];
  const color = colors[(contact.first_name || contact.company || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color + '18', color, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState({
    type: contact?.type || 'Individual',
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    company: contact?.company || '',
    email: contact?.email?.[0] || '',
    phone: contact?.phone?.[0] || '',
    address: contact?.address || '',
    website: contact?.website || '',
    referral_source: contact?.referral_source || 'Website',
    notes: contact?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.type === 'Company' ? form.company : form.first_name;
    if (!name?.trim()) { setError(form.type === 'Company' ? 'Company name is required' : 'First name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, email: form.email ? [form.email] : [], phone: form.phone ? [form.phone] : [] };
      const result = contact
        ? await contactsApi.update(contact._id, payload)
        : await contactsApi.create(payload);
      onSave(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact');
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
        style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 24, boxShadow: '0 32px 80px rgba(11,11,20,0.18)', border: '1px solid var(--border)' }}
      >
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="h-title" style={{ fontSize: 22 }}>{contact ? 'Edit Contact' : 'New Contact'}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
            <I.X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid rgba(220,38,96,0.15)' }}>{error}</div>}

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, background: 'var(--active)', borderRadius: 12 }}>
            {CONTACT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => set('type', t)}
                style={{ flex: 1, height: 36, borderRadius: 9, fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                  background: form.type === t ? 'var(--surface)' : 'transparent',
                  color: form.type === t ? 'var(--purple)' : 'var(--text-secondary)',
                  boxShadow: form.type === t ? '0 1px 4px rgba(11,11,20,0.08)' : 'none',
                }}>
                {t === 'Individual' ? <><I.User size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />Individual</> : <><I.Building size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />Company</>}
              </button>
            ))}
          </div>

          {form.type === 'Individual' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="First Name *"><input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jane" /></Field>
              <Field label="Last Name"><input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Smith" /></Field>
            </div>
          ) : (
            <Field label="Company Name *"><input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" /></Field>
          )}

          {form.type === 'Individual' && (
            <Field label="Company / Employer"><input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Employer or organization" /></Field>
          )}

          <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" /></Field>
          <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" /></Field>
          <Field label="Address"><input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, Country" /></Field>
          <Field label="Website"><input className="input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" /></Field>

          <Field label="Referral Source">
            <select className="input" value={form.referral_source} onChange={e => set('referral_source', e.target.value)} style={{ cursor: 'pointer' }}>
              {REFERRAL_SOURCES.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Notes">
            <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes about this contact…" style={{ resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Saving…' : contact ? 'Update Contact' : 'Create Contact'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ContactDetail({ contact, onEdit, onBack, onDelete }) {
  const fullName = contact.type === 'Company'
    ? contact.company
    : [contact.first_name, contact.last_name].filter(Boolean).join(' ');

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 28 }}>
        <I.ArrowLeft size={15} /> All Contacts
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Main card */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <Avatar contact={contact} size={64} />
            <div>
              <h1 className="h-title" style={{ fontSize: 26, marginBottom: 4 }}>{fullName}</h1>
              {contact.company && contact.type === 'Individual' && (
                <div className="t-secondary" style={{ fontSize: 14 }}>{contact.company}</div>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: contact.type === 'Company' ? 'var(--blue-bg)' : 'var(--purple-soft)', color: contact.type === 'Company' ? 'var(--blue)' : 'var(--purple)' }}>
                {contact.type === 'Company' ? <I.Building size={11} /> : <I.User size={11} />} {contact.type}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={onEdit}><I.Settings size={14} /> Edit</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { icon: <I.Mail size={15} />, label: 'Email', value: contact.email?.[0] },
              { icon: <I.Bell size={15} />, label: 'Phone', value: contact.phone?.[0] },
              { icon: <I.MapPin size={15} />, label: 'Address', value: contact.address },
              { icon: <I.Network size={15} />, label: 'Website', value: contact.website },
              { icon: <I.Users size={15} />, label: 'Referral Source', value: contact.referral_source },
            ].filter(r => r.value).map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--active)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {contact.notes && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Notes</div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contact.email?.[0] && (
                <a href={`mailto:${contact.email[0]}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 10 }}>
                  <I.Mail size={14} /> Send Email
                </a>
              )}
              {contact.phone?.[0] && (
                <a href={`tel:${contact.phone[0]}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 10 }}>
                  <I.Bell size={14} /> Call
                </a>
              )}
              <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 10 }}>
                <I.Briefcase size={14} /> New Matter
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Related Matters</div>
            <div className="t-secondary" style={{ fontSize: 13 }}>No matters linked yet.</div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="h-title" style={{ fontSize: 15, marginBottom: 14 }}>Timeline</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Added {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : 'recently'}
            </div>
          </div>

          <button onClick={onDelete} className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)', width: '100%' }}>
            Delete Contact
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact, onClick }) {
  const fullName = contact.type === 'Company'
    ? contact.company
    : [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  return (
    <motion.div
      className="card"
      style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.2s, transform 0.2s' }}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 10px 32px rgba(11,11,20,0.10)' }}
    >
      <Avatar contact={contact} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-title" style={{ fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email?.[0] || contact.phone?.[0] || contact.company || '—'}</div>
      </div>
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: contact.type === 'Company' ? 'var(--blue-bg)' : 'var(--purple-soft)', color: contact.type === 'Company' ? 'var(--blue)' : 'var(--purple)', fontWeight: 600, flexShrink: 0 }}>
        {contact.type}
      </span>
    </motion.div>
  );
}

/* ── Main Contacts Page ──────────────────────────────────── */
export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conflictResult, setConflictResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contactsApi.list();
      setContacts(r.data || []);
    } catch {
      setError('Failed to load contacts. Make sure the backend is running.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(saved) {
    setShowModal(false);
    setEditingContact(null);
    await load();
    if (saved?._id) setSelectedContact(saved);
  }

  async function handleDelete() {
    if (!selectedContact || !window.confirm('Delete this contact permanently?')) return;
    try {
      await contactsApi.remove(selectedContact._id);
      setSelectedContact(null);
      await load();
    } catch { /* silent */ }
  }

  const filtered = contacts.filter(c => {
    const name = c.type === 'Company' ? c.company : `${c.first_name || ''} ${c.last_name || ''}`.trim();
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || c.email?.[0]?.toLowerCase().includes(search.toLowerCase()) || c.phone?.[0]?.includes(search);
    const matchType = filterType === 'All' || c.type === filterType;
    return matchSearch && matchType;
  });

  /* Detail view */
  if (selectedContact) {
    return (
      <div style={{ padding: '80px 28px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <ContactDetail
          contact={selectedContact}
          onBack={() => setSelectedContact(null)}
          onEdit={() => { setEditingContact(selectedContact); setShowModal(true); }}
          onDelete={handleDelete}
        />
        <AnimatePresence>
          {showModal && (
            <ContactModal
              contact={editingContact}
              onClose={() => { setShowModal(false); setEditingContact(null); }}
              onSave={async (saved) => {
                setShowModal(false);
                setSelectedContact(saved);
                setContacts(cs => cs.map(c => c._id === saved._id ? saved : c));
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* List view */
  return (
    <div style={{ padding: '80px 28px 100px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="h-title" style={{ fontSize: 30, marginBottom: 4 }}>Contacts</h1>
          <p className="t-secondary" style={{ fontSize: 14 }}>Clients, opposing counsel, witnesses, and all related parties</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={async () => {
            const name = window.prompt('Enter name to check for conflicts:');
            if (!name) return;
            try {
              const r = await contactsApi.conflictCheck(name, '');
              setConflictResult(r.data);
            } catch { setConflictResult({ conflicts: [], checked: name }); }
          }}>
            <I.Search size={14} /> Conflict Check
          </button>
          <button className="btn btn-purple" onClick={() => { setEditingContact(null); setShowModal(true); }}>
            <I.User size={14} /> New Contact
          </button>
        </div>
      </div>

      {/* Conflict result */}
      <AnimatePresence>
        {conflictResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: conflictResult.conflicts?.length ? 'var(--red-bg)' : 'var(--green-bg)', color: conflictResult.conflicts?.length ? 'var(--red)' : 'var(--green)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14, border: `1px solid ${conflictResult.conflicts?.length ? 'rgba(220,38,96,0.2)' : 'rgba(22,163,106,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>
              {conflictResult.conflicts?.length
                ? `⚠ Potential conflict found for "${conflictResult.checked}" — ${conflictResult.conflicts.length} match(es)`
                : `✓ No conflicts found for "${conflictResult.checked}"`}
            </span>
            <button onClick={() => setConflictResult(null)} style={{ color: 'inherit', opacity: 0.7 }}><I.X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { l: 'Total', v: contacts.length, col: 'var(--purple)' },
          { l: 'Individuals', v: contacts.filter(c => c.type !== 'Company').length, col: 'var(--blue)' },
          { l: 'Companies', v: contacts.filter(c => c.type === 'Company').length, col: 'var(--green)' },
        ].map(({ l, v, col }) => (
          <div key={l} className="card" style={{ padding: '14px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</div>
            <div className="h-title" style={{ fontSize: 28, color: col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <I.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 140, cursor: 'pointer' }}>
          <option>All</option>
          {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {error && <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 14 }}>{error}</div>}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 22, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}><I.Users size={30} /></div>
          <div className="h-title" style={{ fontSize: 20, marginBottom: 8 }}>{contacts.length === 0 ? 'No contacts yet' : 'No matches'}</div>
          <p className="t-secondary" style={{ fontSize: 14, marginBottom: 24 }}>{contacts.length === 0 ? 'Add your first client or contact to get started.' : 'Try a different search term.'}</p>
          {contacts.length === 0 && <button className="btn btn-purple" onClick={() => { setEditingContact(null); setShowModal(true); }}>Add First Contact</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map(c => (
            <ContactCard key={c._id} contact={c} onClick={() => setSelectedContact(c)} />
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
