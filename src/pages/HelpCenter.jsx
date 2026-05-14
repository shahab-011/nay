import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

/* ── Data ───────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'all',       label: 'All Topics',       icon: 'apps'             },
  { key: 'docs',      label: 'Documents',         icon: 'description'      },
  { key: 'analysis',  label: 'AI Analysis',       icon: 'auto_awesome'     },
  { key: 'lawyer',    label: 'Lawyer Features',   icon: 'account_balance'  },
  { key: 'account',   label: 'Account & Privacy', icon: 'account_circle'   },
];

const FAQS = [
  /* ── Documents ── */
  {
    cat: 'docs',
    q: 'What file formats can I upload?',
    a: 'NyayaAI supports PDF, DOCX, and TXT files up to 10 MB. For best results upload text-selectable PDFs rather than scanned images.',
  },
  {
    cat: 'docs',
    q: 'How do I upload a document for analysis?',
    a: 'Click "Upload Document" in the sidebar or the "New Analysis" button at the bottom of the sidebar. Choose your file, give it a name, select the document type, and click Upload. AI analysis starts automatically.',
  },
  {
    cat: 'docs',
    q: 'Can I delete a document after uploading?',
    a: 'Yes. Go to My Documents, hover over any document card, and click the delete icon. Deleting a document also removes its AI analysis and any alerts linked to it.',
  },
  {
    cat: 'docs',
    q: 'Why does my document show "Analysis Pending"?',
    a: 'The AI model is still processing your document. This usually takes 15–60 seconds. Refresh the page or navigate away and come back — the status updates automatically once analysis is complete.',
  },
  /* ── AI Analysis ── */
  {
    cat: 'analysis',
    q: 'What does the Health Score mean?',
    a: 'The Health Score (0–100) is an overall quality rating for your document. It combines compliance score, number and severity of detected risks, and structural checks (signature, dates, jurisdiction). A score above 80 is considered low risk.',
  },
  {
    cat: 'analysis',
    q: 'What are the four analysis tabs?',
    a: 'Summary — key metadata and an AI-generated overview. Clauses — every extracted legal clause with a plain-English explanation and risk rating. Risks — detailed breakdown of all identified risks with recommendations. Compliance — checks for mandatory clauses, signature, valid dates, and applicable jurisdiction.',
  },
  {
    cat: 'analysis',
    q: 'How accurate is the AI analysis?',
    a: 'NyayaAI uses Google Gemini and is designed for legal documents worldwide. Each analysis includes a Confidence Score. When confidence is below 60%, a warning is shown — always verify low-confidence results with a qualified lawyer before acting on them.',
  },
  {
    cat: 'analysis',
    q: 'Can I ask questions about my document?',
    a: 'Yes. Use the "Ask AI" page to ask free-form questions about any of your uploaded documents. You can also reach Ask AI directly from the document analysis page.',
  },
  {
    cat: 'analysis',
    q: 'How do I compare two documents?',
    a: 'Go to Compare Documents in the sidebar. Select or upload two documents, then click Compare. The system highlights additions, removals, and modifications between the two versions.',
  },
  /* ── Lawyer Features ── */
  {
    cat: 'lawyer',
    q: 'How does client linking work?',
    a: 'Lawyers send a link request to a client\'s registered email from the Client Links page. The client receives an in-app notification and can accept or reject. Once accepted, the client controls which documents to share — the lawyer can then view those documents and their AI analysis.',
  },
  {
    cat: 'lawyer',
    q: 'How does a client share a document with their lawyer?',
    a: 'The client goes to Client Links → My Lawyers, clicks "Manage Docs" on the linked lawyer\'s card, and toggles the documents they want to share. Changes save automatically — no submit needed.',
  },
  {
    cat: 'lawyer',
    q: 'Can a lawyer see documents the client hasn\'t shared?',
    a: 'No. Lawyers can only see documents that the client has explicitly shared. The client has full control and can unshare at any time by toggling off from the Manage Docs panel.',
  },
  {
    cat: 'lawyer',
    q: 'What is the Lawyer Dashboard?',
    a: 'The Lawyer Dashboard (accessible to users with the Lawyer or Admin role) shows linked clients, pending link requests, active cases, and a case status breakdown. From there lawyers can create and manage cases, view shared documents, and navigate to each client\'s full analysis.',
  },
  {
    cat: 'lawyer',
    q: 'How do I create a case for a client?',
    a: 'On the Lawyer Dashboard, go to the Cases tab and click "New Case". Select a linked client from the dropdown (or enter client details manually), fill in the case type, description, priority, and status, then click Create Case.',
  },
  /* ── Account & Privacy ── */
  {
    cat: 'account',
    q: 'What is Privacy Mode?',
    a: 'Privacy Mode (the shield icon at the bottom of the sidebar) blurs sensitive document content on screen — useful when working in public spaces. Your data is not changed; only the display is masked. Click again to return to normal view.',
  },
  {
    cat: 'account',
    q: 'How do I update my profile or change my password?',
    a: 'Go to Profile in the sidebar. You can update your name, profile photo, and password from there. Changes are saved immediately.',
  },
  {
    cat: 'account',
    q: 'Is my data stored securely?',
    a: 'All documents and analysis results are stored in a secured MongoDB database. Passwords are hashed with bcrypt. API routes are protected with JWT authentication. Document text is never shared with third parties beyond the AI analysis call.',
  },
  {
    cat: 'account',
    q: 'How do I enable alerts for expiring contracts?',
    a: 'NyayaAI automatically creates expiry alerts when it detects a contract end date. Go to the Alerts page to view all alerts. You can also see unread alert counts in the sidebar badge next to "Alerts".',
  },
];

const QUICK_LINKS = [
  { label: 'Upload a Document',    icon: 'upload_file',    path: '/upload'       },
  { label: 'My Documents',         icon: 'description',    path: '/documents'    },
  { label: 'Ask AI',               icon: 'psychology',     path: '/ask'          },
  { label: 'Compare Documents',    icon: 'compare_arrows', path: '/compare'      },
  { label: 'Contract Lifecycle',   icon: 'history_edu',    path: '/lifecycle'    },
  { label: 'Alerts',               icon: 'notifications',  path: '/alerts'       },
  { label: 'Client Links',         icon: 'handshake',      path: '/client-links' },
  { label: 'Profile Settings',     icon: 'account_circle', path: '/profile'      },
];

/* ── Component ──────────────────────────────────────────────────────── */

export default function HelpCenter() {
  const navigate  = useNavigate();
  const [search,  setSearch]  = useState('');
  const [cat,     setCat]     = useState('all');
  const [openIdx, setOpenIdx] = useState(null);

  const filtered = FAQS.filter(f => {
    const matchCat  = cat === 'all' || f.cat === cat;
    const matchSearch = !search.trim() ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggle = (i) => setOpenIdx(prev => (prev === i ? null : i));

  return (
    <>
      <Header title="Help Center" />

      <div className="p-4 md:p-8 pb-24 max-w-4xl space-y-10">

        {/* ── Hero ── */}
        <div className="relative bg-surface-container-low rounded-3xl border border-white/5 p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 mb-2">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
            </div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
              How can we help you?
            </h1>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              Search our knowledge base or browse by category below.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto mt-4">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">search</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpenIdx(null); }}
                placeholder="Search questions…"
                className="w-full bg-surface-container border border-white/10 focus:border-primary text-on-surface text-sm py-3.5 pl-12 pr-4 rounded-xl outline-none transition-colors placeholder-slate-600"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div>
          <h2 className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(({ label, icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-2xl border border-white/5 hover:border-primary/25 hover:bg-surface-container cursor-pointer transition-all group text-center"
              >
                <span
                  className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >{icon}</span>
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── FAQ Section ── */}
        <div>
          <h2 className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-4">Frequently Asked Questions</h2>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCat(c.key); setOpenIdx(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  cat === c.key
                    ? 'bg-primary text-on-primary shadow-[0_0_14px_rgba(0,201,167,0.25)]'
                    : 'bg-surface-container-low border border-white/8 text-on-surface-variant hover:text-white hover:border-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-white/5 space-y-3">
              <span className="material-symbols-outlined text-4xl text-primary opacity-20 block">search_off</span>
              <p className="text-white/60 font-headline font-bold">No results found</p>
              <p className="text-sm text-on-surface-variant">Try different keywords or browse all topics.</p>
              <button
                onClick={() => { setSearch(''); setCat('all'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((faq, i) => (
                <div
                  key={i}
                  className={`bg-surface-container-low rounded-2xl border transition-all ${
                    openIdx === i ? 'border-primary/25' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left"
                  >
                    <span className={`material-symbols-outlined text-lg flex-shrink-0 transition-colors ${openIdx === i ? 'text-primary' : 'text-on-surface-variant'}`}
                      style={{ fontVariationSettings: openIdx === i ? "'FILL' 1" : "'FILL' 0" }}>
                      {openIdx === i ? 'help' : 'help'}
                    </span>
                    <span className={`flex-1 text-sm font-semibold font-headline transition-colors ${openIdx === i ? 'text-primary' : 'text-on-surface'}`}>
                      {faq.q}
                    </span>
                    <span className={`material-symbols-outlined text-lg flex-shrink-0 text-on-surface-variant transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {openIdx === i && (
                    <div className="px-6 pb-5">
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Contact / Support banner ── */}
        <div className="flex items-center gap-5 p-6 bg-primary/5 border border-primary/15 rounded-2xl flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-on-surface text-sm">Still have questions?</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Nyaya is built for legal professionals worldwide. For feedback or issues, reach us at{' '}
              <span className="text-primary font-semibold">support@nyayaai.in</span>
            </p>
          </div>
          <a
            href="mailto:support@nyayaai.in"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            Email Support
          </a>
        </div>

      </div>
    </>
  );
}
