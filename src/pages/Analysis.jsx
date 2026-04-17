import React from 'react';
import Header from '../components/Header';

export default function Analysis() {
  return (
    <>
      <Header title="NyayaAI | Analysis Terminal 4.2">
        <button className="bg-primary-container/10 text-primary-container font-headline font-semibold px-4 py-1.5 rounded-full text-xs hover:opacity-80 transition-opacity flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" data-icon="verified_user" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
          Privacy Mode
        </button>
      </Header>
      
      <div className="p-8 bg-surface min-h-[calc(100vh-64px)]">
        {/* Document Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <nav className="flex gap-2 text-[10px] font-label text-on-surface-variant mb-3 tracking-widest uppercase">
              <span>Repository</span>
              <span>/</span>
              <span>Service Level Agreements</span>
            </nav>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Cloud_Services_MSA_v2.pdf</h2>
              <div className="bg-surface-container-high px-3 py-1 rounded flex items-center gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary-container text-sm" data-icon="verified">verified</span>
                <span className="text-xs font-label text-on-surface-variant">Conf. Score: <span className="text-primary font-bold">94%</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant/20 hover:bg-white/5 transition-all text-sm font-headline">
              <span className="material-symbols-outlined text-lg" data-icon="download">download</span>
              Export PDF
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-sm shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined text-lg" data-icon="share">share</span>
              Share Analysis
            </button>
          </div>
        </div>

        {/* Top Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left: Health Score Donut */}
          <div className="lg:col-span-4 bg-surface-container-low p-8 rounded-xl border-l-4 border-primary">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-headline font-bold">Document Health</h3>
              <span className="material-symbols-outlined text-on-surface-variant" data-icon="info">info</span>
            </div>
            <div className="relative flex justify-center mb-8">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12"></circle>
                <circle className="text-primary stroke-round" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray="502.65" strokeDashoffset="90.47" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-headline font-extrabold text-on-surface">82</span>
                <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Composite Index</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-label mb-1 uppercase tracking-tighter">
                  <span>Compliance Risk</span>
                  <span className="text-primary">Low</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[88%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-label mb-1 uppercase tracking-tighter">
                  <span>Enforceability</span>
                  <span className="text-secondary">Optimal</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[94%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: AI Summary */}
          <div className="lg:col-span-8 bg-surface-container-low p-8 rounded-xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary-container" data-icon="auto_awesome" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
              <h3 className="text-lg font-headline font-bold">Executive Intelligence Summary</h3>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-lg mb-8 font-body">
              This Master Service Agreement contains standard terms for cloud infrastructure provisioning. However, the <span className="text-primary font-semibold">Liability Limitation</span> clause (Section 14.2) significantly favors the provider, creating a potential exposure of <span className="bg-primary/10 text-primary px-1 rounded">2.5x the annual contract value</span> in specific breach scenarios. Termination rights are balanced, but notice periods are shorter than industry benchmarks.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
              <div className="p-4 bg-error/5 rounded-lg border border-error/10 flex gap-4">
                <span className="material-symbols-outlined text-error" data-icon="warning">warning</span>
                <div>
                  <h4 className="text-error font-bold text-sm mb-1">Critical Risk Detected</h4>
                  <p className="text-xs text-on-surface-variant leading-tight">Clause 14.2 (Indemnification) uses ambiguous language regarding third-party IP claims.</p>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex gap-4">
                <span className="material-symbols-outlined text-primary" data-icon="verified">verified</span>
                <div>
                  <h4 className="text-primary font-bold text-sm mb-1">Strong Protection</h4>
                  <p className="text-xs text-on-surface-variant leading-tight">Data Sovereignty clauses fully comply with recent GDPR and DPDP requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Extracted Clauses */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-headline font-extrabold flex items-center gap-3">
            Extracted Clauses
            <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-label px-2 py-0.5 rounded-full uppercase tracking-widest">12 Items Found</span>
          </h3>
          <div className="flex items-center bg-surface-container-low rounded-lg p-1">
            <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-surface-container-highest text-primary">All Clauses</button>
            <button className="px-4 py-1.5 rounded-md text-xs font-bold text-on-surface-variant hover:text-on-surface">Risky Only</button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Clause Card 1 */}
          <div className="group bg-surface-container rounded-xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label text-error font-bold uppercase tracking-widest">High Risk · Section 14.2</span>
                  <h4 className="text-lg font-headline font-bold text-on-surface">Limitation of Liability & Indirect Damages</h4>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:rotate-180 transition-transform cursor-pointer" data-icon="expand_more">expand_more</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-on-surface-variant uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="gavel">gavel</span>
                    Original Legal Text
                  </div>
                  <p className="italic text-on-surface-variant/80 text-sm leading-relaxed border-l-2 border-outline-variant/30 pl-4">
                    "Notwithstanding anything to the contrary contained herein, in no event shall the Provider be liable to the Customer or any third party for any special, indirect, incidental, punitive, or consequential damages of any kind, including but not limited to loss of profits or data, even if Provider has been advised of the possibility of such damages."
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-primary-container uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="translate">translate</span>
                    Nyaya Plain English Analysis
                  </div>
                  <div className="bg-primary/5 p-5 rounded-lg border border-primary/10">
                    <p className="text-sm text-on-surface leading-relaxed font-medium">
                      The provider wants to avoid paying for any "hidden" or "domino effect" losses (like lost business profits) if their system fails, even if they knew it could happen. You won't be able to sue them for anything beyond the basic service credit.
                    </p>
                    <div className="mt-4 pt-4 border-t border-primary/10 flex items-center gap-3">
                      <span className="text-[10px] font-label text-primary font-bold uppercase">Recommendation:</span>
                      <span className="text-xs text-on-surface-variant">Request a 'Carve-out' for Gross Negligence and Data Breach.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-high/50 px-6 py-3 flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm" data-icon="history">history</span>Last Edited: 2d ago</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm" data-icon="policy">policy</span>Precedent: Matches 82% of NYSE Tech MSAs</span>
              </div>
              <button className="text-primary hover:underline cursor-pointer">View Precedent</button>
            </div>
          </div>
          
          {/* Clause Card 2 */}
          <div className="group bg-surface-container rounded-xl overflow-hidden border border-white/5 hover:border-secondary/20 transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label text-secondary font-bold uppercase tracking-widest">Balanced · Section 8.1</span>
                  <h4 className="text-lg font-headline font-bold text-on-surface">Intellectual Property Ownership</h4>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform cursor-pointer" data-icon="expand_more">expand_more</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-on-surface-variant uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="gavel">gavel</span>
                    Original Legal Text
                  </div>
                  <p className="italic text-on-surface-variant/80 text-sm leading-relaxed border-l-2 border-outline-variant/30 pl-4">
                    "Customer shall retain all right, title and interest in and to all Customer Data. Provider shall retain all right, title and interest in and to the Services, the Documentation, and all related technology and intellectual property rights."
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-primary-container uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="translate">translate</span>
                    Nyaya Plain English Analysis
                  </div>
                  <div className="bg-primary/5 p-5 rounded-lg border border-primary/10">
                    <p className="text-sm text-on-surface leading-relaxed font-medium">
                      You own your data; they own their software. This is a standard, fair "who owns what" split. No red flags here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Clause Card 3 */}
          <div className="group bg-surface-container rounded-xl overflow-hidden border border-white/5 hover:border-tertiary/20 transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-label text-tertiary-container font-bold uppercase tracking-widest">Medium Risk · Section 19.4</span>
                  <h4 className="text-lg font-headline font-bold text-on-surface">Governing Law & Jurisdiction</h4>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform cursor-pointer" data-icon="expand_more">expand_more</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-on-surface-variant uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="gavel">gavel</span>
                    Original Legal Text
                  </div>
                  <p className="italic text-on-surface-variant/80 text-sm leading-relaxed border-l-2 border-outline-variant/30 pl-4">
                    "This Agreement shall be governed by the laws of the State of Delaware, without regard to conflict of laws principles. The parties irrevocably consent to the exclusive jurisdiction of the courts in Wilmington, DE."
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-label text-primary-container uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm" data-icon="translate">translate</span>
                    Nyaya Plain English Analysis
                  </div>
                  <div className="bg-primary/5 p-5 rounded-lg border border-primary/10">
                    <p className="text-sm text-on-surface leading-relaxed font-medium">
                      If you ever have to sue them, you have to go to Delaware. If your company is based in India, this will be extremely expensive and logistically difficult.
                    </p>
                    <div className="mt-4 pt-4 border-t border-tertiary/20 flex items-center gap-3">
                      <span className="text-[10px] font-label text-tertiary-container font-bold uppercase">Geography Alert:</span>
                      <span className="text-xs text-on-surface-variant">Recommended shift to neutral ground like Singapore or local jurisdiction.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Interaction FAB (AI Chat) */}
        <button className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-50">
          <span className="material-symbols-outlined text-on-primary text-3xl" data-icon="psychology" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
        </button>
      </div>
    </>
  );
}
