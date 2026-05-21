import { useState, useEffect, useCallback } from 'react';
import {
  formatMoney,
  getCurrencySymbol,
  getStoredCurrency,
  CHANGE_EVENT,
} from '../utils/currency';

export function useCurrency() {
  const [code, setCode] = useState(getStoredCurrency);

  useEffect(() => {
    const sync = () => setCode(getStoredCurrency());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const fmt = useCallback((n) => formatMoney(n, code), [code]);

  return {
    currency: code,
    symbol:   getCurrencySymbol(code),
    fmt,
  };
}
