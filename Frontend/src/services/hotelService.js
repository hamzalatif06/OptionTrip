const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Search cities by keyword for autocomplete.
 * @param {string} term
 * @returns {Promise<Array<{cityCode, name, countryName}>>}
 */
export const searchHotelLocations = async (term) => {
  if (!term || term.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_URL}/api/hotels/locations?term=${encodeURIComponent(term.trim())}`);
    const data = await res.json();
    if (!data.success) return [];
    return data.data.locations || [];
  } catch {
    return [];
  }
};

/**
 * Search hotels by city code + dates.
 * @param {{ cityCode: string, checkIn: string, checkOut: string, adults: number }}
 * @returns {Promise<{ hotels: Array, count: number }>}
 */
export const searchHotels = async ({ cityCode, checkIn, checkOut, adults }) => {
  const params = new URLSearchParams({
    cityCode,
    checkIn,
    checkOut,
    adults: String(adults),
  });
  const res = await fetch(`${API_URL}/api/hotels/search?${params.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.errors?.join(' ') || data.message || 'Hotel search failed');
  return data.data;
};
