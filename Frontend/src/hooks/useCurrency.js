import { useLocale } from '../contexts/LocaleContext';

/**
 * Approximate exchange rates relative to USD.
 * These are static estimates — good enough for trip cost display
 * since backend prices are already estimates.
 */
export const RATES_FROM_USD = {
  USD: 1,       EUR: 0.92,    GBP: 0.79,    JPY: 149,     CNY: 7.24,
  AUD: 1.53,    CAD: 1.36,    CHF: 0.89,    INR: 83.2,    RUB: 91,
  BRL: 4.97,    MXN: 17.2,    KRW: 1330,    SGD: 1.34,    HKD: 7.82,
  NOK: 10.5,    SEK: 10.4,    DKK: 6.9,     PLN: 3.97,    CZK: 22.9,
  HUF: 356,     TRY: 30.7,    AED: 3.67,    SAR: 3.75,    ZAR: 18.7,
  THB: 35.1,    MYR: 4.68,    IDR: 15700,   PHP: 56.5,    VND: 24500,
  EGP: 30.9,    UAH: 37.8,    RON: 4.57,    BGN: 1.8,     HRK: 7.05,
  RSD: 108,     NZD: 1.63,    PKR: 279,     BDT: 110,     ILS: 3.72,
  QAR: 3.64,    KWD: 0.307,   NGN: 1400,    KES: 131,     COP: 3950,
  ARS: 820,     CLP: 895,
};

/**
 * Convert a USD amount to the target currency.
 */
export const convertFromUSD = (usdAmount, currencyCode) => {
  const rate = RATES_FROM_USD[currencyCode] ?? 1;
  return Math.round(usdAmount * rate);
};

/**
 * useCurrency hook — returns a formatPrice(usdAmount) function
 * that converts and formats amounts in the user's selected currency.
 */
const useCurrency = () => {
  const { currency } = useLocale();

  const formatPrice = (usdAmount) => {
    if (usdAmount === null || usdAmount === undefined) return null;
    const num = typeof usdAmount === 'string' ? parseFloat(usdAmount.replace(/[^0-9.]/g, '')) : usdAmount;
    if (isNaN(num)) return null;
    if (num === 0) return 'Free';

    const converted = convertFromUSD(num, currency.code);
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(converted);
    } catch {
      return `${currency.symbol}${converted.toLocaleString()}`;
    }
  };

  /**
   * Format a price that is in a specific source currency (e.g. EUR from Hotelbeds, USD from GF).
   * Converts source → USD → user currency.
   */
  const formatPriceFromCurrency = (amount, fromCurrency = 'USD') => {
    if (amount === null || amount === undefined) return null;
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount;
    if (isNaN(num) || num === 0) return formatPrice(0);
    const fromRate = RATES_FROM_USD[fromCurrency] ?? 1;
    const usdAmount = num / fromRate; // convert source → USD
    return formatPrice(usdAmount);    // then USD → user currency
  };

  return { formatPrice, formatPriceFromCurrency, currency };
};

export default useCurrency;
