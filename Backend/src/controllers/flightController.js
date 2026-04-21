/**
 * Flight Controller
 * Handles flight search requests via Amadeus API.
 */

import { searchFlights as amadeusSearchFlights } from '../services/amadeusService.js';
import { searchFlights as tpSearchFlights, getCheapPrice, getExploreDestinations } from '../services/travelpayoutsFlightService.js';
import { searchFlightsGoogle } from '../services/googleFlightsService.js';
import { searchFlightsDuffel } from '../services/duffelService.js';
import { searchDestinationImage } from '../services/unsplashService.js';
import { 
  getPlaceImageWithCache, 
  getPlaceImagesForMultiplePlaces,
  getCacheStats
} from '../services/googlePlacesService.js';

/**
 * GET /api/flights/airports?keyword=Paris
 * Proxies Travelpayouts places2 autocomplete (free, no auth required).
 */
export const getAirports = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }
    // Include airports AND cities so users can search by city name (e.g. "Dubai", "London")
    const qs = `term=${encodeURIComponent(keyword.trim())}&locale=en&types[]=airport&types[]=city`;
    const apiRes = await fetch(`https://autocomplete.travelpayouts.com/places2?${qs}`);
    if (!apiRes.ok) return res.json({ success: true, data: { locations: [] } });
    const raw = await apiRes.json();

    // Prefer airports over cities when both share the same code; deduplicate
    const seen = new Set();
    const locations = raw
      .filter(item => item.code)
      .sort((a, b) => (a.type === 'airport' ? -1 : 1)) // airports first
      .reduce((acc, item) => {
        if (!seen.has(item.code)) {
          seen.add(item.code);
          acc.push({
            iataCode:    item.code,
            name:        item.name,
            cityName:    item.city_name || item.name,
            countryName: item.country_name || '',
          });
        }
        return acc;
      }, [])
      .slice(0, 10);

    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('❌ Airport search error:', error.message);
    res.status(500).json({ success: false, message: 'Airport search failed', error: error.message });
  }
};

/**
 * POST /api/flights/search
 * Body: { originCode, destinationCode, departureDate, returnDate?, adults, children?, currencyCode? }
 */
export const searchFlights = async (req, res) => {
  try {
    const {
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      adults,
      children = 0,
      currencyCode = 'USD',
    } = req.body;

    console.log(`📋 Flight search: ${originCode} → ${destinationCode} on ${departureDate}, adults: ${adults}`);

    const flights = await amadeusSearchFlights({
      originCode,
      destinationCode,
      departureDate,
      returnDate: returnDate || null,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    });

    console.log(`✅ Flight search complete — ${flights.length} result(s)`);

    res.status(200).json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: {
        flights,
        count: flights.length,
        searchParams: {
          originCode: originCode.toUpperCase(),
          destinationCode: destinationCode.toUpperCase(),
          departureDate,
          returnDate: returnDate || null,
          adults: Number(adults),
          children: Number(children),
        },
      },
    });
  } catch (error) {
    console.error('❌ Flight search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search flights',
      error: error.message,
    });
  }
};

/**
 * GET /api/flights/cheap-price?origin=KHI&destination=DXB&departDate=2026-05-01
 * Returns cheapest cached TP price for a route/month (instant, no heavy search).
 */
export const getCheapPriceHandler = async (req, res) => {
  try {
    const { origin, destination, departDate } = req.query;
    if (!origin || !destination || !departDate)
      return res.status(400).json({ success: false, message: 'origin, destination and departDate required' });
    const result = await getCheapPrice({ origin, destination, departDate });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/flights/google-search?origin=LAX&destination=JFK&departureDate=2026-04-15&adults=1[&returnDate=...]
 * Returns real-time flights via Google Flights (RapidAPI). Book Now → Aviasales affiliate.
 */
export const searchFlightsGoogleHandler = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, message: 'origin, destination and departureDate are required' });
    }

    console.log(`🌐 Google Flights search: ${origin} → ${destination} on ${departureDate}`);

    const { topFlights, otherFlights } = await searchFlightsGoogle({
      origin,
      destination,
      departureDate,
      returnDate:  returnDate || null,
      adults:      Number(adults),
      travelClass,
    });

    const flights = [...(topFlights || []), ...(otherFlights || [])];

    if (flights.length === 0) {
      console.warn(`⚠️  Google Flights: 0 results for ${origin} → ${destination} on ${departureDate} — frontend will fall back to TP`);
    } else {
      console.log(`✅ Google Flights: ${topFlights.length} top + ${otherFlights.length} other = ${flights.length} total`);
    }

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found',
      data: { topFlights: topFlights || [], otherFlights: otherFlights || [], flights, count: flights.length },
    });
  } catch (error) {
    console.error(`❌ Google Flights error (${req.query.origin} → ${req.query.destination}): ${error.message} — frontend will fall back to TP`);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/tp-search?origin=LHR&destination=DXB&departureAt=2026-04-01[&returnAt=2026-04-05][&limit=20]
 * Returns real flight offers via Travelpayouts Aviasales API.
 */
export const searchFlightsTravelpayouts = async (req, res) => {
  try {
    const { origin, destination, departureAt, returnAt, limit } = req.query;

    console.log(`✈️  TP flight search: ${origin} → ${destination} on ${departureAt}`);

    const flights = await tpSearchFlights({
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureAt,
      returnAt:    returnAt || null,
      limit:       limit ? parseInt(limit, 10) : 20,
    });

    console.log(`✅ TP flight search complete — ${flights.length} result(s)`);

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: { flights, count: flights.length },
    });
  } catch (error) {
    console.error('❌ TP flight search error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Flight search failed',
      error: error.message,
    });
  }
};

/**
 * GET /api/flights/duffel-search?origin=LHR&destination=DXB&departureDate=2026-04-15&adults=1[&returnDate=...&travelClass=economy]
 * Returns real-time flights via Duffel API, normalised to FlightCardDuffel shape.
 */
export const searchFlightsDuffelHandler = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'economy' } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, message: 'origin, destination and departureDate are required' });
    }

    console.log(`🛫  Duffel search handler: ${origin} → ${destination} on ${departureDate}`);

    const flights = await searchFlightsDuffel({
      origin,
      destination,
      departureDate,
      returnDate:  returnDate || null,
      adults:      Number(adults),
      travelClass,
    });

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found',
      data:    { flights, count: flights.length },
    });
  } catch (error) {
    console.error(`❌ Duffel error (${req.query.origin} → ${req.query.destination}): ${error.message}`);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/explore?origin=LHE
 * Returns cheapest prices from origin to all known destinations.
 */
export const exploreDestinationsHandler = async (req, res) => {
  try {
    const { origin } = req.query;
    if (!origin) return res.status(400).json({ success: false, message: 'origin is required' });
    const prices = await getExploreDestinations(origin);
    res.json({ success: true, data: { prices } });
  } catch (error) {
    console.error('❌ Explore destinations error:', error.message);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/destination-image?query=Dubai
 * Returns an Unsplash image URL for a destination query.
 * DEPRECATED: Use /api/flights/place-image instead (uses Google Places API with DB caching)
 */
export const getDestinationImageHandler = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      console.warn(`⚠️ Invalid image query: ${query}`);
      return res.status(400).json({ success: false, message: 'query must be at least 2 characters' });
    }

    console.log(`📷 Getting image for query: ${query}`);
    const result = await searchDestinationImage(query.trim());
    
    // Ensure response has the imageUrl at the right level
    const response = {
      success: true,
      data: {
        imageUrl: result?.imageUrl || null,
        source: result?.source || 'none',
        error: result?.error || null,
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Destination image error:', error.message);
    res.status(502).json({ 
      success: false, 
      message: error.message,
      data: {
        imageUrl: null,
        source: 'error',
      }
    });
  }
};

/**
 * GET /api/flights/place-image?placeName=Dubai
 * Returns an accurate image for a place using Google Places API with database caching.
 * 
 * FLOW:
 * 1. Check if place image is cached in database
 * 2. If cache is valid → return cached image (fast)
 * 3. If cache expired/not found → fetch from Google Places API
 * 4. Store fetched images in database for future use
 * 5. Return image URL with cache status
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     imageUrl: "https://...",
 *     source: "cached|google-places|fallback",
 *     cacheStatus: "hit|valid|new|failed|no_photos|error",
 *     placeDetails: { displayName, rating, ... },
 *     cacheInfo: { totalCached: 123, avgFetchCount: 4.5 }
 *   }
 * }
 */
export const getPlaceImageHandler = async (req, res) => {
  try {
    const { placeName } = req.query;
    
    if (!placeName || placeName.trim().length < 2) {
      console.warn(`⚠️ Invalid place name: ${placeName}`);
      return res.status(400).json({ 
        success: false, 
        message: 'placeName must be at least 2 characters' 
      });
    }

    console.log(`\n🖼️  [API] Getting place image for: ${placeName}`);
    
    const result = await getPlaceImageWithCache(placeName.trim());
    
    // Get cache stats for response
    const stats = await getCacheStats();
    
    const response = {
      success: true,
      data: {
        imageUrl: result?.imageUrl || null,
        source: result?.source || 'fallback',
        cacheStatus: result?.cacheStatus || 'error',
        placeDetails: result?.placeDetails || null,
        cacheInfo: {
          totalCached: stats?.activeCacheEntries || 0,
          avgFetchCount: stats?.totalFetches && stats?.activeCacheEntries 
            ? (stats.totalFetches / stats.activeCacheEntries).toFixed(2)
            : 0
        }
      }
    };
    
    console.log(`✅ [API] Response - Source: ${result?.source}, Status: ${result?.cacheStatus}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ [API] Place image error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch place image',
      error: error.message,
      data: {
        imageUrl: null,
        source: 'error',
        cacheStatus: 'error'
      }
    });
  }
};

/**
 * POST /api/flights/place-images-batch
 * Fetch images for multiple places at once (optimized with Promise.allSettled)
 * 
 * REQUEST BODY:
 * { placeNames: ["Dubai", "Paris", "Tokyo"] }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     imageMap: {
 *       "Dubai": { imageUrl, source, cacheStatus, ... },
 *       "Paris": { imageUrl, source, cacheStatus, ... },
 *       "Tokyo": { imageUrl, source, cacheStatus, ... }
 *     },
 *     totalPlaces: 3,
 *     cachedCount: 2,
 *     newlyFetchedCount: 1
 *   }
 * }
 */
export const getPlaceImagesBatchHandler = async (req, res) => {
  try {
    const { placeNames } = req.body;
    
    if (!Array.isArray(placeNames) || placeNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'placeNames must be a non-empty array'
      });
    }

    if (placeNames.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 places allowed per request'
      });
    }

    console.log(`\n📦 [API] Batch fetching images for ${placeNames.length} places`);
    
    const imageMap = await getPlaceImagesForMultiplePlaces(placeNames);
    
    // Count cache statuses
    const stats = {
      cached: 0,
      new: 0,
      fallback: 0,
      error: 0
    };

    Object.values(imageMap).forEach(item => {
      if (item.cacheStatus === 'hit' || item.cacheStatus === 'valid') {
        stats.cached++;
      } else if (item.cacheStatus === 'new') {
        stats.new++;
      } else if (item.cacheStatus === 'fallback' || item.cacheStatus === 'no_photos') {
        stats.fallback++;
      } else {
        stats.error++;
      }
    });

    const response = {
      success: true,
      data: {
        imageMap,
        totalPlaces: placeNames.length,
        stats: {
          cachedCount: stats.cached,
          newlyFetchedCount: stats.new,
          fallbackCount: stats.fallback,
          errorCount: stats.error
        }
      }
    };

    console.log(`✅ [API] Batch complete - Cached: ${stats.cached}, New: ${stats.new}, Fallback: ${stats.fallback}`);
    res.json(response);

  } catch (error) {
    console.error('❌ [API] Batch place images error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Batch place image fetch failed',
      error: error.message
    });
  }
};

/**
 * GET /api/flights/cache-stats
 * Returns cache statistics for monitoring
 */
export const getCacheStatsHandler = async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Cache stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cache statistics',
      error: error.message
    });
  }
};
