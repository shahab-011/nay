import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { reportsApi } from '../api/reports.api';

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmt$  = n => `$${(parseFloat(n)||0).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtN  = n => (parseFloat(n)||0).toLocaleString('en',{maximumFractionDigits:1});
const fmtPct= n => `${(parseFloat(n)||0).toFixed(1)}%`;

function downloadCSV(rows, filename) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = filename;
  a.click();
}

/* ─── Shared primitives ─────────────────────────────────────────── */
const COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];

function StatCard({ label, value, sub, color = '#7C3AED', icon: Ic }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'1.5px solid #E5E7EB', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        {Ic && <div style={{ width:32,height:32,borderRadius:8, background:`${color}18`, display:'flex',alignItems:'center',justifyContent:'center' }}><Ic size={16} style={{color}} /></div>}
        <span style={{ fontSize:12,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize:24,fontWeight:900,color:'#111827' }}>{value}</div>
      {sub && <div style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, color = '#7C3AED', unit = '' }) {
  if (!data?.length) return <Empty />;
  const max = Math.max(...data.map(d => d.value||d.total||d.hours||0), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:110 }}>
      {data.map((d, i) => {
        const val = d.value||d.total||d.hours||0;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:0 }}>
            <div style={{ fontSize:9,color:'#9CA3AF',fontWeight:700,textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%' }}>
              {unit}{val>=1000?`${(val/1000).toFixed(1)}k`:fmtN(val)}
            </div>
            <motion.div
              initial={{ height:0 }}
              animate={{ height:`${Math.max((val/max)*90,val>0?4:0)}px` }}
              transition={{ delay:i*0.04, type:'spring', stiffness:180, damping:18 }}
              style={{ width:'100%', background:color, borderRadius:'4px 4px 0 0' }}
            />
            <div style={{ fontSize:8,color:'#9CA3AF',fontWeight:700,textAlign:'center',letterSpacing:'0.04em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%' }}>
              {d.label||d.period||d.area||d.stage||d.source||d.type||''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieRing({ data, valueKey='count' }) {
  if (!data?.length) return <Empty />;
  const total = data.reduce((s,d) => s+(d[valueKey]||0), 0) || 1;
  let cum = 0;
  const parts = data.map((d,i) => {
    const pct = (d[valueKey]||0)/total*100;
    const from = cum; cum += pct;
    return `${COLORS[i%COLORS.length]} ${from}% ${cum}%`;
  });
  return (
    <div style={{ display:'flex',alignItems:'center',gap:20 }}>
      <div style={{ width:90,height:90,borderRadius:'50%',background:`conic-gradient(${parts.join(',')})`,position:'relative',flexShrink:0 }}>
        <div style={{ position:'absolute',inset:'24%',borderRadius:'50%',background:'#fff' }} />
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:5,flex:1,minWidth:0 }}>
        {data.slice(0,6).map((d,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
            <div style={{ width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0 }} />
            <span style={{ fontSize:11,color:'#374151',flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
              {d.label||d.area||d.stage||d.source||d.type||Object.values(d)[0]}
            </span>
            <span style={{ fontSize:11,fontWeight:800,color:'#111827' }}>
              {Math.round((d[valueKey]||0)/total*100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyMsg='No data' }) {
  if (!rows?.length) return <Empty msg={emptyMsg} />;
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:800,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'2px solid #E5E7EB',whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i%2===0?'#fff':'#F9FAFB' }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:'9px 12px',color:'#374151',borderBottom:'1px solid #F3F4F6',whiteSpace:'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key]??'—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ msg='No data for this period' }) {
  return <div style={{ textAlign:'center',padding:'32px 20px',color:'#9CA3AF',fontSize:13 }}>{msg}</div>;
}

function Card({ title, actions, children }) {
  return (
    <div style={{ background:'#fff',borderRadius:16,border:'1.5px solid #E5E7EB',padding:20,marginBottom:20 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:800,color:'#111827' }}>{title}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function DateRange({ from, to, onChange }) {
  return (
    <div style={{ display:'flex',gap:8,alignItems:'center' }}>
      <input type="date" value={from} onChange={e=>onChange('from',e.target.value)} style={{ padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E7EB',fontSize:12,color:'#374151',outline:'none' }} />
      <span style={{ fontSize:12,color:'#9CA3AF' }}>to</span>
      <input type="date" value={to} onChange={e=>onChange('to',e.target.value)} style={{ padding:'7px 10px',borderRadius:8,border:'1.5px solid #E5E7EB',fontSize:12,color:'#374151',outline:'none' }} />
    </div>
  );
}

/* ─── Tabs ──────────────────────────────────────────────────────── */
const TABS = [
  { id:'dashboard',  label:'Dashboard',  icon:I.Home },
  { id:'financial',  label:'Financial',  icon:I.DollarSign },
  { id:'time',       label:'Time',       icon:I.Clock },
  { id:'matters',    label:'Matters',    icon:I.Briefcase },
  { id:'pipeline',   label:'Pipeline',   icon:I.Star },
  { id:'custom',     label:'Saved',      icon:I.Save },
];

/* ─── Dashboard Tab ─────────────────────────────────────────────── */
function DashboardTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.dashboard().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Empty msg="Loading dashboard…" />;
  if (!data)   return <Empty msg="Failed to load dashboard" />;

  const { today={}, month={}, myTasks=[], recentActivity=[] } = data;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:20 }}>
        <StatCard label="Hours Today"     value={fmtN(today.hoursLogged)} icon={I.Clock}     color="#7C3AED" />
        <StatCard label="Billed Today"    value={fmt$(today.revenueBilled)} icon={I.DollarSign} color="#10B981" />
        <StatCard label="Tasks Due Today" value={today.tasksDueToday||0}  icon={I.CheckSquare} color="#F59E0B" />
        <StatCard label="Month Billed"    value={fmt$(month.billed)}       icon={I.TrendingUp}  color="#3B82F6" />
        <StatCard label="Month Collected" value={fmt$(month.collected)}    icon={I.Check}       color="#10B981" />
        <StatCard label="Outstanding"     value={fmt$(month.outstanding)}  icon={I.AlertTriangle||I.Alert} color="#EF4444" />
        <StatCard label="New Matters"     value={month.newMatters||0}      icon={I.Briefcase}   color="#8B5CF6" />
        <StatCard label="Invoices Sent"   value={month.invoicesSent||0}    icon={I.FileText}    color="#06B6D4" />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20 }}>
        <Card title="Upcoming Events">
          {(today.upcomingEvents||[]).length === 0
            ? <Empty msg="No upcoming events" />
            : (today.upcomingEvents||[]).map((e,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'#7C3AED',flexShrink:0 }} />
                <div style={{ flex:1,fontSize:13,fontWeight:600,color:'#111827' }}>{e.title}</div>
                <div style={{ fontSize:11,color:'#9CA3AF' }}>{new Date(e.startTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ))
          }
        </Card>

        <Card title="My Tasks (Top 5)">
          {myTasks.length === 0
            ? <Empty msg="No pending tasks" />
            : myTasks.map((t,i) => (
              <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ width:16,height:16,borderRadius:4,border:'2px solid #D1D5DB',flexShrink:0,marginTop:1 }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:'#111827',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{t.title}</div>
                  {t.dueDate && <div style={{ fontSize:11,color:'#9CA3AF' }}>{new Date(t.dueDate).toLocaleDateString()}</div>}
                </div>
                <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:12,background:t.priority==='urgent'?'#FEE2E2':t.priority==='high'?'#FEF3C7':'#F3F4F6',color:t.priority==='urgent'?'#DC2626':t.priority==='high'?'#D97706':'#6B7280',whiteSpace:'nowrap' }}>
                  {t.priority||'normal'}
                </span>
              </div>
            ))
          }
        </Card>
      </div>

      <Card title="Recent Activity">
        {recentActivity.length === 0
          ? <Empty msg="No recent activity" />
          : recentActivity.slice(0,10).map((inv,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid #F3F4F6' }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:'#7C3AED',flexShrink:0 }} />
              <div style={{ flex:1,fontSize:13,color:'#374151' }}>
                Invoice #{inv.invoiceNumber} · {inv.clientName||'—'} · {fmt$(inv.total)}
              </div>
              <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:12,background:inv.status==='paid'?'#ECFDF5':inv.status==='overdue'?'#FEE2E2':'#F3F4F6',color:inv.status==='paid'?'#059669':inv.status==='overdue'?'#DC2626':'#6B7280' }}>
                {inv.status}
              </span>
              <div style={{ fontSize:11,color:'#9CA3AF' }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
            </div>
          ))
        }
      </Card>
    </motion.div>
  );
}

/* ─── Financial Tab ─────────────────────────────────────────────── */
function FinancialTab() {
  const [from, setFrom]   = useState('');
  const [to,   setTo]     = useState('');
  const [rev,  setRev]    = useState(null);
  const [ar,   setAR]     = useState(null);
  const [col,  setCol]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [sub, setSub]     = useState('revenue');

  const load = useCallback(async () => {
    setLoading(true);
    const params = { from:from||undefined, to:to||undefined };
    try {
      const [rr, ar, cr] = await Promise.all([
        reportsApi.revenue(params),
        reportsApi.arAging(params),
        reportsApi.collections(params),
      ]);
      setRev(rr.data.data);
      setAR(ar.data.data);
      setCol(cr.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  function handleDate(field, val) {
    if (field==='from') setFrom(val); else setTo(val);
  }

  const SUB_TABS = [
    { id:'revenue',    label:'Revenue'     },
    { id:'ar',         label:'AR Aging'    },
    { id:'collections',label:'Collections' },
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div style={{ display:'flex',gap:4,background:'#F3F4F6',borderRadius:10,padding:3 }}>
          {SUB_TABS.map(t => (
            <button key={t.id} onClick={()=>setSub(t.id)} style={{ padding:'6px 14px',borderRadius:7,border:'none',background:sub===t.id?'#fff':'transparent',color:sub===t.id?'#7C3AED':'#6B7280',cursor:'pointer',fontSize:12,fontWeight:700,boxShadow:sub===t.id?'0 1px 4px rgba(0,0,0,0.1)':undefined }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <DateRange from={from} to={to} onChange={handleDate} />
          <button onClick={load} disabled={loading} style={{ padding:'7px 16px',borderRadius:8,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,opacity:loading?.7:1 }}>
            {loading?'…':'Apply'}
          </button>
        </div>
      </div>

      {sub === 'revenue' && rev && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20 }}>
            <StatCard label="Total Billed"  value={fmt$(rev.totals?.billed)}      color="#7C3AED" icon={I.DollarSign} />
            <StatCard label="Collected"     value={fmt$(rev.totals?.collected)}   color="#10B981" icon={I.Check} />
            <StatCard label="Outstanding"   value={fmt$(rev.totals?.outstanding)} color="#EF4444" icon={I.Alert} />
            <StatCard label="Invoices"      value={rev.totals?.invoiceCount||0}   color="#3B82F6" icon={I.FileText} />
          </div>
          <Card title="Revenue by Month" actions={<button onClick={()=>downloadCSV(rev.byPeriod,'revenue_by_month.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
            <BarChart data={(rev.byPeriod||[]).map(p=>({...p,value:p.total}))} color="#7C3AED" unit="$" />
          </Card>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            <Card title="By Practice Area">
              <BarChart data={(rev.byArea||[]).slice(0,8).map(a=>({...a,value:a.billed,label:a.area}))} color="#3B82F6" unit="$" />
            </Card>
            <Card title="Top Clients">
              <DataTable
                columns={[
                  {key:'name',label:'Client'},
                  {key:'billed',label:'Billed',render:v=>fmt$(v)},
                  {key:'collected',label:'Collected',render:v=>fmt$(v)},
                  {key:'count',label:'Invoices'},
                ]}
                rows={(rev.byClient||[]).slice(0,8)}
              />
            </Card>
          </div>
          <Card title="Top Matters">
            <DataTable
              columns={[
                {key:'title',label:'Matter'},
                {key:'billed',label:'Billed',render:v=>fmt$(v)},
                {key:'collected',label:'Collected',render:v=>fmt$(v)},
                {key:'count',label:'Invoices'},
              ]}
              rows={(rev.byMatter||[]).slice(0,10)}
            />
          </Card>
        </>
      )}

      {sub === 'ar' && ar && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
            {(ar.summary||[]).map((b,i) => (
              <StatCard key={b.range} label={`${b.range} days`} value={fmt$(b.total)} sub={`${b.count} invoice${b.count!==1?'s':''}`} color={COLORS[i]} />
            ))}
          </div>
          <Card title={`AR Aging — Total Outstanding: ${fmt$(ar.totalOutstanding)}`} actions={<button onClick={()=>downloadCSV(Object.values(ar.buckets||{}).flat(),'ar_aging.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
            <DataTable
              columns={[
                {key:'invoiceNumber',label:'Invoice #'},
                {key:'clientName',label:'Client'},
                {key:'dueDate',label:'Due Date',render:v=>v?new Date(v).toLocaleDateString():'—'},
                {key:'days',label:'Days Overdue'},
                {key:'amount',label:'Amount',render:v=>fmt$(v)},
              ]}
              rows={Object.entries(ar.buckets||{}).flatMap(([range,items])=>items.map(i=>({...i,range})))}
            />
          </Card>
        </>
      )}

      {sub === 'collections' && col && (
        <>
          <StatCard label="Total Collected" value={fmt$(col.total)} color="#10B981" icon={I.Check} />
          <div style={{ marginTop:16 }}>
            <Card title="Payment History" actions={<button onClick={()=>downloadCSV(col.payments,'collections.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
              <DataTable
                columns={[
                  {key:'date',label:'Date',render:v=>new Date(v).toLocaleDateString()},
                  {key:'clientName',label:'Client'},
                  {key:'invoiceNumber',label:'Invoice #'},
                  {key:'matterTitle',label:'Matter'},
                  {key:'amount',label:'Amount',render:v=>fmt$(v)},
                  {key:'method',label:'Method'},
                ]}
                rows={col.payments||[]}
              />
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─── Time Tab ──────────────────────────────────────────────────── */
function TimeTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const [time, setTime] = useState(null);
  const [util, setUtil] = useState(null);
  const [wip,  setWip]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [sub,  setSub]  = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    const params = { from:from||undefined, to:to||undefined };
    try {
      const [tr, ur, wr] = await Promise.all([
        reportsApi.time(params),
        reportsApi.utilization(params),
        reportsApi.wip(),
      ]);
      setTime(tr.data.data);
      setUtil(ur.data.data);
      setWip(wr.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div style={{ display:'flex',gap:4,background:'#F3F4F6',borderRadius:10,padding:3 }}>
          {[['overview','Overview'],['utilization','Utilization'],['wip','WIP']].map(([id,label]) => (
            <button key={id} onClick={()=>setSub(id)} style={{ padding:'6px 14px',borderRadius:7,border:'none',background:sub===id?'#fff':'transparent',color:sub===id?'#7C3AED':'#6B7280',cursor:'pointer',fontSize:12,fontWeight:700,boxShadow:sub===id?'0 1px 4px rgba(0,0,0,0.1)':undefined }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <DateRange from={from} to={to} onChange={(f,v)=>f==='from'?setFrom(v):setTo(v)} />
          <button onClick={load} disabled={loading} style={{ padding:'7px 16px',borderRadius:8,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,opacity:loading?.7:1 }}>
            {loading?'…':'Apply'}
          </button>
        </div>
      </div>

      {sub === 'overview' && time && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20 }}>
            <StatCard label="Total Hours"    value={fmtN(time.totals?.hours)+'h'}        color="#7C3AED" icon={I.Clock} />
            <StatCard label="Billable Hours" value={fmtN(time.totals?.billableHours)+'h'} color="#10B981" icon={I.Check} />
            <StatCard label="Unbilled Hours" value={fmtN(time.totals?.unbilledHours)+'h'} color="#EF4444" icon={I.Alert} />
            <StatCard label="Unbilled Value" value={fmt$(time.totals?.unbilledValue)}    color="#F59E0B" icon={I.DollarSign} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            <Card title="Hours by Month">
              <BarChart data={(time.byMonth||[]).map(p=>({...p,value:p.total,label:p.period?.slice(5)}))} color="#7C3AED" />
            </Card>
            <Card title="By Activity Type">
              <PieRing data={(time.byActivity||[]).map(a=>({...a,label:a.type,count:Math.round(a.hours*10)/10}))} valueKey="count" />
            </Card>
          </div>
          <Card title="By Practice Area">
            <BarChart data={(time.byArea||[]).slice(0,8).map(a=>({...a,value:a.hours,label:a.area}))} color="#3B82F6" />
          </Card>
        </>
      )}

      {sub === 'utilization' && util && (
        <Card title="Attorney Utilization" actions={<button onClick={()=>downloadCSV(util,'utilization.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
          <DataTable
            columns={[
              {key:'name',label:'Attorney'},
              {key:'totalHours',label:'Total Hours',render:v=>fmtN(v)+'h'},
              {key:'billableHours',label:'Billable',render:v=>fmtN(v)+'h'},
              {key:'billedHours',label:'Billed',render:v=>fmtN(v)+'h'},
              {key:'utilization',label:'Utilization',render:v=>(
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:60,height:6,borderRadius:3,background:'#F3F4F6',overflow:'hidden'}}>
                    <div style={{width:`${Math.min(v,100)}%`,height:'100%',background:v>=70?'#10B981':v>=40?'#F59E0B':'#EF4444',borderRadius:3}} />
                  </div>
                  <span style={{fontSize:11,fontWeight:700}}>{fmtPct(v)}</span>
                </div>
              )},
              {key:'realization',label:'Realization',render:v=>fmtPct(v)},
            ]}
            rows={util}
          />
        </Card>
      )}

      {sub === 'wip' && wip && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20 }}>
            <StatCard label="Time Entries"   value={wip.summary?.timeEntries||0}       color="#7C3AED" icon={I.Clock} />
            <StatCard label="WIP Time Value" value={fmt$(wip.summary?.timeValue)}      color="#3B82F6" icon={I.DollarSign} />
            <StatCard label="Expenses"       value={wip.summary?.expenseCount||0}      color="#F59E0B" icon={I.FileText} />
            <StatCard label="Total WIP"      value={fmt$(wip.summary?.totalWIP)}       color="#EF4444" icon={I.TrendingUp} />
          </div>
          <Card title="Unbilled Time" actions={<button onClick={()=>downloadCSV(wip.unbilledTime,'wip_time.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
            <DataTable
              columns={[
                {key:'date',label:'Date',render:v=>new Date(v).toLocaleDateString()},
                {key:'userId',label:'Attorney',render:v=>v?.name||'—'},
                {key:'matterId',label:'Matter',render:v=>v?.title||'—'},
                {key:'hours',label:'Hours',render:v=>fmtN(v)+'h'},
                {key:'amount',label:'Value',render:v=>fmt$(v)},
                {key:'activityType',label:'Type'},
              ]}
              rows={wip.unbilledTime||[]}
            />
          </Card>
        </>
      )}
    </motion.div>
  );
}

/* ─── Matters Tab ───────────────────────────────────────────────── */
function MattersTab() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]   = useState('');
  const [to,   setTo]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await reportsApi.matters({ from:from||undefined, to:to||undefined });
      setData(r.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  if (loading) return <Empty msg="Loading…" />;
  if (!data)   return <Empty />;

  const statusPie = Object.entries(data.byStatus||{}).map(([k,v])=>({label:k,count:v}));
  const areaPie   = Object.entries(data.byArea||{}).map(([k,v])=>({label:k,count:v}));

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16,gap:8 }}>
        <DateRange from={from} to={to} onChange={(f,v)=>f==='from'?setFrom(v):setTo(v)} />
        <button onClick={load} style={{ padding:'7px 16px',borderRadius:8,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700 }}>Apply</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:20 }}>
        <StatCard label="Total Matters" value={data.total}        color="#7C3AED" icon={I.Briefcase} />
        <StatCard label="Active"        value={data.openMatters}  color="#10B981" icon={I.Check} />
        <StatCard label="Closed"        value={data.closedMatters} color="#6B7280" icon={I.Check} />
        <StatCard label="Avg Days Open" value={data.avgDaysToClose+'d'} color="#F59E0B" icon={I.Clock} />
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20 }}>
        <Card title="By Status"><PieRing data={statusPie} valueKey="count" /></Card>
        <Card title="By Practice Area"><PieRing data={areaPie} valueKey="count" /></Card>
      </div>
      <Card title="By Stage">
        <BarChart data={Object.entries(data.byStage||{}).map(([k,v])=>({label:k,value:v}))} color="#7C3AED" />
      </Card>
      <Card title="Matter List" actions={<button onClick={()=>downloadCSV(data.matters,'matters.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
        <DataTable
          columns={[
            {key:'matterNumber',label:'#'},
            {key:'title',label:'Matter'},
            {key:'practiceArea',label:'Area'},
            {key:'status',label:'Status'},
            {key:'stage',label:'Stage'},
            {key:'openDate',label:'Opened',render:v=>new Date(v).toLocaleDateString()},
          ]}
          rows={data.matters||[]}
        />
      </Card>
    </motion.div>
  );
}

/* ─── Pipeline Tab ──────────────────────────────────────────────── */
function PipelineTab() {
  const [pipe, setPipe] = useState(null);
  const [src,  setSrc]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = { from:from||undefined, to:to||undefined };
    try {
      const [pr, sr] = await Promise.all([reportsApi.pipeline(params), reportsApi.leadSources(params)]);
      setPipe(pr.data.data);
      setSrc(sr.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  if (loading) return <Empty msg="Loading…" />;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16,gap:8 }}>
        <DateRange from={from} to={to} onChange={(f,v)=>f==='from'?setFrom(v):setTo(v)} />
        <button onClick={load} style={{ padding:'7px 16px',borderRadius:8,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700 }}>Apply</button>
      </div>

      {pipe && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:20 }}>
            <StatCard label="Total Leads"    value={pipe.total}                       color="#7C3AED" icon={I.Star} />
            <StatCard label="Hired"          value={pipe.hired}                       color="#10B981" icon={I.Check} />
            <StatCard label="Not Hired"      value={pipe.lost}                        color="#EF4444" icon={I.Alert} />
            <StatCard label="Conversion"     value={fmtPct(pipe.convRate)}            color="#3B82F6" icon={I.TrendingUp} />
            <StatCard label="Pipeline Value" value={fmt$(pipe.totalPipelineValue)}    color="#F59E0B" icon={I.DollarSign} />
            <StatCard label="Avg Days to Hire" value={pipe.avgDaysToHire+'d'}         color="#8B5CF6" icon={I.Clock} />
          </div>
          <Card title="Conversion Funnel">
            <div style={{ display:'flex',gap:8,alignItems:'flex-end',height:130 }}>
              {(pipe.funnel||[]).map((stage,i) => {
                const max = Math.max(...(pipe.funnel||[]).map(s=>s.count),1);
                return (
                  <div key={stage.stage} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                    <div style={{ fontSize:10,color:'#9CA3AF',fontWeight:700 }}>{stage.count}</div>
                    <motion.div
                      initial={{height:0}}
                      animate={{height:`${Math.max((stage.count/max)*100,stage.count>0?6:0)}px`}}
                      transition={{delay:i*0.06,type:'spring',stiffness:180,damping:18}}
                      style={{ width:'100%',background:COLORS[i%COLORS.length],borderRadius:'4px 4px 0 0' }}
                    />
                    <div style={{ fontSize:9,color:'#9CA3AF',fontWeight:700,textAlign:'center',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%' }}>
                      {stage.stage.replace('Consultation Scheduled','Consultation')}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {src && (
        <Card title="Lead Source Analysis" actions={<button onClick={()=>downloadCSV(src,'lead_sources.csv')} style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:4}}><I.Download size={11}/>CSV</button>}>
          <DataTable
            columns={[
              {key:'source',label:'Source'},
              {key:'total',label:'Leads'},
              {key:'hired',label:'Hired'},
              {key:'convRate',label:'Conv %',render:v=>fmtPct(v)},
              {key:'value',label:'Est. Value',render:v=>fmt$(v)},
            ]}
            rows={src}
          />
        </Card>
      )}
    </motion.div>
  );
}

/* ─── Custom Reports Tab ────────────────────────────────────────── */
function CustomTab() {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', reportType:'revenue' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reportsApi.custom.list().then(r => setReports(r.data.data||[])).catch(console.error);
  }, []);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await reportsApi.custom.create(form);
      setReports(prev => [r.data.data, ...prev]);
      setShowForm(false);
      setForm({ name:'', description:'', reportType:'revenue' });
    } finally { setSaving(false); }
  }

  async function remove(id) {
    await reportsApi.custom.remove(id);
    setReports(prev => prev.filter(r => r._id !== id));
  }

  const REPORT_TYPES = ['revenue','ar_aging','collections','trust','time','utilization','wip','matters','pipeline','lead_sources'];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16 }}>
        <button onClick={()=>setShowForm(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700 }}>
          <I.Plus size={14} /> Save Report
        </button>
      </div>

      {showForm && (
        <div style={{ background:'#fff',borderRadius:16,border:'1.5px solid #E5E7EB',padding:20,marginBottom:20 }}>
          <div style={{ fontSize:14,fontWeight:800,color:'#111827',marginBottom:16 }}>Save Custom Report</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:'#374151',marginBottom:5 }}>Report Name</div>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Monthly Revenue Summary" style={{ width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #E5E7EB',fontSize:13,color:'#111827',outline:'none',boxSizing:'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:'#374151',marginBottom:5 }}>Report Type</div>
              <select value={form.reportType} onChange={e=>setForm(p=>({...p,reportType:e.target.value}))} style={{ width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #E5E7EB',fontSize:13,color:'#374151',outline:'none',background:'#F9FAFB' }}>
                {REPORT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#374151',marginBottom:5 }}>Description</div>
            <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Optional description…" style={{ width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #E5E7EB',fontSize:13,color:'#111827',outline:'none',boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
            <button onClick={()=>setShowForm(false)} style={{ padding:'8px 16px',borderRadius:8,border:'1.5px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontSize:12,fontWeight:600,color:'#374151' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:'8px 16px',borderRadius:8,background:'#7C3AED',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,opacity:saving?.7:1 }}>{saving?'Saving…':'Save'}</button>
          </div>
        </div>
      )}

      {reports.length === 0
        ? <Empty msg="No saved reports yet. Save any report configuration for quick access." />
        : reports.map(r => (
          <div key={r._id} style={{ background:'#fff',borderRadius:12,border:'1.5px solid #E5E7EB',padding:'14px 18px',display:'flex',alignItems:'center',gap:14,marginBottom:8 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:'#F5F3FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <I.BarChart2 size={16} style={{ color:'#7C3AED' }} />
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#111827' }}>{r.name}</div>
              <div style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>{r.reportType?.replace(/_/g,' ')} · {r.description||'No description'}</div>
            </div>
            <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#F3F4F6',color:'#6B7280' }}>{r.schedule?.frequency||'unscheduled'}</span>
            <button onClick={()=>remove(r._id)} style={{ padding:'5px 10px',borderRadius:7,border:'1.5px solid #FCA5A5',background:'#FEF2F2',color:'#DC2626',cursor:'pointer',fontSize:12,fontWeight:700 }}>Delete</button>
          </div>
        ))
      }
    </motion.div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function Reports() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'#F8F9FC' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} style={{marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#7C3AED,#4F46E5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <I.BarChart2 size={22} style={{color:'#fff'}} />
            </div>
            <div>
              <h1 style={{margin:0,fontSize:24,fontWeight:800,color:'#111827'}}>Reports & Analytics</h1>
              <p style={{margin:0,fontSize:13,color:'#6B7280'}}>Business intelligence for your firm — revenue, time, matters, and pipeline</p>
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div style={{ display:'flex',gap:2,marginBottom:24,background:'#fff',borderRadius:14,padding:4,border:'1.5px solid #E5E7EB',overflowX:'auto' }}>
          {TABS.map(({id,label,icon:Ic}) => (
            <button key={id} onClick={()=>setTab(id)} style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:10,border:'none',background:tab===id?'#7C3AED':'transparent',color:tab===id?'#fff':'#6B7280',cursor:'pointer',fontSize:13,fontWeight:700,whiteSpace:'nowrap',transition:'all .15s' }}>
              <Ic size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'dashboard'  && <DashboardTab key="dashboard" />}
          {tab === 'financial'  && <FinancialTab  key="financial" />}
          {tab === 'time'       && <TimeTab        key="time" />}
          {tab === 'matters'    && <MattersTab     key="matters" />}
          {tab === 'pipeline'   && <PipelineTab    key="pipeline" />}
          {tab === 'custom'     && <CustomTab      key="custom" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
