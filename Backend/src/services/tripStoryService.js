import OpenAI from 'openai';

let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};
const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const PLATFORM_PATTERNS = [
  { platform: 'youtube', re: /(?:youtube\.com|youtu\.be)/i },
  { platform: 'tiktok', re: /tiktok\.com/i },
  { platform: 'instagram', re: /instagram\.com/i },
  { platform: 'facebook', re: /facebook\.com|fb\.watch/i },
  { platform: 'twitter', re: /twitter\.com|x\.com/i }
];

export const detectMediaPlatform = (url) => {
  const match = PLATFORM_PATTERNS.find(p => p.re.test(url));
  return match?.platform || 'other';
};

const OEMBED_ENDPOINTS = {
  youtube: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  tiktok: (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
};

export const fetchMediaPreview = async (url) => {
  const platform = detectMediaPlatform(url);
  const buildEndpoint = OEMBED_ENDPOINTS[platform];
  if (!buildEndpoint) return { platform, previewTitle: null, previewThumbnail: null };

  try {
    const res = await fetch(buildEndpoint(url));
    if (!res.ok) return { platform, previewTitle: null, previewThumbnail: null };
    const data = await res.json();
    return {
      platform,
      previewTitle: data.title || null,
      previewThumbnail: data.thumbnail_url || null
    };
  } catch {
    return { platform, previewTitle: null, previewThumbnail: null };
  }
};

export const geocodePlace = async (query) => {
  if (!query?.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'OptionTrip/1.0 (travel planning app)' } }
    );
    if (!res.ok) return null;
    const results = await res.json();
    const first = results?.[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch (err) {
    console.warn('Nominatim geocode failed:', err.message);
    return null;
  }
};

export const refineText = async (text, mode) => {
  const client = getOpenAIClient();
  if (!client) return text;

  const instruction = mode === 'improve_style'
    ? 'Rewrite this short travel tip to be more vivid and engaging, keeping it truthful and no longer than the original. Keep it first-person and casual.'
    : 'Fix the grammar and punctuation of this short travel tip. Keep the meaning, tone, and length as close to the original as possible.';

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: `${instruction} Respond with ONLY the rewritten text, no quotes, no explanation.` },
        { role: 'user', content: text }
      ],
      temperature: mode === 'improve_style' ? 0.7 : 0.2,
      max_tokens: 300
    });
    return completion.choices[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.error('refineText error:', err.message);
    return text;
  }
};

export default { detectMediaPlatform, fetchMediaPreview, geocodePlace, refineText };
