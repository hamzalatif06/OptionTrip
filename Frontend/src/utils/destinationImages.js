/**
 * Destination Images Utility - Google Places API with Database Caching
 * 
 * STRATEGY: Database-First with Local Fallback
 * 1. Request image from backend /api/flights/place-image
 * 2. Backend checks database cache first (fast, usually hits)
 * 3. If cache hit → return cached Google Places image immediately
 * 4. If cache miss → fetch from Google Places API → store in database → return
 * 5. Local fallback images used only when API/DB unavailable
 * 
 * BENEFITS:
 * ✅ Accurate images for specific places (Google Places)
 * ✅ Reduced API calls (database caching)
 * ✅ Better user experience (consistent images across sessions)
 * ✅ Faster load times (database cache hits)
 * ✅ No Unsplash dependency
 */

const BROWSER_CACHE_PREFIX = 'optiontrip:place-image:'; // Local browser cache
const BROWSER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LOCAL_FALLBACK_IMAGES = [
  '/images/destination/destination1.jpg',
  '/images/destination/destination2.jpg',
  '/images/destination/destination3.jpg',
  '/images/destination/destination4.jpg',
  '/images/destination/destination5.jpg',
  '/images/destination/destination6.jpg',
  '/images/destination/destination7.jpg',
  '/images/destination/destination8.jpg',
  '/images/destination/destination9.jpg',
  '/images/destination/destination10.jpg',
  '/images/destination/destination11.jpg',
  '/images/destination/destination12.jpg',
  '/images/destination/destination13.jpg',
  '/images/destination/destination14.jpg',
  '/images/destination/destination15.jpg',
  '/images/destination/destination16.jpg',
  '/images/destination/destination17.jpg',
];

/**
 * Normalize place name for consistent caching
 */
const normalizePlaceName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/**
 * Hash string to get consistent index
 */
const hashString = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Check if browser cache is available and valid
 */
const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Get local storage key for place image
 */
const getBrowserCacheKey = (placeName) => {
  return `${BROWSER_CACHE_PREFIX}${normalizePlaceName(placeName)}`;
};

/**
 * Check if cached data is still valid
 */
export const isBrowserCacheValid = (timestamp) => {
  if (!Number.isFinite(Number(timestamp))) return false;
  return Date.now() - Number(timestamp) < BROWSER_CACHE_TTL_MS;
};

/**
 * Get image from browser's localStorage cache
 */
export const getBrowserCachedImage = (placeName) => {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(getBrowserCacheKey(placeName));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.imageUrl || !isBrowserCacheValid(parsed.timestamp)) {
      // Cache expired, remove it
      window.localStorage.removeItem(getBrowserCacheKey(placeName));
      return null;
    }

    console.log(`✅ Browser cache HIT for: ${placeName}`);
    return parsed;
  } catch (error) {
    console.error(`⚠️ Error reading browser cache for ${placeName}:`, error);
    return null;
  }
};

/**
 * Set image in browser's localStorage cache
 */
export const setBrowserCachedImage = (placeName, data) => {
  if (!hasWindow()) return data;

  try {
    const payload = {
      placeName: normalizePlaceName(placeName),
      imageUrl: data?.imageUrl || '',
      source: data?.source || 'unknown',
      cacheStatus: data?.cacheStatus || 'unknown',
      placeDetails: data?.placeDetails || null,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(getBrowserCacheKey(placeName), JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.error(`⚠️ Error setting browser cache for ${placeName}:`, error);
    return data;
  }
};

/**
 * Get a deterministic fallback image based on place name
 */
export const getDestinationFallbackImage = (placeName) => {
  const normalized = normalizePlaceName(placeName);
  const seed = hashString(normalized);
  const index = seed % LOCAL_FALLBACK_IMAGES.length;
  return LOCAL_FALLBACK_IMAGES[index] || '/images/destination/destination1.jpg';
};

/**
 * Fetch place image with smart caching strategy:
 * 1. Check browser cache first (instant)
 * 2. If miss → call backend API
 * 3. Backend checks database cache (usually hits)
 * 4. If backend cache miss → fetch from Google Places API
 * 5. Cache result and return
 * 
 * RESPONSE:
 * {
 *   imageUrl: "https://...",
 *   source: "cached|google-places|fallback",
 *   cacheStatus: "hit|valid|new|failed|no_photos|error",
 *   placeDetails: { displayName, rating, ... },
 *   cacheInfo: { ... }
 * }
 */
export const getPlaceImage = async (placeName) => {
  const normalized = normalizePlaceName(placeName);

  if (!normalized || normalized.length < 2) {
    console.warn(`⚠️ Invalid place name: ${placeName}`);
    return {
      imageUrl: getDestinationFallbackImage(placeName),
      source: 'fallback',
      error: 'Invalid place name'
    };
  }

  try {
    // STEP 1: Check browser cache
    console.log(`\n🔍 Fetching image for: ${placeName}`);
    const browserCached = getBrowserCachedImage(placeName);
    
    if (browserCached && browserCached.imageUrl) {
      console.log(`✅ Using browser cache (source: ${browserCached.source})`);
      return browserCached;
    }

    // STEP 2: Fetch from backend API (which handles database caching + Google Places API)
    console.log(`📡 Calling backend API for: ${placeName}`);
    const response = await fetch(
      `${API_BASE_URL}/api/flights/place-image?placeName=${encodeURIComponent(placeName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    if (!response.ok) {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      const fallbackUrl = getDestinationFallbackImage(placeName);
      return {
        imageUrl: fallbackUrl,
        source: 'fallback',
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`❌ API returned error:`, data.message);
      const fallbackUrl = getDestinationFallbackImage(placeName);
      return {
        imageUrl: fallbackUrl,
        source: 'fallback',
        error: data.message
      };
    }

    const result = data.data || {};

    // STEP 3: Store in browser cache and return
    if (result.imageUrl) {
      console.log(`✅ Got image from: ${result.source} (cache: ${result.cacheStatus})`);
      const cached = setBrowserCachedImage(placeName, result);
      return cached;
    }

    // Fallback if no imageUrl
    const fallbackUrl = getDestinationFallbackImage(placeName);
    return {
      imageUrl: fallbackUrl,
      source: 'fallback',
      error: 'No image URL in response'
    };

  } catch (error) {
    console.error(`❌ Error fetching place image for ${placeName}:`, error.message);
    return {
      imageUrl: getDestinationFallbackImage(placeName),
      source: 'fallback',
      error: error.message
    };
  }
};

/**
 * DEPRECATED: Use getPlaceImage instead (was using Unsplash)
 * Kept for backwards compatibility
 */
export const getDestinationImage = async (query) => {
  const result = await getPlaceImage(query);
  return result.imageUrl;
};

/**
 * Batch fetch images for multiple places
 * Optimized with Promise.allSettled
 * 
 * REQUEST: ["Dubai", "Paris", "Tokyo"]
 * RESPONSE: { "Dubai": { imageUrl, ... }, "Paris": { imageUrl, ... }, ... }
 */
export const getPlaceImagesForMultiplePlaces = async (placeNames) => {
  try {
    if (!Array.isArray(placeNames) || placeNames.length === 0) {
      console.warn('⚠️ Invalid placeNames array');
      return {};
    }

    console.log(`\n📦 Batch fetching images for ${placeNames.length} places`);

    const response = await fetch(
      `${API_BASE_URL}/api/flights/place-images-batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeNames }),
        timeout: 30000
      }
    );

    if (!response.ok) {
      console.error(`❌ Batch API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`❌ Batch API returned error:`, data.message);
      return {};
    }

    const imageMap = data.data?.imageMap || {};
    
    // Cache each result in browser cache
    Object.entries(imageMap).forEach(([placeName, result]) => {
      if (result?.imageUrl) {
        setBrowserCachedImage(placeName, result);
      }
    });

    console.log(`✅ Batch fetch complete - ${Object.keys(imageMap).length} places cached`);
    return imageMap;

  } catch (error) {
    console.error(`❌ Error in batch fetch:`, error.message);
    return {};
  }
};

/**
 * Get cache statistics from backend
 */
export const getCacheStatsFromBackend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flights/cache-stats`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('⚠️ Error fetching cache stats:', error.message);
    return null;
  }
};

/**
 * Clear all browser cached place images
 * Use when resetting or upgrading image system
 */
export const clearBrowserPlaceImageCache = () => {
  if (!hasWindow()) return;
  
  try {
    const keys = Object.keys(window.localStorage || {});
    let clearedCount = 0;
    
    keys.forEach((key) => {
      if (key.startsWith(BROWSER_CACHE_PREFIX)) {
        window.localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`✅ Cleared ${clearedCount} browser cached place images`);
  } catch (error) {
    console.error('⚠️ Error clearing browser place image cache:', error);
  }
};

/**
 * DEPRECATED: For backwards compatibility
 */
export const clearDestinationImageCache = () => {
  clearBrowserPlaceImageCache();
};

// Legacy exports for backwards compatibility
export const isCacheValid = isBrowserCacheValid;
export const getCachedImage = getBrowserCachedImage;
export const setCachedImage = setBrowserCachedImage;