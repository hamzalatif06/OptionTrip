import express from 'express';
import { getCarLocations, searchCarsHandler } from '../controllers/carRentalController.js';

const router = express.Router();

// GET /api/cars/locations?query=Dubai
router.get('/locations', getCarLocations);

// GET /api/cars/search?pickUpPlaceId=...&pickUpDate=...&dropOffDate=...
router.get('/search', searchCarsHandler);

export default router;
