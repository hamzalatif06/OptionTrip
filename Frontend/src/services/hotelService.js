const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const searchHotelLocations = async (term) => {
  if (!term || term.trim().length < 2) return [];
  try {
    const res  = await fetch(`${API_URL}/api/hotels/locations?term=${encodeURIComponent(term.trim())}`);
    const data = await res.json();
    return data.success ? (data.data.locations || []) : [];
  } catch { return []; }
};

export const searchHotels = async ({ destId, searchType = 'CITY', checkIn, checkOut, adults, rooms = 1, cityName = '' }) => {
  const params = new URLSearchParams({ destId, searchType, checkIn, checkOut, adults: String(adults), rooms: String(rooms), cityName });
  const res  = await fetch(`${API_URL}/api/hotels/search?${params}`);
  const data = await res.json();
  if (!data.success) {
    const msg = typeof data.message === 'object' ? JSON.stringify(data.message) : (data.message || 'Hotel search failed');
    throw new Error(msg);
  }
  return data.data;
};

export const getHotelDetails = async (hotelId) => {
  try {
    const res  = await fetch(`${API_URL}/api/hotels/details?hotelId=${hotelId}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
};

export const getHotelRooms = async ({ hotelId, checkIn, checkOut, adults }) => {
  const params = new URLSearchParams({ hotelId, checkIn, checkOut, adults: String(adults) });
  const res  = await fetch(`${API_URL}/api/hotels/rooms?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to load rooms');
  return data.data.rooms || [];
};

export const getHotelPhotos = async (hotelId) => {
  try {
    const res  = await fetch(`${API_URL}/api/hotels/photos?hotelId=${hotelId}`);
    const data = await res.json();
    return data.success ? (data.data.photos || []) : [];
  } catch { return []; }
};
