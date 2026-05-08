import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getClientLink, getLinkDocuments } from '../api/lawyer.api';

function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ScoreColor = (s) => s >= 80 ? 'text-primary' : s >= 50 ? 'text-amber-400' : 'text-error';
const BarColor   = (s) => s >= 80 ? 'bg-primary'   : s >= 50 ? 'bg-amber-400'   : 'bg-error';

export default function LawyerClientView() {
  const { linkId } = useParams();
  const navigate   = useNavigate();

  const [link,    setLink]    = useState(null);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [linkRes, docsRes] = await Promise.all([
        getClientLink(linkId),
        getLinkDocuments(linkId),
      ]);
      setLink(linkRes.data.data.link);
      setDocs(docsRes.data.data.documents || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load client data: ${msg}`);
      console.error('LawyerClientView load error:', err.response?.status, msg);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <>
        <Header title="Client Profile" />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Client Profile" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <p className="text-on-surface-variant text-center max-w-md">{error}</p>
          <button onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:opacity-90">
            ← Go Back
          </button>
        </div>
      </>
    );
  }

  const client = link?.clientId || {};

  return (
    <>
      <Header title={client.name || link?.clientEmail || 'Client Profile'}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant hover:text-white hover:border-white/20 text-sm font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
      </Header>

      <div className="p-8 pb-24 max-w-5xl space-y-8">

        {/* ── Client profile card ── */}
        <div className="bg-surface-container-low rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
              <span className="text-2xl font-bold text-primary font-headline">
                {(client.name || link?.clientEmail || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">
                  {client.name || link?.clientEmail}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />Linked Client
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5">{client.email || link?.clientEmail}</p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { icon: 'description', label: `${link?.stats?.totalDocuments ?? 0} total docs`   },
                { icon: 'share',       label: `${docs.length} shared with you`                    },
                { icon: 'folder_open', label: `${link?.stats?.totalCases ?? 0} cases`             },
                { icon: 'schedule',    label: `Linked ${formatRelative(link?.acceptedAt)}`        },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-primary">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Shared documents list ── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-sm font-bold font-headline uppercase tracking-widest text-on-surface-variant">
              Shared Documents
            </h2>
            <span className="text-[11px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
              {docs.length}
            </span>
          </div>

          {docs.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-white/5 space-y-3">
              <span className="material-symbols-outlined text-5xl text-primary opacity-20 block">description</span>
              <p className="font-headline font-bold text-white/60">No documents shared yet</p>
              <p className="text-sm text-on-surface-variant">
                The client hasn't shared any documents with you yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <DocRow
                  key={doc._id}
                  doc={doc}
                  onClick={() => navigate(`/lawyer/client/${linkId}/document/${doc._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DocRow({ doc, onClick }) {
  const score = doc.healthScore ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-container-low rounded-2xl border border-white/5 p-5 hover:border-primary/30 hover:bg-surface-container cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-5">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl group-hover:text-primary transition-colors"
            style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>

        {/* Name + type */}
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-on-surface text-sm truncate group-hover:text-primary transition-colors">
            {doc.originalName}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-on-surface-variant">{doc.docType || 'Unknown type'}</span>
            {doc.riskCount > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-error">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                {doc.riskCount} risk{doc.riskCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                No risks
              </span>
            )}
            {doc.expiryDate && (
              <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[12px]">event</span>
                Expires {formatDate(doc.expiryDate)}
              </span>
            )}
          </div>
        </div>

        {/* Health score */}
        <div className="flex-shrink-0 w-32 hidden sm:block">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Health</span>
            <span className={`text-sm font-bold font-headline ${ScoreColor(score)}`}>{score}%</span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${BarColor(score)} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Uploaded time */}
        <div className="flex-shrink-0 text-right hidden md:block">
          <span className="text-[11px] text-on-surface-variant">{formatRelative(doc.uploadedAt)}</span>
        </div>

        {/* Arrow */}
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors flex-shrink-0">
          chevron_right
        </span>
      </div>
    </button>
  );
}
