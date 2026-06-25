/**
 * User Activity Service (client)
 *
 * Lightweight fire-and-forget client. Logging never blocks the UI and never
 * throws — if the user is not authenticated we silently no-op.
 */

import { getAccessToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Read the PlanMyDay cached location ({ location, ts, ... }) without importing
 * planMyDayService — we want this service to stay leaf-level / no-circular.
 */
const readCachedLocationLite = () => {
  try {
    const raw = sessionStorage.getItem('pmd_loc_v1');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || Date.now() - obj.ts > 10 * 60 * 1000) return null;
    return obj.location || null;
  } catch {
    return null;
  }
};

/** Build a tidy location snapshot from the cached PlanMyDay location, if any. */
const snapshotLocation = () => {
  const loc = readCachedLocationLite();
  if (!loc) return undefined;
  const snap = {};
  if (loc.city)         snap.city = loc.city;
  if (loc.country)      snap.country = loc.country;
  if (loc.neighborhood) snap.neighborhood = loc.neighborhood;
  if (typeof loc.lat === 'number') snap.lat = loc.lat;
  if (typeof loc.lng === 'number') snap.lng = loc.lng;
  return Object.keys(snap).length ? snap : undefined;
};

/**
 * Record an activity for the current user.
 * @param {object}  payload
 * @param {string}  payload.type      — e.g. 'trip', 'plan_my_day', 'page', 'flight'
 * @param {string}  payload.action    — e.g. 'created', 'viewed', 'searched'
 * @param {string} [payload.title]    — human-readable label that lands in prompts
 * @param {object} [payload.metadata] — destination, dates, vibe, budget, etc.
 * @param {object} [payload.location] — overrides the cached location snapshot
 */
export const logActivity = async ({ type, action, title, metadata, location }) => {
  const token = getAccessToken();
  if (!token || !type || !action) return null;

  const body = {
    type,
    action,
    title: title || `${type}:${action}`,
    metadata: metadata || {},
    location: location || snapshotLocation()
  };

  try {
    // Fire-and-forget — do NOT await for the UI's sake. We still return the
    // promise so callers can chain if they want.
    const resp = await fetch(`${API_BASE_URL}/api/activity/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch (err) {
    // Logging must never break a flow.
    if (process.env.NODE_ENV === 'development') {
      console.debug('logActivity failed silently:', err?.message);
    }
    return null;
  }
};

/** Get the lightweight summary the ViAssistant uses for its opening bubble. */
export const getActivityContext = async () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const resp = await fetch(`${API_BASE_URL}/api/activity/context`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.data || null;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('getActivityContext failed:', err?.message);
    }
    return null;
  }
};

export default { logActivity, getActivityContext };
