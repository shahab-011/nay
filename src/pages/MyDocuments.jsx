import React from 'react';
import Header from '../components/Header';

export default function MyDocuments() {
  return (
    <>
      <Header title="My Documents">
        <div className="flex items-center gap-3 bg-surface-container-high py-1.5 px-3 rounded-full border border-outline-variant/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Privacy Mode</span>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20">
            <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh6EQ4ogu_H1p-1_TBjfq-gsU75QDAtNL0g3_qQl45pyl3xjqKWyUaprPYXBLJJtiKSzPnDnS7JtEP4LV0h2S8JghDCUP8_qJ5EnK0XH_NKmOl4kYf4rNXJ1w8zggl37n4uAkH3hMjZ1MALkKMeknBHNq_K0hLQdB_9SmiWc_um_ns-wOzSIj2Z9z2riscFAWv5pauR2Z5LZu60y2tQ_k1K4U7ZdaiZ7NmkoXB-X2LisgzXh6a13F31p6vveNT1wjsbhDS9EVf650"/>
          </div>
        </div>
      </Header>
      
      <div className="p-10 max-w-[1400px] mx-auto min-h-[calc(100vh-64px)]">
        {/* Page Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Legal Repository</h2>
          <p className="text-on-surface-variant font-body max-w-2xl">Access and manage your complete portfolio of digitized legal instruments and contracts with precision AI analysis.</p>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 group w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" data-icon="search">search</span>
            <input className="w-full bg-surface-container-low border-0 border-b border-outline-variant/20 focus:border-primary focus:ring-0 pl-12 pr-4 py-4 text-sm rounded-t-xl transition-all font-body text-on-surface" placeholder="Search by case name, document ID, or clause content..." type="text"/>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select className="bg-surface-container-low border-0 border-b border-outline-variant/20 focus:ring-0 py-4 px-4 text-sm rounded-t-xl text-on-surface font-label min-w-[140px]">
              <option>All Types</option>
              <option>Master Service Agreement</option>
              <option>NDA</option>
              <option>Real Estate</option>
            </select>
            <select className="bg-surface-container-low border-0 border-b border-outline-variant/20 focus:ring-0 py-4 px-4 text-sm rounded-t-xl text-on-surface font-label min-w-[140px]">
              <option>Risk Level</option>
              <option>Critical</option>
              <option>Standard</option>
              <option>Compliant</option>
            </select>
            <button className="bg-surface-container-high hover:bg-surface-container-highest p-4 rounded-xl text-primary transition-all">
              <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            </button>
          </div>
        </div>
        
        {/* Data Table Section */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl shadow-black/20 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/10">
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Document</th>
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Type</th>
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Health Score</th>
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Risk Level</th>
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Upload Date</th>
                <th className="py-5 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {/* Row 1 */}
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" data-icon="description">description</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Vendor_Master_v4.2.pdf</p>
                      <p className="text-[10px] text-on-surface-variant font-label tracking-wide">ID: NYA-2023-9021</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="bg-surface-container-highest text-secondary text-[11px] font-bold px-2 py-1 rounded tracking-wide font-label">MSA</span>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-primary"></div>
                    </div>
                    <span className="text-sm font-bold text-primary font-label">92%</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="flex items-center gap-1.5 text-primary text-[11px] font-bold font-label">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Compliant
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm text-on-surface-variant font-label">Oct 12, 2023</span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">Analyze</button>
                    <button className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Ask AI</button>
                    <button className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined" data-icon="gavel">gavel</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Non_Disclosure_Alpha.docx</p>
                      <p className="text-[10px] text-on-surface-variant font-label tracking-wide">ID: NYA-2023-8812</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="bg-surface-container-highest text-tertiary text-[11px] font-bold px-2 py-1 rounded tracking-wide font-label">NDA</span>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="w-[48%] h-full bg-error"></div>
                    </div>
                    <span className="text-sm font-bold text-error font-label">48%</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="flex items-center gap-1.5 text-error text-[11px] font-bold font-label">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Critical
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm text-on-surface-variant font-label">Sep 28, 2023</span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">Analyze</button>
                    <button className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Ask AI</button>
                    <button className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" data-icon="real_estate_agent">real_estate_agent</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Commercial_Lease_Tower_A.pdf</p>
                      <p className="text-[10px] text-on-surface-variant font-label tracking-wide">ID: NYA-2023-7455</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="bg-surface-container-highest text-secondary text-[11px] font-bold px-2 py-1 rounded tracking-wide font-label">Lease</span>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="w-[75%] h-full bg-tertiary-container"></div>
                    </div>
                    <span className="text-sm font-bold text-tertiary-container font-label">75%</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="flex items-center gap-1.5 text-tertiary-container text-[11px] font-bold font-label">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                    Standard
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm text-on-surface-variant font-label">Sep 15, 2023</span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">Analyze</button>
                    <button className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Ask AI</button>
                    <button className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-white/5 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" data-icon="shield">shield</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-surface group-hover:text-primary transition-colors">Privacy_Policy_Update.pdf</p>
                      <p className="text-[10px] text-on-surface-variant font-label tracking-wide">ID: NYA-2023-6612</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="bg-surface-container-highest text-secondary text-[11px] font-bold px-2 py-1 rounded tracking-wide font-label">Compliance</span>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-primary"></div>
                    </div>
                    <span className="text-sm font-bold text-primary font-label">88%</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="flex items-center gap-1.5 text-primary text-[11px] font-bold font-label">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Compliant
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm text-on-surface-variant font-label">Aug 30, 2023</span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">Analyze</button>
                    <button className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Ask AI</button>
                    <button className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Pagination/Footer */}
          <div className="bg-surface-container/50 px-6 py-4 flex items-center justify-between border-t border-outline-variant/5">
            <p className="text-xs text-on-surface-variant font-label">Showing <span className="text-on-surface font-bold">1-4</span> of 24 documents</p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm" data-icon="chevron_left">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-primary text-on-primary text-xs font-bold font-label">1</button>
              <button className="w-8 h-8 rounded bg-surface-container-high text-on-surface-variant text-xs font-bold font-label hover:text-primary transition-colors">2</button>
              <button className="w-8 h-8 rounded bg-surface-container-high text-on-surface-variant text-xs font-bold font-label hover:text-primary transition-colors">3</button>
              <button className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contextual Insight Card (Asymmetric Layout element) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#00C9A7]/10 to-transparent p-8 rounded-2xl border border-[#00C9A7]/10 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
                Quick Insights
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
                AI has detected <span className="text-tertiary-container font-bold">3 critical discrepancies</span> in your recent NDA uploads regarding liability limitation clauses. We recommend running a batch "Compare Analysis" to identify inconsistencies across your procurement framework.
              </p>
              <button className="mt-6 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                View Discrepancy Report
                <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </div>
            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[200px]" data-icon="analytics">analytics</span>
            </div>
          </div>
          
          <div className="bg-surface-container-high p-8 rounded-2xl border border-outline-variant/10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Storage Utilization</h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-label mb-2">
                  <span className="text-on-surface-variant">Used Space</span>
                  <span className="text-on-surface font-bold">12.4 GB / 50 GB</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="w-[24.8%] h-full bg-gradient-to-r from-primary to-primary-container"></div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">Total Files</p>
                  <p className="text-lg font-headline font-extrabold text-primary">1,204</p>
                </div>
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">Processed</p>
                  <p className="text-lg font-headline font-extrabold text-secondary">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
