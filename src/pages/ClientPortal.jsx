import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';

/* ─── Mock portal data keyed by token ────────────────────────── */
const PORTAL_DATA = {
  'demo': {
    client: 'Ahmed Al-Rashid',
    firm: 'Nyaya Law Associates',
    attorney: 'Adnan Mirza',
    matter: {
      title: 'Al-Rashid v. Hassan — Family Proceedings',
      number: 'M-2024-001',
      type: 'Family Law',
      stage: 'Discovery',
      stages: ['Intake', 'Filing', 'Discovery', 'Pre-Trial', 'Trial', 'Closed'],
      lastUpdate: '2026-05-10',
      nextDate: '2026-06-10',
      nextEvent: 'Court Hearing — Islamabad High Court',
    },
    documents: [
      { name: 'Retainer Agreement', date: '2026-05-02', type: 'Contract', size: '184 KB' },
      { name: 'Petition — Initial Filing', date: '2026-05-05', type: 'Court Filing', size: '320 KB' },
      { name: 'Discovery Request List', date: '2026-05-12', type: 'Discovery', size: '95 KB' },
    ],
    invoices: [
      { number: 'INV-001', description: 'Initial Retainer', amount: 50000, status: 'Paid', date: '2026-05-02' },
      { number: 'INV-002', description: 'Court Filing Fees', amount: 12000, status: 'Paid', date: '2026-05-07' },
      { number: 'INV-003', description: 'Legal Services — May 2026', amount: 85000, status: 'Outstanding', date: '2026-05-14', due: '2026-05-28' },
    ],
    messages: [
      { from: 'Adnan Mirza', date: '2026-05-14 16:30', text: 'The court has confirmed the hearing date for June 10. Please ensure you have all bank statements from 2023 ready. We\'ll meet before the hearing to prepare.' },
      { from: 'Adnan Mirza', date: '2026-05-10 11:00', text: 'Filed the discovery motion today. Opposing counsel has 30 days to respond. I\'ll keep you updated on any developments.' },
    ],
  },
};

const STAGE_COLORS = ['#9CA3AF', '#3B82F6', '#7C3AED', '#F59E0B', '#EF4444', '#10B981'];

function StatusBadge({ status }) {
  const meta = { Paid: ['#ECFDF5', '#059669'], Outstanding: ['#FFF7ED', '#D97706'], Overdue: ['#FFF1F2', '#DC2626'] };
  const [bg, color] = meta[status] || ['#F3F4F6', '#6B7280'];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color }}>{status}</span>;
}

export default function ClientPortal() {
  const { token } = useParams();
  const data = PORTAL_DATA[token] || PORTAL_DATA['demo'];
  const [activeTab, setActiveTab] = useState('overview');

  const stageIndex = data.matter.stages.indexOf(data.matter.stage);
  const outstanding = data.invoices.filter(i => i.status === 'Outstanding').reduce((s, i) => s + i.amount, 0);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: I.Home },
    { id: 'documents', label: `Documents (${data.documents.length})`, icon: I.Doc },
    { id: 'invoices', label: `Invoices (${data.invoices.length})`, icon: I.Receipt },
    { id: 'messages', label: `Messages (${data.messages.length})`, icon: I.MessageCircle },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', fontFamily: 'inherit' }}>

      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <I.Logo size={28} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Client Portal</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{data.firm}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
              {data.client[0]}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{data.client}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Matter header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #E5E7EB', padding: '24px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{data.matter.type} · {data.matter.number}</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>{data.matter.title}</h2>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Attorney: {data.attorney} · Last update: {data.matter.lastUpdate}</div>
            </div>
            {outstanding > 0 && (
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>OUTSTANDING</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>PKR {outstanding.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Stage progress */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case Stage</div>
            <div style={{ display: 'flex', gap: 0 }}>
              {data.matter.stages.map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 6, background: i <= stageIndex ? '#7C3AED' : '#E5E7EB', borderRadius: i === 0 ? '3px 0 0 3px' : i === data.matter.stages.length - 1 ? '0 3px 3px 0' : 0, marginBottom: 6 }} />
                  <div style={{ fontSize: 10, fontWeight: i === stageIndex ? 800 : 500, color: i === stageIndex ? '#7C3AED' : i < stageIndex ? '#374151' : '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          {data.matter.nextDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10 }}>
              <I.Calendar size={14} style={{ color: '#7C3AED' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Next: {data.matter.nextEvent}</span>
              <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>{data.matter.nextDate}</span>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 14, padding: 4, border: '1.5px solid #E5E7EB', marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === t.id ? '#7C3AED' : 'transparent', color: activeTab === t.id ? '#fff' : '#6B7280', transition: 'all 150ms', whiteSpace: 'nowrap' }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { label: 'Your Attorney', value: data.attorney, sub: data.firm, icon: I.User, color: '#7C3AED' },
              { label: 'Documents Shared', value: data.documents.length, sub: 'Click Documents tab to view', icon: I.Doc, color: '#3B82F6' },
              { label: 'Invoices', value: data.invoices.length, sub: `${data.invoices.filter(i => i.status === 'Paid').length} paid`, icon: I.Receipt, color: '#10B981' },
              { label: 'Messages', value: data.messages.length, sub: 'From your attorney', icon: I.MessageCircle, color: '#F59E0B' },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: card.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{card.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{card.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.documents.map((doc, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <I.Doc size={18} style={{ color: '#7C3AED' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{doc.name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{doc.type} · {doc.size} · Shared {doc.date}</div>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  <I.Download size={13} /> Download
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Invoices */}
        {activeTab === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.invoices.map((inv, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <I.Receipt size={18} style={{ color: '#10B981' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{inv.description}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{inv.number} · {inv.date}{inv.due ? ` · Due ${inv.due}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>PKR {inv.amount.toLocaleString()}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Messages */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.messages.map((msg, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E5E7EB', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F5F3FF', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: '#7C3AED', flexShrink: 0 }}>{msg.from[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{msg.from}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{msg.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{msg.text}</div>
              </div>
            ))}

            {/* Reply section */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed #DDD6FE', padding: '18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', marginBottom: 10 }}>Reply to your attorney</div>
              <textarea placeholder="Type your message…" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, resize: 'vertical', height: 80, boxSizing: 'border-box', outline: 'none' }} />
              <button style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                <I.Send size={14} /> Send Message
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
          Powered by <strong style={{ color: '#7C3AED' }}>Nyaya</strong> · Secure Client Portal · All communications are confidential
        </div>
      </div>
    </div>
  );
}
