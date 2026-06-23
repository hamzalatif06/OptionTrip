import OpenAI from 'openai';
import { searchDestinationImage } from './unsplashService.js';

let openai = null;

const getClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const stripHtml = (html = '') =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const SYSTEM_PROMPT = `You are an image-selection assistant for a travel news website.

Read the article and determine the best visual subject for a hero image.

Return ONLY JSON:
{
  "primary_search": "",
  "fallback_searches": [],
  "entity_type": "",
  "country": "",
  "confidence": 0
}

Selection priority:
1. Famous landmark
2. Tourist attraction
3. National park
4. Beach
5. City skyline
6. Region
7. Country`;

/**
 * Uses AI to extract the best image search term from an article, then
 * searches Unsplash with primary + fallback queries until an image is found.
 */
export const getSmartHeroImage = async ({ title = '', content = '', postId = 0 }) => {
  const client = getClient();

  if (!client) {
    console.warn('⚠️ OpenAI not configured — skipping smart hero image');
    return { imageUrl: null, source: 'no-openai', searchUsed: null };
  }

  // Truncate to ~2000 chars to keep API cost minimal
  const plainText = stripHtml(content).slice(0, 2000);
  const articleText = `Title: ${title}\n\n${plainText}`;

  let searchData = { primary_search: title, fallback_searches: ['travel destination'] };

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Article:\n${articleText}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    if (parsed.primary_search) searchData = parsed;
  } catch (err) {
    console.error('❌ Blog image AI extraction failed:', err.message);
  }

  const queries = [
    searchData.primary_search,
    ...(Array.isArray(searchData.fallback_searches) ? searchData.fallback_searches : []),
  ].filter(Boolean);

  for (const query of queries) {
    const result = await searchDestinationImage(query);
    if (result.imageUrl) {
      console.log(`✅ Blog hero image found via "${query}" (postId: ${postId})`);
      return { imageUrl: result.imageUrl, source: 'unsplash', searchUsed: query };
    }
  }

  console.warn(`⚠️ No blog hero image found for postId: ${postId}`);
  return { imageUrl: null, source: 'none', searchUsed: null };
};
