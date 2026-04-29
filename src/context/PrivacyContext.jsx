import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [isPrivate, setIsPrivate] = useState(() => {
    const stored = localStorage.getItem('nyaya_privacy_mode');
    return stored === null ? true : stored === 'true'; // default: private
  });

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      localStorage.setItem('nyaya_privacy_mode', String(next));
      return next;
    });
  };

  // Clear any temporary session data when the tab closes
  useEffect(() => {
    const handleUnload = () => sessionStorage.clear();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used inside PrivacyProvider');
  return ctx;
};
