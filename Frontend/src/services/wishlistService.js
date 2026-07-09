import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` })
});

export const getWishlist = async () => {
  const token = getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, { headers: authHeaders(token) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || [];
  } catch { return []; }
};

export const addToWishlist = async ({ destinationName, country, imageUrl, notes }) => {
  const token = getAccessToken();
  if (!token) throw new Error('not_authenticated');
  const res = await fetch(`${API_BASE}/api/wishlist`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ destinationName, country, imageUrl, notes })
  });
  if (!res.ok) throw new Error('add_failed');
  const data = await res.json();
  return data.data?.item;
};

export const removeFromWishlist = async (id) => {
  const token = getAccessToken();
  if (!token) throw new Error('not_authenticated');
  const res = await fetch(`${API_BASE}/api/wishlist/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  if (!res.ok) throw new Error('remove_failed');
  return true;
};
