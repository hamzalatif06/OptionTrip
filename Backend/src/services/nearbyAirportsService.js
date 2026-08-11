import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const airports = JSON.parse(
  readFileSync(join(__dirname, '../data/airports.json'), 'utf-8')
);

const airportIndex = new Map(airports.map(a => [a.iata.toUpperCase(), a]));

const _cache    = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const cacheGet = (key) => {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data;
};
const cacheSet = (key, data) =>
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

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

export const findNearbyForRoute = (originIata, destIata, radiusKm = 250, limit = 3) => ({
  originNearby: findNearbyAirports(originIata, radiusKm, limit),
  destNearby:   findNearbyAirports(destIata,   radiusKm, limit),
});

export const getAirportInfo = (iata) =>
  airportIndex.get(iata?.toUpperCase().trim()) || null;

export const findAirportByCityName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  const match = airports.find(a =>
    a.city?.toLowerCase() === needle || a.name?.toLowerCase().includes(needle)
  ) || airports.find(a => a.city?.toLowerCase().includes(needle));
  return match || null;
};

console.log(`✅ Nearby airports service loaded: ${airports.length} airports indexed`);
