import express from 'express';

const router = express.Router();

// Simple in-memory cache — 30 minutes
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 30 * 60 * 1000;

router.get('/latest', async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
      return res.json(cache.data);
    }

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return res.status(500).json({ error: 'YOUTUBE_CHANNEL_ID not set in environment' });
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);

    if (!response.ok) {
      throw new Error(`RSS fetch failed with status ${response.status}`);
    }

    const xml = await response.text();

    // Extract first video entry fields
    const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titles = xml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/g);
    const publishedMatch = xml.match(/<published>([^<]+)<\/published>/);

    if (!videoIdMatch) {
      throw new Error('No video entries found in RSS feed');
    }

    const videoId = videoIdMatch[1];
    // Index 0 is channel title, index 1 is first video title
    const rawTitle = titles?.[1] || '';
    const title = rawTitle
      .replace(/<title><!\[CDATA\[/, '')
      .replace(/\]\]><\/title>/, '')
      .replace(/<\/?title>/g, '')
      .trim();

    const published = publishedMatch?.[1] || null;
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const data = { videoId, title, published, thumbnail };
    cache = { data, timestamp: Date.now() };

    res.json(data);
  } catch (error) {
    console.error('YouTube RSS error:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest YouTube video' });
  }
});

export default router;
