import express from 'express';
import { searchFlights, getAirports, searchFlightsTravelpayouts, searchFlightsGoogleHandler, getCheapPriceHandler, exploreDestinationsHandler, searchFlightsDuffelHandler } from '../controllers/flightController.js';
import { validateFlightSearch, validateTPFlightSearch } from '../middleware/validation.js';

const router = express.Router();

// GET /api/flights/airports?keyword=Paris
router.get('/airports', getAirports);

// GET /api/flights/cheap-price?origin=KHI&destination=DXB&departDate=2026-05-01
router.get('/cheap-price', getCheapPriceHandler);

// GET /api/flights/explore?origin=LHE
router.get('/explore', exploreDestinationsHandler);

// GET /api/flights/duffel-search?origin=LHR&destination=DXB&departureDate=2026-04-15&adults=1
router.get('/duffel-search', searchFlightsDuffelHandler);

// GET /api/flights/google-search?origin=LAX&destination=JFK&departureDate=2026-04-15&adults=1
router.get('/google-search', searchFlightsGoogleHandler);

// POST /api/flights/search  (Amadeus - legacy)
router.post('/search', validateFlightSearch, searchFlights);

// GET /api/flights/tp-search  (Travelpayouts cache - legacy)
router.get('/tp-search', validateTPFlightSearch, searchFlightsTravelpayouts);

export default router;
