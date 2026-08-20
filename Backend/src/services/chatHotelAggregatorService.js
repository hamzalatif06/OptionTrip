import { searchHotelLocations } from './travelpayoutsService.js';
import { searchHotelsWithFallback } from './hotelSearchService.js';

const TOP_N = 6;

export const resolveHotelDestination = async (cityName) => {
  if (!cityName) return null;
  try {
    const matches = await searchHotelLocations(cityName);
    return matches[0]?.cityCode || null;
  } catch {
    return null;
  }
};

export const aggregateHotelSearch = async ({ destination, checkIn, checkOut, adults = 1, rooms = 1 }) => {
  const destId = await resolveHotelDestination(destination);

  const { hotels, source } = await searchHotelsWithFallback({
    destId: destId || '',
    cityName: destination,
    checkIn,
    checkOut,
    adults,
    rooms
  });

  const results = hotels
    .filter(h => typeof h.price === 'number' && h.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, TOP_N)
    .map(h => ({ ...h, source: h.source || source }));

  return {
    results,
    providerStatus: { [source || 'hotels']: hotels.length ? 'ok' : 'no_results' },
    searchParams: { destination, destId, checkIn, checkOut, adults, rooms }
  };
};

export default { resolveHotelDestination, aggregateHotelSearch };
