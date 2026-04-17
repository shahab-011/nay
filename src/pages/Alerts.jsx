import React from 'react';
import Header from '../components/Header';

export default function Alerts() {
  return (
    <>
      <Header title="Alerts Center">
        <div className="flex items-center gap-4 mr-6">
          <span className="font-label text-xs text-slate-400 tracking-wider uppercase">Latest Updates</span>
        </div>
        <button className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-bold text-primary border border-primary/20 hover:bg-primary/10 transition-all">
          Privacy Mode
        </button>
      </Header>
      
      <div className="min-h-[calc(100vh-64px)] bg-surface relative overflow-hidden">
        {/* Main Canvas */}
        <div className="max-w-5xl mx-auto p-12 relative z-10">
          {/* Header Section */}
          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 font-headline">Notifications</h1>
              <div className="flex items-center gap-2 font-label">
                <span className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full font-bold">4 UNREAD</span>
                <span className="text-slate-500 text-sm">Action items requiring your immediate review.</span>
              </div>
            </div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-medium pb-2 group font-body">
              <span className="material-symbols-outlined text-lg" data-icon="done_all">done_all</span>
              Mark all read
            </button>
          </div>
          
          {/* Bento Notification Grid */}
          <div className="space-y-4 font-body">
            {/* Unread: Expiry Warning (High Priority) */}
            <div className="group relative overflow-hidden bg-primary/5 border-l-4 border-primary rounded-xl p-6 transition-all hover:bg-primary/10 hover:translate-x-1 cursor-pointer">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container text-2xl shadow-lg shadow-primary/20">
                  ⏳
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Contract Expiry Warning
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    </h3>
                    <span className="font-label text-xs text-primary font-bold">2m ago</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-3">Master Service Agreement with <span className="text-primary-fixed">Indus-Tech Solutions</span> is set to expire in 15 days. No renewal notice detected.</p>
                  <div className="flex gap-3">
                    <button className="bg-primary text-on-primary-container text-xs px-4 py-1.5 rounded-lg font-bold hover:scale-105 transition-transform">Draft Renewal</button>
                    <button className="bg-white/5 text-slate-300 text-xs px-4 py-1.5 rounded-lg font-bold hover:bg-white/10 transition-colors">View Document</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Unread: Compliance Failure */}
            <div className="group relative overflow-hidden bg-primary/5 border-l-4 border-primary rounded-xl p-6 transition-all hover:bg-primary/10 hover:translate-x-1 cursor-pointer">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-on-error-container text-2xl shadow-lg shadow-error/20">
                  ⚖️
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Compliance Failure Detected
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    </h3>
                    <span className="font-label text-xs text-primary font-bold">1h ago</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">Recent updates to <span className="text-tertiary">SEBI Regulations</span> have rendered Clause 14.2 of your current Employment By-laws non-compliant.</p>
                </div>
              </div>
            </div>
            
            {/* Read: Risk Detection */}
            <div className="group relative overflow-hidden bg-surface-container-low border-l-4 border-transparent rounded-xl p-6 transition-all hover:bg-surface-container hover:translate-x-1 cursor-pointer">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
                  ⚠️
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-200">New Risk Profile Generated</h3>
                    <span className="font-label text-xs text-slate-500">4h ago</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">NyayaAI identified 'High' indemnity risk in the Vendor Agreement draft uploaded by the HR department.</p>
                </div>
              </div>
            </div>
            
            {/* Unread: Alert */}
            <div className="group relative overflow-hidden bg-primary/5 border-l-4 border-primary rounded-xl p-6 transition-all hover:bg-primary/10 hover:translate-x-1 cursor-pointer">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container text-2xl shadow-lg shadow-secondary/20">
                  🚀
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Batch Analysis Complete
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    </h3>
                    <span className="font-label text-xs text-primary font-bold">6h ago</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">Batch #824 (12 documents) has been successfully processed. 3 anomalies were flagged for review.</p>
                </div>
              </div>
            </div>
            
            {/* Read: Generic Notification */}
            <div className="group relative overflow-hidden bg-surface-container-low border-l-4 border-transparent rounded-xl p-6 transition-all hover:bg-surface-container hover:translate-x-1 cursor-pointer">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
                  📫
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-200">Legal Newsletter: June 2024</h3>
                    <span className="font-label text-xs text-slate-500">Yesterday</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">Summary of the Supreme Court's latest ruling on Data Privacy and how it affects your storage policies.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Meta */}
          <div className="mt-12 flex flex-col md:flex-row gap-8 items-center justify-between border-t border-white/5 pt-8 font-body">
            <div className="flex gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Smart Filter</p>
                  <p className="text-sm font-medium">Filtering 2 low-priority alerts</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary" data-icon="verified_user">verified_user</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">System Status</p>
                  <p className="text-sm font-medium">All engines operational</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-label mb-2 uppercase">Need more control?</p>
              <button className="text-primary font-bold text-sm hover:underline underline-offset-4">Configure notification preferences</button>
            </div>
          </div>
        </div>

        {/* Visual Background Elements */}
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-20 right-[10%] w-[300px] h-[300px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>
      </div>
    </>
  );
}
