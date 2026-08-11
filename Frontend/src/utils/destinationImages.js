const BROWSER_CACHE_PREFIX = 'optiontrip:place-image:';
const BROWSER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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

const normalizePlaceName = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const hashString = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getBrowserCacheKey = (placeName) => {
  return `${BROWSER_CACHE_PREFIX}${normalizePlaceName(placeName)}`;
};

export const isBrowserCacheValid = (timestamp) => {
  if (!Number.isFinite(Number(timestamp))) return false;
  return Date.now() - Number(timestamp) < BROWSER_CACHE_TTL_MS;
};

export const getBrowserCachedImage = (placeName) => {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(getBrowserCacheKey(placeName));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.imageUrl || !isBrowserCacheValid(parsed.timestamp)) {
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

export const getDestinationFallbackImage = (placeName) => {
  const normalized = normalizePlaceName(placeName);
  const seed = hashString(normalized);
  const index = seed % LOCAL_FALLBACK_IMAGES.length;
  return LOCAL_FALLBACK_IMAGES[index] || '/images/destination/destination1.jpg';
};

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
    console.log(`\n🔍 Fetching image for: ${placeName}`);
    const browserCached = getBrowserCachedImage(placeName);
    
    if (browserCached && browserCached.imageUrl) {
      console.log(`✅ Using browser cache (source: ${browserCached.source})`);
      return browserCached;
    }

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

    if (result.imageUrl) {
      console.log(`✅ Got image from: ${result.source} (cache: ${result.cacheStatus})`);
      const cached = setBrowserCachedImage(placeName, result);
      return cached;
    }

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

export const getDestinationImage = async (query) => {
  const result = await getPlaceImage(query);
  return result.imageUrl;
};

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

export const clearDestinationImageCache = () => {
  clearBrowserPlaceImageCache();
};

export const isCacheValid = isBrowserCacheValid;
export const getCachedImage = getBrowserCachedImage;
export const setCachedImage = setBrowserCachedImage;