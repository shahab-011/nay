export const CURRENCIES = {
  INR: { symbol: '₹',   locale: 'en-IN', name: 'Indian Rupee (₹)' },
  USD: { symbol: '$',   locale: 'en-US', name: 'US Dollar ($)' },
  GBP: { symbol: '£',   locale: 'en-GB', name: 'British Pound (£)' },
  EUR: { symbol: '€',   locale: 'de-DE', name: 'Euro (€)' },
  AED: { symbol: 'AED ',locale: 'ar-AE', name: 'UAE Dirham (AED)' },
  PKR: { symbol: '₨',   locale: 'en-PK', name: 'Pakistani Rupee (₨)' },
  SGD: { symbol: 'S$',  locale: 'en-SG', name: 'Singapore Dollar (S$)' },
  AUD: { symbol: 'A$',  locale: 'en-AU', name: 'Australian Dollar (A$)' },
  CAD: { symbol: 'C$',  locale: 'en-CA', name: 'Canadian Dollar (C$)' },
  BDT: { symbol: '৳',   locale: 'bn-BD', name: 'Bangladeshi Taka (৳)' },
  LKR: { symbol: 'Rs',  locale: 'si-LK', name: 'Sri Lankan Rupee (Rs)' },
  NPR: { symbol: 'Rs',  locale: 'ne-NP', name: 'Nepali Rupee (Rs)' },
  MYR: { symbol: 'RM',  locale: 'ms-MY', name: 'Malaysian Ringgit (RM)' },
  ZAR: { symbol: 'R',   locale: 'en-ZA', name: 'South African Rand (R)' },
};

const STORAGE_KEY = 'firm_currency';
const CHANGE_EVENT = 'firm_currency_changed';

export function getStoredCurrency() {
  return localStorage.getItem(STORAGE_KEY) || 'INR';
}

export function setStoredCurrency(code) {
  localStorage.setItem(STORAGE_KEY, code);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getCurrencySymbol(code) {
  return CURRENCIES[code]?.symbol ?? code;
}

export function formatMoney(amount, currencyCode) {
  const meta = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const num = parseFloat(amount) || 0;
  return meta.symbol + num.toLocaleString(meta.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export { CHANGE_EVENT };
