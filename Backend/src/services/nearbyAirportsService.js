/**
 * Nearby Airports Service
 *
 * Loads a static airport dataset once at module startup.
 * Uses the Haversine formula to find airports within a given radius.
 * Results are cached in-memory with a 1-hour TTL.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load airport data ─────────────────────────────────────────────────────────

const airports = JSON.parse(
  readFileSync(join(__dirname, '../data/airports.json'), 'utf-8')
);

// O(1) lookup by IATA code
const airportIndex = new Map(airports.map(a => [a.iata.toUpperCase(), a]));

// ── In-memory cache ───────────────────────────────────────────────────────────

const _cache    = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const cacheGet = (key) => {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data;
};
const cacheSet = (key, data) =>
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

// ── Haversine formula ─────────────────────────────────────────────────────────

const TO_RAD = Math.PI / 180;
const EARTH_KM = 6371;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLng = (lng2 - lng1) * TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Find airports within radiusKm of the given IATA airport.
 * Results are sorted by distance ascending, capped at `limit`.
 * Returns [] if the IATA code is not in the dataset.
 *
 * @param {string} iata
 * @param {number} radiusKm  default 250
 * @param {number} limit     default 3
 * @returns {Array<{ iata, name, city, country, lat, lng, distanceKm }>}
 */
export const findNearbyAirports = (iata, radiusKm = 250, limit = 3) => {
  const code = iata.toUpperCase().trim();
  const key  = `${code}:${radiusKm}:${limit}`;

  const cached = cacheGet(key);
  if (cached) return cached;

  const ref = airportIndex.get(code);
  if (!ref) return [];

  const nearby = [];
  for (const airport of airports) {
    if (airport.iata === code) continue;
    const dist = haversineKm(ref.lat, ref.lng, airport.lat, airport.lng);
    if (dist <= radiusKm) {
      nearby.push({ ...airport, distanceKm: Math.round(dist * 10) / 10 });
    }
  }

  const result = nearby
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  cacheSet(key, result);
  return result;
};

/**
 * Convenience wrapper — finds nearby airports for both ends of a route.
 * Avoids calling findNearbyAirports twice from the handler.
 *
 * @returns {{ originNearby, destNearby }}
 */
export const findNearbyForRoute = (originIata, destIata, radiusKm = 250, limit = 3) => ({
  originNearby: findNearbyAirports(originIata, radiusKm, limit),
  destNearby:   findNearbyAirports(destIata,   radiusKm, limit),
});

/**
 * Resolve an IATA code to its metadata (name, city, country).
 * Used to enrich nearbyMeta in API responses.
 */
export const getAirportInfo = (iata) =>
  airportIndex.get(iata?.toUpperCase().trim()) || null;

console.log(`✅ Nearby airports service loaded: ${airports.length} airports indexed`);
