/**
 * User Activity Routes
 */

import express from 'express';
import {
  logActivityHandler,
  getActivityContext
} from '../controllers/userActivityController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Anonymous calls are accepted but no-op'd (returns skipped: true).
router.post('/log', optionalAuthenticate, logActivityHandler);

// Greeting summary — requires sign-in.
router.get('/context', authenticate, getActivityContext);

export default router;
