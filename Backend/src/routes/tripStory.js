import express from 'express';
import {
  createEntry,
  listMyEntries,
  listEntriesForTrip,
  listPublicEntriesNear,
  deleteEntry,
  refineEntryText,
  previewMediaLink
} from '../controllers/tripStoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createEntry);
router.get('/near', listPublicEntriesNear);
router.get('/mine', authenticate, listMyEntries);
router.get('/trip/:tripId', authenticate, listEntriesForTrip);
router.delete('/:id', authenticate, deleteEntry);
router.post('/refine-text', authenticate, refineEntryText);
router.post('/preview-link', authenticate, previewMediaLink);

export default router;
