import express from 'express';
import { generate } from '../controllers/planMyDayController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', optionalAuthenticate, generate);

export default router;
