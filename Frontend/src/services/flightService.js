const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { getDestinationImage as getCachedDestinationImage } from '../utils/destinationImages';

export const searchAirports = async (keyword) => {
  if (!keyword || keyword.trim().length < 2) return [];
  try {
    const res = await fetch(
      `${API_URL}/api/flights/airports?keyword=${encodeURIComponent(keyword.trim())}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.locations || [];
  } catch {
    return [];
  }
};

export const searchFlights = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate,
  adults,
  children = 0,
  currencyCode = 'USD',
}) => {
  const res = await fetch(`${API_URL}/api/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originCode: originCode.trim().toUpperCase(),
      destinationCode: destinationCode.trim().toUpperCase(),
      departureDate,
      returnDate: returnDate || undefined,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    if (data.errors?.length) {
      throw new Error(data.errors.join('. '));
    }
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data;
};

export const searchFlightsGoogle = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate    = null,
  adults        = 1,
  travelClass   = 'ECONOMY',
  includeNearby = false,
  radius        = 250,
}) => {
  const params = new URLSearchParams({
    origin:        originCode.trim().toUpperCase(),
    destination:   destinationCode.trim().toUpperCase(),
    departureDate,
    adults:        String(adults),
    travelClass,
  });
  if (returnDate)    params.append('returnDate',    returnDate);
  if (includeNearby) { params.append('includeNearby', 'true'); params.append('radius', String(radius)); }

  const res  = await fetch(`${API_URL}/api/flights/google-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Flight search failed');
  return data.data;
};

export const fetchMonthlyPrices = async ({ origin, destination, month }) => {
  try {
    const params = new URLSearchParams({ origin, destination, month });
    const res  = await fetch(`${API_URL}/api/flights/monthly-prices?${params}`);
    const data = await res.json();
    return data.success ? (data.data?.prices || {}) : {};
  } catch { return {}; }
};

export const fetchNearbyAirports = async ({ iata, radius = 250, limit = 3 }) => {
  try {
    const params = new URLSearchParams({ iata, radius: String(radius), limit: String(limit) });
    const res  = await fetch(`${API_URL}/api/flights/nearby-airports?${params}`);
    const data = await res.json();
    return data.success ? (data.data?.nearby || []) : [];
  } catch { return []; }
};

export const exploreDestinations = async (origin) => {
  try {
    const res  = await fetch(`${API_URL}/api/flights/explore?origin=${encodeURIComponent(origin)}`);
    const data = await res.json();
    return data.success ? (data.data?.prices || {}) : {};
  } catch {
    return {};
  }
};

export const getDestinationImage = async (query) => {
  if (!query || query.trim().length < 2) return null;
  return {
    imageUrl: getCachedDestinationImage(query),
    source: 'unsplash-source',
  };
};

export const getCheapPrice = async ({ origin, destination, departDate }) => {
  try {
    const params = new URLSearchParams({ origin, destination, departDate });
    const res  = await fetch(`${API_URL}/api/flights/cheap-price?${params}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
};

export const searchFlightsDuffel = async ({
  originCode,
  destinationCode,
  departureDate,
  returnDate    = null,
  adults        = 1,
  travelClass   = 'economy',
  includeNearby = false,
  radius        = 250,
}) => {
  const params = new URLSearchParams({
    origin:      originCode.trim().toUpperCase(),
    destination: destinationCode.trim().toUpperCase(),
    departureDate,
    adults:      String(adults),
    travelClass,
  });
  if (returnDate)    params.append('returnDate',    returnDate);
  if (includeNearby) { params.append('includeNearby', 'true'); params.append('radius', String(radius)); }

  const res  = await fetch(`${API_URL}/api/flights/duffel-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) throw new Error(data.message || 'Duffel flight search failed');
  return data.data;
};

export const searchFlightsTP = async ({ origin, destination, departureAt, returnAt, limit }) => {
  const params = new URLSearchParams({ origin, destination, departureAt });
  if (returnAt) params.append('returnAt', returnAt);
  if (limit)    params.append('limit', String(limit));

  const res = await fetch(`${API_URL}/api/flights/tp-search?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || 'Flight search failed');
  }

  return data.data;
};
