/**
 * Amadeus Travel API Service
 *
 * Handles:
 *  - OAuth 2.0 client_credentials token fetch + in-memory caching
 *  - Flight Offers Search (GET /v2/shopping/flight-offers)
 *  - Response normalization to a simplified shape
 *  - MVP booking URL builder (Google Flights deep link)
 */

import { AMADEUS_CONFIG } from '../config/amadeus.js';

// ── Token cache ───────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0; // Unix ms

/**
 * Fetch (or return cached) Amadeus OAuth token.
 * Refreshes automatically when within 60 s of expiry.
 */
export const getAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  if (!AMADEUS_CONFIG.clientId || !AMADEUS_CONFIG.clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET is not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_CONFIG.clientId,
    client_secret: AMADEUS_CONFIG.clientSecret,
  });

  const res = await fetch(`${AMADEUS_CONFIG.baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Amadeus token request failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  console.log('✅ Amadeus OAuth token refreshed');
  return cachedToken;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format ISO 8601 duration (e.g. "PT2H35M") → "2h 35m"
 */
const formatDuration = (iso) => {
  if (!iso) return '';
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ');
};

/**
 * Build a Google Flights deep link for MVP booking.
 */
const buildBookingUrl = (offer, params) => {
  const seg = offer.itineraries?.[0]?.segments?.[0];
  const origin = seg?.departure?.iataCode || params.originCode;
  const destination = seg?.arrival?.iataCode || params.destinationCode;
  const date = params.departureDate;
  const q = `Flights from ${origin} to ${destination} on ${date}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
};

/**
 * Normalize a raw Amadeus flight offer into a simple flat object.
 */
const normalizeOffer = (offer, params) => {
  const itineraries = (offer.itineraries || []).map(itin => ({
    totalDuration: formatDuration(itin.duration),
    segments: (itin.segments || []).map(seg => ({
      carrierCode: seg.carrierCode,
      flightNumber: seg.number,
      departure: {
        iataCode: seg.departure?.iataCode,
        terminal: seg.departure?.terminal,
        time: seg.departure?.at,
      },
      arrival: {
        iataCode: seg.arrival?.iataCode,
        terminal: seg.arrival?.terminal,
        time: seg.arrival?.at,
      },
      duration: formatDuration(seg.duration),
    })),
  }));

  const numberOfStops = itineraries[0]?.segments?.length
    ? itineraries[0].segments.length - 1
    : 0;

  return {
    id: offer.id,
    price: offer.price?.grandTotal,
    currency: offer.price?.currency,
    validatingCarrier: offer.validatingAirlineCodes?.[0],
    lastTicketingDate: offer.lastTicketingDate,
    numberOfStops,
    itineraries,
    bookingUrl: buildBookingUrl(offer, params),
  };
};

// ── Main search function ──────────────────────────────────────────────────────

/**
 * Search for flight offers via Amadeus API.
 *
 * @param {object} params
 * @param {string} params.originCode          IATA airport code (e.g. "JFK")
 * @param {string} params.destinationCode     IATA airport code (e.g. "LAX")
 * @param {string} params.departureDate       YYYY-MM-DD
 * @param {string} [params.returnDate]        YYYY-MM-DD (round-trip)
 * @param {number} [params.adults=1]
 * @param {number} [params.children=0]
 * @param {string} [params.currencyCode]      ISO 4217 (e.g. "USD")
 * @param {number} [params.max=20]            Max results
 * @returns {Promise<Array>} Normalized flight offers
 */
/**
 * Search airports/cities by keyword (for autocomplete).
 * Calls GET /v1/reference-data/locations
 */
export const searchAirports = async (keyword) => {
  if (!keyword || keyword.trim().length < 2) return [];

  try {
    const token = await getAccessToken();
    const query = new URLSearchParams({
      subType: 'AIRPORT,CITY',
      keyword: keyword.trim(),
      'page[limit]': '8',
    });

    const res = await fetch(
      `${AMADEUS_CONFIG.baseUrl}/v1/reference-data/locations?${query.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.data || []).map(loc => ({
      iataCode:    loc.iataCode,
      name:        loc.name,
      cityName:    loc.address?.cityName || loc.name,
      countryName: loc.address?.countryName || '',
      subType:     loc.subType,
    }));
  } catch {
    return [];
  }
};

export const searchFlights = async (params) => {
  const {
    originCode,
    destinationCode,
    departureDate,
    returnDate,
    adults = 1,
    children = 0,
    currencyCode = 'USD',
    max = 20,
  } = params;

  const token = await getAccessToken();

  const query = new URLSearchParams({
    originLocationCode: originCode.toUpperCase(),
    destinationLocationCode: destinationCode.toUpperCase(),
    departureDate,
    adults: String(adults),
    max: String(max),
    currencyCode,
  });

  if (returnDate) query.set('returnDate', returnDate);
  if (children > 0) query.set('children', String(children));

  const url = `${AMADEUS_CONFIG.baseUrl}/v2/shopping/flight-offers?${query.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody?.errors?.[0]?.detail || errBody?.errors?.[0]?.title || res.statusText;
    throw new Error(`Amadeus flight search failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const offers = data.data || [];

  console.log(`✅ Amadeus returned ${offers.length} flight offer(s) for ${originCode} → ${destinationCode}`);
  return offers.map(offer => normalizeOffer(offer, params));
};
