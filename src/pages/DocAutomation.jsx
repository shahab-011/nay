import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I } from '../components/Icons';
import { templatesApi } from '../api/templates.api';

/* ─── helpers ─────────────────────────────────────────────────── */
function extractFields(content) {
  const m = (content || '').match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(m.map(s => s.replace(/\{\{|\}\}/g, '')))];
}
function fieldLabel(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function fillTemplate(content, vals) {
  return (content || '').replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] || `[${fieldLabel(k)}]`);
}

const CATS = ['All', 'NDA', 'Retainer', 'Employment', 'Lease', 'Settlement', 'Corporate', 'Custom'];
const CAT_COLOR = {
  NDA: '#7C3AED', Retainer: '#3B82F6', Employment: '#10B981',
  Lease: '#F59E0B', Settlement: '#EF4444', Corporate: '#8B5CF6', Custom: '#6B7280',
};

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── TemplateCard ────────────────────────────────────────────── */
function TemplateCard({ t, onUse, onEdit, onDelete }) {
  const fields = extractFields(t.content);
  const color = CAT_COLOR[t.category] || '#6B7280';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I.Layers size={20} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{t.description}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: color + '18', color, whiteSpace: 'nowrap' }}>{t.category}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {fields.slice(0, 4).map(f => (
          <span key={f} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#4B5563' }}>{`{{${f}}}`}</span>
        ))}
        {fields.length > 4 && <span style={{ fontSize: 10, color: '#9CA3AF', padding: '2px 8px' }}>+{fields.length - 4} more</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onUse(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <I.Doc size={13} /> Use Template
        </button>
        <button onClick={() => onEdit(t)} style={{ padding: '8px 12px', borderRadius: 8, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          <I.Edit size={13} />
        </button>
        <button onClick={() => onDelete(t._id)} style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 12 }}>
          <I.X size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── TemplateModal (new / edit) ──────────────────────────────── */
function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState(template || { name: '', category: 'Custom', description: '', content: '' });
  const [saving, setSaving] = useState(false);
  const fields = useMemo(() => extractFields(form.content), [form.content]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name || !form.content) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Template Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="e.g. Client NDA" />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
              {CATS.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} style={inp} placeholder="Short description of this template" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>
            Content — use <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{'{{field_name}}'}</code> for smart fields
          </label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            style={{ ...inp, height: 260, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            placeholder="Paste or type your document content here..."
          />
        </div>
        {fields.length > 0 && (
          <div style={{ marginBottom: 18, padding: '12px 14px', background: '#F5F3FF', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 6 }}>Detected Smart Fields ({fields.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {fields.map(f => <span key={f} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>{fieldLabel(f)}</span>)}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── GenerateModal ───────────────────────────────────────────── */
function GenerateModal({ template, onClose, onGenerate }) {
  const fields = useMemo(() => extractFields(template.content), [template]);
  const [vals, setVals] = useState({});
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const localFilled = fillTemplate(template.content, vals);

  async function download() {
    setGenerating(true);
    let content = localFilled;
    try {
      const res = await templatesApi.generate(template._id, vals);
      content = res.data.data?.generatedContent || localFilled;
    } catch {
      // fallback to local fill
    } finally {
      setGenerating(false);
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${template.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    onGenerate({ template: template.name, date: new Date().toLocaleDateString(), content });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>Generate Document</h2>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{template.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {['Fill Fields', 'Preview'].map((tab, i) => (
            <button key={tab} onClick={() => setPreview(i === 1)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: preview === (i === 1) ? '#7C3AED' : '#F3F4F6', color: preview === (i === 1) ? '#fff' : '#374151' }}>{tab}</button>
          ))}
        </div>

        {!preview ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(f => (
              <div key={f}>
                <label style={lbl}>{fieldLabel(f)}</label>
                <input value={vals[f] || ''} onChange={e => setVals(v => ({ ...v, [f]: e.target.value }))} style={inp} placeholder={`Enter ${fieldLabel(f)}`} />
              </div>
            ))}
          </div>
        ) : (
          <pre style={{ background: '#F9FAFB', borderRadius: 10, padding: 18, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 380, overflowY: 'auto', border: '1px solid #E5E7EB' }}>{localFilled}</pre>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          {!preview && <button onClick={() => setPreview(true)} style={btnGhost}>Preview →</button>}
          {preview && (
            <button onClick={download} disabled={generating} style={{ ...btnPurple, opacity: generating ? 0.7 : 1 }}>
              <I.Download size={14} /> {generating ? 'Generating…' : 'Download .txt'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── GeneratedList ───────────────────────────────────────────── */
function GeneratedList({ docs, onDownload }) {
  if (!docs.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
      <I.Doc size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p style={{ margin: 0, fontSize: 14 }}>No documents generated yet. Use a template to create one.</p>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {docs.map((d, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.Doc size={18} style={{ color: '#7C3AED' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{d.template}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Generated {d.date}</div>
          </div>
          <button onClick={() => onDownload(d)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
            <I.Download size={13} /> Download
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function DocAutomation() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState([]);
  const [tab, setTab] = useState('templates');
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [genTpl, setGenTpl] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await templatesApi.list();
      setTemplates(res.data.data || []);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter(t =>
    (cat === 'All' || t.category === cat) &&
    ((t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
  );

  async function saveTemplate(form) {
    try {
      if (editTpl) {
        const res = await templatesApi.update(editTpl._id, form);
        setTemplates(ts => ts.map(t => t._id === editTpl._id ? (res.data.data || { ...t, ...form }) : t));
        setEditTpl(null);
      } else {
        const res = await templatesApi.create(form);
        setTemplates(ts => [res.data.data, ...ts]);
        setShowNew(false);
      }
    } catch (e) {
      console.error('Failed to save template:', e);
      throw e;
    }
  }

  async function deleteTemplate(id) {
    const prev = templates;
    setTemplates(ts => ts.filter(t => t._id !== id));
    try {
      await templatesApi.remove(id);
    } catch {
      setTemplates(prev);
    }
  }

  function downloadGenerated(d) {
    const blob = new Blob([d.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(d.template || 'document').replace(/\s+/g, '_')}.txt`;
    a.click();
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Layers size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Document Automation</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Build templates with smart fields — generate any document in seconds</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 10, padding: 3, border: '1.5px solid #E5E7EB', gap: 2 }}>
            {['templates', 'generated'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === t ? '#7C3AED' : 'transparent', color: tab === t ? '#fff' : '#6B7280', textTransform: 'capitalize' }}>
                {t === 'templates' ? `Templates (${templates.length})` : `Generated (${generated.length})`}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Template</button>
        </div>

        {tab === 'templates' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <I.Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" style={{ ...inp, paddingLeft: 34 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', borderColor: cat === c ? '#7C3AED' : '#E5E7EB', background: cat === c ? '#EDE9FE' : '#fff', color: cat === c ? '#7C3AED' : '#6B7280', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{c}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: 14 }}>Loading templates…</div>
            ) : (
              <>
                <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  <AnimatePresence>
                    {filtered.map(t => (
                      <TemplateCard key={t._id} t={t} onUse={setGenTpl} onEdit={setEditTpl} onDelete={deleteTemplate} />
                    ))}
                  </AnimatePresence>
                </motion.div>
                {!filtered.length && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                    <I.Layers size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No templates found</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'generated' && <GeneratedList docs={generated} onDownload={downloadGenerated} />}
      </div>

      {(showNew || editTpl) && (
        <TemplateModal
          template={editTpl}
          onClose={() => { setShowNew(false); setEditTpl(null); }}
          onSave={saveTemplate}
        />
      )}
      {genTpl && (
        <GenerateModal
          template={genTpl}
          onClose={() => setGenTpl(null)}
          onGenerate={doc => setGenerated(g => [doc, ...g])}
        />
      )}
    </div>
  );
}
