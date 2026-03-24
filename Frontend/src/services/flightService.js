const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Search airports/cities by keyword for autocomplete.
 * @param {string} keyword
 * @returns {Promise<Array<{iataCode, name, cityName, countryName, subType}>>}
 */
export const searchAirports = async (keyword) => {
  if (!keyword || keyword.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_URL}/api/flights/airports?keyword=${encodeURIComponent(keyword.trim())}`);
    const data = await res.json();
    if (!data.success) return [];
    return data.data.locations || [];
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
