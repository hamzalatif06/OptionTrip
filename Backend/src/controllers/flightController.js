/**
 * Flight Controller
 * Handles flight search requests via Amadeus API.
 */

import { searchFlights as amadeusSearchFlights, searchAirports as amadeusSearchAirports } from '../services/amadeusService.js';

/**
 * GET /api/flights/airports?keyword=Paris
 * Returns matching airports/cities for autocomplete.
 */
export const getAirports = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }
    const locations = await amadeusSearchAirports(keyword.trim());
    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('❌ Airport search error:', error.message);
    res.status(500).json({ success: false, message: 'Airport search failed', error: error.message });
  }
};

/**
 * POST /api/flights/search
 * Body: { originCode, destinationCode, departureDate, returnDate?, adults, children?, currencyCode? }
 */
export const searchFlights = async (req, res) => {
  try {
    const {
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      adults,
      children = 0,
      currencyCode = 'USD',
    } = req.body;

    console.log(`📋 Flight search: ${originCode} → ${destinationCode} on ${departureDate}, adults: ${adults}`);

    const flights = await amadeusSearchFlights({
      originCode,
      destinationCode,
      departureDate,
      returnDate: returnDate || null,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    });

    console.log(`✅ Flight search complete — ${flights.length} result(s)`);

    res.status(200).json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: {
        flights,
        count: flights.length,
        searchParams: {
          originCode: originCode.toUpperCase(),
          destinationCode: destinationCode.toUpperCase(),
          departureDate,
          returnDate: returnDate || null,
          adults: Number(adults),
          children: Number(children),
        },
      },
    });
  } catch (error) {
    console.error('❌ Flight search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search flights',
      error: error.message,
    });
  }
};
