import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="ml-[220px] pt-16 min-h-screen bg-background">
        {children}
      </main>
      
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[15%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]"></div>
      </div>
    </>
  );
}
