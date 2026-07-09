import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = getAccessToken();
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
};

const get = async (path) => {
  const res = await fetch(`${API_BASE}/api/admin${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getAdminStats    = ()              => get('/stats');
export const getAdminUsers    = (page, search)  => get(`/users?page=${page}&search=${encodeURIComponent(search || '')}`);
export const getAdminActivity = (type, page)    => get(`/activity?type=${type || ''}&page=${page || 1}`);

export const deactivateUser = async (id) => {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
