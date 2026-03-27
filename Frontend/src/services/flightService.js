const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  return data.data; // { flights, count }
};

/**
 * Search for flights via Travelpayouts Aviasales API.
 *
 * @param {{ origin: string, destination: string, departureAt: string, returnAt?: string, limit?: number }}
 * @returns {Promise<{ flights: Array, count: number }>}
 */
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
