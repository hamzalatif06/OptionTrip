const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { getDestinationImage as getCachedDestinationImage } from '../utils/destinationImages';

/**
 * Search airports/cities using Travelpayouts places2 API (free, no auth).
 * @param {string} keyword
 * @returns {Promise<Array<{iataCode, name, cityName, countryName}>>}
 */
export const searchAirports = async (keyword) => {
  if (!keyword || keyword.trim().length < 2) return [];
  try {
    const res = await fetch(
      `${API_URL}/api/flights/airports?keyword=${encodeURIComponent(keyword.trim())}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.locations || [];
  } catch {
    return [];
  }
};

/**
 * Search for flights via the OptionTrip backend → Amadeus API.
 *
 * @param {object} params
 * @param {string} params.originCode
 * @param {string} params.destinationCode
 * @param {string} params.departureDate   YYYY-MM-DD
 * @param {string} [params.returnDate]    YYYY-MM-DD
 * @param {number} params.adults
 * @param {number} [params.children]
 * @param {string} [params.currencyCode]
 * @returns {Promise<{ flights: Array, searchParams: object }>}
 */
export const searchFlights = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate,
  adults,
  children = 0,
  currencyCode = 'USD',
}) => {
  const res = await fetch(`${API_URL}/api/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originCode: originCode.trim().toUpperCase(),
      destinationCode: destinationCode.trim().toUpperCase(),
      departureDate,
      returnDate: returnDate || undefined,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    // Surface validation errors as a readable string
    if (data.errors?.length) {
      throw new Error(data.errors.join('. '));
    }
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data; // { flights, count, searchParams }
};

/**
 * Search real-time flights via Google Flights (RapidAPI).
 * Book Now links redirect to Aviasales affiliate (marker 370056).
 *
 * @param {{ originCode, destinationCode, departureDate, returnDate?, adults, travelClass? }}
 * @returns {Promise<{ flights: Array, count: number }>}
 */
export const searchFlightsGoogle = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate   = null,
  adults       = 1,
  travelClass  = 'ECONOMY',
}) => {
  const params = new URLSearchParams({
    origin:        originCode.trim().toUpperCase(),
    destination:   destinationCode.trim().toUpperCase(),
    departureDate,
    adults:        String(adults),
    travelClass,
  });
  if (returnDate) params.append('returnDate', returnDate);

  const res  = await fetch(`${API_URL}/api/flights/google-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Flight search failed');
  return data.data; // { topFlights, otherFlights, flights, count }
};

/**
 * Explore Anywhere — cheapest fares from one origin to all destinations.
 * @param {string} origin  IATA code
 * @returns {Promise<Object>}  { IATA: { price, airline, transfers } }
 */
export const exploreDestinations = async (origin) => {
  try {
    const res  = await fetch(`${API_URL}/api/flights/explore?origin=${encodeURIComponent(origin)}`);
    const data = await res.json();
    return data.success ? (data.data?.prices || {}) : {};
  } catch {
    return {};
  }
};

/**
 * Fetch an accurate destination image from the browser cache / Unsplash Source URL helper.
 * @param {string} query
 * @returns {Promise<{ imageUrl: string, source: string, credit?: object } | null>}
 */
export const getDestinationImage = async (query) => {
  if (!query || query.trim().length < 2) return null;
  return {
    imageUrl: getCachedDestinationImage(query),
    source: 'unsplash-source',
  };
};

/**
 * Search for flights via Travelpayouts Aviasales API.
 *
 * @param {{ origin: string, destination: string, departureAt: string, returnAt?: string, limit?: number }}
 * @returns {Promise<{ flights: Array, count: number }>}
 */
export const getCheapPrice = async ({ origin, destination, departDate }) => {
  try {
    const params = new URLSearchParams({ origin, destination, departDate });
    const res  = await fetch(`${API_URL}/api/flights/cheap-price?${params}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
};

/**
 * Search real-time flights via Duffel API (Stage 0 — highest priority).
 *
 * @param {{ originCode, destinationCode, departureDate, returnDate?, adults, travelClass? }}
 * @returns {Promise<{ flights: Array, count: number }>}
 */
export const searchFlightsDuffel = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate  = null,
  adults      = 1,
  travelClass = 'economy',
}) => {
  const params = new URLSearchParams({
    origin:      originCode.trim().toUpperCase(),
    destination: destinationCode.trim().toUpperCase(),
    departureDate,
    adults:      String(adults),
    travelClass,
  });
  if (returnDate) params.append('returnDate', returnDate);

  const res  = await fetch(`${API_URL}/api/flights/duffel-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Duffel flight search failed');
  return data.data; // { flights, count }
};

export const searchFlightsTP = async ({ origin, destination, departureAt, returnAt, limit }) => {
  const params = new URLSearchParams({ origin, destination, departureAt });
  if (returnAt) params.append('returnAt', returnAt);
  if (limit)    params.append('limit', String(limit));

  const res = await fetch(`${API_URL}/api/flights/tp-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data; // { flights, count }
};
