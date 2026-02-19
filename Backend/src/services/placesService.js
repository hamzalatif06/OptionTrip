/**
 * Google Places Service
 * Handles location enrichment with Google Places API
 */

import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

/**
 * Enrich activity with Google Places data (photos, rating, location)
 * Uses Text Search API as specified - NO Unsplash, only Google Places photos
 * @param {string} placeQuery - Search query for the place (name only from AI)
 * @param {object} destination - Destination with lat/lng for location bias
 * @returns {object} Place details including photo URL, location, rating
 */
export const enrichActivityWithPlaces = async (placeQuery, destination) => {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not configured, using default data');
      return null;
    }

    // Use Text Search API to find the place
    const searchResponse = await client.textSearch({
      params: {
        query: placeQuery,
        location: destination?.geometry ?
          `${destination.geometry.lat},${destination.geometry.lng}` : undefined,
        radius: 5000, // 5km radius for location bias
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.warn(`No place found for query: ${placeQuery}`);
      return null;
    }

    const place = searchResponse.data.results[0];

    // Generate photo URL ONLY if photo exists (NO Unsplash fallback)
    let photoUrl = '';
    if (place.photos && place.photos.length > 0) {
      const photoReference = place.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    }
    // If no photo, leave empty string (frontend will use local fallback)

    return {
      name: place.name,
      address: place.formatted_address,
      location: {
        name: place.name,
        coordinates: {
          lat: place.geometry?.location?.lat || 0,
          lng: place.geometry?.location?.lng || 0
        }
      },
      rating: place.rating || 0,
      image: photoUrl, // Empty string if no photo available
      place_id: place.place_id,
      types: place.types || []
    };

  } catch (error) {
    console.error(`Error enriching place "${placeQuery}":`, error.message);
    return null;
  }
};

/**
 * Batch enrich multiple activities with Places data
 * @param {Array} activities - Array of activities with placeQuery
 * @param {object} destination - Destination for location bias
 * @returns {Array} Enriched activities
 */
export const batchEnrichActivities = async (activities, destination) => {
  const enrichedActivities = [];

  for (const activity of activities) {
    try {
      if (!activity.placeQuery) {
        console.warn('Activity missing placeQuery:', activity.title);
        enrichedActivities.push(activity);
        continue;
      }

      const placeData = await enrichActivityWithPlaces(activity.placeQuery, destination);

      if (placeData) {
        enrichedActivities.push({
          ...activity,
          location: placeData.location,
          image: placeData.image || activity.image,
          rating: placeData.rating || activity.rating,
          address: placeData.address,
          place_id: placeData.place_id
        });
      } else {
        // Keep original activity if enrichment fails
        enrichedActivities.push(activity);
      }

      // Rate limiting: wait 100ms between requests to avoid quota issues
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error processing activity "${activity.title}":`, error.message);
      enrichedActivities.push(activity);
    }
  }

  return enrichedActivities;
};

/**
 * Get place details by place ID
 * @param {string} placeId - Google Place ID
 * @returns {object} Detailed place information
 */
export const getPlaceDetails = async (placeId) => {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'user_ratings_total',
          'photos',
          'opening_hours',
          'website',
          'formatted_phone_number',
          'types',
          'price_level'
        ],
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.result) {
      const place = response.data.result;

      let photoUrl = '';
      if (place.photos && place.photos.length > 0) {
        const photoReference = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      }

      return {
        name: place.name,
        address: place.formatted_address,
        location: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng
        },
        rating: place.rating,
        ratingsTotal: place.user_ratings_total,
        image: photoUrl,
        openingHours: place.opening_hours,
        website: place.website,
        phone: place.formatted_phone_number,
        types: place.types,
        priceLevel: place.price_level
      };
    }

    return null;

  } catch (error) {
    console.error('Error getting place details:', error.message);
    throw error;
  }
};

/**
 * Search for places near a location
 * @param {string} query - Search query
 * @param {object} location - {lat, lng}
 * @param {number} radius - Search radius in meters (default: 5000)
 * @returns {Array} Array of places
 */
export const searchNearbyPlaces = async (query, location, radius = 5000) => {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const response = await client.textSearch({
      params: {
        query,
        location: `${location.lat},${location.lng}`,
        radius,
        key: process.env.GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map(place => {
        let photoUrl = '';
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        }

        return {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: {
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng
          },
          rating: place.rating,
          image: photoUrl,
          types: place.types,
          priceLevel: place.price_level
        };
      });
    }

    return [];

  } catch (error) {
    console.error('Error searching nearby places:', error.message);
    throw error;
  }
};

/**
 * PHASE 2: Enrich entire itinerary with Google Places data
 * Takes an itinerary array and enriches all activities with place data
 * @param {Array} itinerary - Array of day objects with activities
 * @param {object} destination - Destination for location bias
 * @returns {Array} Enriched itinerary
 */
export const enrichItineraryWithPlaces = async (itinerary, destination) => {
  const enrichedItinerary = [];

  for (const day of itinerary) {
    const enrichedActivities = [];

    for (const activity of day.activities) {
      try {
        if (!activity.place_name) {
          console.warn(`Activity missing place_name: ${activity.title}`);
          enrichedActivities.push(activity);
          continue;
        }

        // Enrich activity with Google Places data
        const placeData = await enrichActivityWithPlaces(activity.place_name, destination);

        if (placeData) {
          enrichedActivities.push({
            ...activity,
            location: placeData.location,
            image: placeData.image || activity.image || '',
            rating: placeData.rating || activity.rating || 0,
            address: placeData.address || activity.address || '',
            place_id: placeData.place_id || activity.place_id || ''
          });
        } else {
          // Keep original activity if enrichment fails
          enrichedActivities.push(activity);
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error enriching activity "${activity.title}":`, error.message);
        enrichedActivities.push(activity);
      }
    }

    // Calculate day total cost
    const dayTotalCost = enrichedActivities.reduce((sum, act) => sum + (act.cost || 0), 0);

    enrichedItinerary.push({
      ...day,
      activities: enrichedActivities,
      total_cost: dayTotalCost
    });
  }

  return enrichedItinerary;
};

/**
 * PHASE 2B: Enrich a SINGLE day's itinerary with Google Places data
 * Used for progressive loading - enriches one day at a time
 * @param {object} day - Single day object with activities
 * @param {object} destination - Destination for location bias
 * @returns {object} Enriched day object
 */
export const enrichSingleDayWithPlaces = async (day, destination) => {
  const enrichedActivities = [];

  for (const activity of day.activities || []) {
    try {
      if (!activity.place_name) {
        console.warn(`Activity missing place_name: ${activity.title}`);
        enrichedActivities.push(activity);
        continue;
      }

      // Enrich activity with Google Places data
      const placeData = await enrichActivityWithPlaces(activity.place_name, destination);

      if (placeData) {
        enrichedActivities.push({
          ...activity,
          location: placeData.location,
          image: placeData.image || activity.image || '',
          rating: placeData.rating || activity.rating || 0,
          address: placeData.address || activity.address || '',
          place_id: placeData.place_id || activity.place_id || ''
        });
      } else {
        // Keep original activity if enrichment fails
        enrichedActivities.push(activity);
      }

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error enriching activity "${activity.title}":`, error.message);
      enrichedActivities.push(activity);
    }
  }

  // Calculate day total cost
  const dayTotalCost = enrichedActivities.reduce((sum, act) => sum + (act.cost || 0), 0);

  return {
    ...day,
    activities: enrichedActivities,
    total_cost: dayTotalCost
  };
};

export default {
  enrichActivityWithPlaces,
  batchEnrichActivities,
  enrichItineraryWithPlaces,
  enrichSingleDayWithPlaces,
  getPlaceDetails,
  searchNearbyPlaces
};
