import { createContext, useContext, useState } from 'react';

const MobileMenuContext = createContext({
  isOpen: false,
  open:   () => {},
  close:  () => {},
  toggle: () => {},
});

export function MobileMenuProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileMenuContext.Provider value={{
      isOpen,
      open:   () => setIsOpen(true),
      close:  () => setIsOpen(false),
      toggle: () => setIsOpen(p => !p),
    }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export const useMobileMenu = () => useContext(MobileMenuContext);
