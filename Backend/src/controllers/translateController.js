/**
 * Translation proxy controller
 * Uses Google Translate unofficial API (client=gtx) — no API key required.
 * Server-side in-memory cache avoids duplicate calls.
 * Graceful fallback: always returns original text on error.
 */

const cache = new Map(); // `${source}:${target}:${text}` → translatedText

const callGoogle = async (text, source, target) => {
  const cacheKey = `${source}:${target}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) {
    throw new Error(`Google Translate HTTP ${response.status}`);
  }

  const data = await response.json();
  // Response: [[[translated_chunk, original_chunk], ...], ...]
  const translated = (data[0] || []).map(item => item[0] || '').join('').trim() || text;
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
    const results = await Promise.all(
      texts.map(text => callGoogle(text, source, target).catch(() => text))
    );

    return res.json(Array.isArray(q)
      ? { translatedTexts: results }
      : { translatedText: results[0] }
    );
  } catch (err) {
    console.error('[translate] Error:', err.message);
    return res.json(Array.isArray(q)
      ? { translatedTexts: texts }
      : { translatedText: texts[0] }
    );
  }
};
