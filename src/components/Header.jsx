import React from 'react';

export default function Header({ title, children }) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-220px)] h-16 z-40 bg-[#000f3b]/50 backdrop-blur-md flex justify-between items-center px-8">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-lg font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {children}
        <div className="flex items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors" data-icon="dark_mode">dark_mode</span>
          <div className="relative">
            <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors" data-icon="notifications">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
          </div>
        </div>
        <div className="h-6 w-px bg-white/10 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-on-surface">Adv. Vikram Singh</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Senior Partner</div>
          </div>
          <img 
            className="w-10 h-10 rounded-full border-2 border-primary-container/20" 
            alt="User Profile" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE-C7yh6QUM1VU-2MoEEwTYMXFyeUIGJ_aqicLRsk-9kouEjunR6YRi4z1qB5SUO1Pnf4xMQbqiIPRRwJXxQPE_dFg9zafJHJSQqYUBQSngb8YyFOyjYeDnHKHiwr62czyEUS8vojJWrumc196tHI5mNyO_wlnTZIvfYEGxZae0hfFE3S_j0o-HdkFHw8rnD8SPgly1twVM9MVpDxU5xKi2H7d6Ws2ZJm8aymYxBKQwmqa7NZS88hVea29WLEjJH_1Knyh-CckRwM"
          />
        </div>
      </div>
    </header>
  );
}
