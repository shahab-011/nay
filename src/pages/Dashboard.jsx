import React from 'react';
import Header from '../components/Header';

export default function Dashboard() {
  return (
    <>
      <Header title="Dashboard Overview">
        <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors" data-icon="security">security</span>
      </Header>
      
      {/* Dashboard Body */}
      <div className="p-8 space-y-8">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat Card 1 */}
          <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl" data-icon="folder_open">folder_open</span>
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Documents</div>
            <div className="text-4xl font-bold font-[Space_Grotesk] text-primary-container">1,284</div>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary">
              <span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
              <span>12% from last month</span>
            </div>
          </div>
          
          {/* Stat Card 2 */}
          <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl" data-icon="verified_user">verified_user</span>
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Health Score</div>
            <div className="text-4xl font-bold font-[Space_Grotesk] text-on-surface">94.2<span className="text-xl text-slate-500">%</span></div>
            <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-container h-full w-[94%]"></div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl" data-icon="gavel">gavel</span>
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Risks Found</div>
            <div className="text-4xl font-bold font-[Space_Grotesk] text-error">28</div>
            <div className="mt-4 flex items-center gap-2 text-xs text-error">
              <span className="material-symbols-outlined text-sm" data-icon="report">report</span>
              <span>4 High priority items</span>
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl" data-icon="alarm_on">alarm_on</span>
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Expiring Soon</div>
            <div className="text-4xl font-bold font-[Space_Grotesk] text-tertiary-container">09</div>
            <div className="mt-4 flex items-center gap-2 text-xs text-tertiary-container">
              <span className="material-symbols-outlined text-sm" data-icon="calendar_month">calendar_month</span>
              <span>Next 30 days</span>
            </div>
          </div>
        </div>

        {/* 2-Column Middle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents List */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl p-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-xl font-bold font-[Epilogue] tracking-tight">Recent Documents</h2>
                <p className="text-slate-500 text-sm">Latest legal filings and analysis reports</p>
              </div>
              <button className="text-primary-container text-sm font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {/* Doc Item */}
              <div className="group flex items-center justify-between p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#000b2f] flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined" data-icon="article">article</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Employment_Contract_V4.pdf</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-[Space_Grotesk]">Labor Law</span>
                      <span className="text-[10px] text-slate-500">Modified 2h ago</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-tighter">Health</div>
                    <div className="font-[Space_Grotesk] text-primary font-bold">98%</div>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
                </div>
              </div>
              {/* Doc Item */}
              <div className="group flex items-center justify-between p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#000b2f] flex items-center justify-center text-tertiary-container">
                    <span className="material-symbols-outlined" data-icon="gavel">gavel</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">NDA_Reliance_Industries.docx</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-[Space_Grotesk]">NDA</span>
                      <span className="text-[10px] text-slate-500">Modified 5h ago</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-tighter">Health</div>
                    <div className="font-[Space_Grotesk] text-tertiary-container font-bold">64%</div>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
                </div>
              </div>
              {/* Doc Item */}
              <div className="group flex items-center justify-between p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#000b2f] flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined" data-icon="description">description</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Lease_Agreement_CyberCity.pdf</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-[Space_Grotesk]">Real Estate</span>
                      <span className="text-[10px] text-slate-500">Modified 1d ago</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-tighter">Health</div>
                    <div className="font-[Space_Grotesk] text-primary font-bold">82%</div>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Summary Panel */}
          <div className="bg-surface-container rounded-xl p-8">
            <h2 className="text-xl font-bold font-[Epilogue] tracking-tight mb-2">Risk Summary</h2>
            <p className="text-slate-500 text-sm mb-8">Active exposure across portfolio</p>
            <div className="space-y-6">
              <div className="p-4 rounded-xl border-l-4 border-error bg-error/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-error uppercase tracking-widest">Critical Severity</span>
                  <span className="font-[Space_Grotesk] font-bold text-error">04</span>
                </div>
                <p className="text-sm text-slate-200">Indemnity clauses exceeding liability caps found in 4 SaaS agreements.</p>
              </div>
              <div className="p-4 rounded-xl border-l-4 border-tertiary-container bg-tertiary-container/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-tertiary-container uppercase tracking-widest">Medium Severity</span>
                  <span className="font-[Space_Grotesk] font-bold text-tertiary-container">12</span>
                </div>
                <p className="text-sm text-slate-200">Non-compete durations exceed local regulatory guidelines in Delhi region.</p>
              </div>
              <div className="p-4 rounded-xl border-l-4 border-primary bg-primary/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Low Severity</span>
                  <span className="font-[Space_Grotesk] font-bold text-primary">22</span>
                </div>
                <p className="text-sm text-slate-200">Missing electronic signature timestamps on 22 historical documents.</p>
              </div>
            </div>
            <button className="w-full mt-8 py-3 rounded-lg border border-outline-variant/30 text-sm font-semibold hover:bg-white/5 transition-colors">
              Generate Risk Report
            </button>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* Compliance Status Panel */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold font-[Epilogue] tracking-tight">Compliance Tracking</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] text-primary font-bold uppercase">Live Audit</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-[Space_Grotesk] mb-1">
                  <span className="text-slate-400">GDPR Compliance</span>
                  <span className="text-primary">88%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[88%]"></div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <span className="material-symbols-outlined text-sm" data-icon="check_circle" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <span>12 of 14 controls passed</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high p-4 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-300">Data Privacy</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] rounded font-bold uppercase">Pass</span>
                </div>
                <div className="bg-surface-container-high p-4 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-300">Anti-Bribery</span>
                  <span className="px-2 py-1 bg-tertiary-container/20 text-tertiary-container text-[10px] rounded font-bold uppercase">Warn</span>
                </div>
                <div className="bg-surface-container-high p-4 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-300">Labor Laws</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] rounded font-bold uppercase">Pass</span>
                </div>
                <div className="bg-surface-container-high p-4 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-300">Intellectual Prop.</span>
                  <span className="px-2 py-1 bg-error/20 text-error text-[10px] rounded font-bold uppercase">Fail</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Timeline */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-white/5">
            <h3 className="text-lg font-bold font-[Epilogue] tracking-tight mb-8">Upcoming Legal Deadlines</h3>
            <div className="relative space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {/* Deadline Item */}
              <div className="relative pl-8 group">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary-container border-4 border-[#000f3b] z-10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">Lease Renewal: Cyber Hub Phase 2</div>
                    <div className="text-xs text-slate-500 mt-1">Real Estate | Regional Office</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary font-[Space_Grotesk]">Nov 12, 2023</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">In 4 Days</div>
                  </div>
                </div>
              </div>
              {/* Deadline Item */}
              <div className="relative pl-8 group">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-tertiary-container border-4 border-[#000f3b] z-10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">Regulatory Filing: SEBI Compliance</div>
                    <div className="text-xs text-slate-500 mt-1">Corporate Law | Annual Disclosure</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-tertiary-container font-[Space_Grotesk]">Nov 28, 2023</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">In 20 Days</div>
                  </div>
                </div>
              </div>
              {/* Deadline Item */}
              <div className="relative pl-8 group">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-700 border-4 border-[#000f3b] z-10"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">Contract Expiry: AWS Enterprise Support</div>
                    <div className="text-xs text-slate-500 mt-1">Vendor Mgmt | Tech Services</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 font-[Space_Grotesk]">Dec 15, 2023</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">In 37 Days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
