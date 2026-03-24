import express from 'express';
import { searchFlights, getAirports } from '../controllers/flightController.js';
import { validateFlightSearch } from '../middleware/validation.js';

const router = express.Router();

// GET /api/flights/airports?keyword=Paris
router.get('/airports', getAirports);

// POST /api/flights/search
router.post('/search', validateFlightSearch, searchFlights);

export default router;
