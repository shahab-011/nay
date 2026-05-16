import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { firmApi } from '../api/firm.api';

/* ─── Shared styles ─────────────────────────────────────────────── */
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 };
const inp = { width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #E5E7EB', fontSize:13, color:'#111827', background:'#fff', outline:'none', boxSizing:'border-box' };
const btnPurple = { display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:9, background:'#7C3AED', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 };
const btnGhost  = { padding:'9px 18px', borderRadius:9, background:'#F3F4F6', color:'#374151', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 };

const ROLES = ['owner','admin','attorney','paralegal','staff'];
const ROLE_COLOR = { owner:'#111827', admin:'#7C3AED', attorney:'#3B82F6', paralegal:'#10B981', staff:'#9CA3AF', lawyer:'#3B82F6', client:'#F59E0B', viewer:'#9CA3AF' };

function SaveButton({ onClick, saving, saved }) {
  return (
    <button onClick={onClick} disabled={saving} style={{ ...btnPurple, opacity:saving?.7:1 }}>
      {saved ? <><I.Check size={14}/> Saved!</> : saving ? 'Saving…' : 'Save Changes'}
    </button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background:value?'#7C3AED':'#E5E7EB', position:'relative', flexShrink:0, transition:'background 200ms' }}>
      <div style={{ position:'absolute', top:3, left:value?23:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 200ms', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

/* ─── Firm Profile ──────────────────────────────────────────────── */
function FirmProfile({ firm, setFirm }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const set = (k, v) => setFirm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try { await firmApi.updateSettings(firm); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth:720 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[
          ['name','Firm Name'],['email','Billing Email'],['supportEmail','Support Email'],
          ['phone','Phone'],['website','Website'],['barNumber','Bar Registration #'],
          ['jurisdiction','Primary Jurisdiction'],['taxId','Tax ID / NTN'],['timeZone','Time Zone'],
        ].map(([k,label]) => (
          <div key={k}>
            <label style={lbl}>{label}</label>
            <input value={firm[k]||''} onChange={e=>set(k,e.target.value)} style={inp} />
          </div>
        ))}
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={lbl}>Office Address</label>
          <input value={firm.address||''} onChange={e=>set('address',e.target.value)} style={inp} />
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={lbl}>About the Firm (shown in client portal)</label>
          <textarea value={firm.description||''} onChange={e=>set('description',e.target.value)} style={{ ...inp, height:80, resize:'vertical' }} />
        </div>
      </div>
      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

/* ─── Team Members ──────────────────────────────────────────────── */
function TeamMembers() {
  const [team, setTeam]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite]   = useState({ name:'', email:'', role:'attorney', billingRate:'' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    firmApi.listTeam().then(r=>setTeam(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  }, []);

  async function sendInvite() {
    if (!invite.email||!invite.name) return;
    setInviting(true);
    try {
      const r = await firmApi.inviteMember(invite);
      setTeam(t=>[...t, r.data.data]);
      setInvite({ name:'', email:'', role:'attorney', billingRate:'' });
      setShowInvite(false);
    } catch(e) { console.error(e); }
    finally { setInviting(false); }
  }

  async function toggleStatus(memberId) {
    const prev = team;
    setTeam(t=>t.map(m=>m._id===memberId?{...m,status:m.status==='active'?'inactive':'active'}:m));
    try { await firmApi.toggleMember(memberId); }
    catch { setTeam(prev); }
  }

  async function removeMember(memberId) {
    if (!window.confirm('Remove this team member?')) return;
    const prev = team;
    setTeam(t=>t.filter(m=>m._id!==memberId));
    try { await firmApi.removeMember(memberId); }
    catch { setTeam(prev); }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button onClick={()=>setShowInvite(true)} style={btnPurple}><I.UserPlus size={14}/> Invite Member</button>
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{ background:'#F5F3FF', borderRadius:14, border:'1.5px solid #DDD6FE', padding:20, marginBottom:20, overflow:'hidden' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#6D28D9', marginBottom:14 }}>Invite New Team Member</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 140px 120px', gap:12, marginBottom:14 }}>
              {[['name','Full Name','text'],['email','Email Address','email']].map(([k,pl,type])=>(
                <div key={k}>
                  <label style={lbl}>{pl}</label>
                  <input type={type} value={invite[k]} onChange={e=>setInvite(i=>({...i,[k]:e.target.value}))} style={inp} placeholder={pl} />
                </div>
              ))}
              <div>
                <label style={lbl}>Role</label>
                <select value={invite.role} onChange={e=>setInvite(i=>({...i,role:e.target.value}))} style={inp}>
                  {ROLES.map(r=><option key={r} value={r} style={{textTransform:'capitalize'}}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Billing Rate</label>
                <input type="number" value={invite.billingRate} onChange={e=>setInvite(i=>({...i,billingRate:e.target.value}))} style={inp} placeholder="$/hr" />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={sendInvite} disabled={inviting} style={{ ...btnPurple, opacity:inviting?.7:1 }}><I.Send size={13}/> {inviting?'Sending…':'Send Invitation'}</button>
              <button onClick={()=>setShowInvite(false)} style={btnGhost}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #E5E7EB', overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#9CA3AF', fontSize:14 }}>Loading team…</div>
        ) : team.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#9CA3AF', fontSize:14 }}>No team members yet.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                {['Member','Email','Role','Rate','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((m,i)=>(
                <tr key={m._id} style={{ borderBottom:i<team.length-1?'1px solid #F3F4F6':'none' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32,height:32,borderRadius:10,background:(ROLE_COLOR[m.role]||'#9CA3AF')+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:ROLE_COLOR[m.role]||'#9CA3AF' }}>
                        {m.initials||(m.name||'?')[0]}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#6B7280' }}>{m.email}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:(ROLE_COLOR[m.role]||'#9CA3AF')+'18', color:ROLE_COLOR[m.role]||'#9CA3AF', textTransform:'capitalize' }}>{m.role}</span>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:'#374151' }}>{m.billingRate?`$${m.billingRate}/hr`:'—'}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:m.status==='active'?'#ECFDF5':m.status==='invited'?'#FFF7ED':'#F3F4F6',color:m.status==='active'?'#059669':m.status==='invited'?'#D97706':'#6B7280' }}>{m.status}</span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>toggleStatus(m._id)} style={{ padding:'5px 10px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',cursor:'pointer',fontSize:11,fontWeight:600 }}>
                        {m.status==='active'?'Deactivate':'Activate'}
                      </button>
                      <button onClick={()=>removeMember(m._id)} style={{ padding:'5px 9px',borderRadius:7,border:'1.5px solid #FECDD3',background:'#FFF1F2',color:'#DC2626',cursor:'pointer',fontSize:11 }}>
                        <I.X size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Billing Config ────────────────────────────────────────────── */
function BillingConfig({ billing, setBilling }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const set = (k, v) => setBilling(b => ({ ...b, [k]: v }));

  async function save() {
    setSaving(true);
    try { await firmApi.updateBilling(billing); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div>
          <label style={lbl}>Currency</label>
          <select value={billing.currency||'PKR'} onChange={e=>set('currency',e.target.value)} style={inp}>
            {['PKR','USD','GBP','EUR','AED','CAD','AUD'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Default Hourly Rate</label>
          <input type="number" value={billing.defaultHourlyRate||billing.defaultRate||''} onChange={e=>set('defaultHourlyRate',e.target.value)} style={inp} placeholder="0" />
        </div>
        <div>
          <label style={lbl}>Default Tax Rate (%)</label>
          <input type="number" value={billing.defaultTaxRate||billing.taxRate||''} onChange={e=>set('defaultTaxRate',e.target.value)} style={inp} placeholder="0" />
        </div>
        <div>
          <label style={lbl}>Invoice Prefix</label>
          <input value={billing.invoicePrefix||'INV'} onChange={e=>set('invoicePrefix',e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Payment Terms (days)</label>
          <select value={billing.paymentTermsDays||billing.paymentTerms||30} onChange={e=>set('paymentTermsDays',Number(e.target.value))} style={inp}>
            {[0,15,30,45].map(d=><option key={d} value={d}>{d===0?'Due on Receipt':`Net ${d}`}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Late Fee (%/month)</label>
          <input type="number" value={billing.lateFeePercent||''} onChange={e=>set('lateFeePercent',e.target.value)} style={inp} placeholder="0" />
        </div>
        <div>
          <label style={lbl}>Grace Period (days)</label>
          <input type="number" value={billing.graceperiodDays||''} onChange={e=>set('graceperiodDays',e.target.value)} style={inp} placeholder="0" />
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={lbl}>Trust Account Bank Details</label>
          <input value={billing.trustAccountBank||''} onChange={e=>set('trustAccountBank',e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ background:'#F9FAFB', borderRadius:12, border:'1.5px solid #E5E7EB', padding:'16px 18px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:800, color:'#374151', marginBottom:12 }}>Invoice Display Options</div>
        {[
          ['showRatesOnInvoice','Show hourly rates on invoice'],
          ['showTimekeeperNames','Show timekeeper names on invoice'],
          ['showEntryDates','Show individual entry dates on invoice'],
          ['allowPartialPayment','Allow partial payments'],
        ].map(([k,label])=>(
          <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
            <span style={{ fontSize:13, color:'#374151' }}>{label}</span>
            <Toggle value={billing[k]!==false} onChange={v=>set(k,v)} />
          </div>
        ))}
      </div>
      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

/* ─── Notifications ─────────────────────────────────────────────── */
function Notifications({ notifs, setNotifs }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const toggle = k => setNotifs(n=>({...n,[k]:!n[k]}));

  const items = [
    ['newLead','New Lead Submitted','Get notified when a new intake form is submitted'],
    ['matterAssigned','Matter Assigned','Notify when a matter is assigned to you'],
    ['matterUpdate','Matter Status Change','Notify when a matter moves to a new stage'],
    ['taskDue','Task Due Soon','Remind 24 hours before a task deadline'],
    ['appointmentReminder','Appointment Reminder','Calendar event reminders via email'],
    ['invoicePaid','Invoice Paid','Notify when a client pays an invoice'],
    ['trustDeposit','Trust Deposit','Notify on any trust account deposit'],
    ['documentUploaded','Document Uploaded','Notify when a document is added to a matter'],
    ['messageReceived','Message Received','Notify on client portal messages'],
    ['systemAlerts','System Alerts','Critical system notifications'],
    ['weeklyReport','Weekly Report','Receive a weekly summary of firm activity'],
    ['systemUpdates','Product Updates','Product news and feature announcements'],
  ];

  async function save() {
    setSaving(true);
    try { await firmApi.updateNotifications(notifs); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth:640 }}>
      <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #E5E7EB', overflow:'hidden', marginBottom:16 }}>
        {items.map(([key,title,desc],i)=>(
          <div key={key} style={{ display:'flex', alignItems:'center', gap:16, padding:'15px 20px', borderBottom:i<items.length-1?'1px solid #F3F4F6':'none' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{title}</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{desc}</div>
            </div>
            <Toggle value={notifs[key]!==false} onChange={()=>toggle(key)} />
          </div>
        ))}
      </div>
      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

/* ─── Roles & Permissions ───────────────────────────────────────── */
const ALL_PERMS = [
  ['matters:read','matters:create','matters:update','matters:delete'],
  ['contacts:read','contacts:create','contacts:update','contacts:delete'],
  ['billing:invoice:read','billing:invoice:create','billing:invoice:send'],
  ['trust:deposit','trust:transfer'],
  ['time:read','time:create'],
  ['tasks:read','tasks:create','tasks:update'],
  ['leads:read','leads:create','leads:update'],
  ['reports:read'],
  ['esign:read','esign:send'],
  ['firm:settings:read','firm:settings:update','firm:team:manage'],
];

function RolesTab() {
  const [roles, setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    firmApi.listRoles().then(r=>setRoles(r.data.data||[])).catch(console.error).finally(()=>setLoading(false));
  }, []);

  function newRole() {
    const perms = {};
    ALL_PERMS.flat().forEach(p=>perms[p]=false);
    setEditing({ name:'', description:'', permissions: perms, _new: true });
  }

  async function saveRole() {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    try {
      if (editing._new) {
        const r = await firmApi.createRole({ name:editing.name, description:editing.description, permissions:editing.permissions });
        setRoles(prev=>[...prev, r.data.data]);
      } else {
        const r = await firmApi.updateRole(editing._id, { name:editing.name, description:editing.description, permissions:editing.permissions });
        setRoles(prev=>prev.map(ro=>ro._id===editing._id?r.data.data:ro));
      }
      setEditing(null);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deleteRole(id) {
    if (!window.confirm('Delete this role?')) return;
    await firmApi.deleteRole(id);
    setRoles(prev=>prev.filter(r=>r._id!==id));
  }

  const CATEGORY_LABELS = ['Matters','Contacts','Billing','Trust','Time','Tasks','Leads','Reports','E-Sign','Firm Settings'];

  if (loading) return <div style={{ textAlign:'center',padding:40,color:'#9CA3AF' }}>Loading roles…</div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button onClick={newRole} style={btnPurple}><I.Plus size={14}/> New Role</button>
      </div>

      {editing && (
        <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #E5E7EB', padding:22, marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
            <div>
              <label style={lbl}>Role Name</label>
              <input value={editing.name||''} onChange={e=>setEditing(r=>({...r,name:e.target.value}))} style={inp} placeholder="e.g. Senior Paralegal" />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input value={editing.description||''} onChange={e=>setEditing(r=>({...r,description:e.target.value}))} style={inp} />
            </div>
          </div>
          <div style={{ fontSize:12, fontWeight:800, color:'#374151', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>Permissions</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginBottom:18 }}>
            {ALL_PERMS.map((group,gi)=>(
              <div key={gi} style={{ background:'#F9FAFB', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#6B7280', marginBottom:8 }}>{CATEGORY_LABELS[gi]}</div>
                {group.map(p=>(
                  <label key={p} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!editing.permissions?.[p]} onChange={e=>setEditing(r=>({...r,permissions:{...r.permissions,[p]:e.target.checked}}))} />
                    <span style={{ fontSize:12, color:'#374151' }}>{p.split(':').pop()}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveRole} disabled={saving} style={{ ...btnPurple, opacity:saving?.7:1 }}>{saving?'Saving…':'Save Role'}</button>
            <button onClick={()=>setEditing(null)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      {roles.length===0&&!editing ? (
        <div style={{ textAlign:'center',padding:'40px 20px',color:'#9CA3AF',fontSize:13 }}>No custom roles yet. Create one above.</div>
      ) : roles.map(role=>(
        <div key={role._id} style={{ background:'#fff', borderRadius:12, border:'1.5px solid #E5E7EB', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:'#F5F3FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <I.Shield size={16} style={{ color:'#7C3AED' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{role.name}</div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{role.description||'No description'} · {Object.values(role.permissions||{}).filter(Boolean).length} permissions</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setEditing(role)} style={{ padding:'6px 12px',borderRadius:7,border:'1.5px solid #E5E7EB',background:'#F9FAFB',color:'#374151',cursor:'pointer',fontSize:12,fontWeight:600 }}>Edit</button>
            <button onClick={()=>deleteRole(role._id)} style={{ padding:'6px 10px',borderRadius:7,border:'1.5px solid #FECDD3',background:'#FFF1F2',color:'#DC2626',cursor:'pointer',fontSize:12 }}><I.Trash size={13}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Security ──────────────────────────────────────────────────── */
function SecurityTab({ security, setSecurity }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [ip, setIp]         = useState('');
  const set = (k, v) => setSecurity(s=>({...s,[k]:v}));

  async function save() {
    setSaving(true);
    try { await firmApi.updateSecurity(security); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  function addIp() {
    const trimmed = ip.trim();
    if (!trimmed) return;
    set('ipAllowlist', [...(security.ipAllowlist||[]), trimmed]);
    setIp('');
  }

  function removeIp(addr) {
    set('ipAllowlist', (security.ipAllowlist||[]).filter(a=>a!==addr));
  }

  return (
    <div style={{ maxWidth:620 }}>
      <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #E5E7EB', overflow:'hidden', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F3F4F6' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Enforce Two-Factor Authentication</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Require all team members to enable 2FA</div>
          </div>
          <Toggle value={!!security.enforce2FA} onChange={v=>set('enforce2FA',v)} />
        </div>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6' }}>
          <label style={lbl}>Session Timeout</label>
          <select value={security.sessionTimeoutMinutes||60} onChange={e=>set('sessionTimeoutMinutes',Number(e.target.value))} style={{ ...inp, maxWidth:200 }}>
            {[[15,'15 minutes'],[30,'30 minutes'],[60,'1 hour'],[480,'8 hours'],[0,'Never']].map(([v,l])=>(
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:8 }}>IP Allowlist</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:10 }}>Restrict access to specific IP addresses or ranges. Leave empty to allow all IPs.</div>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <input value={ip} onChange={e=>setIp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addIp()} placeholder="e.g. 192.168.1.0/24" style={{ ...inp, flex:1 }} />
            <button onClick={addIp} style={{ ...btnPurple, whiteSpace:'nowrap' }}><I.Plus size={13}/> Add</button>
          </div>
          {(security.ipAllowlist||[]).map(addr=>(
            <div key={addr} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#F9FAFB', borderRadius:8, marginBottom:6, fontSize:13, color:'#374151' }}>
              {addr}
              <button onClick={()=>removeIp(addr)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:0 }}><I.X size={13}/></button>
            </div>
          ))}
        </div>
      </div>
      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

/* ─── Integrations ──────────────────────────────────────────────── */
const INTEGRATIONS = [
  { name:'google',     label:'Google Workspace', icon:'G', desc:'Calendar sync, Gmail filing', color:'#EA4335' },
  { name:'outlook',    label:'Microsoft 365',    icon:'O', desc:'Outlook calendar & email',  color:'#0078D4' },
  { name:'quickbooks', label:'QuickBooks',       icon:'Q', desc:'Accounting & payroll sync', color:'#2CA01C' },
  { name:'stripe',     label:'Stripe Payments',  icon:'S', desc:'Online payment collection', color:'#635BFF' },
  { name:'twilio',     label:'Twilio SMS',       icon:'T', desc:'SMS messaging for clients', color:'#F22F46' },
  { name:'docusign',   label:'DocuSign',         icon:'D', desc:'E-signature integration',   color:'#FFBE00' },
  { name:'dropbox',    label:'Dropbox',          icon:'B', desc:'Cloud document storage',    color:'#0061FF' },
  { name:'box',        label:'Box',              icon:'X', desc:'Enterprise file storage',   color:'#0061D5' },
];

function IntegrationsTab({ integrations, setIntegrations }) {
  const [disconnecting, setDisconnecting] = useState(null);

  async function disconnect(name) {
    setDisconnecting(name);
    try {
      await firmApi.disconnectIntegration(name);
      setIntegrations(prev=>({ ...prev, [`${name}Connected`]:false }));
    } catch(e) { console.error(e); }
    finally { setDisconnecting(null); }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
      {INTEGRATIONS.map(({name,label,icon,desc,color})=>{
        const connected = integrations[`${name}Connected`];
        return (
          <div key={name} style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${connected?color+'40':'#E5E7EB'}`, padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:38,height:38,borderRadius:10,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{label}</div>
                <div style={{ fontSize:11, color:'#9CA3AF' }}>{desc}</div>
              </div>
            </div>
            {connected ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12,fontWeight:700,color:'#059669',display:'flex',alignItems:'center',gap:4 }}><I.Check size={12}/> Connected</span>
                <button onClick={()=>disconnect(name)} disabled={disconnecting===name} style={{ padding:'5px 12px',borderRadius:7,border:'1.5px solid #FECDD3',background:'#FFF1F2',color:'#DC2626',cursor:'pointer',fontSize:11,fontWeight:600,opacity:disconnecting===name?.7:1 }}>
                  {disconnecting===name?'…':'Disconnect'}
                </button>
              </div>
            ) : (
              <button style={{ width:'100%',padding:'8px 0',borderRadius:8,border:`1.5px solid ${color}`,background:`${color}10`,color,cursor:'pointer',fontSize:12,fontWeight:700 }}>
                Connect {label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Practice Areas ────────────────────────────────────────────── */
function PracticeAreas({ areas, setAreas }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];

  function addArea() {
    setAreas(a=>[...a,{ name:'', color:COLORS[a.length%COLORS.length], defaultBillingType:'hourly', defaultHourlyRate:0, stages:[] }]);
    setEditIdx(areas.length);
  }

  function remove(i) {
    setAreas(a=>a.filter((_,idx)=>idx!==i));
    if (editIdx===i) setEditIdx(null);
  }

  function update(i, k, v) {
    setAreas(a=>a.map((ar,idx)=>idx===i?{...ar,[k]:v}:ar));
  }

  async function save() {
    setSaving(true);
    try { await firmApi.updatePracticeAreas({ practiceAreaConfig:areas }); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth:740 }}>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginBottom:16 }}>
        <button onClick={addArea} style={btnPurple}><I.Plus size={14}/> Add Practice Area</button>
      </div>

      {areas.length===0 ? (
        <div style={{ textAlign:'center',padding:'48px 20px',color:'#9CA3AF',fontSize:13 }}>No practice areas configured. Add one above.</div>
      ) : (
        areas.map((area,i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${area.color||'#E5E7EB'}40`, marginBottom:10, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', cursor:'pointer', borderBottom:editIdx===i?'1px solid #F3F4F6':'none' }} onClick={()=>setEditIdx(editIdx===i?null:i)}>
              <div style={{ width:12,height:12,borderRadius:'50%',background:area.color||'#7C3AED',flexShrink:0 }} />
              <div style={{ flex:1, fontSize:14, fontWeight:700, color:'#111827' }}>{area.name||'Unnamed'}</div>
              <span style={{ fontSize:11,color:'#9CA3AF' }}>{area.defaultBillingType} · ${area.defaultHourlyRate||0}/hr</span>
              <button onClick={e=>{e.stopPropagation();remove(i);}} style={{ background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4 }}><I.X size={13}/></button>
              <I.ChevronDown size={14} style={{ color:'#9CA3AF', transform:editIdx===i?'rotate(180deg)':'none', transition:'transform 200ms' }} />
            </div>
            {editIdx===i && (
              <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Name</label>
                  <input value={area.name||''} onChange={e=>update(i,'name',e.target.value)} style={inp} placeholder="e.g. Family Law" />
                </div>
                <div>
                  <label style={lbl}>Color</label>
                  <div style={{ display:'flex', gap:6, marginTop:2 }}>
                    {COLORS.map(c=>(
                      <div key={c} onClick={()=>update(i,'color',c)} style={{ width:22,height:22,borderRadius:6,background:c,cursor:'pointer',border:area.color===c?`3px solid #111827`:'3px solid transparent' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Billing Type</label>
                  <select value={area.defaultBillingType||'hourly'} onChange={e=>update(i,'defaultBillingType',e.target.value)} style={inp}>
                    {['hourly','flat_fee','contingency','retainer','pro_bono'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Default Rate ($/hr)</label>
                  <input type="number" value={area.defaultHourlyRate||''} onChange={e=>update(i,'defaultHourlyRate',Number(e.target.value))} style={inp} placeholder="0" />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Custom Stages (comma-separated)</label>
                  <input value={(area.stages||[]).join(', ')} onChange={e=>update(i,'stages',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} style={inp} placeholder="e.g. Filing, Discovery, Trial, Settled" />
                </div>
              </div>
            )}
          </div>
        ))
      )}
      {areas.length>0 && <div style={{ marginTop:16 }}><SaveButton onClick={save} saving={saving} saved={saved} /></div>}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
const TABS = [
  { id:'profile',       label:'Firm Profile',    icon:I.Building },
  { id:'team',          label:'Team',            icon:I.Users },
  { id:'billing',       label:'Billing',         icon:I.DollarSign },
  { id:'notifications', label:'Notifications',   icon:I.Bell },
  { id:'roles',         label:'Roles',           icon:I.Shield },
  { id:'security',      label:'Security',        icon:I.Lock||I.Shield },
  { id:'integrations',  label:'Integrations',    icon:I.Link||I.Globe },
  { id:'areas',         label:'Practice Areas',  icon:I.Briefcase },
];

export default function FirmSettings() {
  const [tab,      setTab]      = useState('profile');
  const [firm,     setFirm]     = useState({});
  const [billing,  setBilling]  = useState({});
  const [notifs,   setNotifs]   = useState({});
  const [security, setSecurity] = useState({});
  const [integrations, setIntegrations] = useState({});
  const [areas,    setAreas]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    firmApi.getSettings().then(res => {
      const d = res.data.data || {};
      setFirm({
        name:d.name||'', email:d.email||'', supportEmail:d.supportEmail||'',
        phone:d.phone||'', website:d.website||'', barNumber:d.barNumber||'',
        jurisdiction:d.jurisdiction||'', taxId:d.taxId||'',
        address:d.address||'', description:d.description||'',
        timeZone:d.timeZone||'Asia/Karachi',
      });
      setBilling({
        currency:d.currency||'PKR', defaultHourlyRate:d.defaultHourlyRate||0,
        defaultTaxRate:d.defaultTaxRate||0, invoicePrefix:d.invoicePrefix||'INV',
        paymentTermsDays:d.paymentTermsDays||30, lateFeePercent:d.lateFeePercent||0,
        graceperiodDays:d.graceperiodDays||0, trustAccountBank:d.trustAccountBank||'',
        allowPartialPayment:d.allowPartialPayment!==false,
        showRatesOnInvoice:d.showRatesOnInvoice!==false,
        showTimekeeperNames:d.showTimekeeperNames!==false,
        showEntryDates:d.showEntryDates!==false,
      });
      setNotifs(d.notifications||{});
      setSecurity(d.security||{});
      setIntegrations(d.integrations||{});
      setAreas(d.practiceAreaConfig||[]);
    }).catch(console.error).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'#F8F9FC' }}>
      <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px 80px' }}>

        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} style={{marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#374151,#111827)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <I.Settings size={22} style={{color:'#fff'}}/>
            </div>
            <div>
              <h1 style={{margin:0,fontSize:24,fontWeight:800,color:'#111827'}}>Firm Settings</h1>
              <p style={{margin:0,fontSize:13,color:'#6B7280'}}>Profile, team, billing, permissions, security, and integrations</p>
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div style={{display:'flex',gap:2,background:'#fff',borderRadius:14,padding:4,border:'1.5px solid #E5E7EB',marginBottom:28,overflowX:'auto'}}>
          {TABS.map(({id,label,icon:Ic})=>(
            <button key={id} onClick={()=>setTab(id)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,background:tab===id?'#111827':'transparent',color:tab===id?'#fff':'#6B7280',transition:'all 150ms',whiteSpace:'nowrap'}}>
              <Ic size={13}/> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:60,color:'#9CA3AF',fontSize:14}}>Loading settings…</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.15}}>
              {tab==='profile'       && <FirmProfile firm={firm} setFirm={setFirm} />}
              {tab==='team'          && <TeamMembers />}
              {tab==='billing'       && <BillingConfig billing={billing} setBilling={setBilling} />}
              {tab==='notifications' && <Notifications notifs={notifs} setNotifs={setNotifs} />}
              {tab==='roles'         && <RolesTab />}
              {tab==='security'      && <SecurityTab security={security} setSecurity={setSecurity} />}
              {tab==='integrations'  && <IntegrationsTab integrations={integrations} setIntegrations={setIntegrations} />}
              {tab==='areas'         && <PracticeAreas areas={areas} setAreas={setAreas} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
