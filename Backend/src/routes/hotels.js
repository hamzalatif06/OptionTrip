import express from 'express';
import { getHotelLocations, searchHotels } from '../controllers/hotelController.js';
import { validateHotelSearch } from '../middleware/validation.js';

const router = express.Router();

// GET /api/hotels/locations?term=Paris
router.get('/locations', getHotelLocations);

// GET /api/hotels/search?cityCode=PAR&checkIn=2026-05-01&checkOut=2026-05-07&adults=2
router.get('/search', validateHotelSearch, searchHotels);

export default router;
