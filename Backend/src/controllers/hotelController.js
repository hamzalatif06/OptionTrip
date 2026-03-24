/**
 * Hotel Controller
 * Handles hotel location autocomplete and hotel search via Travelpayouts Hotellook API.
 */

import {
  searchHotelLocations as tpSearchLocations,
  searchHotels as tpSearchHotels,
} from '../services/travelpayoutsService.js';

/**
 * GET /api/hotels/locations?term=Paris
 * Returns matching cities for autocomplete.
 */
export const getHotelLocations = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'term must be at least 2 characters' });
    }
    const locations = await tpSearchLocations(term.trim());
    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('❌ Hotel location search error:', error.message);
    res.status(500).json({ success: false, message: 'Location search failed', error: error.message });
  }
};

/**
 * GET /api/hotels/search?cityCode=PAR&checkIn=2026-05-01&checkOut=2026-05-07&adults=2
 * Returns hotels with prices and affiliate booking links.
 */
export const searchHotels = async (req, res) => {
  try {
    const { cityCode, checkIn, checkOut, adults } = req.query;

    console.log(`📋 Hotel search: ${cityCode} | ${checkIn} → ${checkOut} | adults: ${adults}`);

    const hotels = await tpSearchHotels({
      cityCode:  cityCode.trim().toUpperCase(),
      checkIn,
      checkOut,
      adults:    Number(adults),
      limit:     20,
    });

    console.log(`✅ Hotel search complete — ${hotels.length} result(s)`);

    res.status(200).json({
      success: true,
      message: hotels.length > 0 ? 'Hotels found' : 'No hotels found for this city and dates',
      data: {
        hotels,
        count: hotels.length,
        searchParams: { cityCode: cityCode.toUpperCase(), checkIn, checkOut, adults: Number(adults) },
      },
    });
  } catch (error) {
    console.error('❌ Hotel search error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to search hotels', error: error.message });
  }
};
