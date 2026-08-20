import express from 'express';
import { getMemory, updateMemoryFact, forgetMemory } from '../controllers/memoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMemory);
router.patch('/', authenticate, updateMemoryFact);
router.delete('/', authenticate, forgetMemory);

export default router;
