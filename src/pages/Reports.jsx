import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { I } from '../components/Icons';
import api from '../api/axios';

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtMoney(n) { return `$${(parseFloat(n) || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtHours(m) { return `${((m || 0) / 60).toFixed(1)}h`; }

/* ─── CSS bar chart ───────────────────────────────────────────── */
function BarChart({ data, maxValue, color = 'var(--purple)', unit = '' }) {
  if (!data?.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>No data yet</div>;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
            {unit}{d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value}
          </div>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((d.value / max) * 90, d.value > 0 ? 4 : 0)}px` }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 20 }}
            style={{ width: '100%', background: color, borderRadius: '4px 4px 0 0', minHeight: d.value > 0 ? 4 : 0 }}
          />
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut / Pie ring (CSS) ──────────────────────────────────── */
function PieRing({ segments }) {
  if (!segments?.length) return null;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const COLORS = ['var(--purple)', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const gradientParts = segments.map((seg, i) => {
    const pct = (seg.value / total) * 100;
    const from = cumulative;
    cumulative += pct;
    return `${COLORS[i % COLORS.length]} ${from}% ${cumulative}%`;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${gradientParts.join(', ')})`,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: '22%', borderRadius: '50%', background: 'var(--surface)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seg.label}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginLeft: 'auto', paddingLeft: 12 }}>{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, delta }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: delta >= 0 ? '#10B981' : '#EF4444' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs last period
        </div>
      )}
    </div>
  );
}

/* ─── Reports ─────────────────────────────────────────────────── */
const RANGES = ['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'All Time'];

export default function Reports() {
  const [range, setRange]   = useState('This Month');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/reports/summary', { params: { range } })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  /* Build display values — use API data if available, else show zeros */
  const stats = {
    revenue:        data?.revenue || 0,
    revenueCollected: data?.revenue_collected || 0,
    totalHours:     data?.total_hours_minutes || 0,
    billableHours:  data?.billable_hours_minutes || 0,
    mattersClosed:  data?.matters_closed || 0,
    mattersOpen:    data?.matters_open || 0,
    invoicesSent:   data?.invoices_sent || 0,
    invoicesPaid:   data?.invoices_paid || 0,
    avgRate:        data?.avg_hourly_rate || 0,
    collectionRate: data?.collection_rate || 0,
    utilizationRate:data?.utilization_rate || 0,
  };

  const revenueChart = data?.revenue_by_month || [
    { label: 'Jan', value: 0 }, { label: 'Feb', value: 0 }, { label: 'Mar', value: 0 },
    { label: 'Apr', value: 0 }, { label: 'May', value: 0 }, { label: 'Jun', value: 0 },
  ];

  const hoursChart = data?.hours_by_week || [
    { label: 'Wk1', value: 0 }, { label: 'Wk2', value: 0 }, { label: 'Wk3', value: 0 }, { label: 'Wk4', value: 0 },
  ];

  const mattersByArea = data?.matters_by_practice_area || [];
  const topClients    = data?.top_clients || [];
  const matterStatus  = data?.matter_status_breakdown || [
    { label: 'Open', value: stats.mattersOpen },
    { label: 'Closed', value: stats.mattersClosed },
  ];

  const activityTypes = data?.time_by_activity || [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FC', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>Reports & Analytics</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Firm performance, revenue, and utilization metrics</p>
          </div>
          {/* Range selector */}
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 12, padding: 4, gap: 2, border: '1.5px solid var(--border)' }}>
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{
                  padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: range === r ? 'var(--purple)' : 'transparent',
                  color: range === r ? '#fff' : 'var(--text-muted)',
                  transition: 'all 150ms', whiteSpace: 'nowrap',
                }}>{r}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard label="Revenue Billed"   value={fmtMoney(stats.revenue)}                color="var(--purple)"  sub={range} />
              <StatCard label="Revenue Collected" value={fmtMoney(stats.revenueCollected)}       color="#10B981"        sub={`${stats.collectionRate}% collection rate`} />
              <StatCard label="Billable Hours"    value={fmtHours(stats.billableHours)}           color="#3B82F6"        sub={`of ${fmtHours(stats.totalHours)} total`} />
              <StatCard label="Utilization Rate"  value={`${stats.utilizationRate}%`}             color="#F59E0B"        sub="billable / total hours" />
              <StatCard label="Avg Hourly Rate"   value={fmtMoney(stats.avgRate)}                color="#8B5CF6"        sub="across all attorneys" />
              <StatCard label="Invoices Sent"     value={stats.invoicesSent}                     color="#EF4444"        sub={`${stats.invoicesPaid} paid`} />
              <StatCard label="Matters Open"      value={stats.mattersOpen}                      color="#0EA5E9"        sub={`${stats.mattersClosed} closed`} />
            </div>

            {/* Two column: revenue chart + matter status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, marginBottom: 18 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 20 }}>Revenue Over Time</div>
                <BarChart data={revenueChart} unit="$" color="var(--purple)" />
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 20 }}>Matter Status</div>
                <PieRing segments={matterStatus.filter(s => s.value > 0)} />
                {!matterStatus.some(s => s.value > 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No matter data yet</div>
                )}
              </div>
            </div>

            {/* Two column: hours chart + activity types */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, marginBottom: 18 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 20 }}>Billable Hours by Week</div>
                <BarChart data={hoursChart} color="#3B82F6" />
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px 24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 20 }}>Time by Activity</div>
                <PieRing segments={activityTypes.filter(s => s.value > 0)} />
                {!activityTypes.some(s => s.value > 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Log time entries to see breakdown</div>
                )}
              </div>
            </div>

            {/* Two column: top clients + practice areas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Top clients */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Top Clients by Revenue</div>
                {topClients.length === 0 ? (
                  <div style={{ padding: '32px 22px', color: 'var(--text-muted)', fontSize: 13 }}>No client data yet — create matters and log time.</div>
                ) : topClients.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.matter_count} matter{c.matter_count !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{fmtMoney(c.revenue)}</div>
                  </div>
                ))}
              </div>

              {/* Practice area breakdown */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Matters by Practice Area</div>
                {mattersByArea.length === 0 ? (
                  <div style={{ padding: '32px 22px', color: 'var(--text-muted)', fontSize: 13 }}>No matters yet — add matters to see breakdown.</div>
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    {mattersByArea.map((a, i) => {
                      const max = Math.max(...mattersByArea.map(x => x.count), 1);
                      return (
                        <div key={i} style={{ padding: '8px 22px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{a.area}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>{a.count}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--elevated)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(a.count / max) * 100}%` }}
                              transition={{ delay: i * 0.05, duration: 0.5 }}
                              style={{ height: '100%', borderRadius: 3, background: 'var(--purple)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
