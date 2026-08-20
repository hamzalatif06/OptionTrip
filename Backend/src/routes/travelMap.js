import express from 'express';
import { shareTravelMap, getPublicTravelMap, getTravelMapShareCard } from '../controllers/travelMapController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/share', authenticate, shareTravelMap);
router.get('/:token/card.svg', getTravelMapShareCard);
router.get('/:token', getPublicTravelMap);

export default router;
