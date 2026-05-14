import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

/* ── Feature cards data ─────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: 'auto_awesome',
    title: 'Gemini-Powered Analysis',
    desc: 'Every document is processed by Google Gemini — one of the most capable AI models in the world — giving you clause-level understanding, plain-English summaries, and accurate risk scoring.',
    color: 'from-violet-500/10 to-transparent border-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    icon: 'gavel',
    title: 'Built for Global Law',
    desc: 'Nyaya is designed for any jurisdiction worldwide. Compliance checks reference contract law fundamentals, GDPR, and jurisdiction-specific requirements — not one-size-fits-all templates.',
    color: 'from-primary/10 to-transparent border-primary/15',
    iconColor: 'text-primary',
  },
  {
    icon: 'shield_lock',
    title: 'Privacy Mode',
    desc: 'Sensitive documents never have to leave your device. Activate Privacy Mode and files are processed entirely in your browser — zero cloud upload, zero server storage. No other legal AI tool offers this.',
    color: 'from-emerald-500/10 to-transparent border-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    icon: 'account_balance',
    title: 'Lawyer–Client Collaboration',
    desc: 'Lawyers get a dedicated dashboard to manage client links, review shared documents, and provide analysis — all within the same platform. No switching between email, Drive, and separate tools.',
    color: 'from-amber-500/10 to-transparent border-amber-500/15',
    iconColor: 'text-amber-400',
  },
  {
    icon: 'compare_arrows',
    title: 'Multi-Document Comparison',
    desc: 'Compare two contracts side-by-side in seconds. Nyaya highlights additions, removals, and modifications at the clause level — making contract negotiations and version reviews effortless.',
    color: 'from-sky-500/10 to-transparent border-sky-500/15',
    iconColor: 'text-sky-400',
  },
  {
    icon: 'notifications_active',
    title: 'Smart Contract Alerts',
    desc: 'Nyaya tracks your contract timelines and sends real-time alerts for expiry dates, renewal windows, and key milestones — so you never miss a critical deadline buried in a 40-page agreement.',
    color: 'from-rose-500/10 to-transparent border-rose-500/15',
    iconColor: 'text-rose-400',
  },
];

const DIFFERENTIATORS = [
  {
    icon: 'language',
    label: 'Jurisdiction-Aware',
    detail: 'Nyaya is trained on global contract law patterns, covering major jurisdictions worldwide.',
  },
  {
    icon: 'lock',
    label: 'True Privacy Option',
    detail: 'Most AI legal tools are cloud-only. Nyaya\'s Privacy Mode is the only fully offline processing option among legal AI platforms.',
  },
  {
    icon: 'psychology',
    label: 'Plain English Explanations',
    detail: 'Not just risk flags — every clause gets a jargon-free plain-English explanation so non-lawyers can understand their own contracts.',
  },
  {
    icon: 'handshake',
    label: 'Two-Sided Platform',
    detail: 'Most tools serve either clients or lawyers. Nyaya bridges both: clients upload and analyse, lawyers review and advise — all in one place.',
  },
  {
    icon: 'history_edu',
    label: 'Full Contract Lifecycle',
    detail: 'From upload → analysis → comparison → tracking → alerts — Nyaya covers the entire contract journey, not just the initial review.',
  },
  {
    icon: 'bolt',
    label: 'Seconds, Not Days',
    detail: 'A lawyer review takes days. Nyaya delivers a comprehensive AI analysis — health score, clauses, risks, compliance — in under 60 seconds.',
  },
];

const STATS = [
  { value: '60s', label: 'Average analysis time' },
  { value: '4', label: 'Analysis dimensions' },
  { value: '100%', label: 'Global law coverage' },
  { value: '0 uploads', label: 'In Privacy Mode' },
];

/* ── Accordion item ─────────────────────────────────────────────────── */

function DiffItem({ icon, label, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-surface-container-low border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="flex-1 text-sm font-semibold text-on-surface font-headline">{label}</span>
        <span className="material-symbols-outlined text-on-surface-variant text-[16px] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </div>
      {open && (
        <p className="mt-2.5 ml-7 text-[13px] text-on-surface-variant leading-relaxed">{detail}</p>
      )}
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <Header title="About Nyaya" />

      <div className="p-4 md:p-8 pb-24 max-w-5xl space-y-12">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-surface-container to-transparent border border-primary/10 p-6 md:p-10">
          {/* decorative glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary font-label">Legal Intelligence Platform</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-on-surface font-headline tracking-tight leading-tight mb-3">
              What is <span className="text-primary">Nyaya</span>?
            </h1>

            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl mb-6">
              Nyaya is an AI-powered legal document intelligence platform built for global legal intelligence.
              It lets individuals, businesses, and lawyers upload contracts and legal documents,
              instantly understand every clause in plain English, identify risks, track compliance
              with applicable law, and collaborate — all in one place.
            </p>

            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl">
              The name <span className="text-primary font-semibold">Nyaya</span> (न्याय) means
              <em className="text-on-surface"> justice</em> in Sanskrit — and that is exactly what we are building:
              making legal clarity accessible to everyone, not just those who can afford expensive lawyers.
            </p>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="bg-surface-container-low rounded-xl border border-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-primary font-headline">{s.value}</div>
              <div className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Core features ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <h2 className="text-lg font-bold text-on-surface font-headline">What Nyaya Does</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className={`bg-gradient-to-br ${f.color} border rounded-xl p-5 flex gap-4`}>
                <span className={`material-symbols-outlined ${f.iconColor} text-2xl flex-shrink-0 mt-0.5`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface font-headline mb-1">{f.title}</h3>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it's different ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}>difference</span>
            <h2 className="text-lg font-bold text-on-surface font-headline">How Nyaya is Different</h2>
          </div>
          <p className="text-on-surface-variant text-[13px] mb-5 ml-7">
            Tap any item to see why it matters.
          </p>

          <div className="space-y-2">
            {DIFFERENTIATORS.map(d => (
              <DiffItem key={d.label} {...d} />
            ))}
          </div>
        </section>

        {/* ── X Factor ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-primary/5 to-transparent border border-violet-500/10 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-violet-400 text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <h2 className="text-lg font-bold text-on-surface font-headline">Our X Factor</h2>
            </div>

            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 max-w-2xl">
              Most legal AI tools are either expensive SaaS products for law firms, or generic
              chatbots that hallucinate statutes. Nyaya is neither.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">Jurisdiction-aware, not jurisdiction-locked</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Every risk flag, compliance check, and clause explanation adapts to the jurisdiction you specify.
                    We built for global contract law from the ground up.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">The only legal AI with real Privacy Mode</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    No other legal AI platform lets you process documents entirely in the browser with zero server
                    upload. Nyaya's Privacy Mode is a genuine architectural choice — not a checkbox.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">A platform, not a point solution</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Upload → Analyse → Compare → Track → Alert → Collaborate. The full contract lifecycle
                    in one app. Competing tools do one of these things. Nyaya does all of them.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">Lawyer marketplace built in</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Clients can share documents directly with their lawyer through a secure link system.
                    Lawyers get a purpose-built dashboard. It's not a chat thread — it's structured legal collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission ───────────────────────────────────────────────── */}
        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 md:p-8 text-center">
          <span className="material-symbols-outlined text-primary text-3xl mb-3 block"
            style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
          <h2 className="text-xl font-bold text-on-surface font-headline mb-3">Our Mission</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-4">
            Legal clarity should not be a luxury. Millions of people sign contracts they don't
            fully understand — employment agreements, rental deeds, vendor contracts, loan documents —
            because professional legal advice is expensive and slow.
          </p>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-6">
            Nyaya exists to close that gap. We believe every person — regardless of budget — deserves
            to know exactly what they're signing.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold font-headline hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            Analyse Your First Document
          </button>
        </section>

        {/* ── Tech stack ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}>settings_suggest</span>
            <h2 className="text-lg font-bold text-on-surface font-headline">Technology Behind Nyaya</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: 'auto_awesome',   label: 'Google Gemini',  sub: 'AI Analysis Engine'    },
              { icon: 'code',           label: 'React',          sub: 'Frontend Framework'    },
              { icon: 'storage',        label: 'Node + Express', sub: 'Backend API'           },
              { icon: 'database',       label: 'MongoDB',        sub: 'Document Database'     },
            ].map(t => (
              <div key={t.label} className="bg-surface-container rounded-xl border border-white/5 p-4 flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                <div>
                  <p className="text-xs font-bold text-on-surface font-headline">{t.label}</p>
                  <p className="text-[10px] text-on-surface-variant">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Version footer ────────────────────────────────────────── */}
        <div className="text-center text-[11px] text-on-surface-variant space-y-1 pb-4">
          <p className="font-semibold text-on-surface">Nyaya Legal Intelligence</p>
          <p>Version 1.0 · Final Year Project · Built with ❤ for legal clarity worldwide</p>
          <p className="text-[10px]">For support, visit <button onClick={() => navigate('/help')} className="text-primary underline underline-offset-2">Help Center</button></p>
        </div>

      </div>
    </>
  );
}
