import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';

/* ─── Initial state ───────────────────────────────────────────── */
const INIT_FIRM = {
  name: 'Nyaya Law Associates', address: '42 Justice Avenue, F-7/2, Islamabad',
  phone: '+92 51 1234567', email: 'info@nyayalaw.pk', website: 'www.nyayalaw.pk',
  barNumber: 'ISB-LAW-2019-0042', jurisdiction: 'Islamabad High Court',
  taxId: '1234567-8', description: 'Full-service law firm specializing in corporate, family, and criminal law.',
};

const INIT_TEAM = [
  { id: 1, name: 'Adnan Mirza', email: 'adnan@nyayalaw.pk', role: 'admin', status: 'active', joined: '2022-01-15' },
  { id: 2, name: 'Sadia Farooq', email: 'sadia@nyayalaw.pk', role: 'lawyer', status: 'active', joined: '2022-06-01' },
  { id: 3, name: 'Kamran Ali', email: 'kamran@nyayalaw.pk', role: 'lawyer', status: 'active', joined: '2023-03-10' },
  { id: 4, name: 'Aisha Qureshi', email: 'aisha@nyayalaw.pk', role: 'paralegal', status: 'active', joined: '2023-09-20' },
  { id: 5, name: 'Tariq Zaman', email: 'tariq@nyayalaw.pk', role: 'lawyer', status: 'inactive', joined: '2021-11-05' },
];

const INIT_BILLING = {
  currency: 'PKR', defaultRate: '15000', taxRate: '16', invoicePrefix: 'INV',
  paymentTerms: '30', lateFeePercent: '1.5', trustAccountBank: 'Meezan Bank — IBAN PK36MEZN',
};

const INIT_NOTIFS = {
  newLead: true, matterUpdate: true, invoicePaid: true, taskDue: true,
  appointmentReminder: true, documentShared: false, systemUpdates: false, weeklyReport: true,
};

const ROLES = ['admin', 'lawyer', 'paralegal', 'client', 'viewer'];
const ROLE_COLOR = { admin: '#7C3AED', lawyer: '#3B82F6', paralegal: '#10B981', client: '#F59E0B', viewer: '#9CA3AF' };

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── Firm Profile tab ────────────────────────────────────────── */
function FirmProfile({ firm, setFirm }) {
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setFirm(f => ({ ...f, [k]: v }));

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <button onClick={save} style={btnPurple}>
          {saved ? <><I.Check size={14} /> Saved!</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ─── Team Members tab ────────────────────────────────────────── */
function TeamMembers({ team, setTeam }) {
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'lawyer' });

  function sendInvite() {
    if (!invite.email || !invite.name) return;
    setTeam(t => [...t, { ...invite, id: Date.now(), status: 'pending', joined: new Date().toISOString().slice(0, 10) }]);
    setInvite({ name: '', email: '', role: 'lawyer' });
    setShowInvite(false);
  }

  function toggleStatus(id) {
    setTeam(t => t.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
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
              <tr key={m.id} style={{ borderBottom: i < team.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: ROLE_COLOR[m.role] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: ROLE_COLOR[m.role] }}>{m.name[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#6B7280' }}>{m.email}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ROLE_COLOR[m.role] + '18', color: ROLE_COLOR[m.role], textTransform: 'capitalize' }}>{m.role}</span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF' }}>{m.joined}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.status === 'active' ? '#ECFDF5' : m.status === 'pending' ? '#FFF7ED' : '#F3F4F6', color: m.status === 'active' ? '#059669' : m.status === 'pending' ? '#D97706' : '#6B7280' }}>{m.status}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <button onClick={() => toggleStatus(m.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {m.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Billing Config tab ──────────────────────────────────────── */
function BillingConfig({ billing, setBilling }) {
  const [saved, setSaved] = useState(false);
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
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={btnPurple}>
        {saved ? <><I.Check size={14} /> Saved!</> : 'Save Billing Settings'}
      </button>
    </div>
  );
}

/* ─── Notifications tab ───────────────────────────────────────── */
function Notifications({ notifs, setNotifs }) {
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
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
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
  const [firm, setFirm] = useState(INIT_FIRM);
  const [team, setTeam] = useState(INIT_TEAM);
  const [billing, setBilling] = useState(INIT_BILLING);
  const [notifs, setNotifs] = useState(INIT_NOTIFS);

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

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {tab === 'profile'       && <FirmProfile firm={firm} setFirm={setFirm} />}
          {tab === 'team'          && <TeamMembers team={team} setTeam={setTeam} />}
          {tab === 'billing'       && <BillingConfig billing={billing} setBilling={setBilling} />}
          {tab === 'notifications' && <Notifications notifs={notifs} setNotifs={setNotifs} />}
        </motion.div>
      </div>
    </div>
  );
}
