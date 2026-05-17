import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { practiceDocsApi } from '../api/practiceDocuments.api';

/* ─── Constants ─────────────────────────────────────────────────── */
const MIME_ICONS = {
  'application/pdf':    { icon: '📄', color: '#EF4444', label: 'PDF' },
  'application/msword': { icon: '📝', color: '#3B82F6', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: '#3B82F6', label: 'DOCX' },
  'application/vnd.ms-excel':            { icon: '📊', color: '#10B981', label: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: '#10B981', label: 'XLSX' },
  'image/jpeg': { icon: '🖼️', color: '#8B5CF6', label: 'JPG' },
  'image/png':  { icon: '🖼️', color: '#8B5CF6', label: 'PNG' },
  'text/plain': { icon: '📃', color: '#6B7280', label: 'TXT' },
};
const mimeInfo = m => MIME_ICONS[m] || { icon: '📎', color: '#6B7280', label: (m || 'FILE').split('/').pop().toUpperCase() };

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/* ─── Upload Modal ───────────────────────────────────────────────── */
function UploadModal({ folders, onClose, onUploaded }) {
  const [file, setFile]         = useState(null);
  const [drag, setDrag]         = useState(false);
  const [folderId, setFolderId] = useState('');
  const [description, setDesc]  = useState('');
  const [tags, setTags]         = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  function handleDrop(e) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (folderId)   fd.append('folderId', folderId);
      if (description) fd.append('description', description);
      if (tags)       fd.append('tags', tags);
      await practiceDocsApi.upload(fd);
      onUploaded();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(11,11,20,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale:0.95, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95 }}
        style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'var(--shadow-float)', padding:28 }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>Upload Document</h3>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'var(--elevated)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:'var(--text-muted)' }}><I.X size={14} /></button>
        </div>

        {/* Drop zone */}
        <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{ border:`2px dashed ${drag ? 'var(--purple)' : 'var(--border)'}`, borderRadius:14, padding:'32px 20px', textAlign:'center', cursor:'pointer', background: drag ? 'var(--purple-soft)' : 'var(--bg)', transition:'all 150ms', marginBottom:16 }}>
          <input ref={inputRef} type="file" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <div>
              <div style={{ fontSize:32, marginBottom:8 }}>{mimeInfo(file.type).icon}</div>
              <div style={{ fontWeight:600, fontSize:14 }}>{file.name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{fmtSize(file.size)}</div>
            </div>
          ) : (
            <div>
              <I.Upload size={32} style={{ color:'var(--text-muted)', margin:'0 auto 10px', display:'block' }} />
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Drop file here or click to browse</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>PDF, DOCX, XLSX, JPG, PNG, TXT — up to 250 MB</div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Folder</label>
            <select className="input" value={folderId} onChange={e => setFolderId(e.target.value)}>
              <option value="">— Root / No folder —</option>
              {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Description</label>
            <input className="input" value={description} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Tags (comma-separated)</label>
            <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="contract, nda, 2024" />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading} className="btn btn-purple">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Document Detail Panel ──────────────────────────────────────── */
function DocDetailPanel({ doc, onClose, onUpdated }) {
  const [versions, setVersions] = useState([]);
  const [loadingVer, setLoadingVer] = useState(false);
  const [shareUrl, setShareUrl]     = useState('');
  const [sharing, setSharing]       = useState(false);

  useEffect(() => {
    if (!doc) return;
    setLoadingVer(true);
    practiceDocsApi.listVersions(doc._id)
      .then(r => setVersions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingVer(false));
  }, [doc]);

  async function handleDelete() {
    if (!window.confirm('Delete this document?')) return;
    await practiceDocsApi.remove(doc._id);
    onUpdated(); onClose();
  }

  async function handleShare() {
    setSharing(true);
    try {
      const r = await practiceDocsApi.share(doc._id, { expiresInHours: 72 });
      setShareUrl(r.data.data.shareUrl);
      navigator.clipboard?.writeText(r.data.data.shareUrl);
    } catch {} finally { setSharing(false); }
  }

  if (!doc) return null;
  const mi = mimeInfo(doc.mimeType);

  return (
    <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type:'spring', damping:28, stiffness:280 }}
      style={{ position:'fixed', top:0, right:0, bottom:0, width:380, background:'var(--surface)', boxShadow:'-4px 0 24px rgba(11,11,20,0.12)', zIndex:150, display:'flex', flexDirection:'column', overflowY:'auto' }}>

      <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:12, background: `${mi.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{mi.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{mi.label} · {fmtSize(doc.size)}</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><I.X size={16} /></button>
      </div>

      <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:18 }}>
        {/* Meta */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'Uploaded By', value: doc.uploadedBy?.name || '—' },
            { label:'Upload Date', value: fmtDate(doc.createdAt) },
            { label:'Matter', value: doc.matterId?.title || '—' },
            { label:'Folder', value: doc.folderId?.name || 'Root' },
            { label:'Version', value: `v${doc.currentVersion || 1}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
              <span style={{ color:'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight:600 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {doc.tags?.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Tags</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {doc.tags.map(t => (
                <span key={t} style={{ padding:'3px 10px', borderRadius:999, background:'var(--purple-soft)', color:'var(--purple)', fontSize:11, fontWeight:600 }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {doc.description && (
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Description</div>
            <p style={{ margin:0, fontSize:13, color:'var(--ink)', lineHeight:1.5 }}>{doc.description}</p>
          </div>
        )}

        {/* Version history */}
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Version History</div>
          {loadingVer ? (
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Loading…</div>
          ) : versions.length === 0 ? (
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>No versions yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[...versions].reverse().map(v => (
                <div key={v._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:'var(--bg)', fontSize:12 }}>
                  <span style={{ background: v.versionNumber === doc.currentVersion ? 'var(--purple)' : 'var(--border)', color: v.versionNumber === doc.currentVersion ? '#fff' : 'var(--text-muted)', padding:'2px 8px', borderRadius:6, fontWeight:700, fontSize:10 }}>v{v.versionNumber}</span>
                  <span style={{ flex:1, color:'var(--text-muted)' }}>{fmtDate(v.uploadedAt)} · {fmtSize(v.size)}</span>
                  {v.versionNumber !== doc.currentVersion && (
                    <button onClick={async () => { await practiceDocsApi.restoreVersion(doc._id, v._id); onUpdated(); }}
                      style={{ fontSize:10, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Restore</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share link */}
        {shareUrl && (
          <div style={{ background:'var(--purple-soft)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--purple)', marginBottom:4 }}>Share link copied!</div>
            <div style={{ fontSize:11, color:'var(--purple)', wordBreak:'break-all' }}>{shareUrl}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:20, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={handleShare} disabled={sharing} className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }}>
          <I.Share size={14} /> {sharing ? 'Generating…' : 'Share Link (72h)'}
        </button>
        <button onClick={handleDelete} style={{ width:'100%', padding:'9px 0', borderRadius:10, border:'1.5px solid #EF4444', color:'#EF4444', background:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          Delete Document
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Folder Sidebar ─────────────────────────────────────────────── */
function FolderSidebar({ folders, selectedFolder, onSelect, matterId }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await practiceDocsApi.createFolder({ name: newName.trim(), matterId: matterId || undefined });
    setNewName(''); setCreating(false);
    onSelect(null);
  }

  return (
    <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', padding:'8px 12px 4px' }}>Folders</div>

      <button onClick={() => onSelect(null)}
        style={{ padding:'8px 12px', borderRadius:10, background: !selectedFolder ? 'var(--purple-soft)' : 'transparent', color: !selectedFolder ? 'var(--purple)' : 'var(--text-muted)', border:'none', cursor:'pointer', textAlign:'left', fontSize:13, fontWeight: !selectedFolder ? 700 : 500, transition:'all 150ms' }}>
        All Documents
      </button>

      {folders.map(f => (
        <button key={f._id} onClick={() => onSelect(f._id)}
          style={{ padding:'8px 12px', borderRadius:10, background: selectedFolder === f._id ? 'var(--purple-soft)' : 'transparent', color: selectedFolder === f._id ? 'var(--purple)' : 'var(--ink)', border:'none', cursor:'pointer', textAlign:'left', fontSize:13, fontWeight: selectedFolder === f._id ? 700 : 400, transition:'all 150ms', display:'flex', alignItems:'center', gap:8 }}>
          <span>📁</span> {f.name}
          {f.isDefault && <span style={{ fontSize:9, color:'var(--text-muted)', marginLeft:'auto' }}>DEFAULT</span>}
        </button>
      ))}

      {creating ? (
        <form onSubmit={handleCreate} style={{ padding:'4px 8px', display:'flex', gap:6 }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Folder name"
            style={{ flex:1, padding:'5px 8px', borderRadius:7, border:'1.5px solid var(--purple)', fontSize:12, background:'var(--bg)', outline:'none' }} />
          <button type="submit" style={{ padding:'5px 10px', borderRadius:7, background:'var(--purple)', color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:600 }}>Add</button>
          <button type="button" onClick={() => setCreating(false)} style={{ padding:'5px 8px', borderRadius:7, background:'var(--elevated)', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><I.X size={11} /></button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} style={{ padding:'7px 12px', borderRadius:10, background:'transparent', color:'var(--text-muted)', border:'1.5px dashed var(--border)', cursor:'pointer', fontSize:12, textAlign:'left', display:'flex', alignItems:'center', gap:6, transition:'all 150ms', margin:'4px 0' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--purple)'; e.currentTarget.style.color='var(--purple)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <I.Plus size={12} /> New Folder
        </button>
      )}
    </div>
  );
}

/* ─── Document Request Modal ─────────────────────────────────────── */
function RequestModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title:'', description:'', dueDate:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try { await practiceDocsApi.createRequest(form); onSaved(); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(11,11,20,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale:0.95 }} animate={{ scale:1 }} exit={{ scale:0.95 }}
        style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:440, padding:28, boxShadow:'var(--shadow-float)' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700 }}>Request Document from Client</h3>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Request Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Please upload your W-2 for 2024" autoFocus />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 }}>Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-purple" disabled={saving}>{saving ? 'Sending…' : 'Send Request'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main DocumentManagement Page ──────────────────────────────── */
const TABS = ['Documents','Requests'];

export default function DocumentManagement() {
  const [tab, setTab]           = useState('Documents');
  const [docs, setDocs]         = useState([]);
  const [folders, setFolders]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedDoc, setSelectedDoc]       = useState(null);
  const [search, setSearch]     = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showUpload, setShowUpload]   = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedFolder) params.folderId = selectedFolder;
      if (search)         params.q        = search;
      const r = await practiceDocsApi.list(params);
      setDocs(r.data.data?.docs || []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  }, [selectedFolder, search]);

  const loadFolders = useCallback(async () => {
    try { const r = await practiceDocsApi.listFolders(); setFolders(r.data.data || []); }
    catch { setFolders([]); }
  }, []);

  const loadRequests = useCallback(async () => {
    try { const r = await practiceDocsApi.listRequests(); setRequests(r.data.data || []); }
    catch { setRequests([]); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);
  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { if (tab === 'Requests') loadRequests(); }, [tab, loadRequests]);

  const totalSize = docs.reduce((a, d) => a + (d.size || 0), 0);

  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px 60px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'var(--ink)' }}>Documents</h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted)' }}>Secure document vault — {docs.length} files · {fmtSize(totalSize)}</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {tab === 'Documents' && (
              <>
                <div style={{ display:'flex', gap:3, background:'var(--elevated)', borderRadius:10, padding:3 }}>
                  {[{ id:'list', icon:<I.Doc size={13} /> }, { id:'grid', icon:<I.Chart size={13} /> }].map(v => (
                    <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                      padding:'6px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                      background: viewMode === v.id ? 'var(--surface)' : 'transparent',
                      color: viewMode === v.id ? 'var(--purple)' : 'var(--text-muted)',
                      boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>{v.icon}</button>
                  ))}
                </div>
                <button className="btn btn-secondary" onClick={() => setShowRequest(true)} style={{ fontSize:13 }}>
                  Request Doc
                </button>
                <button className="btn btn-purple" onClick={() => setShowUpload(true)} style={{ fontSize:13 }}>
                  <I.Upload size={14} /> Upload
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 20px', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:'none',
              color: tab === t ? 'var(--purple)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--purple)' : '2px solid transparent',
              marginBottom:-2, transition:'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'Requests' ? (
          /* ── Requests tab ── */
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>
                <p style={{ fontSize:15 }}>No document requests yet.</p>
                <button className="btn btn-purple" onClick={() => setShowRequest(true)}>Create Request</button>
              </div>
            ) : requests.map(r => (
              <div key={r._id} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:10, height:10, borderRadius:5, flexShrink:0, background: r.status === 'fulfilled' ? '#10B981' : r.status === 'cancelled' ? '#6B7280' : '#F59E0B' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{r.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                    {r.requestedBy?.name} · {fmtDate(r.createdAt)}
                    {r.dueDate && ` · Due ${fmtDate(r.dueDate)}`}
                  </div>
                </div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:999, fontWeight:600, background: r.status === 'fulfilled' ? '#D1FAE5' : r.status === 'cancelled' ? '#F3F4F6' : '#FEF3C7', color: r.status === 'fulfilled' ? '#065F46' : r.status === 'cancelled' ? '#374151' : '#92400E' }}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* ── Documents tab ── */
          <div style={{ display:'flex', gap:20 }}>
            <FolderSidebar folders={folders} selectedFolder={selectedFolder} onSelect={f => { setSelectedFolder(f); setSelectedDoc(null); }} />

            <div style={{ flex:1, minWidth:0 }}>
              {/* Search */}
              <div style={{ position:'relative', marginBottom:16 }}>
                <I.Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input className="input" placeholder="Search documents by name, tag, or description…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:38 }} />
              </div>

              {loading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height:60, borderRadius:12 }} />)}
                </div>
              ) : docs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'56px 24px', color:'var(--text-muted)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📂</div>
                  <div style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>No documents yet</div>
                  <p style={{ fontSize:13, marginBottom:20 }}>Upload your first document to get started.</p>
                  <button className="btn btn-purple" onClick={() => setShowUpload(true)}><I.Upload size={14} /> Upload Document</button>
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                  {docs.map(doc => {
                    const mi = mimeInfo(doc.mimeType);
                    return (
                      <motion.div key={doc._id} whileHover={{ y:-2, boxShadow:'0 8px 24px rgba(11,11,20,0.1)' }}
                        className="card" onClick={() => setSelectedDoc(doc)}
                        style={{ padding:18, cursor:'pointer', textAlign:'center' }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>{mi.icon}</div>
                        <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{doc.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtSize(doc.size)}</div>
                        <div style={{ marginTop:6, display:'inline-block', padding:'2px 8px', borderRadius:6, background:`${mi.color}20`, color:mi.color, fontSize:10, fontWeight:700 }}>{mi.label}</div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ overflow:'hidden' }}>
                  {/* Header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px 80px 100px', gap:12, padding:'10px 18px', borderBottom:'2px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    <span>Name</span><span>Matter</span><span>Folder</span><span>Size</span><span>Uploaded</span>
                  </div>
                  {docs.map(doc => {
                    const mi = mimeInfo(doc.mimeType);
                    return (
                      <motion.div key={doc._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                        onClick={() => setSelectedDoc(doc)}
                        style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px 80px 100px', gap:12, padding:'12px 18px', borderBottom:'1px solid var(--border)', cursor:'pointer', alignItems:'center', transition:'background 150ms' }}
                        onMouseEnter={e => { e.currentTarget.style.background='var(--elevated)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                          <span style={{ fontSize:18, flexShrink:0 }}>{mi.icon}</span>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</div>
                            {doc.tags?.length > 0 && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{doc.tags.join(', ')}</div>}
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.matterId?.title || '—'}</span>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{doc.folderId?.name || 'Root'}</span>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtSize(doc.size)}</span>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtDate(doc.createdAt)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUpload && <UploadModal folders={folders} onClose={() => setShowUpload(false)} onUploaded={() => { loadDocs(); loadFolders(); }} />}
        {showRequest && <RequestModal onClose={() => setShowRequest(false)} onSaved={loadRequests} />}
        {selectedDoc && (
          <DocDetailPanel
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdated={() => { loadDocs(); setSelectedDoc(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
