import express from 'express';
import {
  generateTripOptions,
  generateItineraryForOption,
  getTripById,
  selectOption,
  saveTrip,
  getMyTrips,
  getUserTrips,
  generateSingleDay,
  getDayItinerary,
  parseTripDescriptionController,
  getMapData
} from '../controllers/tripController.js';
import {
  validateTripGeneration,
  validateTripId,
  validateOptionSelection
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * PROGRESSIVE LOADING API ARCHITECTURE
 *
 * PHASE 1 (FAST): Generate lightweight trip options
 * POST /api/trips/generate-options
 * Returns: 3 trip options with NO detailed itinerary
 *
 * PHASE 2 (SLOW - ALL AT ONCE): Generate detailed itinerary for selected option
 * POST /api/trips/:tripId/options/:optionId/generate-itinerary
 * Returns: Detailed day-by-day itinerary with Google Places data
 *
 * PHASE 2B (PROGRESSIVE - DAY BY DAY): Generate single day itinerary
 * POST /api/trips/:tripId/options/:optionId/generate-day/:dayNumber
 * Returns: Single day itinerary with Google Places data (~3-5 seconds per day)
 */

// Natural language trip description parser (used by smart textarea)
router.post('/parse-description', parseTripDescriptionController);

// PHASE 1: Generate lightweight trip options (FAST)
router.post('/generate-options', validateTripGeneration, generateTripOptions);

// GET /api/trips/my-trips - Get authenticated user's saved trips (must be before :tripId routes)
router.get('/my-trips', authenticate, getMyTrips);

// GET /api/trips/map-data - Lightweight trip data for travel map (auth required)
router.get('/map-data', authenticate, getMapData);

// GET /api/trips/user/:userId - Get all trips for a user (public)
router.get('/user/:userId', getUserTrips);

// PHASE 2: Generate detailed itinerary for selected option (SLOW - all at once)
router.post('/:tripId/options/:optionId/generate-itinerary', validateTripId, generateItineraryForOption);

// PHASE 2B: Generate single day itinerary (PROGRESSIVE - one day at a time)
router.post('/:tripId/options/:optionId/generate-day/:dayNumber', validateTripId, generateSingleDay);

// GET specific day itinerary (check cache)
router.get('/:tripId/options/:optionId/day/:dayNumber', validateTripId, getDayItinerary);

// GET /api/trips/:tripId - Get trip by ID
router.get('/:tripId', validateTripId, getTripById);

// PATCH /api/trips/:tripId/select-option - Select an option
router.patch('/:tripId/select-option', validateTripId, validateOptionSelection, selectOption);

// POST /api/trips/:tripId/save - Save trip to user account (requires auth)
router.post('/:tripId/save', authenticate, validateTripId, saveTrip);

export default router;
