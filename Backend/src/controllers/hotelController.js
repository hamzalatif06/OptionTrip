import {
  searchHotelLocations as tpSearchLocations,
} from '../services/travelpayoutsService.js';
import {
  searchDestination,
  searchHotels    as bookingSearchHotels,
  getHotelDetails as bookingGetDetails,
  getRoomList     as bookingGetRooms,
  getHotelPhotos  as bookingGetPhotos,
  getReviewScores as bookingGetReviews,
} from '../services/bookingHotelService.js';
import {
  searchHotelsHotelbeds,
  getHotelbedsDetails,
  getHotelbedsRooms,
  HB_PREFIX,
} from '../services/hotelbedsService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse "HB_{hotelCode}_{destCode}" back into its parts. */
const parseHbId = (hotelId) => {
  const inner = hotelId.slice(HB_PREFIX.length); // e.g. "12345_DXB"
  const idx   = inner.indexOf('_');
  if (idx === -1) return { hotelCode: inner, destinationCode: '' };
  return {
    hotelCode:       inner.slice(0, idx),
    destinationCode: inner.slice(idx + 1),
  };
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getHotelLocations = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim().length < 2)
      return res.status(400).json({ success: false, message: 'term must be at least 2 characters' });

    const tpLocations = await tpSearchLocations(term.trim());

    const locations = tpLocations.map(loc => ({
      destId:     loc.cityCode,
      name:       loc.name,
      countryName: loc.countryName,
      searchType: 'CITY',
    }));

    console.log(`📍 Returning ${locations.length} location(s) for "${term}"`);
    res.json({ success: true, data: { locations } });
  } catch (err) {
    console.error('❌ Hotel location search error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchHotels = async (req, res) => {
  const { destId, searchType = 'CITY', checkIn, checkOut, adults = 1, rooms = 1, cityName = '' } = req.query;

  if (!destId || !checkIn || !checkOut)
    return res.status(400).json({ success: false, message: 'destId, checkIn and checkOut are required' });

  // ── 1. Try Hotelbeds (primary) ────────────────────────────────────────────
  try {
    const hotels = await searchHotelsHotelbeds({
      destinationCode: destId,
      checkIn,
      checkOut,
      adults:  Number(adults),
      rooms:   Number(rooms),
      cityName,
    });

    if (hotels.length > 0) {
      console.log(`🏨 Hotelbeds: ${hotels.length} hotel(s) for ${destId}`);
      return res.json({ success: true, data: { hotels, count: hotels.length, source: 'hotelbeds' } });
    }

    console.log(`⚠️  Hotelbeds: 0 results for "${destId}" — trying Booking.com fallback`);
  } catch (err) {
    console.warn(`⚠️  Hotelbeds failed for "${destId}": ${err.message} — trying Booking.com fallback`);
  }

  // ── 2. Fallback to Booking.com (via RapidAPI) ─────────────────────────────
  // Booking.com uses its own destination IDs, so we resolve the city name first.
  try {
    const searchTerm = cityName || destId;
    const destinations = await searchDestination(searchTerm);

    if (destinations.length > 0) {
      const dest = destinations[0];
      const hotels = await bookingSearchHotels({
        destId:     dest.destId,
        searchType: dest.searchType || 'CITY',
        checkIn,
        checkOut,
        adults:   Number(adults),
        rooms:    Number(rooms),
        cityName: dest.name || cityName,
      });

      if (hotels.length > 0) {
        console.log(`🏨 Booking.com fallback: ${hotels.length} hotel(s) for "${searchTerm}"`);
        return res.json({ success: true, data: { hotels, count: hotels.length, source: 'booking' } });
      }
    }
  } catch (err) {
    console.warn(`⚠️  Booking.com fallback failed: ${err.message}`);
  }

  return res.json({ success: true, data: { hotels: [], count: 0 } });
};

export const getHotelDetailsHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    let details;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode } = parseHbId(hotelId);
      details = await getHotelbedsDetails(hotelCode);
    } else {
      details = await bookingGetDetails(hotelId);
    }

    res.json({ success: true, data: details });
  } catch (err) {
    console.error('❌ Hotel details error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getRoomListHandler = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, adults = 1, rooms = 1 } = req.query;
    if (!hotelId || !checkIn || !checkOut)
      return res.status(400).json({ success: false, message: 'hotelId, checkIn and checkOut required' });

    let roomList;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode, destinationCode } = parseHbId(hotelId);
      roomList = await getHotelbedsRooms({
        hotelCode,
        destinationCode,
        checkIn,
        checkOut,
        adults: Number(adults),
        rooms:  Number(rooms),
      });
    } else {
      roomList = await bookingGetRooms({ hotelId, checkIn, checkOut, adults: Number(adults) });
    }

    res.json({ success: true, data: { rooms: roomList } });
  } catch (err) {
    console.error('❌ Room list error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getHotelPhotosHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    let photos;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode } = parseHbId(hotelId);
      const details = await getHotelbedsDetails(hotelCode);
      photos = details.photos || [];
    } else {
      photos = await bookingGetPhotos(hotelId);
    }

    res.json({ success: true, data: { photos } });
  } catch (err) {
    console.error('❌ Hotel photos error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getReviewScoresHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    // Hotelbeds doesn't provide review scores — return null gracefully
    if (hotelId.startsWith(HB_PREFIX)) {
      return res.json({ success: true, data: null });
    }

    const scores = await bookingGetReviews(hotelId);
    res.json({ success: true, data: scores });
  } catch (err) {
    console.error('❌ Review scores error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};
