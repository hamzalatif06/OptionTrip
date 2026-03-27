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
 * Search for flights via Travelpayouts Aviasales API.
 * Results are cached for 15 minutes.
 *
 * @param {{ origin: string, destination: string, departureAt: string, returnAt?: string, limit?: number, currency?: string }}
 * @returns {Promise<Array>} normalized flight objects
 */
export async function searchFlights({
  origin,
  destination,
  departureAt,
  returnAt = null,
  limit = 20,
  currency = 'usd',
}) {
  const key = `${origin}-${destination}-${departureAt}-${returnAt || 'one'}-${limit}`;
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`✈️  Flight cache hit: ${key}`);
    return cached.data;
  }

  const params = {
    origin,
    destination,
    departure_at: departureAt,
    currency,
    limit,
    one_way: !returnAt,
    token: TP_CONFIG.token,
  };
  if (returnAt) params.return_at = returnAt;

  console.log(`🔍 Aviasales search: ${origin} → ${destination} on ${departureAt}`);

  const { data } = await axios.get(TP_CONFIG.aviasalesBase, { params });
  const results = (data.data ?? []).map(normalizeResult);

  cache.set(key, { data: results, expiresAt: Date.now() + TTL });
  return results;
}
