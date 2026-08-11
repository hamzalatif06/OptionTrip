import express from 'express';
import {
  logActivityHandler,
  getActivityContext
} from '../controllers/userActivityController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/log', optionalAuthenticate, logActivityHandler);

router.get('/context', authenticate, getActivityContext);

export default router;
