/**
 * LibreTranslate proxy controller
 * - Server-side in-memory cache (avoids duplicate API calls)
 * - Graceful fallback: always returns original text on error
 * - Supports single string or array of strings
 */

const cache = new Map(); // `${source}:${target}:${text}` → translatedText

const LIBRE_URL = () => process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
const LIBRE_KEY = () => process.env.LIBRETRANSLATE_API_KEY || '';

const callLibre = async (text, source, target) => {
  const cacheKey = `${source}:${target}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const body = { q: text, source, target, format: 'text' };
  if (LIBRE_KEY()) body.api_key = LIBRE_KEY();

  const response = await fetch(`${LIBRE_URL()}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LibreTranslate ${response.status}: ${err}`);
  }

  const data = await response.json();
  const translated = data.translatedText || text;
  cache.set(cacheKey, translated);
  return translated;
};

export const translateText = async (req, res) => {
  const { q, source = 'en', target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: 'q and target are required' });
  }

  // Same language — return as-is
  if (source === target) {
    return res.json(Array.isArray(q)
      ? { translatedTexts: q }
      : { translatedText: q }
    );
  }

  const texts = Array.isArray(q) ? q : [q];

  try {
    // Parallelize all translations (LibreTranslate handles one string per call)
    const results = await Promise.all(
      texts.map(text => callLibre(text, source, target).catch(() => text))
    );

    return res.json(Array.isArray(q)
      ? { translatedTexts: results }
      : { translatedText: results[0] }
    );
  } catch (err) {
    console.error('[translate] LibreTranslate error:', err.message);
    // Graceful fallback — return originals
    return res.json(Array.isArray(q)
      ? { translatedTexts: texts }
      : { translatedText: texts[0] }
    );
  }
};
