/**
 * Travelpayouts Aviasales Flight Service
 * Fetches cached flight prices from the Aviasales API.
 */

import axios from 'axios';
import { TP_CONFIG } from '../config/travelpayouts.js';

const cache = new Map(); // key → { data, expiresAt }
const TTL = 15 * 60 * 1000; // 15 minutes

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function buildBookingUrl(link) {
  if (link && TP_CONFIG.marker) {
    return `${TP_CONFIG.aviasalesBook}${link}?marker=${TP_CONFIG.marker}`;
  }
  if (link) {
    return `${TP_CONFIG.aviasalesBook}${link}`;
  }
  return TP_CONFIG.aviasalesFallback;
}

function normalizeResult(item) {
  const durationMin = item.duration ?? item.duration_to ?? null;
  return {
    id:              `${item.origin}-${item.destination}-${item.departure_at}-${item.airline}-${item.price}`,
    origin:          item.origin,
    destination:     item.destination,
    airline:         item.airline,
    flightNumber:    item.flight_number ?? null,
    departureAt:     item.departure_at,
    returnAt:        item.return_at ?? null,
    duration:        formatDuration(durationMin),
    durationMinutes: durationMin,
    stops:           item.transfers ?? 0,
    price:           item.price,
    currency:        'USD',
    bookingUrl:      buildBookingUrl(item.link),
  };
}

/**
 * Get popular destinations from one origin via city-directions API.
 * Returns a map: { IATA: { price, airline, transfers } }
 */
export async function getCityDirections(origin) {
  try {
    const params = new URLSearchParams({
      origin:   origin.toUpperCase(),
      currency: 'usd',
      token:    TP_CONFIG.token,
    });
    const res  = await fetch(`${TP_CONFIG.cityDirectionsUrl}?${params}`);
    if (!res.ok) return {};
    const json = await res.json();
    if (!json.success) return {};
    // Response shape: { "BKK": { price, number_of_changes, airline, ... }, ... }
    const result = {};
    for (const [dest, info] of Object.entries(json.data || {})) {
      result[dest] = {
        price:     info.price,
        airline:   info.airline,
        transfers: info.number_of_changes ?? info.transfers ?? 0,
      };
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Get cheapest prices from one origin to ALL destinations (Explore Anywhere).
 * Tries city-directions first (popular routes), falls back to cheap prices.
 * Returns a map: { IATA: { price, airline, transfers } }
 */
export async function getExploreDestinations(origin) {
  // Attempt 1: city-directions (popular destinations, one clean record per dest)
  const cityDir = await getCityDirections(origin);
  if (Object.keys(cityDir).length > 0) return cityDir;

  // Attempt 2: cheap prices fallback
  try {
    const params = new URLSearchParams({
      origin:   origin.toUpperCase(),
      currency: 'usd',
      token:    TP_CONFIG.token,
    });
    const res  = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params}`);
    if (!res.ok) return {};
    const json = await res.json();
    if (!json.success) return {};
    const result = {};
    for (const [dest, months] of Object.entries(json.data || {})) {
      const prices = Object.values(months);
      if (prices.length) {
        result[dest] = prices.reduce((best, p) => p.price < best.price ? p : best);
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Get cheapest cached price for a route/month from Travelpayouts.
 * Instant response — no heavy computation, pure cache lookup.
 *
 * @param {{ origin: string, destination: string, departDate: string }}  departDate = YYYY-MM-DD
 * @returns {Promise<{ price: number, airline: string, departureAt: string, transfers: number } | null>}
 */
export async function getCheapPrice({ origin, destination, departDate }) {
  try {
    const month = departDate.substring(0, 7); // YYYY-MM
    const params = new URLSearchParams({
      origin:       origin.toUpperCase(),
      destination:  destination.toUpperCase(),
      depart_date:  month,
      currency:     'usd',
      token:        TP_CONFIG.token,
    });
    const res  = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    const destData = json.data?.[destination.toUpperCase()];
    if (!destData) return null;
    const prices = Object.values(destData);
    if (!prices.length) return null;
    // Return the cheapest option
    return prices.reduce((best, p) => (!best || p.price < best.price) ? p : best, null);
  } catch {
    return null;
  }
}

/* ── Internal helpers ───────────────────────────────────────────────────── */

/**
 * Single call to /aviasales/v3/prices_for_dates.
 * Returns normalized array (may be empty).
 */
async function fetchPricesForDates({ origin, destination, departureAt, returnAt, limit, currency }) {
  try {
    const params = {
      origin:       origin.toUpperCase(),
      destination:  destination.toUpperCase(),
      departure_at: departureAt,
      currency,
      sorting:      'price',
      page:         1,
      limit,
      one_way:      !returnAt,
      token:        TP_CONFIG.token,
    };
    if (returnAt) params.return_at = returnAt;

    const { data } = await axios.get(TP_CONFIG.aviasalesBase, { params });
    return (data.data ?? []).map(normalizeResult);
  } catch {
    return [];
  }
}

/**
 * Fallback: pull cheapest prices for a route from /v1/prices/cheap
 * and coerce them into the normalizeResult shape.
 */
async function fetchCheapPricesForRoute({ origin, destination, departureAt }) {
  try {
    const month = departureAt.substring(0, 7); // YYYY-MM
    const params = new URLSearchParams({
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      depart_date: month,
      currency:    'usd',
      token:       TP_CONFIG.token,
    });
    const res  = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];

    const destData = json.data?.[destination.toUpperCase()];
    if (!destData) return [];

    return Object.values(destData).map(item =>
      normalizeResult({
        origin:       origin.toUpperCase(),
        destination:  destination.toUpperCase(),
        airline:      item.airline      ?? '',
        flight_number:item.flight_number ?? null,
        departure_at: item.departure_at  ?? `${month}-01T00:00:00`,
        return_at:    item.return_at     ?? null,
        duration:     item.duration      ?? null,
        transfers:    item.transfers     ?? 0,
        price:        item.price,
        link:         item.link          ?? null,
      })
    );
  } catch {
    return [];
  }
}

/* ── Public search function ─────────────────────────────────────────────── */

/**
 * Search for flights via Travelpayouts Aviasales API.
 * Multi-strategy with cache: exact date → month → cheap-prices fallback.
 * Empty results are cached for only 2 minutes to allow fresh retries.
 *
 * @param {{ origin, destination, departureAt, returnAt?, limit?, currency? }}
 * @returns {Promise<Array>} normalized flight objects
 */
export async function searchFlights({
  origin,
  destination,
  departureAt,
  returnAt = null,
  limit    = 30,
  currency = 'usd',
}) {
  const o   = origin.toUpperCase();
  const d   = destination.toUpperCase();
  const key = `${o}-${d}-${departureAt}-${returnAt || 'one'}-${limit}`;

  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`✈️  Flight cache hit: ${key}`);
    return cached.data;
  }

  console.log(`🔍 Aviasales search: ${o} → ${d} on ${departureAt}`);

  // Strategy 1 — exact date (YYYY-MM-DD)
  let results = await fetchPricesForDates({ origin: o, destination: d, departureAt, returnAt, limit, currency });

  // Strategy 2 — month-level (YYYY-MM); TP cache is denser at this granularity
  if (results.length === 0) {
    const month = departureAt.substring(0, 7);
    if (month !== departureAt) {
      console.log(`🔄 Retrying with month format: ${o} → ${d} on ${month}`);
      results = await fetchPricesForDates({ origin: o, destination: d, departureAt: month, returnAt, limit, currency });
    }
  }

  // Strategy 3 — cheap-prices endpoint for this route/month
  if (results.length === 0) {
    console.log(`🔄 Falling back to cheap-prices endpoint: ${o} → ${d}`);
    results = await fetchCheapPricesForRoute({ origin: o, destination: d, departureAt });
  }

  // Cache hits for 15 min; empty results for 2 min only (allow fresh retries sooner)
  const ttl = results.length > 0 ? TTL : 2 * 60 * 1000;
  cache.set(key, { data: results, expiresAt: Date.now() + ttl });

  console.log(`${results.length > 0 ? '✅' : '⚠️ '} Aviasales: ${results.length} result(s) for ${o} → ${d}`);
  return results;
}
