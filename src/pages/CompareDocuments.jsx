import React from 'react';
import Header from '../components/Header';

export default function CompareDocuments() {
  return (
    <>
      <Header title="Compare Documents">
        <div className="flex items-center gap-4">
          <span className="font-label text-xs tracking-wider text-slate-400">SESSION ID: NY-9921-DIFF</span>
        </div>
        <button className="bg-surface-container text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 hover:bg-primary/5 transition-all">
          Privacy Mode
        </button>
      </Header>
      
      <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-64px)]">
        {/* Document Picker Bento */}
        <section className="grid grid-cols-12 gap-6">
          {/* Source Doc */}
          <div className="col-span-12 lg:col-span-5 group">
            <div className="bg-surface-container-low rounded-2xl p-6 transition-all hover:bg-surface-container border border-transparent hover:border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-error/10 flex items-center justify-center rounded-xl text-error">
                    <span className="material-symbols-outlined" data-icon="description">description</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg">Employment_Agreement_V1.pdf</h3>
                    <p className="text-xs font-label text-slate-500 uppercase tracking-widest mt-1">BASE VERSION • 12 MAY 2024</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors cursor-pointer" data-icon="swap_horiz">swap_horiz</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-xs" data-icon="history">history</span>
                <span>Uploaded by system_admin</span>
              </div>
            </div>
          </div>
          
          {/* Comparison Stats */}
          <div className="col-span-12 lg:col-span-2 flex flex-col justify-center items-center gap-4 bg-surface-container-lowest rounded-2xl p-6">
            <div className="text-center">
              <div className="text-3xl font-headline font-extrabold text-primary">24</div>
              <div className="text-[10px] font-label text-slate-500 uppercase tracking-tighter">Total Changes</div>
            </div>
            <div className="w-full h-px bg-outline-variant/10"></div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center bg-surface-container-high rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-slate-400">ADD</span>
                <span className="text-xs font-bold text-primary">+12</span>
              </div>
              <div className="flex justify-between items-center bg-surface-container-high rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-slate-400">REM</span>
                <span className="text-xs font-bold text-error">-08</span>
              </div>
              <div className="flex justify-between items-center bg-surface-container-high rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-slate-400">MOD</span>
                <span className="text-xs font-bold text-secondary">04</span>
              </div>
            </div>
          </div>
          
          {/* Target Doc */}
          <div className="col-span-12 lg:col-span-5 group">
            <div className="bg-surface-container-low rounded-2xl p-6 transition-all hover:bg-surface-container border border-transparent hover:border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-xl text-primary">
                    <span className="material-symbols-outlined" data-icon="description">description</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg">Employment_Agreement_V2_Draft.pdf</h3>
                    <p className="text-xs font-label text-primary uppercase tracking-widest mt-1">COMPARING VERSION • 18 MAY 2024</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors cursor-pointer" data-icon="more_vert">more_vert</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-xs" data-icon="edit_note">edit_note</span>
                <span>Modified by Adv. Khanna</span>
              </div>
            </div>
          </div>
        </section>

        {/* Diff View Control Bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-semibold">
              <span className="material-symbols-outlined text-sm" data-icon="list">list</span>
              All Changes
            </button>
            <button className="flex items-center gap-2 text-slate-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
              Critical Clauses
            </button>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm" data-icon="download">download</span>
              Export PDF
            </button>
            <button className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm" data-icon="share">share</span>
              Share Comparison
            </button>
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5">
          <div className="grid grid-cols-12 bg-surface-container-high/50 font-label text-[10px] uppercase tracking-[0.2em] text-slate-500 py-3 px-8">
            <div className="col-span-1">Ref</div>
            <div className="col-span-11">Clause Comparison Content</div>
          </div>
          <div className="divide-y divide-white/5">
            {/* Clause 1 */}
            <div className="grid grid-cols-12 gap-8 p-8 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-1 font-label text-sm text-slate-600 font-bold">1.2</div>
              <div className="col-span-11 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-on-surface">Term of Engagement</h4>
                  <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Modified</span>
                </div>
                <div className="p-6 bg-surface-container rounded-2xl space-y-4 leading-relaxed text-sm">
                  <div className="bg-error/10 text-error p-2 rounded line-through">
                    The Employee shall be employed for a period of twelve (12) months starting from the Commencement Date.
                  </div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    The Employee shall be employed for an <span className="font-bold underline text-on-surface">indefinite period</span> starting from the Commencement Date, subject to termination clauses herein.
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <img className="w-5 h-5 opacity-50" alt="AI Insight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS8ggETwd2LND9mRhRliLLe8twMlX5urwoKYBiT4LAlmMWtogLyb06wT0kjAKqUlo7Vja8e4zlESwRjPrgZxbLXNYYj1ZCGL-TJIpJbZIW27_g3grY1Hj0LYC-n_ovGLRVXVYIt48qgiz30C4UQ4k1SxAbgoXiJGFYVV1hn47wJTptNGaXRMgbKo8KOhrYbg7DkZkmlDltlXIai5kBleP-INSDIpvHDvyzaKyYVC2bhJPgwywpK9RTGwycFZCTw5LGVt0D11lu8zA"/>
                  <p className="text-xs text-on-surface-variant italic">AI Insight: This change shifts the contract from a fixed-term to a permanent engagement, increasing employer liability.</p>
                </div>
              </div>
            </div>
            
            {/* Clause 2 */}
            <div className="grid grid-cols-12 gap-8 p-8 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-1 font-label text-sm text-slate-600 font-bold">4.1</div>
              <div className="col-span-11 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-on-surface">Non-Compete Clause</h4>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Added</span>
                </div>
                <div className="p-6 bg-surface-container rounded-2xl text-sm leading-relaxed">
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    4.1.2 The Employee agrees not to engage in any business activity that directly competes with the Company's core logistics operations for a period of 24 months post-termination within the territory of India.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clause 3 */}
            <div className="grid grid-cols-12 gap-8 p-8 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-1 font-label text-sm text-slate-600 font-bold">8.4</div>
              <div className="col-span-11 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-on-surface">Dispute Resolution</h4>
                  <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Removed</span>
                </div>
                <div className="p-6 bg-surface-container rounded-2xl text-sm leading-relaxed">
                  <div className="bg-error/10 text-error p-2 rounded line-through mb-4">
                    Any disputes shall be settled by the courts of Mumbai exclusively, and the laws of Maharashtra shall apply.
                  </div>
                  <div className="bg-primary/10 text-primary p-2 rounded">
                    Any disputes shall be settled through mandatory arbitration under the SIAC Rules in Singapore.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Actions */}
        <div className="flex justify-end gap-4 pb-12">
          <button className="px-8 py-3 rounded-xl bg-surface-container text-on-surface font-headline font-bold hover:bg-surface-container-high transition-all border border-white/5">
            Reject Changes
          </button>
          <button className="px-8 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
            Accept All Changes & Sync
          </button>
        </div>
      </div>
    </>
  );
}
