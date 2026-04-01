import express from 'express';
import {
  getHotelLocations,
  searchHotels,
  getHotelDetailsHandler,
  getRoomListHandler,
  getHotelPhotosHandler,
  getReviewScoresHandler,
} from '../controllers/hotelController.js';

const router = express.Router();

router.get('/locations', getHotelLocations);
router.get('/search',    searchHotels);
router.get('/details',   getHotelDetailsHandler);
router.get('/rooms',     getRoomListHandler);
router.get('/photos',    getHotelPhotosHandler);
router.get('/reviews',   getReviewScoresHandler);

export default router;
