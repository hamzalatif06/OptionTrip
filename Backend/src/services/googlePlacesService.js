/**
 * Google Places API Service
 * Handles fetching place images from Google Places API with caching
 */

import PlaceImage from '../models/PlaceImage.js';
import env from '../config/env.js';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1';
const CACHE_TTL_DAYS = 30; // Refresh cache every 30 days
const MAX_IMAGES_TO_CACHE = 5;

const FALLBACK_IMAGES = [
  '/images/destination/destination1.jpg',
  '/images/destination/destination2.jpg',
  '/images/destination/destination3.jpg',
  '/images/destination/destination4.jpg',
  '/images/destination/destination5.jpg',
];

/**
 * Normalize place name for caching (e.g., "Dubai" -> "dubai")
 */
const normalizePlaceName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/**
 * Create a deterministic placeId from place name
 */
const createPlaceId = (placeName) => {
  return `place_${normalizePlaceName(placeName).replace(/\s+/g, '_')}`;
};

/**
 * Get a deterministic fallback image based on place name so the same
 * destination always gets the same fallback (no random repeats across cards)
 */
const getFallbackImage = (placeName = '') => {
  let hash = 0;
  const text = normalizePlaceName(placeName) || String(Date.now());
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
};

/**
 * Search for a place using Google Places Text Search API v1
 * REQUIRED: X-Goog-FieldMask header with fields to return
 */
export const searchGooglePlace = async (placeName) => {
  try {
    if (!placeName || placeName.trim().length < 2) {
      console.warn('⚠️ Invalid place name provided to Google Places API');
      return null;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ GOOGLE_PLACES_API_KEY not configured');
      return null;
    }

    console.log(`🔍 Searching Google Places for: ${placeName}`);

    // Use AbortController for proper timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const requestBody = {
      textQuery: placeName,
      maxResultCount: 1,
      languageCode: 'en'
    };

    // Required fields for Places API v1
    // X-Goog-FieldMask specifies which fields to return
    const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.websiteUri,places.internationalPhoneNumber,places.photos';

    console.log(`📤 Request URL: ${GOOGLE_PLACES_API_URL}/places:searchText`);
    console.log(`📤 Request body:`, JSON.stringify(requestBody));
    console.log(`📤 Field mask: ${fieldMask}`);
    console.log(`📤 API Key configured: ${GOOGLE_PLACES_API_KEY ? 'YES' : 'NO'}`);

    const response = await fetch(`${GOOGLE_PLACES_API_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask  // ← REQUIRED HEADER
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Google Places API error: ${response.status} ${response.statusText}`);
      console.error(`   Error body: ${errorBody}`);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          console.error(`   Error details: ${JSON.stringify(errorJson.error)}`);
        }
      } catch (e) {
        // Not JSON
      }
      return null;
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      console.warn(`⚠️ No places found for: ${placeName}`);
      return null;
    }

    const place = data.places[0];
    console.log(`✅ Found place: ${place.displayName.text}`);

    return {
      placeId: place.id,
      displayName: place.displayName?.text || placeName,
      formattedAddress: place.formattedAddress || '',
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types || [],
      website: place.websiteUri || '',
      phone: place.internationalPhoneNumber || '',
      photos: place.photos || []
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Google Places API request timeout (10s)`);
    } else {
      console.error(`❌ Error searching Google Places:`, error.message);
    }
    return null;
  }
};

/**
 * Get photo URL from Google Places using photoReference
 * photo.name from Places API v1 is already "places/{id}/photos/{photoId}"
 * so we must NOT add an extra "/places/" prefix
 */
export const getGooglePlacePhotoUrl = (photoReference, maxWidth = 800, maxHeight = 600) => {
  if (!photoReference || !GOOGLE_PLACES_API_KEY) {
    return null;
  }

  return `${GOOGLE_PLACES_API_URL}/${photoReference}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
};

/**
 * Fetch place photos from Google Places API
 * REQUIRED: X-Goog-FieldMask header with fields to return
 */
const fetchPlacePhotos = async (placeId, displayName) => {
  try {
    if (!placeId || !GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Missing placeId or API key for fetching photos');
      return [];
    }

    console.log(`📸 Fetching photos for place: ${displayName}`);

    // Use AbortController for proper timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // For GET requests, use query parameter 'fields' instead of header
    const fields = 'places.photos,places.displayName,places.formattedAddress';
    
    // URL encode the fields parameter
    const url = `${GOOGLE_PLACES_API_URL}/places/${placeId}?fields=${encodeURIComponent(fields)}`;

    console.log(`📸 Fetching from: ${url}`);
    console.log(`📸 Fields: ${fields}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Failed to fetch place details: ${response.status} ${response.statusText}`);
      console.error(`   Error body: ${errorBody.substring(0, 300)}`);
      return [];
    }

    const data = await response.json();
    const photos = data.photos || [];

    if (photos.length === 0) {
      console.warn(`⚠️ No photos found for place: ${displayName}`);
      return [];
    }

    console.log(`✅ Found ${photos.length} photos for ${displayName}`);

    return photos.slice(0, MAX_IMAGES_TO_CACHE).map((photo, index) => ({
      photoReference: photo.name,
      url: getGooglePlacePhotoUrl(photo.name),
      attribution: photo.attributions?.join(', ') || 'Google Places',
      width: photo.widthPx,
      height: photo.heightPx,
      addedAt: new Date()
    }));
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Fetch place photos request timeout (10s)`);
    } else {
      console.error(`❌ Error fetching place photos:`, error.message);
    }
    return [];
  }
};

/**
 * Get or fetch place image with caching
 * FLOW: Check DB cache -> if expired/not found -> fetch from Google Places API -> cache in DB
 */
export const getPlaceImageWithCache = async (placeName) => {
  try {
    const normalized = normalizePlaceName(placeName);
    const placeId = createPlaceId(placeName);

    console.log(`\n🎯 Getting place image for: ${placeName} (ID: ${placeId})`);

    // STEP 1: Check if cached in database
    console.log(`⏱️ Checking database cache...`);
    const cachedPlaceImage = await PlaceImage.getCachedImage(placeId);

    if (cachedPlaceImage && cachedPlaceImage.primaryImageUrl) {
      console.log(`✅ DB cache HIT for: ${placeName} (fetches: ${cachedPlaceImage.cacheMetadata.fetchCount})`);
      return {
        imageUrl: cachedPlaceImage.primaryImageUrl,
        source: 'cached',
        placeDetails: cachedPlaceImage.placeDetails,
        cacheStatus: 'hit'
      };
    }

    // STEP 2: Cache miss — fetch from Google Places API
    console.log(`🔄 Cache expired or not found, fetching from Google Places API...`);
    
    const placeDetails = await searchGooglePlace(placeName);
    if (!placeDetails) {
      console.log(`⚠️ Google Places search failed, using fallback image`);
      return {
        imageUrl: getFallbackImage(placeName),
        source: 'fallback',
        cacheStatus: 'failed'
      };
    }

    // STEP 3: Process photos from search results
    const rawPhotos = placeDetails.photos || [];

    if (rawPhotos.length === 0) {
      console.log(`⚠️ No photos found, using fallback image`);
      return {
        imageUrl: getFallbackImage(placeName),
        source: 'fallback',
        placeDetails,
        cacheStatus: 'no_photos'
      };
    }

    // Format photos for caching
    const photos = rawPhotos.slice(0, MAX_IMAGES_TO_CACHE).map((photo, index) => ({
      photoReference: photo.name,
      url: getGooglePlacePhotoUrl(photo.name),
      attribution: photo.authorAttributions?.map(attr => attr.displayName).join(', ') || 'Google Places',
      width: photo.widthPx,
      height: photo.heightPx,
      addedAt: new Date()
    }));

    // STEP 4: Save to database cache
    console.log(`💾 Saving to database cache...`);
    let placeImage = await PlaceImage.getOrCreatePlaceImage(placeId, placeName);
    
    placeImage.placeName = normalized;
    placeImage.images = photos;
    placeImage.primaryImageUrl = photos[0].url;
    placeImage.source = 'google-places';
    placeImage.placeDetails = {
      displayName: placeDetails.displayName,
      formattedAddress: placeDetails.formattedAddress,
      latitude: placeDetails.latitude,
      longitude: placeDetails.longitude,
      rating: placeDetails.rating,
      userRatingsTotal: placeDetails.userRatingsTotal,
      types: placeDetails.types,
      website: placeDetails.website,
      phone: placeDetails.phone
    };
    placeImage.fallbackImages = FALLBACK_IMAGES;
    placeImage.cacheMetadata = {
      fetchCount: 1,
      lastFetched: new Date(),
      nextRefreshDate: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
    placeImage.isActive = true;

    await placeImage.save();
    console.log(`✅ Successfully saved ${photos.length} images to cache`);

    return {
      imageUrl: placeImage.primaryImageUrl,
      source: 'google-places',
      placeDetails: placeImage.placeDetails,
      cacheStatus: 'new'
    };

  } catch (error) {
    console.error(`❌ Error in getPlaceImageWithCache:`, error.message);
    
    // Return fallback on any error
    return {
      imageUrl: getFallbackImage(placeName),
      source: 'fallback',
      cacheStatus: 'error',
      error: error.message
    };
  }
};

/**
 * Batch get place images for multiple places
 */
export const getPlaceImagesForMultiplePlaces = async (placeNames) => {
  try {
    console.log(`\n📦 Fetching images for ${placeNames.length} places...`);

    const results = await Promise.allSettled(
      placeNames.map(name => getPlaceImageWithCache(name))
    );

    const imageMap = {};
    results.forEach((result, index) => {
      const placeName = placeNames[index];
      if (result.status === 'fulfilled') {
        imageMap[placeName] = result.value;
      } else {
        console.error(`❌ Failed to fetch image for ${placeName}:`, result.reason);
        imageMap[placeName] = {
          imageUrl: getFallbackImage(placeName),
          source: 'fallback',
          cacheStatus: 'error'
        };
      }
    });

    console.log(`✅ Completed batch fetch for ${Object.keys(imageMap).length} places`);
    return imageMap;
  } catch (error) {
    console.error(`❌ Error in batch fetch:`, error.message);
    return {};
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = async () => {
  try {
    console.log(`🧹 Clearing expired cache entries...`);
    
    const result = await PlaceImage.deleteMany({
      'cacheMetadata.expiresAt': { $lt: new Date() }
    });

    console.log(`✅ Deleted ${result.deletedCount} expired cache entries`);
    return result;
  } catch (error) {
    console.error(`❌ Error clearing expired cache:`, error.message);
    return null;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const totalEntries = await PlaceImage.countDocuments();
    const activeCacheEntries = await PlaceImage.countDocuments({ isActive: true });
    const totalFetches = await PlaceImage.aggregate([
      { $group: { _id: null, totalFetches: { $sum: '$cacheMetadata.fetchCount' } } }
    ]);

    return {
      totalEntries,
      activeCacheEntries,
      totalFetches: totalFetches[0]?.totalFetches || 0,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`❌ Error getting cache stats:`, error.message);
    return null;
  }
};

export default {
  getPlaceImageWithCache,
  getPlaceImagesForMultiplePlaces,
  searchGooglePlace,
  getGooglePlacePhotoUrl,
  clearExpiredCache,
  getCacheStats
};
