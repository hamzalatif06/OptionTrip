/**
 * Trips API Service
 * Handles trip generation, retrieval, and management
 */

import { refreshAccessToken, getAccessToken as getStoredToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Make authenticated fetch request with automatic token refresh
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {string} token - Access token
 * @returns {Promise} Fetch response
 */
const authenticatedFetch = async (url, options = {}, token) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
  };

  let response = await fetch(url, config);

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      const newToken = getStoredToken();
      config.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, config);
    }
  }

  return response;
};

/**
 * PHASE 1: Generate lightweight trip options (FAST - ~10 seconds)
 * @param {Object} tripData - Trip generation parameters
 * @returns {Promise} Generated trip with 3 lightweight options (NO detailed itinerary)
 */
export const generateTripOptions = async (tripData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/generate-options`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating trip options (Phase 1):', error);
    throw error;
  }
};

/**
 * PHASE 2: Generate detailed itinerary for selected option (SLOW - ~30 seconds)
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID to generate itinerary for
 * @returns {Promise} Detailed itinerary with Google Places data
 */
export const generateItineraryForOption = async (tripId, optionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/options/${optionId}/generate-itinerary`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating detailed itinerary (Phase 2):', error);
    throw error;
  }
};

/**
 * Get trip by ID
 * @param {string} tripId - The trip ID
 * @returns {Promise} Trip data with iterations
 */
export const getTripById = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
};

/**
 * Select a trip option (marks user's choice)
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID to select
 * @returns {Promise} Updated trip data
 */
export const selectTripOption = async (tripId, optionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/select-option`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ option_id: optionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error selecting option:', error);
    throw error;
  }
};

/**
 * Save/associate a trip with a user account
 * @param {string} tripId - The trip ID to save
 * @param {string} token - User's access token
 * @returns {Promise} Saved trip data
 */
export const saveTrip = async (tripId, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/${tripId}/save`,
      { method: 'POST' },
      token
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
};

/**
 * Get all trips for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Query options (limit, skip)
 * @returns {Promise} List of trips
 */
export const getUserTrips = async (userId, options = {}) => {
  try {
    const { limit = 10, skip = 0 } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user trips:', error);
    throw error;
  }
};

/**
 * Get current authenticated user's saved trips
 * @param {string} token - User's access token
 * @param {Object} options - Query options (limit, skip)
 * @returns {Promise} List of user's saved trips
 */
export const getMyTrips = async (token, options = {}) => {
  try {
    const { limit = 20, skip = 0 } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/my-trips?${queryParams}`,
      { method: 'GET' },
      token
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching my trips:', error);
    throw error;
  }
};

/**
 * PHASE 2B: Generate single day itinerary (PROGRESSIVE - ~3-5 seconds per day)
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 * @param {number} dayNumber - The day number to generate (1-based)
 * @returns {Promise} Single day itinerary with Google Places data
 */
export const generateSingleDayItinerary = async (tripId, optionId, dayNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/options/${optionId}/generate-day/${dayNumber}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error generating Day ${dayNumber} itinerary:`, error);
    throw error;
  }
};

/**
 * Get specific day itinerary (check cache first)
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 * @param {number} dayNumber - The day number (1-based)
 * @returns {Promise} Single day itinerary
 */
export const getDayItinerary = async (tripId, optionId, dayNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/options/${optionId}/day/${dayNumber}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Return needs_generation flag instead of throwing
      if (errorData.needs_generation) {
        return { success: false, needs_generation: true };
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching Day ${dayNumber}:`, error);
    throw error;
  }
};

/**
 * Generate all days progressively (SEQUENTIAL - Day 1 first, then Day 2, etc.)
 * Generates days one-by-one in order, calls onDayComplete callback as each day finishes
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 * @param {number} totalDays - Total number of days
 * @param {Function} onDayComplete - Callback when a day is completed (dayNumber, dayData)
 * @param {Function} onAllComplete - Callback when all days are completed
 * @param {Function} onError - Callback when an error occurs (dayNumber, error)
 * @returns {Promise} Resolves when all days are generated
 */
export const generateAllDaysProgressively = async (
  tripId,
  optionId,
  totalDays,
  onDayComplete,
  onAllComplete,
  onError
) => {
  const completedDays = [];
  const results = [];

  // Generate days SEQUENTIALLY - Day 1 first, then Day 2, etc.
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    try {
      console.log(`🚀 Starting generation for Day ${dayNum}...`);
      const response = await generateSingleDayItinerary(tripId, optionId, dayNum);

      if (response.success && response.data?.day) {
        completedDays.push(response.data.day);
        onDayComplete?.(dayNum, response.data.day, response.data.from_cache);
        results.push(response);
      } else {
        console.error(`Day ${dayNum} response unsuccessful:`, response);
        onError?.(dayNum, new Error('Unsuccessful response'));
        results.push({ success: false, dayNumber: dayNum });
      }
    } catch (error) {
      console.error(`Failed to generate Day ${dayNum}:`, error);
      onError?.(dayNum, error);
      results.push({ success: false, dayNumber: dayNum, error });
      // Continue to next day even if this one fails
    }
  }

  // Sort completed days by day number (should already be sorted, but just in case)
  completedDays.sort((a, b) => a.day_number - b.day_number);

  // Call completion callback
  onAllComplete?.(completedDays, results);

  return {
    success: true,
    days: completedDays,
    results
  };
};

/**
 * Check local storage cache for trip itinerary
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 * @returns {Object|null} Cached itinerary data or null
 */
export const getCachedItinerary = (tripId, optionId) => {
  try {
    const cacheKey = `trip_itinerary_${tripId}_${optionId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is still valid (24 hours)
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
    }
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Save itinerary to local storage cache
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 * @param {Array} days - Array of day itineraries
 */
export const setCachedItinerary = (tripId, optionId, days) => {
  try {
    const cacheKey = `trip_itinerary_${tripId}_${optionId}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: days
    }));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

/**
 * Clear cached itinerary
 * @param {string} tripId - The trip ID
 * @param {string} optionId - The option ID
 */
export const clearCachedItinerary = (tripId, optionId) => {
  try {
    const cacheKey = `trip_itinerary_${tripId}_${optionId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export default {
  generateTripOptions,
  generateItineraryForOption,
  getTripById,
  selectTripOption,
  saveTrip,
  getUserTrips,
  getMyTrips,
  generateSingleDayItinerary,
  getDayItinerary,
  generateAllDaysProgressively,
  getCachedItinerary,
  setCachedItinerary,
  clearCachedItinerary,
};
