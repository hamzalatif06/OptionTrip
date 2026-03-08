/**
 * Translation Service
 *
 * Calls Google Translate's free client=gtx endpoint directly from the browser.
 * - No backend proxy needed → faster, no extra failure point
 * - localStorage cache persists across sessions (instant load on repeat visits)
 * - In-memory Map for zero-latency repeat lookups within a session
 */

const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const LS_KEY = 'ot_translate_cache';
const MAX_CACHE = 3000;

// ── Cache ────────────────────────────────────────────────────────────────────

// In-memory: `${source}:${target}:${text}` → translated
const memCache = new Map();

// Load localStorage into memory on startup
try {
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  for (const [k, v] of Object.entries(stored)) memCache.set(k, v);
} catch {
  // ignore
}

const persistCache = () => {
  try {
    const obj = {};
    let n = 0;
    for (const [k, v] of memCache) {
      obj[k] = v;
      if (++n >= MAX_CACHE) break;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {
    // quota exceeded — clear old cache and retry
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }
};

// ── Google Translate call ─────────────────────────────────────────────────────

const callGoogle = async (text, source, target) => {
  const url = `${GOOGLE_URL}?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const data = await res.json();
  // Response: [ [ [translated_chunk, original], ... ], null, source ]
  return (data[0] || []).map(item => (item[0] || '')).join('').trim() || text;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Translate a single string. Returns original on error.
 */
export const translateText = async (text, targetLang, sourceLang = 'en') => {
  const t = text?.trim();
  if (!t) return text;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return text;

  const key = `${sourceLang}:${target}:${t}`;
  if (memCache.has(key)) return memCache.get(key);

  try {
    const translated = await callGoogle(t, sourceLang, target);
    memCache.set(key, translated);
    persistCache();
    return translated;
  } catch {
    return text;
  }
};

/**
 * Translate multiple strings in parallel.
 * Cached strings resolve instantly; only uncached strings hit the network.
 */
export const translateBatch = async (texts, targetLang, sourceLang = 'en') => {
  if (!texts?.length) return texts;
  const target = (targetLang || 'en').split('-')[0];
  if (target === sourceLang || target === 'en') return texts;

  const results = new Array(texts.length);
  const toFetch = [];   // { idx, text }

  for (let i = 0; i < texts.length; i++) {
    const t = texts[i]?.trim();
    const key = `${sourceLang}:${target}:${t}`;
    if (memCache.has(key)) {
      results[i] = memCache.get(key);
    } else {
      toFetch.push({ idx: i, text: t });
    }
  }

  if (toFetch.length > 0) {
    // Translate uncached strings in parallel
    await Promise.all(
      toFetch.map(async ({ idx, text }) => {
        try {
          const translated = await callGoogle(text, sourceLang, target);
          const key = `${sourceLang}:${target}:${text}`;
          memCache.set(key, translated);
          results[idx] = translated;
        } catch {
          results[idx] = texts[idx]; // fallback to original
        }
      })
    );
    persistCache();
  }

  return results;
};

/**
 * Get a cached translation without any API call.
 * Returns null if not cached.
 */
export const getCached = (text, targetLang, sourceLang = 'en') => {
  const t = text?.trim();
  if (!t) return null;
  const target = (targetLang || 'en').split('-')[0];
  const key = `${sourceLang}:${target}:${t}`;
  return memCache.has(key) ? memCache.get(key) : null;
};

/**
 * Returns true if the cache has every string in the list for this language.
 */
export const isFullyCached = (texts, targetLang, sourceLang = 'en') => {
  const target = (targetLang || 'en').split('-')[0];
  return texts.every(t => memCache.has(`${sourceLang}:${target}:${t?.trim()}`));
};

/**
 * Translate missing i18n keys.
 */
export const translateMissingKeys = async (enBundle, targetBundle, targetLang) => {
  const target = (targetLang || 'en').split('-')[0];
  if (target === 'en') return {};

  const flatten = (obj, prefix = '') =>
    Object.entries(obj).reduce((acc, [k, v]) => {
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null) Object.assign(acc, flatten(v, full));
      else acc[full] = String(v);
      return acc;
    }, {});

  const flatEn = flatten(enBundle);
  const flatTarget = flatten(targetBundle);
  const missingKeys = Object.keys(flatEn).filter(k => !flatTarget[k] || flatTarget[k] === flatEn[k]);
  if (!missingKeys.length) return {};

  const translated = await translateBatch(missingKeys.map(k => flatEn[k]), target);
  const result = {};
  missingKeys.forEach((k, i) => { result[k] = translated[i]; });
  return result;
};
