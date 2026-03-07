/**
 * LibreTranslate frontend service
 * - In-memory cache for the session (instant repeat lookups)
 * - localStorage cache persisted across page loads
 * - Graceful fallback: returns original text on any error
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const LS_KEY = 'ot_lt_cache';

// In-memory cache: `${source}:${target}:${text}` → translated
const memCache = new Map();

// Load localStorage cache into memory on startup
try {
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  Object.entries(stored).forEach(([k, v]) => memCache.set(k, v));
} catch {
  // ignore
}

const persistCache = () => {
  try {
    const obj = {};
    // Only persist entries from the last session (keep cache small)
    let count = 0;
    for (const [k, v] of memCache) {
      obj[k] = v;
      if (++count > 2000) break; // cap at 2000 entries
    }
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {
    // ignore quota errors
  }
};

/**
 * Translate a single string from source to target language.
 * Returns the original text if translation fails or language is 'en'.
 */
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text?.trim()) return text;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return text;

  const key = `${sourceLang}:${target}:${text}`;
  if (memCache.has(key)) return memCache.get(key);

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: sourceLang, target }),
    });

    if (!res.ok) return text;

    const data = await res.json();
    const translated = data.translatedText || text;
    memCache.set(key, translated);
    persistCache();
    return translated;
  } catch {
    return text;
  }
};

/**
 * Translate multiple strings in a single backend call.
 * Returns the original array on any failure.
 */
export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
  if (!texts?.length) return texts;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return texts;

  // Split into cached vs uncached
  const results = new Array(texts.length);
  const uncachedIndices = [];
  const uncachedTexts = [];

  texts.forEach((text, i) => {
    const key = `${sourceLang}:${target}:${text}`;
    if (memCache.has(key)) {
      results[i] = memCache.get(key);
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(text);
    }
  });

  if (uncachedTexts.length > 0) {
    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: uncachedTexts, source: sourceLang, target }),
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data.translatedTexts || uncachedTexts;
        translated.forEach((t, i) => {
          const origIndex = uncachedIndices[i];
          results[origIndex] = t;
          memCache.set(`${sourceLang}:${target}:${texts[origIndex]}`, t);
        });
        persistCache();
      } else {
        // Fallback for uncached
        uncachedIndices.forEach((origIdx, i) => {
          results[origIdx] = uncachedTexts[i];
        });
      }
    } catch {
      uncachedIndices.forEach((origIdx, i) => {
        results[origIdx] = uncachedTexts[i];
      });
    }
  }

  return results;
};

/**
 * Translate all keys from the English i18n bundle that are missing
 * in the target language bundle. Returns a flat object of key → translated value.
 */
export const translateMissingKeys = async (enBundle, targetBundle, targetLang) => {
  const target = (targetLang || 'en').split('-')[0];
  if (target === 'en') return {};

  // Flatten nested JSON object to dot-notation keys
  const flatten = (obj, prefix = '') => {
    return Object.entries(obj).reduce((acc, [k, v]) => {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) {
        Object.assign(acc, flatten(v, fullKey));
      } else {
        acc[fullKey] = String(v);
      }
      return acc;
    }, {});
  };

  const flatEn = flatten(enBundle);
  const flatTarget = flatten(targetBundle);

  // Find keys present in English but missing or empty in target
  const missingKeys = Object.keys(flatEn).filter(
    k => !flatTarget[k] || flatTarget[k] === flatEn[k]
  );

  if (missingKeys.length === 0) return {};

  const enValues = missingKeys.map(k => flatEn[k]);
  const translated = await translateBatch(enValues, target);

  const result = {};
  missingKeys.forEach((k, i) => {
    result[k] = translated[i];
  });
  return result;
};
