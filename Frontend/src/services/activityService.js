import { getAccessToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    if (process.env.NODE_ENV === 'development') {
      console.debug('logActivity failed silently:', err?.message);
    }
    return null;
  }
};

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
