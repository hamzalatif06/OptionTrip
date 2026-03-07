import express from 'express';
import { translateText } from '../controllers/translateController.js';

const router = express.Router();

// POST /api/translate — proxy to LibreTranslate with server-side caching
router.post('/', translateText);

export default router;
