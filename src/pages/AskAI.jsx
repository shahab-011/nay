import React from 'react';
import Header from '../components/Header';

export default function AskAI() {
  return (
    <>
      <Header title="Ask AI">
        <div className="flex items-center gap-4 mr-6">
          <div className="px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary" data-icon="description">description</span>
            <span className="text-sm font-label text-on-surface-variant">Master_Service_Agreement_v4.pdf</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <span className="material-symbols-outlined text-[18px] text-primary" data-icon="security" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
          <span className="text-xs font-bold text-primary tracking-tight">Privacy Mode</span>
        </div>
      </Header>
      
      <div className="flex flex-col h-[calc(100vh-64px)] relative bg-surface">
        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto px-12 py-8 space-y-8 max-w-5xl mx-auto w-full">
          {/* AI Message */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C9A7] to-[#762f00] flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-white" data-icon="psychology" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
            </div>
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className="bg-surface-container-low p-6 rounded-2xl rounded-tl-none border border-outline-variant/5 shadow-sm">
                <p className="text-on-surface leading-relaxed font-body">
                  Greetings. I have analyzed the <span className="text-primary font-semibold">Master_Service_Agreement_v4.pdf</span>. How can I assist your legal review today? I can summarize key liabilities, check for non-compete compliance, or flag potential jurisdictional risks.
                </p>
              </div>
              <span className="text-[10px] font-label text-on-surface-variant/60 ml-1 uppercase tracking-widest">Nyaya AI • Just now</span>
            </div>
          </div>
          
          {/* User Message */}
          <div className="flex gap-6 items-start justify-end">
            <div className="flex flex-col gap-2 max-w-[85%] items-end">
              <div className="bg-primary p-6 rounded-2xl rounded-tr-none shadow-[0_4px_20px_rgba(0,201,167,0.2)]">
                <p className="text-on-primary font-medium font-body">
                  What are my primary indemnification obligations under Clause 14?
                </p>
              </div>
              <span className="text-[10px] font-label text-on-surface-variant/60 mr-1 uppercase tracking-widest">You • 2 mins ago</span>
            </div>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 border-primary/20">
              <img className="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWaSxgZ8OE77bsgOe4sWO-bldBqQi0IHlpy7BAjGf7t6vgdIU34DFY9YTCJb5uQnVppIxiKwS1yJOWSUQm8GXAOdw3qC9ruc7-UjB8qqBq53ym7NsAzldKmdcg6XFxQimko7dFIZeOE5_23-HEBR7YKanE7IuejfhsI7meN-R6O551O3qXx4b_i80JtAu6q0xjy5mgzkeNpHT1XeX5bfrSjlIieSWvpqZ66cPZqjcjneR3nuREcdLpfWVy82b8avzaPB1LH8RYwRo"/>
            </div>
          </div>
          
          {/* AI Message: Detailed Response */}
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C9A7] to-[#762f00] flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-white" data-icon="psychology" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
            </div>
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className="bg-surface-container-low p-6 rounded-2xl rounded-tl-none border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-sm" data-icon="gavel">gavel</span>
                  <h3 className="font-headline font-bold text-primary tracking-tight">Clause 14 Analysis</h3>
                </div>
                <p className="text-on-surface leading-relaxed font-body mb-4">
                  Under Clause 14.2 (Liability & Indemnity), your obligations are significant:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container p-4 rounded-xl border-l-4 border-primary">
                    <p className="text-xs font-label text-on-surface-variant mb-1 uppercase tracking-wider">Intellectual Property</p>
                    <p className="text-sm font-medium">Full indemnity for third-party IP infringement claims arising from deliverables.</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-xl border-l-4 border-tertiary-container">
                    <p className="text-xs font-label text-on-surface-variant mb-1 uppercase tracking-wider">Data Breach</p>
                    <p className="text-sm font-medium">Liability for regulatory fines resulting from unauthorized data access.</p>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]" data-icon="error">error</span>
                  <p className="text-xs text-on-surface/80">
                    <strong className="text-primary">Observation:</strong> The current draft lacks a "Cap on Indemnity," which is standard in 65% of similar MSAs in our database. Would you like me to draft a limitation of liability clause?
                  </p>
                </div>
              </div>
              <div className="flex gap-4 ml-1">
                <button className="flex items-center gap-1 text-[10px] font-label text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[14px]" data-icon="thumb_up">thumb_up</span> Helpful
                </button>
                <button className="flex items-center gap-1 text-[10px] font-label text-on-surface-variant hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[14px]" data-icon="content_copy">content_copy</span> Copy
                </button>
                <button className="flex items-center gap-1 text-[10px] font-label text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[14px]" data-icon="refresh">refresh</span> Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Input Section */}
        <div className="w-full bg-[#000b2f]/50 backdrop-blur-2xl border-t border-white/5 p-8">
          <div className="max-w-5xl mx-auto w-full">
            {/* Quick Suggestions Chips */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
              <button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-xs font-medium text-on-surface-variant transition-all whitespace-nowrap flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary" data-icon="bolt">bolt</span>
                What are my termination rights?
              </button>
              <button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-xs font-medium text-on-surface-variant transition-all whitespace-nowrap flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary" data-icon="history">history</span>
                Summarize last 5 changes
              </button>
              <button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-xs font-medium text-on-surface-variant transition-all whitespace-nowrap flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary" data-icon="shield_with_heart">shield_with_heart</span>
                Verify force majeure clause
              </button>
              <button className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-xs font-medium text-on-surface-variant transition-all whitespace-nowrap flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary" data-icon="edit_note">edit_note</span>
                Redraft Section 4.2
              </button>
            </div>
            
            {/* Chat Input Field */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative bg-surface-container-low border border-outline-variant/20 rounded-2xl p-2 flex flex-col">
                <textarea className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 p-4 resize-none min-h-[60px] font-body outline-none" placeholder="Ask Nyaya anything about your document..."></textarea>
                <div className="flex justify-between items-center px-4 py-2 border-t border-white/5">
                  <div className="flex gap-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined" data-icon="attach_file">attach_file</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined" data-icon="mic">mic</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined" data-icon="image">image</span>
                    </button>
                  </div>
                  <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-xl font-bold font-headline flex items-center gap-2 hover:shadow-[0_0_20px_rgba(68,229,194,0.3)] transition-all active:scale-95">
                    Send 
                    <span className="material-symbols-outlined text-[18px]" data-icon="send">send</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-[14px]" data-icon="verified_user">verified_user</span>
                <span className="text-[10px] font-label uppercase tracking-widest">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-[14px]" data-icon="auto_awesome">auto_awesome</span>
                <span className="text-[10px] font-label uppercase tracking-widest">Llama-3 Legal Model</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
