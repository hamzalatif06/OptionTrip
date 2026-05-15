import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Data ──────────────────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'RUB', symbol: '₽',   name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩',   name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr',  name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł',  name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč',  name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft',  name: 'Hungarian Forint' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'UAH', symbol: '₴',   name: 'Ukrainian Hryvnia' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв',  name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn',  name: 'Croatian Kuna' },
  { code: 'RSD', symbol: 'din', name: 'Serbian Dinar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka' },
  { code: 'ILS', symbol: '₪',   name: 'Israeli Shekel' },
  { code: 'QAR', symbol: '﷼',   name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'COP', symbol: 'CO$', name: 'Colombian Peso' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso' },
];

export const COUNTRIES = [
  { code: 'US', name: 'United States',    flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom',   flag: '🇬🇧', currency: 'GBP' },
  { code: 'DE', name: 'Germany',          flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France',           flag: '🇫🇷', currency: 'EUR' },
  { code: 'IT', name: 'Italy',            flag: '🇮🇹', currency: 'EUR' },
  { code: 'ES', name: 'Spain',            flag: '🇪🇸', currency: 'EUR' },
  { code: 'PT', name: 'Portugal',         flag: '🇵🇹', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands',      flag: '🇳🇱', currency: 'EUR' },
  { code: 'BE', name: 'Belgium',          flag: '🇧🇪', currency: 'EUR' },
  { code: 'AT', name: 'Austria',          flag: '🇦🇹', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland',      flag: '🇨🇭', currency: 'CHF' },
  { code: 'SE', name: 'Sweden',           flag: '🇸🇪', currency: 'SEK' },
  { code: 'NO', name: 'Norway',           flag: '🇳🇴', currency: 'NOK' },
  { code: 'DK', name: 'Denmark',          flag: '🇩🇰', currency: 'DKK' },
  { code: 'PL', name: 'Poland',           flag: '🇵🇱', currency: 'PLN' },
  { code: 'CZ', name: 'Czech Republic',   flag: '🇨🇿', currency: 'CZK' },
  { code: 'HU', name: 'Hungary',          flag: '🇭🇺', currency: 'HUF' },
  { code: 'RO', name: 'Romania',          flag: '🇷🇴', currency: 'RON' },
  { code: 'BG', name: 'Bulgaria',         flag: '🇧🇬', currency: 'BGN' },
  { code: 'HR', name: 'Croatia',          flag: '🇭🇷', currency: 'EUR' },
  { code: 'RS', name: 'Serbia',           flag: '🇷🇸', currency: 'RSD' },
  { code: 'UA', name: 'Ukraine',          flag: '🇺🇦', currency: 'UAH' },
  { code: 'RU', name: 'Russia',           flag: '🇷🇺', currency: 'RUB' },
  { code: 'TR', name: 'Turkey',           flag: '🇹🇷', currency: 'TRY' },
  { code: 'IN', name: 'India',            flag: '🇮🇳', currency: 'INR' },
  { code: 'CN', name: 'China',            flag: '🇨🇳', currency: 'CNY' },
  { code: 'JP', name: 'Japan',            flag: '🇯🇵', currency: 'JPY' },
  { code: 'KR', name: 'South Korea',      flag: '🇰🇷', currency: 'KRW' },
  { code: 'SG', name: 'Singapore',        flag: '🇸🇬', currency: 'SGD' },
  { code: 'HK', name: 'Hong Kong',        flag: '🇭🇰', currency: 'HKD' },
  { code: 'TH', name: 'Thailand',         flag: '🇹🇭', currency: 'THB' },
  { code: 'MY', name: 'Malaysia',         flag: '🇲🇾', currency: 'MYR' },
  { code: 'ID', name: 'Indonesia',        flag: '🇮🇩', currency: 'IDR' },
  { code: 'PH', name: 'Philippines',      flag: '🇵🇭', currency: 'PHP' },
  { code: 'VN', name: 'Vietnam',          flag: '🇻🇳', currency: 'VND' },
  { code: 'AU', name: 'Australia',        flag: '🇦🇺', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand',      flag: '🇳🇿', currency: 'NZD' },
  { code: 'CA', name: 'Canada',           flag: '🇨🇦', currency: 'CAD' },
  { code: 'MX', name: 'Mexico',           flag: '🇲🇽', currency: 'MXN' },
  { code: 'BR', name: 'Brazil',           flag: '🇧🇷', currency: 'BRL' },
  { code: 'AR', name: 'Argentina',        flag: '🇦🇷', currency: 'ARS' },
  { code: 'CL', name: 'Chile',            flag: '🇨🇱', currency: 'CLP' },
  { code: 'CO', name: 'Colombia',         flag: '🇨🇴', currency: 'COP' },
  { code: 'EG', name: 'Egypt',            flag: '🇪🇬', currency: 'EGP' },
  { code: 'ZA', name: 'South Africa',     flag: '🇿🇦', currency: 'ZAR' },
  { code: 'NG', name: 'Nigeria',          flag: '🇳🇬', currency: 'NGN' },
  { code: 'KE', name: 'Kenya',            flag: '🇰🇪', currency: 'KES' },
  { code: 'SA', name: 'Saudi Arabia',     flag: '🇸🇦', currency: 'SAR' },
  { code: 'AE', name: 'UAE',              flag: '🇦🇪', currency: 'AED' },
  { code: 'QA', name: 'Qatar',            flag: '🇶🇦', currency: 'QAR' },
  { code: 'KW', name: 'Kuwait',           flag: '🇰🇼', currency: 'KWD' },
  { code: 'IL', name: 'Israel',           flag: '🇮🇱', currency: 'ILS' },
  { code: 'PK', name: 'Pakistan',         flag: '🇵🇰', currency: 'PKR' },
  { code: 'BD', name: 'Bangladesh',       flag: '🇧🇩', currency: 'BDT' },
  { code: 'GR', name: 'Greece',           flag: '🇬🇷', currency: 'EUR' },
  { code: 'FI', name: 'Finland',          flag: '🇫🇮', currency: 'EUR' },
  { code: 'IE', name: 'Ireland',          flag: '🇮🇪', currency: 'EUR' },
];

// Timezone prefix → country code (covers common ambiguous cases)
const TIMEZONE_COUNTRY = {
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'America/Honolulu': 'US', 'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR',
  'America/Fortaleza': 'BR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL',
  'America/Bogota': 'CO', 'America/Mexico_City': 'MX', 'America/Monterrey': 'MX',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Halifax': 'CA',
  'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR', 'Europe/Belgrade': 'RS', 'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA', 'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR',
  'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI', 'Europe/Dublin': 'IE',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Kolkata': 'IN', 'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE',
  'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Jerusalem': 'IL',
  'Asia/Beirut': 'LB', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ', 'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
};

// ── Auto-detection ────────────────────────────────────────────────────────────

/**
 * Detect country code from the browser timezone.
 * Timezone is location-based and is always preferred over navigator.language
 * which reflects the browser UI language setting, not the user's location
 * (e.g. a Pakistani user with en-GB browser language should still get PKR).
 */
const detectFromTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];
    // Broad prefix fallback (e.g. Asia/Unknown → IN)
    const prefix = tz.split('/')[0];
    const prefixMap = { Europe: 'DE', America: 'US', Asia: 'IN', Africa: 'ZA', Pacific: 'AU', Australia: 'AU' };
    return prefixMap[prefix] || null;
  } catch {
    return null;
  }
};

/** Last-resort: try navigator.language region tag (least reliable for currency). */
const detectFromLanguage = () => {
  const locale = navigator.language || '';
  if (locale.includes('-')) {
    const region = locale.split('-')[1].toUpperCase();
    if (COUNTRIES.find(c => c.code === region)) return region;
  }
  return null;
};

const applyCountryCode = (code, setCountryState, setCurrencyState, overrideExisting = false) => {
  const savedCountry   = localStorage.getItem('optiontrip_country');
  const savedCurrency  = localStorage.getItem('optiontrip_currency');
  if (!overrideExisting && (savedCountry || savedCurrency)) return; // respect saved preference

  const country  = COUNTRIES.find(c => c.code === code);
  if (!country) return;
  const currency = CURRENCIES.find(c => c.code === country.currency) || CURRENCIES[0];
  setCountryState(country);
  setCurrencyState(currency);
};

// ── Context ───────────────────────────────────────────────────────────────────

const LocaleContext = createContext(null);

export const LocaleProvider = ({ children }) => {
  const [country, setCountryState]   = useState(null);
  const [currency, setCurrencyState] = useState(null);

  useEffect(() => {
    const savedCountryCode  = localStorage.getItem('optiontrip_country');
    const savedCurrencyCode = localStorage.getItem('optiontrip_currency');

    // ── Step 1: Use saved user preference ONLY if explicitly set by the user ──
    // The 'optiontrip_manual' flag is written only when the user picks via CurrencySwitcher.
    // This prevents stale auto-detected values (e.g. wrong GBP) from persisting.
    const isManual = localStorage.getItem('optiontrip_manual') === '1';
    if (isManual && (savedCountryCode || savedCurrencyCode)) {
      const savedCountry  = COUNTRIES.find(c => c.code === savedCountryCode) || COUNTRIES[0];
      const savedCurrency = CURRENCIES.find(c => c.code === (savedCurrencyCode || savedCountry.currency)) || CURRENCIES[0];
      setCountryState(savedCountry);
      setCurrencyState(savedCurrency);
      return;
    }

    // ── Step 2: Timezone detection (location-based, most accurate sync method)
    const tzCode = detectFromTimezone();
    if (tzCode) {
      const country  = COUNTRIES.find(c => c.code === tzCode) || COUNTRIES[0];
      const currency = CURRENCIES.find(c => c.code === country.currency) || CURRENCIES[0];
      setCountryState(country);
      setCurrencyState(currency);
    } else {
      // Fallback to browser language (least reliable)
      const langCode = detectFromLanguage() || 'US';
      const country  = COUNTRIES.find(c => c.code === langCode) || COUNTRIES[0];
      const currency = CURRENCIES.find(c => c.code === country.currency) || CURRENCIES[0];
      setCountryState(country);
      setCurrencyState(currency);
    }

    // ── Step 3: IP geolocation (async, most accurate — refines after render) ─
    // Proxied through backend to avoid browser CORS restrictions on ipapi.co
    const GEO_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/geo/ip';
    fetch(GEO_URL)
      .then(r => r.json())
      .then(data => {
        const ipCode = data?.country_code;
        if (!ipCode) return;
        const ipCountry  = COUNTRIES.find(c => c.code === ipCode);
        if (!ipCountry) return;
        const ipCurrency = CURRENCIES.find(c => c.code === ipCountry.currency) || CURRENCIES[0];
        // Only update if the user hasn't changed anything manually yet
        if (!localStorage.getItem('optiontrip_country')) {
          setCountryState(ipCountry);
          setCurrencyState(ipCurrency);
        }
      })
      .catch(() => {}); // fail silently — timezone fallback already applied
  }, []);

  const setCountry = (countryObj, updateCurrency = true) => {
    setCountryState(countryObj);
    localStorage.setItem('optiontrip_country', countryObj.code);
    localStorage.setItem('optiontrip_manual', '1'); // user explicitly chose
    if (updateCurrency) {
      const matchedCurrency = CURRENCIES.find(c => c.code === countryObj.currency);
      if (matchedCurrency) {
        setCurrencyState(matchedCurrency);
        localStorage.setItem('optiontrip_currency', matchedCurrency.code);
      }
    }
  };

  const setCurrency = (currencyObj) => {
    setCurrencyState(currencyObj);
    localStorage.setItem('optiontrip_currency', currencyObj.code);
    localStorage.setItem('optiontrip_manual', '1'); // user explicitly chose
  };

  if (!country || !currency) return null; // wait for detection

  return (
    <LocaleContext.Provider value={{ country, currency, setCountry, setCurrency, COUNTRIES, CURRENCIES }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
};

export default LocaleContext;
