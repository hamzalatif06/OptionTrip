const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const searchCarLocations = async (query) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const res  = await fetch(`${API_URL}/api/cars/locations?query=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    return data.success ? (data.data.locations || []) : [];
  } catch { return []; }
};

export const searchCars = async ({
  pickUpPlaceId,
  dropOffPlaceId,
  pickUpDate,
  dropOffDate,
  pickUpTime  = '10:00',
  dropOffTime = '10:00',
  driverAge   = 30,
  currency    = 'USD',
}) => {
  const params = new URLSearchParams({
    pickUpPlaceId,
    dropOffPlaceId: dropOffPlaceId || pickUpPlaceId,
    pickUpDate,
    dropOffDate,
    pickUpTime,
    dropOffTime,
    driverAge: String(driverAge),
    currency,
  });
  const res  = await fetch(`${API_URL}/api/cars/search?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Car search failed');
  return data.data;
};
