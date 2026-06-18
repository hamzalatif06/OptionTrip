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

/* ═════════════════════════════════════════════════════════════════════════
   Location detection — robust, multi-stage strategy.

   The goal is a precise neighborhood-level location. We use a layered
   approach because no single source is reliable everywhere:

   1. PROGRESSIVE GPS REFINEMENT (watchPosition + high accuracy)
      The first fix from the browser is often WiFi/IP-based and can be
      hundreds of meters off. By watching for ~10-12s, the radio gets a
      real GPS lock and accuracy drops to <50m. We keep the best fix.

   2. DUAL REVERSE-GEOCODER (Nominatim + BigDataCloud)
      Run both in parallel; pick the most specific neighborhood between
      them. Nominatim has great global coverage but coarse polygons in
      some regions; BigDataCloud often has the actual residential name.

   3. IP-BASED FALLBACK (ipapi.co)
      If GPS is denied or fails entirely, fall back to IP geolocation
      so the form is at least usable.

   4. SESSION CACHE
      Once we have a good fix, cache it for 10 minutes so reloads don't
      re-prompt or re-spin.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Progressive GPS detection. Returns the best (smallest-radius) fix
 * collected over the watch window.
 *
 * @param {Object}   [opts]
 * @param {number}   [opts.targetAccuracyM=40] — resolve early once accuracy ≤ this
 * @param {number}   [opts.hardTimeoutMs=12000] — give up watching after this long
 * @param {Function} [opts.onUpdate] — called each time the best fix improves
 *                                     ({ lat, lng, accuracy })
 */
export const detectPreciseLocation = ({
  targetAccuracyM = 40,
  hardTimeoutMs   = 12000,
  onUpdate
} = {}) => new Promise((resolve, reject) => {
  if (!('geolocation' in navigator)) {
    reject(new Error('Geolocation not supported'));
    return;
  }

  let bestFix = null;
  let watchId = null;
  let resolved = false;

  const finalize = (reason) => {
    if (resolved) return;
    resolved = true;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    clearTimeout(timer);
    if (bestFix) resolve({ ...bestFix, finalReason: reason });
    else reject(new Error('No location fix received'));
  };

  const timer = setTimeout(() => finalize('timeout'), hardTimeoutMs);

  watchId = navigator.geolocation.watchPosition(
    ({ coords }) => {
      const fix = {
        lat:      coords.latitude,
        lng:      coords.longitude,
        accuracy: coords.accuracy
      };
      if (!bestFix || fix.accuracy < bestFix.accuracy) {
        bestFix = fix;
        try { onUpdate?.(fix); } catch { /* user-callback errors must not break detection */ }
      }
      if (bestFix.accuracy <= targetAccuracyM) finalize('target-reached');
    },
    (err) => {
      // Permission denied / position unavailable. If we already have ANY fix,
      // keep going (the timer will resolve with the best one). Otherwise fail.
      if (!bestFix) {
        clearTimeout(timer);
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        resolved = true;
        reject(err);
      }
    },
    { enableHighAccuracy: true, timeout: hardTimeoutMs, maximumAge: 0 }
  );
});

// ─── Individual reverse-geocode providers ──────────────────────────────────

const reverseNominatim = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
      `&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const j = await res.json();
    const a = j.address || {};
    return {
      source: 'nominatim',
      city:         a.city || a.town || a.municipality || a.village || a.county || '',
      country:      a.country || '',
      country_code: (a.country_code || '').toUpperCase(),
      neighborhood:
        a.residential   ||
        a.neighbourhood ||
        a.suburb        ||
        a.quarter       ||
        a.city_district ||
        a.hamlet        ||
        ''
    };
  } catch { return null; }
};

const reverseBigDataCloud = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const j = await res.json();

    // BDC's `localityInfo.administrative` is a hierarchy of admin levels —
    // higher `order` values are more granular (neighborhood-scale). Find the
    // most granular one that isn't just the city.
    let granular = '';
    const adminLevels = j.localityInfo?.administrative || [];
    const cityName    = j.city || j.locality || '';
    const sorted      = [...adminLevels].sort((a, b) => (b.order || 0) - (a.order || 0));
    for (const lvl of sorted) {
      if (!lvl?.name) continue;
      if (lvl.name === cityName) continue;
      if (lvl.adminLevel >= 8 || (lvl.order || 0) >= 8) { granular = lvl.name; break; }
    }
    if (!granular && j.locality && j.locality !== j.city) granular = j.locality;

    return {
      source: 'bigdatacloud',
      city:         j.city || j.locality || j.principalSubdivision || '',
      country:      j.countryName || '',
      country_code: (j.countryCode || '').toUpperCase(),
      neighborhood: granular
    };
  } catch { return null; }
};

/**
 * Reverse-geocode by running multiple providers in parallel and merging
 * for best precision. Returns the most-specific neighborhood across all
 * providers, while preferring Nominatim for city/country (broader coverage).
 */
export const reverseGeocodeRobust = async (lat, lng) => {
  const [ns, bdc] = await Promise.all([
    reverseNominatim(lat, lng),
    reverseBigDataCloud(lat, lng)
  ]);

  if (!ns && !bdc) return null;

  // Most-specific neighborhood: prefer the longer non-empty string distinct
  // from the city name. Length is a decent proxy for specificity (e.g.
  // "Johar Town" > "Lahore"), and we explicitly reject names matching the
  // city itself.
  const cityCandidate = ns?.city || bdc?.city || '';
  const pickNeighborhood = () => {
    const candidates = [ns?.neighborhood, bdc?.neighborhood]
      .filter(Boolean)
      .filter(n => n.toLowerCase() !== cityCandidate.toLowerCase());
    if (!candidates.length) return '';
    return candidates.sort((a, b) => b.length - a.length)[0];
  };

  return {
    city:         cityCandidate,
    country:      ns?.country || bdc?.country || '',
    country_code: ns?.country_code || bdc?.country_code || '',
    neighborhood: pickNeighborhood(),
    providers: {
      nominatim:    ns?.neighborhood || null,
      bigdatacloud: bdc?.neighborhood || null
    }
  };
};

/**
 * Legacy single-provider reverse geocode — kept for any other callers.
 */
export const reverseGeocode = reverseNominatim;

/**
 * IP-based geolocation as a last-resort fallback when GPS is unavailable.
 * Very coarse (city-level, ~10km radius) but better than nothing.
 */
export const ipGeolocate = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const j = await res.json();
    if (typeof j.latitude !== 'number') return null;
    return {
      city:         j.city || '',
      country:      j.country_name || '',
      country_code: (j.country_code || '').toUpperCase(),
      neighborhood: '',
      lat:          j.latitude,
      lng:          j.longitude,
      accuracy_m:   10000,
      source:       'ip'
    };
  } catch { return null; }
};

// ─── Session cache for the detected location ───────────────────────────────

const LOC_CACHE_KEY = 'pmd_loc_v1';
const LOC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const readCachedLocation = () => {
  try {
    const raw = sessionStorage.getItem(LOC_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || Date.now() - obj.ts > LOC_CACHE_TTL_MS) return null;
    return obj;
  } catch { return null; }
};

export const writeCachedLocation = (location, accuracy_m, source) => {
  try {
    sessionStorage.setItem(LOC_CACHE_KEY, JSON.stringify({
      location, accuracy_m, source, ts: Date.now()
    }));
  } catch { /* sessionStorage may be unavailable in private mode */ }
};

export const clearCachedLocation = () => {
  try { sessionStorage.removeItem(LOC_CACHE_KEY); } catch { /* noop */ }
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
