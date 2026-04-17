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
    // Return leg fields (TP only provides departure time for return)
    isRoundTrip:         !!item.return_at,
    returnOrigin:        item.destination || '',
    returnDestination:   item.origin      || '',
    returnDepartureTime: item.return_at   ? String(item.return_at).slice(11, 16) : '',
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

function mergeExploreResult(target, destination, payload = {}) {
  const code = String(destination || '').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(code)) return;

  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0) return;

  const prev = target[code];
  const base = {
    price,
    airline: payload.airline || payload.airlineName || null,
    transfers: Number.isFinite(Number(payload.transfers)) ? Number(payload.transfers) : 0,
    city: payload.city || payload.destinationName || payload.destination_name || null,
    country: payload.country || payload.countryName || payload.country_name || null,
  };

  if (!prev || price < Number(prev.price)) {
    target[code] = {
      ...prev,
      ...base,
      price,
    };
    return;
  }

  target[code] = {
    ...prev,
    airline: prev.airline || base.airline,
    city: prev.city || base.city,
    country: prev.country || base.country,
    transfers: Number.isFinite(Number(prev.transfers)) ? Number(prev.transfers) : base.transfers,
  };
}

async function fetchTPJson(url, queryObj = {}) {
  try {
    const params = new URLSearchParams(
      Object.entries(queryObj)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    );
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get cheapest prices from one origin to ALL destinations (Explore Anywhere).
 * Tries city-directions first (popular routes), falls back to cheap prices.
 * Returns a map: { IATA: { price, airline, transfers } }
 */
export async function getExploreDestinations(origin) {
  const o = String(origin || '').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(o) || !TP_CONFIG.token) return {};

  const result = {};

  const [
    cityDirectionsJson,
    cheapJson,
    directJson,
    latestJson,
    specialJson,
    rangeJson,
  ] = await Promise.all([
    fetchTPJson(TP_CONFIG.cityDirectionsUrl, { origin: o, currency: 'usd', token: TP_CONFIG.token }),
    fetchTPJson('https://api.travelpayouts.com/v1/prices/cheap', {
      origin: o,
      destination: '-',
      currency: 'usd',
      token: TP_CONFIG.token,
    }),
    fetchTPJson('https://api.travelpayouts.com/v1/prices/direct', {
      origin: o,
      destination: '-',
      currency: 'usd',
      token: TP_CONFIG.token,
    }),
    fetchTPJson(TP_CONFIG.latestPricesUrl, {
      origin: o,
      currency: 'usd',
      period_type: 'year',
      sorting: 'price',
      group_by: 'directions',
      page: 1,
      token: TP_CONFIG.token,
    }),
    fetchTPJson('https://api.travelpayouts.com/aviasales/v3/get_special_offers', {
      origin: o,
      locale: 'en',
      currency: 'usd',
      token: TP_CONFIG.token,
    }),
    fetchTPJson('https://api.travelpayouts.com/aviasales/v3/search_by_price_range', {
      origin: o,
      destination: '-',
      value_min: 50,
      value_max: 500,
      one_way: true,
      direct: false,
      locale: 'en',
      currency: 'usd',
      market: 'us',
      limit: 60,
      page: 1,
      token: TP_CONFIG.token,
    }),
  ]);

  // 1) city-directions
  for (const [dest, info] of Object.entries(cityDirectionsJson?.data || {})) {
    mergeExploreResult(result, dest, {
      price: info.price,
      airline: info.airline,
      transfers: info.number_of_changes ?? info.transfers ?? 0,
      destinationName: info.destination_name,
      countryName: info.country_name,
    });
  }

  // 2) cheap prices to any destination
  for (const [dest, months] of Object.entries(cheapJson?.data || {})) {
    const monthEntries = Object.values(months || {}).filter(Boolean);
    if (!monthEntries.length) continue;
    const best = monthEntries.reduce((acc, item) => {
      if (!acc) return item;
      return Number(item.price) < Number(acc.price) ? item : acc;
    }, null);
    if (!best) continue;
    mergeExploreResult(result, dest, {
      price: best.price,
      airline: best.airline,
      transfers: best.transfers ?? 0,
      destinationName: best.destination_name,
      countryName: best.country_name,
    });
  }

  // 3) direct prices
  for (const [dest, data] of Object.entries(directJson?.data || {})) {
    const directEntries = Object.values(data || {}).filter(Boolean);
    if (!directEntries.length) continue;
    const best = directEntries.reduce((acc, item) => {
      if (!acc) return item;
      return Number(item.price) < Number(acc.price) ? item : acc;
    }, null);
    if (!best) continue;
    mergeExploreResult(result, dest, {
      price: best.price,
      airline: best.airline,
      transfers: 0,
      destinationName: best.destination_name,
      countryName: best.country_name,
    });
  }

  // 4) latest prices grouped by directions
  for (const item of (latestJson?.data || [])) {
    mergeExploreResult(result, item.destination, {
      price: item.price ?? item.value,
      airline: item.airline,
      transfers: item.transfers ?? item.number_of_changes ?? 0,
      destinationName: item.destination_name,
      countryName: item.country_name,
    });
  }

  // 5) special offers
  for (const item of (specialJson?.data || [])) {
    mergeExploreResult(result, item.destination, {
      price: item.price ?? item.value,
      airline: item.airline,
      transfers: item.transfers ?? 0,
      destinationName: item.destination_name,
      countryName: item.country_name,
    });
  }

  // 6) search by price range
  for (const item of (rangeJson?.data || [])) {
    mergeExploreResult(result, item.destination, {
      price: item.price ?? item.value,
      airline: item.airline,
      transfers: item.transfers ?? item.number_of_changes ?? 0,
      destinationName: item.destination_name,
      countryName: item.country_name,
    });
  }

  return result;
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
