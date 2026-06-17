/**
 * Plan My Day Routes
 */

import express from 'express';
import { generate } from '../controllers/planMyDayController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/plan-my-day/generate
 * @desc    Generate an AI-powered day plan based on location + preferences
 * @access  Public (enhanced if authenticated — saved trips could feed preferences later)
 */
router.post('/generate', optionalAuthenticate, generate);

export default router;
