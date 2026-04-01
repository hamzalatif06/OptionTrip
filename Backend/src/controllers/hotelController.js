import {
  searchDestination,
  searchHotels   as bookingSearchHotels,
  getHotelDetails as bookingGetDetails,
  getRoomList     as bookingGetRooms,
  getHotelPhotos  as bookingGetPhotos,
  getReviewScores as bookingGetReviews,
} from '../services/bookingHotelService.js';

export const getHotelLocations = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim().length < 2)
      return res.status(400).json({ success: false, message: 'term must be at least 2 characters' });
    const locations = await searchDestination(term.trim());
    console.log(`📍 Returning ${locations.length} location(s) for "${term}"`);
    res.json({ success: true, data: { locations } });
  } catch (err) {
    console.error('❌ Hotel location search error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchHotels = async (req, res) => {
  try {
    const { destId, searchType = 'CITY', checkIn, checkOut, adults = 1, rooms = 1, cityName = '' } = req.query;
    if (!destId || !checkIn || !checkOut)
      return res.status(400).json({ success: false, message: 'destId, checkIn and checkOut are required' });
    const hotels = await bookingSearchHotels({ destId, searchType, checkIn, checkOut, adults: Number(adults), rooms: Number(rooms), cityName });
    res.json({ success: true, data: { hotels, count: hotels.length } });
  } catch (err) {
    console.error('❌ Hotel search error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getHotelDetailsHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });
    const details = await bookingGetDetails(hotelId);
    res.json({ success: true, data: details });
  } catch (err) {
    console.error('❌ Hotel details error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getRoomListHandler = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, adults = 1 } = req.query;
    if (!hotelId || !checkIn || !checkOut)
      return res.status(400).json({ success: false, message: 'hotelId, checkIn and checkOut required' });
    const rooms = await bookingGetRooms({ hotelId, checkIn, checkOut, adults: Number(adults) });
    res.json({ success: true, data: { rooms } });
  } catch (err) {
    console.error('❌ Room list error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getHotelPhotosHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });
    const photos = await bookingGetPhotos(hotelId);
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
    const scores = await bookingGetReviews(hotelId);
    res.json({ success: true, data: scores });
  } catch (err) {
    console.error('❌ Review scores error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};
