import express from 'express';
import { searchFlights, getAirports, searchFlightsTravelpayouts, searchFlightsGoogleHandler, getCheapPriceHandler, exploreDestinationsHandler, searchFlightsDuffelHandler, getDestinationImageHandler, getPlaceImageHandler, getPlaceImagesBatchHandler, getCacheStatsHandler, clearPlaceImageCacheHandler } from '../controllers/flightController.js';
import { validateFlightSearch, validateTPFlightSearch } from '../middleware/validation.js';

const router = express.Router();

// GET /api/flights/airports?keyword=Paris
router.get('/airports', getAirports);

// GET /api/flights/cheap-price?origin=KHI&destination=DXB&departDate=2026-05-01
router.get('/cheap-price', getCheapPriceHandler);

// GET /api/flights/explore?origin=LHE
router.get('/explore', exploreDestinationsHandler);

// GET /api/flights/destination-image?query=Dubai (DEPRECATED - use /place-image)
router.get('/destination-image', getDestinationImageHandler);

// NEW: GET /api/flights/place-image?placeName=Dubai (Google Places with DB caching)
router.get('/place-image', getPlaceImageHandler);

// NEW: POST /api/flights/place-images-batch (Batch fetch with DB caching)
router.post('/place-images-batch', getPlaceImagesBatchHandler);

// NEW: GET /api/flights/cache-stats (Cache statistics)
router.get('/cache-stats', getCacheStatsHandler);

// DELETE /api/flights/cache-clear (Wipe all cached place images)
router.delete('/cache-clear', clearPlaceImageCacheHandler);

// GET /api/flights/duffel-search?origin=LHR&destination=DXB&departureDate=2026-04-15&adults=1
router.get('/duffel-search', searchFlightsDuffelHandler);

// GET /api/flights/google-search?origin=LAX&destination=JFK&departureDate=2026-04-15&adults=1
router.get('/google-search', searchFlightsGoogleHandler);

// POST /api/flights/search  (Amadeus - legacy)
router.post('/search', validateFlightSearch, searchFlights);

// GET /api/flights/tp-search  (Travelpayouts cache - legacy)
router.get('/tp-search', validateTPFlightSearch, searchFlightsTravelpayouts);

export default router;
