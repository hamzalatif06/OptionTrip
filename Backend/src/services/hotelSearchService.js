import { searchHotelsHotelbeds } from './hotelbedsService.js';
import { searchDestination, searchHotels as bookingSearchHotels } from './bookingHotelService.js';

export const searchHotelsWithFallback = async ({ destId, cityName = '', checkIn, checkOut, adults = 1, rooms = 1 }) => {
  if (destId) {
    try {
      const hotels = await searchHotelsHotelbeds({ destinationCode: destId, checkIn, checkOut, adults, rooms, cityName });
      if (hotels.length > 0) return { hotels, source: 'hotelbeds' };
    } catch (err) {
      console.warn(`⚠️  Hotelbeds failed for "${destId}": ${err.message} — trying Booking.com fallback`);
    }
  }

  try {
    const searchTerm = cityName || destId;
    const destinations = await searchDestination(searchTerm);
    if (destinations.length > 0) {
      const dest = destinations[0];
      const hotels = await bookingSearchHotels({
        destId: dest.destId,
        searchType: dest.searchType || 'CITY',
        checkIn, checkOut, adults, rooms,
        cityName: dest.name || cityName
      });
      if (hotels.length > 0) return { hotels, source: 'booking' };
    }
  } catch (err) {
    console.warn(`⚠️  Booking.com fallback failed: ${err.message}`);
  }

  return { hotels: [], source: null };
};

export default { searchHotelsWithFallback };
