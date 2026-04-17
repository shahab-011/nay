import React from 'react';
import Header from '../components/Header';

export default function UploadDocument() {
  return (
    <>
      <Header title="Upload Document">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <span className="material-symbols-outlined text-primary text-sm" data-icon="security" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
          <span className="text-primary text-[11px] font-bold tracking-wider uppercase font-label">Privacy Mode</span>
        </div>
      </Header>
      
      <div className="max-w-6xl mx-auto p-10">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-white mb-4">Secure Document Intake</h1>
          <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
            Upload your legal documents for hyper-accurate AI analysis. All processing is encrypted and handled locally within your browser session.
          </p>
        </div>
        
        {/* Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload & Config */}
          <div className="lg:col-span-7 space-y-8">
            {/* Upload Zone */}
            <div className="group relative bg-surface-container-low rounded-2xl p-12 border-2 border-dashed border-outline-variant hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform mx-auto">
                  <span className="material-symbols-outlined text-primary text-4xl" data-icon="upload_file">upload_file</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-white mb-2">Drop your file here</h3>
                <p className="text-on-surface-variant font-body">Support for PDF, DOCX, and TXT (Max 50MB)</p>
                <div className="mt-8 flex justify-center gap-3">
                  <button className="px-6 py-2.5 bg-surface-container-high text-on-surface rounded-lg font-medium border border-outline-variant hover:bg-surface-container-highest transition-colors">
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
            
            {/* Dropdowns Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-label text-on-surface-variant ml-1">Document Type</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-low border-b border-outline-variant/20 focus:border-primary focus:ring-0 text-on-surface py-3 px-4 rounded-t-xl appearance-none cursor-pointer">
                    <option>Service Agreement</option>
                    <option>Non-Disclosure Agreement (NDA)</option>
                    <option>Employment Contract</option>
                    <option>Lease Deed</option>
                    <option>Consultancy Agreement</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" data-icon="expand_more">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-label text-on-surface-variant ml-1">Jurisdiction</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-low border-b border-outline-variant/20 focus:border-primary focus:ring-0 text-on-surface py-3 px-4 rounded-t-xl appearance-none cursor-pointer">
                    <option>Central / Union Laws</option>
                    <option>Maharashtra</option>
                    <option>Delhi NCR</option>
                    <option>Karnataka</option>
                    <option>Tamil Nadu</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" data-icon="location_on">location_on</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Status & Options */}
          <div className="lg:col-span-5 space-y-8">
            {/* Privacy Card */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-primary/30 shadow-[0_0_20px_rgba(68,229,194,0.05)]">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <span className="material-symbols-outlined text-primary" data-icon="shield_lock" style={{fontVariationSettings: "'FILL' 1"}}>shield_lock</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-white mb-1">Privacy Mode Active</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Your data never leaves this machine. We use on-device vectorization and confidential computing to ensure 100% data sovereignty.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Analysis Options */}
            <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
              <h4 className="font-headline font-bold text-white mb-6">Analysis Configuration</h4>
              <div className="space-y-5">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Risk Detection</span>
                    <span className="text-[12px] text-on-surface-variant">Flag unfavorable clauses & liabilities</span>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Plain Language Summary</span>
                    <span className="text-[12px] text-on-surface-variant">Translate legalese into simple English</span>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between group opacity-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Compliance Check</span>
                    <span className="text-[12px] text-on-surface-variant">Cross-ref with latest IPC/BNS updates</span>
                  </div>
                  <div className="w-12 h-6 bg-surface-container-highest rounded-full relative cursor-pointer border border-outline-variant">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-outline rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Auto-Redaction</span>
                    <span className="text-[12px] text-on-surface-variant">Mask PII before analysis</span>
                  </div>
                  <div className="w-12 h-6 bg-surface-container-highest rounded-full relative cursor-pointer border border-outline-variant">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-outline rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Primary Action */}
            <button className="w-full h-16 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-extrabold text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined" data-icon="bolt" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
              Analyze Document
            </button>
          </div>
        </div>
        
        {/* Trust Badges / Footer Info */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-40 grayscale">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" data-icon="verified_user">verified_user</span>
            <span className="text-xs font-label font-bold tracking-widest uppercase">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" data-icon="lock">lock</span>
            <span className="text-xs font-label font-bold tracking-widest uppercase">AES-256 Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" data-icon="cloud_off">cloud_off</span>
            <span className="text-xs font-label font-bold tracking-widest uppercase">Offline First Architecture</span>
          </div>
        </div>
      </div>
    </>
  );
}
