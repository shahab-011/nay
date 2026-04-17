import React from 'react';
import Header from '../components/Header';

export default function ContractLifecycle() {
  return (
    <>
      <Header title="NyayaAI" />
      
      <div className="pt-8 pl-8 pr-8 pb-8 bg-surface min-h-[calc(100vh-64px)]">
        {/* Top: Mini Stats Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-low p-6 rounded-xl border-b border-transparent hover:bg-surface-container transition-all group">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-1">Active Contracts</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-white font-headline tracking-tight">124</h3>
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">verified_user</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-b border-transparent hover:bg-surface-container transition-all group">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-1">Expiring Soon</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-tertiary-container font-headline tracking-tight">12</h3>
              <span className="material-symbols-outlined text-tertiary-container group-hover:scale-110 transition-transform">schedule</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-b border-transparent hover:bg-surface-container transition-all group">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-1">Expired (30d)</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-error font-headline tracking-tight">08</h3>
              <span className="material-symbols-outlined text-error group-hover:scale-110 transition-transform">event_busy</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-b border-transparent hover:bg-surface-container transition-all group">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pending Review</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-secondary font-headline tracking-tight">45</h3>
              <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">pending_actions</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Vertical Milestone Timeline */}
          <section className="col-span-1 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-xl p-8 h-fit">
              <h4 className="font-headline text-lg font-semibold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">timeline</span>
                System Milestones
              </h4>
              <div className="relative space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/30">
                {/* Milestone 1 */}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10 shadow-[0_0_15px_rgba(68,229,194,0.4)]">
                    <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                  </div>
                  <h5 className="font-headline font-bold text-white text-sm">Contract Generation</h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">AI-drafted MSA for Client X completed using standard templates. Clause 4.2 flagged for manual review.</p>
                  <span className="font-label text-[10px] text-primary/60 mt-2 block uppercase tracking-tighter">Completed Oct 12, 14:30</span>
                </div>
                {/* Milestone 2 */}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-secondary flex items-center justify-center z-10 border-4 border-surface-container-low">
                  </div>
                  <h5 className="font-headline font-bold text-white text-sm">Legal Review Phase</h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Assigned to Senior Counsel. Identifying potential liabilities in the indemnity section.</p>
                  <span className="font-label text-[10px] text-secondary/60 mt-2 block uppercase tracking-tighter">In Progress • Est. 4h</span>
                </div>
                {/* Milestone 3 */}
                <div className="relative pl-10 opacity-50">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center z-10 border-4 border-surface-container-low">
                  </div>
                  <h5 className="font-headline font-bold text-white text-sm">Counter-party Negotiation</h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Awaiting external feedback portal access. Digital handshake pending.</p>
                </div>
                {/* Milestone 4 */}
                <div className="relative pl-10 opacity-50">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center z-10 border-4 border-surface-container-low">
                  </div>
                  <h5 className="font-headline font-bold text-white text-sm">Execution & Archival</h5>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Smart-contract triggering and long-term legal vault storage.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-label font-bold text-slate-500 uppercase">Analysis Engine</span>
                <span className="text-xs text-primary font-bold">98.2% Accurate</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[98%]"></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic">NyayaAI is currently monitoring 1,240 clauses across all active documents.</p>
            </div>
          </section>

          {/* Right: Status Table */}
          <section className="col-span-1 lg:col-span-8 space-y-6">
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="px-8 py-6 flex items-center justify-between bg-white/5">
                <h4 className="font-headline text-lg font-semibold">Live Monitoring Table</h4>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-surface-container text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                  </button>
                  <button className="p-2 rounded-lg bg-surface-container text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">search</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                  <thead className="bg-surface-container-low font-label text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-8 py-4 font-medium">Document ID</th>
                      <th className="px-4 py-4 font-medium">Agreement Type</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Counter-party</th>
                      <th className="px-4 py-4 font-medium">Next Event</th>
                      <th className="px-8 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-label font-medium text-primary">NYA-2023-091</td>
                      <td className="px-4 py-5 text-white font-medium">Master Services Agmt</td>
                      <td className="px-4 py-5">
                        <span className="bg-[#00c9a7]/10 text-[#00C9A7] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </td>
                      <td className="px-4 py-5 text-slate-400">Vertex Global Ltd.</td>
                      <td className="px-4 py-5 text-slate-300">Dec 15, 2024</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-label font-medium text-primary">NYA-2023-114</td>
                      <td className="px-4 py-5 text-white font-medium">Non-Disclosure Agmt</td>
                      <td className="px-4 py-5">
                        <span className="bg-tertiary-container/10 text-tertiary-container px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Expiring</span>
                      </td>
                      <td className="px-4 py-5 text-slate-400">Cyberdyne Systems</td>
                      <td className="px-4 py-5 text-tertiary-container font-medium italic">In 3 Days</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-label font-medium text-primary">NYA-2023-042</td>
                      <td className="px-4 py-5 text-white font-medium">Employment Contract</td>
                      <td className="px-4 py-5">
                        <span className="bg-secondary/10 text-secondary px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Pending</span>
                      </td>
                      <td className="px-4 py-5 text-slate-400">R. Shankar (HR)</td>
                      <td className="px-4 py-5 text-slate-300">Pending Sign</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-label font-medium text-primary">NYA-2022-882</td>
                      <td className="px-4 py-5 text-white font-medium">Vendor Lease Agmt</td>
                      <td className="px-4 py-5">
                        <span className="bg-error/10 text-error px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Expired</span>
                      </td>
                      <td className="px-4 py-5 text-slate-400">PropTech Realty</td>
                      <td className="px-4 py-5 text-slate-500">Oct 01, 2023</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 font-label font-medium text-primary">NYA-2024-002</td>
                      <td className="px-4 py-5 text-white font-medium">License Agreement</td>
                      <td className="px-4 py-5">
                        <span className="bg-[#00c9a7]/10 text-[#00C9A7] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </td>
                      <td className="px-4 py-5 text-slate-400">OpenAI Inc.</td>
                      <td className="px-4 py-5 text-slate-300">Jan 12, 2025</td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-white/5">
                <div className="relative z-10">
                  <h5 className="font-headline font-bold text-white mb-2">Renewal Intelligence</h5>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">AI predicts 8 renewals will require negotiation based on market volatility in Clause 9.</p>
                  <button className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Prediction Report <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl text-primary">bolt</span>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-white/5">
                <div className="relative z-10">
                  <h5 className="font-headline font-bold text-white mb-2">Compliance Guard</h5>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">No regulatory shifts detected for existing master agreements in this jurisdiction.</p>
                  <button className="text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    Safety Audit Logs <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl text-secondary">verified</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
