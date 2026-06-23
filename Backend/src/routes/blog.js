import express from 'express';
import { getSmartHeroImage } from '../services/blogImageService.js';

const router = express.Router();

/**
 * POST /api/blog/hero-image
 * Body: { title: string, content: string, postId: number }
 * Response: { imageUrl: string|null, source: string, searchUsed: string|null }
 *
 * Uses AI to extract the best travel image search term from article content,
 * then searches Unsplash. Falls back gracefully to null (frontend handles it).
 */
router.post('/hero-image', async (req, res) => {
  try {
    const { title = '', content = '', postId = 0 } = req.body;
    const result = await getSmartHeroImage({ title, content, postId });
    res.json(result);
  } catch (err) {
    console.error('❌ /api/blog/hero-image error:', err.message);
    res.status(500).json({ imageUrl: null, source: 'error', searchUsed: null });
  }
});

export default router;
