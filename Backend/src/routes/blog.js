import express from 'express';
import { getSmartHeroImage, extractDestinations } from '../services/blogImageService.js';

const router = express.Router();

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

router.post('/extract-destinations', async (req, res) => {
  try {
    const { title = '', content = '' } = req.body;
    const result = await extractDestinations({ title, content });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('❌ /api/blog/extract-destinations error:', err.message);
    res.json({ success: true, data: { destinations: [], countries: [] } });
  }
});

export default router;
