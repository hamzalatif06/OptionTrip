/**
 * Plan My Day API client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Generate a day plan from the backend.
 * @param {Object} payload
 * @param {{ city, country, neighborhood, lat, lng }} payload.location
 * @param {string} payload.date           — 'YYYY-MM-DD'
 * @param {string} payload.startTime      — 'HH:MM'
 * @param {number} payload.durationHours
 * @param {string} payload.vibe
 * @param {string} payload.budget
 * @param {string[]} payload.interests
 * @param {number} payload.partySize
 */
export const generateDayPlan = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/api/plan-my-day/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let msg = 'Failed to generate day plan';
    try { const j = await res.json(); msg = j.message || msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  return res.json();
};

/**
 * Reverse geocode lat/lng → city / country / neighborhood via free Nominatim.
 *
 * Notes on accuracy:
 * - We request `zoom=18` (max precision) so we get the smallest OSM polygon
 *   the user actually sits inside. This is far more accurate than zoom=14,
 *   which often snaps to a large neighboring suburb.
 * - Some cities have sparse OSM suburb data (e.g. Lahore) — the result may
 *   still be off. The UI lets the user correct it manually.
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
      `&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const j = await res.json();
    const a = j.address || {};

    // Pick the most specific neighborhood-like field available. Order matters:
    // residential > neighbourhood > suburb > quarter > city_district > city_block.
    // Nominatim's `suburb` is often a coarse parent area; the more-granular keys
    // are usually correct when present.
    const neighborhood =
      a.residential   ||
      a.neighbourhood ||
      a.suburb        ||
      a.quarter       ||
      a.city_district ||
      a.hamlet        ||
      '';

    return {
      city:         a.city || a.town || a.municipality || a.village || a.county || '',
      country:      a.country || '',
      country_code: (a.country_code || '').toUpperCase(),
      neighborhood
    };
  } catch {
    return null;
  }
};

/**
 * Forward geocode a free-text city → coords + canonical name.
 */
export const forwardGeocode = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const arr = await res.json();
    if (!arr.length) return null;
    const r = arr[0];
    const a = r.address || {};
    return {
      city:         a.city || a.town || a.village || a.county || r.display_name?.split(',')[0] || query,
      country:      a.country || '',
      country_code: (a.country_code || '').toUpperCase(),
      neighborhood: a.suburb || a.neighbourhood || '',
      lat:          parseFloat(r.lat),
      lng:          parseFloat(r.lon)
    };
  } catch {
    return null;
  }
};

export default { generateDayPlan, reverseGeocode, forwardGeocode };
