import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authedFetch = async (path, options = {}) => {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  return resp.json();
};

export const createTripStoryEntry = (payload) =>
  authedFetch('/api/tripstory', { method: 'POST', body: JSON.stringify(payload) });

export const getMyTripStoryEntries = () =>
  authedFetch('/api/tripstory/mine');

export const getEntriesForTrip = (tripId) =>
  authedFetch(`/api/tripstory/trip/${tripId}`);

export const getPublicEntriesNearCity = async (city) => {
  const resp = await fetch(`${API_BASE}/api/tripstory/near?city=${encodeURIComponent(city)}`);
  return resp.json();
};

export const deleteTripStoryEntry = (id) =>
  authedFetch(`/api/tripstory/${id}`, { method: 'DELETE' });

export const refineTripStoryText = (text, mode) =>
  authedFetch('/api/tripstory/refine-text', { method: 'POST', body: JSON.stringify({ text, mode }) });

export const previewMediaLink = (url) =>
  authedFetch('/api/tripstory/preview-link', { method: 'POST', body: JSON.stringify({ url }) });

export default {
  createTripStoryEntry, getMyTripStoryEntries, getEntriesForTrip, getPublicEntriesNearCity,
  deleteTripStoryEntry, refineTripStoryText, previewMediaLink
};
