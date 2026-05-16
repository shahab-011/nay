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
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATS = [
  'All', 'NDA', 'Retainer Agreement', 'Engagement Letter', 'Demand Letter',
  'Settlement Agreement', 'Lease', 'Employment Contract', 'Corporate Resolution',
  'Court Motion', 'Pleading', 'Discovery', 'Custom',
];

const CAT_COLOR = {
  'NDA': '#7C3AED', 'Retainer Agreement': '#3B82F6', 'Engagement Letter': '#0EA5E9',
  'Demand Letter': '#EF4444', 'Settlement Agreement': '#10B981', 'Lease': '#F59E0B',
  'Employment Contract': '#6366F1', 'Corporate Resolution': '#8B5CF6',
  'Court Motion': '#EC4899', 'Pleading': '#14B8A6', 'Discovery': '#F97316',
  'Custom': '#6B7280',
};

/* ─── Shared styles ───────────────────────────────────────────── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPurple = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 9, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const btnGhost = { padding: '9px 18px', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };

/* ─── TemplateCard ────────────────────────────────────────────── */
function TemplateCard({ t, onUse, onEdit, onDelete, onFavorite, onVersions }) {
  const fields = useMemo(() => extractFields(t.content), [t.content]);
  const color = CAT_COLOR[t.category] || '#6B7280';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I.Layers size={20} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{t.description}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: color + '18', color }}>{t.category}</span>
          <button onClick={() => onFavorite(t._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: t.isFavorite ? '#F59E0B' : '#D1D5DB', fontSize: 16 }}>
            {t.isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {fields.slice(0, 4).map(f => (
          <span key={f} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#4B5563' }}>{`{{${f}}}`}</span>
        ))}
        {fields.length > 4 && <span style={{ fontSize: 10, color: '#9CA3AF', padding: '2px 8px' }}>+{fields.length - 4} more</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#9CA3AF' }}>
        <span>Used {t.usageCount || 0}×</span>
        {t.lastUsedAt && <span>· Last {fmtDate(t.lastUsedAt)}</span>}
        {(t.versions?.length > 0) && (
          <button onClick={() => onVersions(t)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontSize: 11, fontWeight: 600, padding: 0 }}>
            v{t.currentVersion} · History
          </button>
        )}
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
  const [form, setForm] = useState(template
    ? { name: template.name, category: template.category, description: template.description || '', content: template.content, versionNote: '' }
    : { name: '', category: 'Custom', description: '', content: '', versionNote: '' }
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('editor');
  const fields = useMemo(() => extractFields(form.content), [form.content]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name || !form.content) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['editor', 'fields'].map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: tab === t ? '#7C3AED' : '#F3F4F6', color: tab === t ? '#fff' : '#374151' }}>
              {i === 0 ? 'Editor' : `Fields (${fields.length})`}
            </button>
          ))}
        </div>

        {tab === 'editor' && (
          <>
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
              <input value={form.description} onChange={e => set('description', e.target.value)} style={inp} placeholder="Short description" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>
                Content — use <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{'{{field_name}}'}</code> for smart fields
              </label>
              <textarea
                value={form.content}
                onChange={e => set('content', e.target.value)}
                style={{ ...inp, height: 280, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                placeholder="Paste or type document content…"
              />
            </div>
            {template && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Version Note (optional)</label>
                <input value={form.versionNote} onChange={e => set('versionNote', e.target.value)} style={inp} placeholder="What changed in this version?" />
              </div>
            )}
          </>
        )}

        {tab === 'fields' && (
          <div>
            {fields.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 13 }}>
                No fields detected. Add <code>{'{{field_name}}'}</code> placeholders in the editor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.map(f => (
                  <div key={f} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 2 }}>{`{{${f}}}`}</div>
                      <div style={{ fontSize: 12, color: '#374151' }}>{fieldLabel(f)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', alignSelf: 'center' }}>Auto-detected variable</div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EDE9FE', color: '#7C3AED', alignSelf: 'center', textAlign: 'center', fontWeight: 600 }}>text</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...btnPurple, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── AIConvertModal ──────────────────────────────────────────── */
function AIConvertModal({ onClose, onCreate }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  async function convert() {
    if (!text.trim()) return;
    setLoading(true); setErr('');
    try {
      const res = await templatesApi.aiConvert({ content: text });
      setResult(res.data.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'AI conversion failed');
    } finally {
      setLoading(false);
    }
  }

  async function useResult() {
    if (!result) return;
    setLoading(true);
    try {
      const res = await templatesApi.create(result);
      onCreate(res.data.data);
      onClose();
    } catch {
      setErr('Failed to save template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>AI Convert to Template</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Paste any document — AI identifies variable fields and converts it to a reusable template</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        {!result ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Paste document content</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ ...inp, height: 300, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                placeholder="Paste your Word document, NDA, contract, letter, etc…"
              />
            </div>
            {err && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={btnGhost}>Cancel</button>
              <button onClick={convert} disabled={loading || !text.trim()} style={{ ...btnPurple, opacity: (loading || !text.trim()) ? 0.7 : 1 }}>
                {loading ? 'Analyzing with AI…' : '✦ Convert to Template'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #86EFAC', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>AI detected {result.fields?.length || 0} variable fields</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{result.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{result.description}</div>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(result.fields || []).slice(0, 8).map(f => (
                  <span key={f.name} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}>{`{{${f.name}}}`}</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Generated content preview</label>
              <pre style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 240, overflowY: 'auto', border: '1px solid #E5E7EB', margin: 0 }}>{(result.content || '').substring(0, 1200)}</pre>
            </div>
            {err && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setResult(null)} style={btnGhost}>← Re-analyze</button>
              <button onClick={onClose} style={btnGhost}>Cancel</button>
              <button onClick={useResult} disabled={loading} style={{ ...btnPurple, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving…' : 'Save as Template'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ─── VersionsPanel ───────────────────────────────────────────── */
function VersionsPanel({ template, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    templatesApi.listVersions(template._id)
      .then(r => setVersions(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [template._id]);

  async function restore(vId, vNum) {
    if (!window.confirm(`Restore to version ${vNum}? Current content will be archived.`)) return;
    setRestoring(vId);
    try {
      await templatesApi.restoreVersion(template._id, vId);
      onRestore();
      onClose();
    } catch {
      alert('Restore failed');
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(11,11,20,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '85vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>Version History</h2>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{template.name} · v{template.currentVersion} current</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><I.X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14 }}>Loading history…</div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14 }}>No previous versions. Versions are saved each time you edit this template.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {versions.map(v => (
              <div key={v._id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 12, border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>v{v.versionNumber}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{v.note || 'No note'}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {v.updatedBy?.name || 'Unknown'} · {fmtDate(v.updatedAt)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(v.content || '').substring(0, 120)}…
                  </div>
                </div>
                <button
                  onClick={() => restore(v._id, v.versionNumber)}
                  disabled={restoring === v._id}
                  style={{ padding: '6px 14px', borderRadius: 8, background: '#EDE9FE', color: '#7C3AED', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0, opacity: restoring === v._id ? 0.7 : 1 }}
                >
                  {restoring === v._id ? '…' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGhost}>Close</button>
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
      const res = await templatesApi.generate(template._id, { fieldValues: vals });
      content = res.data.data?.content || localFilled;
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
          {['Fill Fields', 'Preview'].map((t, i) => (
            <button key={t} onClick={() => setPreview(i === 1)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: preview === (i === 1) ? '#7C3AED' : '#F3F4F6', color: preview === (i === 1) ? '#fff' : '#374151' }}>{t}</button>
          ))}
        </div>

        {!preview ? (
          fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9CA3AF', fontSize: 13 }}>This template has no variable fields. Click Download to generate it.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fields.map(f => (
                <div key={f}>
                  <label style={lbl}>{fieldLabel(f)}</label>
                  <input value={vals[f] || ''} onChange={e => setVals(v => ({ ...v, [f]: e.target.value }))} style={inp} placeholder={`Enter ${fieldLabel(f)}`} />
                </div>
              ))}
            </div>
          )
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
  const [showFavs, setShowFavs] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [genTpl, setGenTpl] = useState(null);
  const [versionsTpl, setVersionsTpl] = useState(null);
  const [showAIConvert, setShowAIConvert] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await templatesApi.list();
      const d = res.data.data;
      setTemplates(Array.isArray(d) ? d : d?.templates || []);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (!showFavs || t.isFavorite) &&
    ((t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
  );

  async function saveTemplate(form) {
    if (editTpl) {
      const res = await templatesApi.update(editTpl._id, form);
      setTemplates(ts => ts.map(t => t._id === editTpl._id ? (res.data.data || { ...t, ...form }) : t));
      setEditTpl(null);
    } else {
      const res = await templatesApi.create(form);
      setTemplates(ts => [res.data.data, ...ts]);
      setShowNew(false);
    }
  }

  async function deleteTemplate(id) {
    const prev = templates;
    setTemplates(ts => ts.filter(t => t._id !== id));
    try { await templatesApi.remove(id); } catch { setTemplates(prev); }
  }

  async function toggleFavorite(id) {
    try {
      const res = await templatesApi.toggleFavorite(id);
      const { isFavorite } = res.data.data;
      setTemplates(ts => ts.map(t => t._id === id ? { ...t, isFavorite } : t));
    } catch (e) {
      console.error('Toggle favorite failed:', e);
    }
  }

  function downloadGenerated(d) {
    const blob = new Blob([d.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(d.template || 'document').replace(/\s+/g, '_')}.txt`;
    a.click();
  }

  const favorites = templates.filter(t => t.isFavorite);

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8F9FC' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Layers size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Document Automation</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Build templates with smart fields — generate any document in seconds</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAIConvert(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                ✦ AI Convert
              </button>
              <button onClick={() => setShowNew(true)} style={btnPurple}><I.Plus size={15} /> New Template</button>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        {templates.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Templates', value: templates.length, color: '#7C3AED' },
              { label: 'Favorites', value: favorites.length, color: '#F59E0B' },
              { label: 'Generated Docs', value: generated.length, color: '#10B981' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 140, background: '#fff', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 10, padding: 3, border: '1.5px solid #E5E7EB', gap: 2 }}>
            {[
              { key: 'templates', label: `Templates (${templates.length})` },
              { key: 'generated', label: `Generated (${generated.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: tab === t.key ? '#7C3AED' : 'transparent', color: tab === t.key ? '#fff' : '#6B7280' }}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'templates' && (
            <button
              onClick={() => setShowFavs(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1.5px solid', borderColor: showFavs ? '#F59E0B' : '#E5E7EB', background: showFavs ? '#FFFBEB' : '#fff', color: showFavs ? '#B45309' : '#6B7280', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ★ Favorites {showFavs ? 'only' : ''}
            </button>
          )}
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
                <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
                  <AnimatePresence>
                    {filtered.map(t => (
                      <TemplateCard
                        key={t._id} t={t}
                        onUse={setGenTpl}
                        onEdit={setEditTpl}
                        onDelete={deleteTemplate}
                        onFavorite={toggleFavorite}
                        onVersions={setVersionsTpl}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
                {!filtered.length && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                    <I.Layers size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No templates found</p>
                    <button onClick={() => setShowNew(true)} style={{ ...btnPurple, margin: '16px auto 0', justifyContent: 'center' }}><I.Plus size={15} /> Create your first template</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'generated' && <GeneratedList docs={generated} onDownload={downloadGenerated} />}
      </div>

      {/* Modals */}
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
      {versionsTpl && (
        <VersionsPanel
          template={versionsTpl}
          onClose={() => setVersionsTpl(null)}
          onRestore={load}
        />
      )}
      {showAIConvert && (
        <AIConvertModal
          onClose={() => setShowAIConvert(false)}
          onCreate={tpl => setTemplates(ts => [tpl, ...ts])}
        />
      )}
    </div>
  );
}
