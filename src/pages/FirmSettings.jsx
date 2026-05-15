import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';
import { firmApi } from '../api/firm.api';

const ROLES = ['admin', 'lawyer', 'paralegal', 'client', 'viewer'];
const ROLE_COLOR = { admin: '#7C3AED', lawyer: '#3B82F6', paralegal: '#10B981', client: '#F59E0B', viewer: '#9CA3AF' };

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── Firm Profile tab ────────────────────────────────────────── */
function FirmProfile({ firm, setFirm }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setFirm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await firmApi.updateSettings(firm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save firm settings:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[['name', 'Firm Name'], ['email', 'Email'], ['phone', 'Phone'], ['website', 'Website'], ['barNumber', 'Bar Registration Number'], ['jurisdiction', 'Primary Jurisdiction'], ['taxId', 'Tax ID / NTN'], ['address', 'Office Address']].map(([k, label]) => (
          <div key={k} style={k === 'address' ? { gridColumn: '1 / -1' } : {}}>
            <label style={lbl}>{label}</label>
            <input value={firm[k] || ''} onChange={e => set(k, e.target.value)} style={inp} />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>About the Firm</label>
          <textarea value={firm.description || ''} onChange={e => set('description', e.target.value)} style={{ ...inp, height: 80, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
          {saved ? <><I.Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ─── Team Members tab ────────────────────────────────────────── */
function TeamMembers() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'lawyer' });

  useEffect(() => {
    firmApi.listTeam()
      .then(res => setTeam(res.data.data || []))
      .catch(e => console.error('Failed to load team:', e))
      .finally(() => setLoading(false));
  }, []);

  async function sendInvite() {
    if (!invite.email || !invite.name) return;
    try {
      const res = await firmApi.inviteMember(invite);
      setTeam(t => [...t, res.data.data]);
      setInvite({ name: '', email: '', role: 'lawyer' });
      setShowInvite(false);
    } catch (e) {
      console.error('Failed to invite member:', e);
    }
  }

  async function toggleStatus(memberId) {
    const prev = team;
    setTeam(t => t.map(m => m._id === memberId ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
    try {
      await firmApi.toggleMember(memberId);
    } catch {
      setTeam(prev);
    }
  }

  async function removeMember(memberId) {
    if (!window.confirm('Remove this team member?')) return;
    const prev = team;
    setTeam(t => t.filter(m => m._id !== memberId));
    try {
      await firmApi.removeMember(memberId);
    } catch {
      setTeam(prev);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowInvite(true)} style={btnPurple}><I.UserPlus size={14} /> Invite Member</button>
      </div>

      {showInvite && (
        <div style={{ background: '#F5F3FF', borderRadius: 14, border: '1.5px solid #DDD6FE', padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#6D28D9', marginBottom: 14 }}>Invite New Team Member</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[['name', 'Full Name', 'text'], ['email', 'Email Address', 'email']].map(([k, pl, type]) => (
              <div key={k}>
                <label style={lbl}>{pl}</label>
                <input type={type} value={invite[k]} onChange={e => setInvite(i => ({ ...i, [k]: e.target.value }))} style={inp} placeholder={pl} />
              </div>
            ))}
            <div>
              <label style={lbl}>Role</label>
              <select value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))} style={inp}>
                {ROLES.map(r => <option key={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={sendInvite} style={btnPurple}><I.Send size={13} /> Send Invitation</button>
            <button onClick={() => setShowInvite(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>Loading team…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Name', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((m, i) => (
                <tr key={m._id} style={{ borderBottom: i < team.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: (ROLE_COLOR[m.role] || '#9CA3AF') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: ROLE_COLOR[m.role] || '#9CA3AF' }}>{(m.name || '?')[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#6B7280' }}>{m.email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: (ROLE_COLOR[m.role] || '#9CA3AF') + '18', color: ROLE_COLOR[m.role] || '#9CA3AF', textTransform: 'capitalize' }}>{m.role}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : m.joined || '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.status === 'active' ? '#ECFDF5' : m.status === 'pending' ? '#FFF7ED' : '#F3F4F6', color: m.status === 'active' ? '#059669' : m.status === 'pending' ? '#D97706' : '#6B7280' }}>{m.status}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleStatus(m._id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {m.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => removeMember(m._id)} style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #FECDD3', background: '#FFF1F2', color: '#DC2626', cursor: 'pointer', fontSize: 11 }}>
                        <I.X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !team.length && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>No team members yet. Invite someone above.</div>
        )}
      </div>
    </div>
  );
}

/* ─── Billing Config tab ──────────────────────────────────────── */
function BillingConfig({ billing, setBilling }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setBilling(b => ({ ...b, [k]: v }));
  const fields = [
    ['currency', 'Currency', ['PKR', 'USD', 'GBP', 'EUR', 'AED']],
    ['defaultRate', 'Default Hourly Rate'],
    ['taxRate', 'Tax Rate (%)'],
    ['invoicePrefix', 'Invoice Number Prefix'],
    ['paymentTerms', 'Payment Terms (days)'],
    ['lateFeePercent', 'Late Fee (% per month)'],
    ['trustAccountBank', 'Trust Account Bank Details'],
  ];

  async function save() {
    setSaving(true);
    try {
      await firmApi.updateBilling(billing);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save billing settings:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {fields.map(([k, label, opts]) => (
          <div key={k} style={k === 'trustAccountBank' ? { gridColumn: '1 / -1' } : {}}>
            <label style={lbl}>{label}</label>
            {opts ? (
              <select value={billing[k] || ''} onChange={e => set(k, e.target.value)} style={inp}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input value={billing[k] || ''} onChange={e => set(k, e.target.value)} style={inp} />
            )}
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
        {saved ? <><I.Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Billing Settings'}
      </button>
    </div>
  );
}

/* ─── Notifications tab ───────────────────────────────────────── */
function Notifications({ notifs, setNotifs }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toggle = k => setNotifs(n => ({ ...n, [k]: !n[k] }));
  const items = [
    ['newLead', 'New Lead Submitted', 'Get notified when a new intake form is submitted'],
    ['matterUpdate', 'Matter Status Change', 'Notify when a matter moves to a new stage'],
    ['invoicePaid', 'Invoice Paid', 'Notify when a client pays an invoice'],
    ['taskDue', 'Task Due Soon', 'Remind 24 hours before a task deadline'],
    ['appointmentReminder', 'Appointment Reminder', 'Calendar event reminders via email'],
    ['documentShared', 'Document Shared', 'Notify when a client views a shared document'],
    ['weeklyReport', 'Weekly Performance Report', 'Receive a weekly summary of firm activity'],
    ['systemUpdates', 'System Updates', 'Product news and feature announcements'],
  ];

  async function save() {
    setSaving(true);
    try {
      await firmApi.updateNotifications(notifs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save notification settings:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', overflow: 'hidden', marginBottom: 16 }}>
        {items.map(([key, title, desc], i) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
            </div>
            <button
              onClick={() => toggle(key)}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: notifs[key] ? '#7C3AED' : '#E5E7EB', transition: 'background 200ms', position: 'relative', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: notifs[key] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
        {saved ? <><I.Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
const TABS = [
  { id: 'profile', label: 'Firm Profile', icon: I.Building },
  { id: 'team', label: 'Team Members', icon: I.Users },
  { id: 'billing', label: 'Billing Config', icon: I.DollarSign },
  { id: 'notifications', label: 'Notifications', icon: I.Bell },
];

export default function FirmSettings() {
  const [tab, setTab] = useState('profile');
  const [firm, setFirm] = useState({});
  const [billing, setBilling] = useState({});
  const [notifs, setNotifs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firmApi.getSettings()
      .then(res => {
        const d = res.data.data || {};
        setFirm({
          name: d.name || '', email: d.email || '', phone: d.phone || '',
          website: d.website || '', barNumber: d.barNumber || '', jurisdiction: d.jurisdiction || '',
          taxId: d.taxId || '', address: d.address || '', description: d.description || '',
        });
        setBilling(d.billing || { currency: 'PKR', defaultRate: '', taxRate: '', invoicePrefix: 'INV', paymentTerms: '30', lateFeePercent: '', trustAccountBank: '' });
        setNotifs(d.notifications || { newLead: true, matterUpdate: true, invoicePaid: true, taskDue: true, appointmentReminder: true, documentShared: false, systemUpdates: false, weeklyReport: true });
      })
      .catch(e => console.error('Failed to load firm settings:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #374151, #111827)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Settings size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Firm Settings</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Manage your firm profile, team, billing defaults, and notifications</p>
            </div>
          </div>
        </motion.div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 14, padding: 4, border: '1.5px solid #E5E7EB', marginBottom: 28, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === t.id ? '#7C3AED' : 'transparent', color: tab === t.id ? '#fff' : '#6B7280', transition: 'all 150ms' }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF', fontSize: 14 }}>Loading settings…</div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {tab === 'profile'       && <FirmProfile firm={firm} setFirm={setFirm} />}
            {tab === 'team'          && <TeamMembers />}
            {tab === 'billing'       && <BillingConfig billing={billing} setBilling={setBilling} />}
            {tab === 'notifications' && <Notifications notifs={notifs} setNotifs={setNotifs} />}
          </motion.div>
        )}
      </div>
    </div>
  );
}
