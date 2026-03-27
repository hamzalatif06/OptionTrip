/**
 * Travelpayouts / Hotellook Service
 *
 * Handles:
 *  - City autocomplete  (no auth required)
 *  - Hotel price search via Hotellook cache endpoint
 *  - Affiliate booking link builder
 */

import { TP_CONFIG } from '../config/travelpayouts.js';

// ── In-memory cache (30-min TTL) ─────────────────────────────────────────────
const _cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const cacheGet = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.data;
};
const cacheSet = (key, data) => _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

// ── Affiliate link builder ────────────────────────────────────────────────────
const buildAffiliateLink = ({ hotelId, checkIn, checkOut, adults }) => {
  const params = new URLSearchParams({
    hotelId:  String(hotelId),
    checkIn,
    checkOut,
    adults:   String(adults),
    language: 'en',
    marker:   TP_CONFIG.marker,
  });
  return `${TP_CONFIG.bookBase}/?${params.toString()}`;
};

// ── City / location autocomplete ─────────────────────────────────────────────
/**
 * Search cities by free-text term.
 * No API token required — public endpoint.
 * @param {string} term
 * @returns {Promise<Array<{cityCode, name, countryName}>>}
 */
export const searchHotelLocations = async (term) => {
  if (!term || term.trim().length < 2) return [];

  const cacheKey = `loc:${term.trim().toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const query = new URLSearchParams({
      locale: 'en',
      'types[]': 'city',
      term:   term.trim(),
      limit:  '8',
    });
    const res = await fetch(`${TP_CONFIG.autocompleteUrl}?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const locations = (Array.isArray(data) ? data : []).map(item => ({
      cityCode:    item.code || item.iata || '',      // IATA city code
      name:        item.name || item.city_name || '',
      countryName: item.country_name || '',
    })).filter(l => l.cityCode);

    cacheSet(cacheKey, locations);
    return locations;
  } catch {
    return [];
  }
};

// ── Hotel price search ────────────────────────────────────────────────────────
/**
 * Search hotels by city + dates using Hotellook cached prices.
 * Returns prices cached within the last 48 h by Hotellook.
 *
 * @param {{ cityCode: string, checkIn: string, checkOut: string, adults: number, limit?: number }}
 * @returns {Promise<Array>}  Normalized hotel objects
 */
export const searchHotels = async ({ cityCode, checkIn, checkOut, adults, limit = 20 }) => {
  const cacheKey = `hotels:${cityCode}:${checkIn}:${checkOut}:${adults}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log(`📦 Hotel cache hit for ${cityCode}`);
    return cached;
  }

  const query = new URLSearchParams({
    location: cityCode.toUpperCase(),
    checkIn,
    checkOut,
    adults:   String(adults),
    limit:    String(limit),
    token:    TP_CONFIG.token,
  });

  const url = `${TP_CONFIG.cacheUrl}?${query.toString()}`;
  console.log(`🏨 Hotellook search: ${cityCode} | ${checkIn} → ${checkOut} | adults: ${adults}`);

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!res.ok) {
    // Hotellook cache endpoint is deprecated — return empty so frontend falls back to Booking.com
    console.log(`ℹ️  Hotellook returned ${res.status} for ${cityCode} — falling back to Booking.com redirect`);
    return [];
  }

  const data = await res.json();

  // Hotellook cache.json returns an array of hotel objects
  const hotels = (Array.isArray(data) ? data : []).map(h => {
    const hotelId = h.id || h.hotelId;
    return {
      hotelId:     String(hotelId),
      name:        h.hotelName || h.name || 'Unknown Hotel',
      stars:       Number(h.stars) || 0,
      rating:      h.guestScore ? (h.guestScore / 10) : null,   // Hotellook 0–100 → 0–10
      reviewCount: h.guestScoreCount || 0,
      price:       h.priceFrom ? Math.round(h.priceFrom) : null,
      currency:    h.currency || 'USD',
      imageUrl:    `${TP_CONFIG.photoBase}/${hotelId}/800/520.auto`,
      bookingUrl:  buildAffiliateLink({ hotelId, checkIn, checkOut, adults }),
      location: {
        name:    h.locationName || cityCode,
        country: h.country || '',
      },
    };
  }).filter(h => h.price !== null); // only show hotels with known prices

  console.log(`✅ Hotellook returned ${hotels.length} hotel(s) for ${cityCode}`);
  cacheSet(cacheKey, hotels);
  return hotels;
};
