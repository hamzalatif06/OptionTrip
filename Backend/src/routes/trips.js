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
  getMapData,
  getVisitedLocations,
  addVisitedLocation,
  removeVisitedLocation,
  updateTripSelection,
  deleteTrip,
  renameTrip,
  suggestDestinationsController,
  markTripConfirmed,
  shareTrip,
  getSharedTrip
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

// Public shared trip view (no auth required — must be before :tripId routes)
router.get('/shared/:shareToken', getSharedTrip);

// Natural language trip description parser (used by smart textarea)
router.post('/parse-description', parseTripDescriptionController);

// AI destination suggestions based on vague query
router.post('/suggest-destinations', suggestDestinationsController);

// PHASE 1: Generate lightweight trip options (FAST)
router.post('/generate-options', validateTripGeneration, generateTripOptions);

// GET /api/trips/my-trips - Get authenticated user's saved trips (must be before :tripId routes)
router.get('/my-trips', authenticate, getMyTrips);

// GET /api/trips/map-data - Lightweight trip data for travel map (auth required)
router.get('/map-data', authenticate, getMapData);

// Visited locations
router.get('/visited-locations', authenticate, getVisitedLocations);
router.post('/visited-locations', authenticate, addVisitedLocation);
router.delete('/visited-locations/:id', authenticate, removeVisitedLocation);

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

// PATCH /api/trips/:tripId/selection - Update selected flight/hotel/car
router.patch('/:tripId/selection', authenticate, validateTripId, updateTripSelection);

// DELETE /api/trips/:tripId - Soft delete (requires auth)
router.delete('/:tripId', authenticate, validateTripId, deleteTrip);

// PATCH /api/trips/:tripId/rename - Update trip custom title (requires auth)
router.patch('/:tripId/rename',   authenticate, validateTripId, renameTrip);
router.patch('/:tripId/confirm',  authenticate, validateTripId, markTripConfirmed);
router.post('/:tripId/share',     authenticate, validateTripId, shareTrip);

export default router;
