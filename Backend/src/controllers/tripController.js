import Trip from '../models/Trip.js';
import { generateLightweightTripOptions, generateDetailedItinerary, generateSingleDayItinerary, parseTripDescription } from '../services/openaiService.js';
import { enrichItineraryWithPlaces, enrichSingleDayWithPlaces } from '../services/placesService.js';

/**
 * PHASE 1: POST /api/trips/generate-options
 * Generate 3 lightweight trip options (FAST - no detailed itinerary)
 */
export const generateTripOptions = async (req, res) => {
  try {
    const {
      destination,
      start_date,
      end_date,
      duration_days,
      month_year,
      tripType,
      guests,
      budget,
      description,
      user_id
    } = req.body;

    // Validate required fields
    if (!destination || !start_date || !end_date || !duration_days) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['destination', 'start_date', 'end_date', 'duration_days']
      });
    }

    console.log(`📋 PHASE 1: Generating lightweight trip options for ${destination.name}...`);

    // Generate unique trip ID
    const trip_id = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // PHASE 1: Generate 3 lightweight trip options (no detailed itinerary)
    const options = await generateLightweightTripOptions({
      destination,
      start_date,
      end_date,
      duration_days,
      tripType,
      guests,
      budget,
      description
    });

    console.log(`✅ Generated ${options.length} trip options`);

    // Create trip document with options only
    const trip = new Trip({
      trip_id,
      user_id: user_id || 'guest',
      destination: {
        text: destination.text,
        place_id: destination.place_id,
        name: destination.name,
        geometry: destination.geometry
      },
      dates: {
        start_date,
        end_date,
        duration_days,
        month_year
      },
      trip_type: tripType || null,
      guests: guests || { total: 0, adults: 0, children: 0, infants: 0 },
      budget: budget || null,
      description,
      options, // Phase 1: lightweight options only
      options_generated: true,
      status: 'options_generated'
    });

    await trip.save();

    console.log(`💾 Trip saved with ID: ${trip_id}`);

    res.status(201).json({
      success: true,
      message: 'Trip options generated successfully',
      data: {
        trip_id: trip.trip_id,
        destination: trip.destination,
        dates: trip.dates,
        options: trip.options, // Return lightweight options
        status: trip.status
      }
    });

  } catch (error) {
    console.error('❌ Error in Phase 1 (generate options):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trip options',
      error: error.message
    });
  }
};

/**
 * PHASE 2: POST /api/trips/:tripId/options/:optionId/generate-itinerary
 * Generate detailed itinerary for selected option (SLOW - with places enrichment)
 */
export const generateItineraryForOption = async (req, res) => {
  try {
    const { tripId, optionId } = req.params;

    console.log(`📋 PHASE 2: Generating detailed itinerary for trip ${tripId}, option ${optionId}...`);

    // Find the trip
    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Find the selected option
    const selectedOption = trip.options.find(opt => opt.option_id === optionId);

    if (!selectedOption) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    // Check if itinerary already generated
    if (selectedOption.itinerary_generated) {
      return res.status(400).json({
        success: false,
        message: 'Itinerary already generated for this option',
        data: {
          itinerary: selectedOption.itinerary
        }
      });
    }

    // PHASE 2: Generate detailed day-by-day itinerary
    const itinerary = await generateDetailedItinerary({
      destination: trip.destination,
      start_date: trip.dates.start_date,
      end_date: trip.dates.end_date,
      duration_days: trip.dates.duration_days,
      tripType: trip.trip_type,
      guests: trip.guests,
      budget: trip.budget,
      description: trip.description,
      selectedOption
    });

    console.log(`✅ Generated ${itinerary.length} days of itinerary`);

    // Enrich itinerary with Google Places data
    console.log('📍 Enriching activities with Google Places data...');
    const enrichedItinerary = await enrichItineraryWithPlaces(itinerary, trip.destination);

    console.log('✅ Itinerary enriched with place data');

    // Update the selected option with itinerary
    selectedOption.itinerary = enrichedItinerary;
    selectedOption.itinerary_generated = true;

    // Update trip status
    trip.selected_option_id = optionId;
    trip.status = 'itinerary_generated';

    await trip.save();

    console.log(`💾 Itinerary saved for option ${optionId}`);

    res.status(200).json({
      success: true,
      message: 'Detailed itinerary generated successfully',
      data: {
        trip_id: trip.trip_id,
        option_id: optionId,
        itinerary: selectedOption.itinerary,
        status: trip.status
      }
    });

  } catch (error) {
    console.error('❌ Error in Phase 2 (generate itinerary):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate detailed itinerary',
      error: error.message
    });
  }
};

// GET /api/trips/:tripId - Get trip by ID
export const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });

  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message
    });
  }
};

// PATCH /api/trips/:tripId/select-option - Update selected option
export const selectOption = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { option_id } = req.body;

    if (!option_id) {
      return res.status(400).json({
        success: false,
        message: 'option_id is required'
      });
    }

    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Verify option exists
    const optionExists = trip.options.some(opt => opt.option_id === option_id);
    if (!optionExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option_id'
      });
    }

    // Update selected option and status
    trip.selected_option_id = option_id;
    trip.status = 'option_selected';
    await trip.save();

    res.json({
      success: true,
      message: 'Option selected successfully',
      data: {
        trip_id: trip.trip_id,
        selected_option_id: trip.selected_option_id,
        status: trip.status
      }
    });

  } catch (error) {
    console.error('Error selecting option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select option',
      error: error.message
    });
  }
};

/**
 * POST /api/trips/:tripId/save
 * Save/associate a trip with the authenticated user's account
 */
export const saveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    console.log(`💾 Saving trip ${tripId} to user ${userId}...`);

    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if trip is already saved by this user
    if (trip.user_id === userId.toString()) {
      return res.status(200).json({
        success: true,
        message: 'Trip already saved to your account',
        data: {
          trip_id: trip.trip_id,
          user_id: trip.user_id
        }
      });
    }

    // Update trip with user ID
    trip.user_id = userId;
    trip.saved_at = new Date();
    await trip.save();

    console.log(`✅ Trip ${tripId} saved to user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Trip saved successfully',
      data: {
        trip_id: trip.trip_id,
        user_id: trip.user_id,
        saved_at: trip.saved_at
      }
    });

  } catch (error) {
    console.error('Error saving trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save trip',
      error: error.message
    });
  }
};

/**
 * GET /api/trips/my-trips
 * Get authenticated user's saved trips
 */
export const getMyTrips = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0 } = req.query;

    console.log(`📋 Fetching trips for user ${userId}...`);

    const trips = await Trip.find({ user_id: userId })
      .sort({ saved_at: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-options.itinerary'); // Exclude detailed itinerary for list view

    const total = await Trip.countDocuments({ user_id: userId });

    console.log(`✅ Found ${trips.length} trips for user`);

    res.json({
      success: true,
      data: {
        trips,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });

  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your trips',
      error: error.message
    });
  }
};

// GET /api/trips/map-data — lightweight projection for travel map
export const getMapData = async (req, res) => {
  try {
    const userId = req.user._id;
    const trips  = await Trip.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('trip_id destination dates status budget description options.itinerary.activities.title options.itinerary.activities.location options.itinerary.activities.category');

    // Build a slim payload — only what the map needs
    const mapTrips = trips.map(t => ({
      trip_id:     t.trip_id,
      destination: t.destination,
      dates:       t.dates,
      status:      t.status,
      budget:      t.budget,
      description: t.description,
      options:     t.options,
    }));

    res.json({ success: true, trips: mapTrips, total: mapTrips.length });
  } catch (err) {
    console.error('Error fetching map data:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/trips/user/:userId - Get all trips for a user (public)
export const getUserTrips = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const trips = await Trip.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-options.itinerary'); // Exclude detailed itinerary for list view

    const total = await Trip.countDocuments({ user_id: userId });

    res.json({
      success: true,
      data: {
        trips,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });

  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user trips',
      error: error.message
    });
  }
};

/**
 * PHASE 2B: POST /api/trips/:tripId/options/:optionId/generate-day/:dayNumber
 * Generate a SINGLE day's itinerary (for progressive loading)
 * This enables showing Day 1 in ~3-5 seconds while other days load
 */
export const generateSingleDay = async (req, res) => {
  try {
    const { tripId, optionId, dayNumber } = req.params;
    const dayNum = parseInt(dayNumber);

    console.log(`📅 Generating Day ${dayNum} for trip ${tripId}, option ${optionId}...`);

    // Find the trip
    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Find the selected option
    const selectedOption = trip.options.find(opt => opt.option_id === optionId);

    if (!selectedOption) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    // Validate day number
    if (dayNum < 1 || dayNum > trip.dates.duration_days) {
      return res.status(400).json({
        success: false,
        message: `Invalid day number. Must be between 1 and ${trip.dates.duration_days}`
      });
    }

    // Check if this day is already generated (from cache)
    const existingDay = selectedOption.itinerary?.find(d => d.day_number === dayNum);
    if (existingDay && existingDay.activities && existingDay.activities.length > 0) {
      console.log(`✅ Day ${dayNum} already exists, returning cached version`);
      return res.status(200).json({
        success: true,
        message: `Day ${dayNum} retrieved from cache`,
        data: {
          day: existingDay,
          from_cache: true
        }
      });
    }

    // Get previously generated days for context (to avoid repetition)
    const previousDays = selectedOption.itinerary?.filter(d => d.day_number < dayNum) || [];

    // Generate single day itinerary
    const dayItinerary = await generateSingleDayItinerary({
      destination: trip.destination,
      start_date: trip.dates.start_date,
      duration_days: trip.dates.duration_days,
      tripType: trip.trip_type,
      guests: trip.guests,
      budget: trip.budget,
      description: trip.description,
      selectedOption,
      dayNumber: dayNum,
      previousDays
    });

    console.log(`✅ Generated Day ${dayNum} itinerary`);

    // Enrich with Google Places data
    console.log(`📍 Enriching Day ${dayNum} with Google Places...`);
    const enrichedDay = await enrichSingleDayWithPlaces(dayItinerary, trip.destination);

    // Sanitize activity categories to ensure they match the enum
    const validCategories = ['sightseeing', 'dining', 'adventure', 'relaxation', 'culture', 'shopping', 'transport', 'nature', 'entertainment', 'nightlife', 'beach', 'museum', 'historical', 'outdoor', 'wellness', 'sports', 'photography', 'other'];
    if (enrichedDay.activities) {
      enrichedDay.activities = enrichedDay.activities.map(activity => ({
        ...activity,
        category: validCategories.includes(activity.category?.toLowerCase())
          ? activity.category.toLowerCase()
          : 'sightseeing'
      }));
    }

    console.log(`✅ Day ${dayNum} enriched with place data`);

    // Initialize itinerary array if it doesn't exist
    if (!selectedOption.itinerary) {
      selectedOption.itinerary = [];
    }

    // Add or update this day in the itinerary
    const existingDayIndex = selectedOption.itinerary.findIndex(d => d.day_number === dayNum);
    if (existingDayIndex >= 0) {
      selectedOption.itinerary[existingDayIndex] = enrichedDay;
    } else {
      selectedOption.itinerary.push(enrichedDay);
      // Sort by day number
      selectedOption.itinerary.sort((a, b) => a.day_number - b.day_number);
    }

    // Check if all days are generated
    const allDaysGenerated = selectedOption.itinerary.length === trip.dates.duration_days;
    if (allDaysGenerated) {
      selectedOption.itinerary_generated = true;
      trip.status = 'itinerary_generated';
    }

    await trip.save();

    console.log(`💾 Day ${dayNum} saved for option ${optionId}`);

    res.status(200).json({
      success: true,
      message: `Day ${dayNum} generated successfully`,
      data: {
        day: enrichedDay,
        from_cache: false,
        all_days_complete: allDaysGenerated,
        days_generated: selectedOption.itinerary.length,
        total_days: trip.dates.duration_days
      }
    });

  } catch (error) {
    console.error(`❌ Error generating Day ${req.params.dayNumber}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to generate Day ${req.params.dayNumber}`,
      error: error.message
    });
  }
};

/**
 * GET /api/trips/:tripId/options/:optionId/day/:dayNumber
 * Get a specific day's itinerary (check cache first)
 */
export const getDayItinerary = async (req, res) => {
  try {
    const { tripId, optionId, dayNumber } = req.params;
    const dayNum = parseInt(dayNumber);

    const trip = await Trip.findOne({ trip_id: tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const selectedOption = trip.options.find(opt => opt.option_id === optionId);

    if (!selectedOption) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    const day = selectedOption.itinerary?.find(d => d.day_number === dayNum);

    if (!day) {
      return res.status(404).json({
        success: false,
        message: `Day ${dayNum} not found. Generate it first.`,
        needs_generation: true
      });
    }

    res.status(200).json({
      success: true,
      data: {
        day,
        from_cache: true
      }
    });

  } catch (error) {
    console.error('Error fetching day itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch day itinerary',
      error: error.message
    });
  }
};


/**
 * POST /api/trips/parse-description
 * Parse a natural language trip description into structured trip data
 */
export const parseTripDescriptionController = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'text is required (min 5 chars)' });
    }

    const parsed = await parseTripDescription(text.trim());

    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    console.error('❌ Error parsing trip description:', error);
    res.status(500).json({ success: false, message: 'Failed to parse description', error: error.message });
  }
};
