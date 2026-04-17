const CACHE_PREFIX = 'optiontrip:destination-image:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_QUERY = 'travel,city,landmark';
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

// City-specific landmarks and keywords for accurate image fetching
const CITY_LANDMARKS = {
  dubai: 'Burj Khalifa Dubai',
  bangkok: 'Bangkok temples',
  london: 'London Big Ben',
  paris: 'Eiffel Tower Paris',
  'new york': 'New York Manhattan',
  tokyo: 'Tokyo Tower',
  singapore: 'Marina Bay Singapore',
  istanbul: 'Istanbul Turkey',
  rome: 'Rome Colosseum',
  barcelona: 'Barcelona Gaudí',
  sydney: 'Sydney Opera House',
  bali: 'Bali beach',
  'kuala lumpur': 'Petronas Towers',
  maldives: 'Maldives resort',
  seoul: 'Seoul South Korea',
  athens: 'Acropolis Athens',
  amsterdam: 'Amsterdam canals',
  cairo: 'Pyramids Giza',
  'são paulo': 'São Paulo Brazil',
  'cape town': 'Table Mountain',
  lahore: 'Badshahi Mosque',
  karachi: 'Karachi city',
  skardu: 'Skardu mountains',
  quetta: 'Quetta city',
  tashkent: 'Tashkent city',
  multan: 'Minar-e-Pakistan',
  riyadh: 'Riyadh Saudi Arabia',
  almaty: 'Almaty Kazakhstan',
  sukkur: 'Sukkur city',
};

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeQuery = (query) => String(query || '').trim().replace(/\s+/g, ' ').toLowerCase();

const hashString = (value) => {
  let hash = 0;
  const text = String(value || '');

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getLandmarkForCity = (query) => {
  const normalized = normalizeQuery(query);
  
  // Check direct city match
  if (CITY_LANDMARKS[normalized]) {
    return CITY_LANDMARKS[normalized];
  }
  
  // Check if query starts with a known city
  const firstWord = normalized.split(' ')[0];
  if (CITY_LANDMARKS[firstWord]) {
    return CITY_LANDMARKS[firstWord];
  }
  
  // Fallback: use the query itself
  return normalized || DEFAULT_QUERY;
};

const buildUnsplashApiUrl = (query) => {
  const landmark = getLandmarkForCity(query);
  const encodedQuery = encodeURIComponent(landmark);
  
  // Use Unsplash API with access key from backend
  // Format: https://api.unsplash.com/photos/random?query=landmark&client_id=ACCESS_KEY
  return `/api/flights/destination-image?query=${encodedQuery}`;
};

const getStorageKey = (query) => `${CACHE_PREFIX}${normalizeQuery(query) || DEFAULT_QUERY}`;

export const isCacheValid = (timestamp) => {
  if (!Number.isFinite(Number(timestamp))) return false;
  return Date.now() - Number(timestamp) < CACHE_TTL_MS;
};

export const getCachedImage = (query) => {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(query));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.imageUrl || !isCacheValid(parsed.timestamp)) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const setCachedImage = (query, data) => {
  if (!hasWindow()) return data;

  try {
    const payload = {
      query: normalizeQuery(query) || DEFAULT_QUERY,
      imageUrl: data?.imageUrl || '',
      timestamp: data?.timestamp || Date.now(),
    };
    window.localStorage.setItem(getStorageKey(query), JSON.stringify(payload));
    return payload;
  } catch {
    return data;
  }
};

/**
 * Fetch destination image from Unsplash API via backend.
 * Returns fresh image without caching to allow variety.
 * This is ASYNC and should be awaited.
 */
export const getDestinationImage = async (query) => {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return getDestinationFallbackImage(normalizedQuery);
  }

  try {
    // Always fetch fresh images (no caching) to get variety
    // Backend handles randomization with pagination
    const landmark = getLandmarkForCity(query);
    const response = await fetch(`/api/flights/destination-image?query=${encodeURIComponent(landmark)}&t=${Date.now()}`);
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    
    const data = await response.json();
    const imageUrl = data?.data?.imageUrl || data?.imageUrl;
    
    if (imageUrl) {
      return imageUrl;
    }
    
    return getDestinationFallbackImage(normalizedQuery);
  } catch (error) {
    console.error(`Failed to fetch image for ${query}:`, error);
    return getDestinationFallbackImage(normalizedQuery);
  }
};

export const getDestinationFallbackImage = (query) => {
  const normalizedQuery = normalizeQuery(query);
  const seed = hashString(normalizedQuery || DEFAULT_QUERY);
  const index = seed % LOCAL_FALLBACK_IMAGES.length;
  return LOCAL_FALLBACK_IMAGES[index] || '/images/destination/destination13.jpg';
};

/**
 * Clears all cached destination images from localStorage.
 * Use this when updating the image query format to fetch fresh images.
 */
export const clearDestinationImageCache = () => {
  if (!hasWindow()) return;
  try {
    const keys = Object.keys(window.localStorage || {});
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
    console.log('✓ Cleared destination image cache');
  } catch (error) {
    console.error('Failed to clear destination image cache:', error);
  }
};