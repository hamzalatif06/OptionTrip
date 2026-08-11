import { getAccessToken } from './authService';

const API_BASE_URL     = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const NATIONALITY_KEY  = 'wcig_nationality_v1';

export const readLocalNationality = () => {
  try {
    const v = localStorage.getItem(NATIONALITY_KEY);
    return v && /^[A-Z]{3}$/.test(v) ? v : null;
  } catch { return null; }
};

export const writeLocalNationality = (code) => {
  try {
    if (code && /^[A-Z]{3}$/.test(code)) localStorage.setItem(NATIONALITY_KEY, code);
    else                                 localStorage.removeItem(NATIONALITY_KEY);
  } catch {}
};

const authHeaders = () => {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const fetchPassports = async () => {
  const resp = await fetch(`${API_BASE_URL}/api/where-can-i-go/passports`);
  if (!resp.ok) throw new Error('Failed to load passports');
  const json = await resp.json();
  return json?.data?.passports || [];
};

export const fetchDestinations = async (passport, opts = {}) => {
  const params = new URLSearchParams();
  params.set('passport', passport);
  if (opts.hideEmbassy) params.set('hideEmbassy', '1');
  if (opts.sortBy)      params.set('sortBy', opts.sortBy);
  const c = opts.comfort || {};
  if (c.halal)        params.set('halal', '1');
  if (c.prayer)       params.set('prayer', '1');
  if (c.conservative) params.set('conservative', '1');
  if (c.women_solo)   params.set('women_solo', '1');

  const resp = await fetch(`${API_BASE_URL}/api/where-can-i-go/destinations?${params.toString()}`, {
    headers: { ...authHeaders() }
  });
  if (!resp.ok) throw new Error('Failed to load destinations');
  const json = await resp.json();
  return json?.data || { passport: null, destinations: [] };
};

export const fetchDestinationDetail = async (passport, code) => {
  const params = new URLSearchParams({ passport });
  const resp = await fetch(
    `${API_BASE_URL}/api/where-can-i-go/destination/${encodeURIComponent(code)}?${params.toString()}`,
    { headers: { ...authHeaders() } }
  );
  if (!resp.ok) throw new Error('Failed to load destination');
  const json = await resp.json();
  return json?.data || null;
};

export const savePassportToProfile = async (nationality) => {
  const t = getAccessToken();
  if (!t) return { skipped: true };
  try {
    const resp = await fetch(`${API_BASE_URL}/api/where-can-i-go/passport`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body:    JSON.stringify({ nationality })
    });
    if (!resp.ok) return { success: false };
    return resp.json();
  } catch {
    return { success: false };
  }
};

export default {
  readLocalNationality,
  writeLocalNationality,
  fetchPassports,
  fetchDestinations,
  fetchDestinationDetail,
  savePassportToProfile
};
