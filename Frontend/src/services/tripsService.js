import { refreshAccessToken, getAccessToken as getStoredToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = getStoredToken();
      config.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, config);
    }
  }

  return response;
};

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
    }
  }

  completedDays.sort((a, b) => a.day_number - b.day_number);

  onAllComplete?.(completedDays, results);

  return {
    success: true,
    days: completedDays,
    results
  };
};

export const getCachedItinerary = (tripId, optionId) => {
  try {
    const cacheKey = `trip_itinerary_${tripId}_${optionId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
      localStorage.removeItem(cacheKey);
    }
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

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

export const clearCachedItinerary = (tripId, optionId) => {
  try {
    const cacheKey = `trip_itinerary_${tripId}_${optionId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const parseTripDescription = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips/parse-description`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing trip description:', error);
    throw error;
  }
};

export const getMapData = async (token) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/trips/map-data`, { method: 'GET' }, token);
    if (!response.ok) throw new Error('Failed to fetch map data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching map data:', error);
    throw error;
  }
};

export const getVisitedLocations = async (token) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/trips/visited-locations`, { method: 'GET' }, token);
    if (!response.ok) throw new Error('Failed to fetch visited locations');
    return await response.json();
  } catch (error) {
    console.error('Error fetching visited locations:', error);
    throw error;
  }
};

export const addVisitedLocation = async (locationData, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/visited-locations`,
      { method: 'POST', body: JSON.stringify(locationData) },
      token
    );
    if (!response.ok) throw new Error('Failed to add visited location');
    return await response.json();
  } catch (error) {
    console.error('Error adding visited location:', error);
    throw error;
  }
};

export const removeVisitedLocation = async (id, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/visited-locations/${id}`,
      { method: 'DELETE' },
      token
    );
    if (!response.ok) throw new Error('Failed to remove visited location');
    return await response.json();
  } catch (error) {
    console.error('Error removing visited location:', error);
    throw error;
  }
};

export const updateTripSelection = async (tripId, selectionData, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/${tripId}/selection`,
      { method: 'PATCH', body: JSON.stringify(selectionData) },
      token
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('updateTripSelection error:', error);
    throw error;
  }
};

export const deleteTrip = async (tripId, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/${tripId}`,
      { method: 'DELETE' },
      token
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('deleteTrip error:', error);
    throw error;
  }
};

export const renameTrip = async (tripId, customTitle, token) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/trips/${tripId}/rename`,
      { method: 'PATCH', body: JSON.stringify({ customTitle }) },
      token
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('renameTrip error:', error);
    throw error;
  }
};

export const confirmTrip = async (tripId, token) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/trips/${tripId}/confirm`,
    { method: 'PATCH' },
    token
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export const shareTrip = async (tripId, token) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/trips/${tripId}/share`,
    { method: 'POST' },
    token
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export const getSharedTrip = async (shareToken) => {
  const response = await fetch(`${API_BASE_URL}/api/trips/shared/${shareToken}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
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
  parseTripDescription,
  updateTripSelection,
  deleteTrip,
  renameTrip,
};
