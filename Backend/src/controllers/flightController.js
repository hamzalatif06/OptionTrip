/**
 * Flight Controller
 * Handles flight search requests via Amadeus API.
 */

import { searchFlights as amadeusSearchFlights } from '../services/amadeusService.js';
import { searchFlights as tpSearchFlights } from '../services/travelpayoutsFlightService.js';
import { searchFlightsGoogle } from '../services/googleFlightsService.js';

/**
 * GET /api/flights/airports?keyword=Paris
 * Proxies Travelpayouts places2 autocomplete (free, no auth required).
 */
export const getAirports = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }
    const params = new URLSearchParams({ term: keyword.trim(), locale: 'en', 'types[]': 'airport' });
    const apiRes = await fetch(`https://autocomplete.travelpayouts.com/places2?${params.toString()}`);
    if (!apiRes.ok) return res.json({ success: true, data: { locations: [] } });
    const raw = await apiRes.json();
    const locations = raw.map((item) => ({
      iataCode:    item.code,
      name:        item.name,
      cityName:    item.city_name || item.name,
      countryName: item.country_name || '',
    }));
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

/**
 * GET /api/flights/google-search?origin=LAX&destination=JFK&departureDate=2026-04-15&adults=1[&returnDate=...]
 * Returns real-time flights via Google Flights (RapidAPI). Book Now → Aviasales affiliate.
 */
export const searchFlightsGoogleHandler = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, message: 'origin, destination and departureDate are required' });
    }

    const flights = await searchFlightsGoogle({
      origin,
      destination,
      departureDate,
      returnDate:  returnDate || null,
      adults:      Number(adults),
      travelClass,
    });

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found',
      data: { flights, count: flights.length },
    });
  } catch (error) {
    console.error('❌ Google Flights search error:', error.message);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/tp-search?origin=LHR&destination=DXB&departureAt=2026-04-01[&returnAt=2026-04-05][&limit=20]
 * Returns real flight offers via Travelpayouts Aviasales API.
 */
export const searchFlightsTravelpayouts = async (req, res) => {
  try {
    const { origin, destination, departureAt, returnAt, limit } = req.query;

    console.log(`✈️  TP flight search: ${origin} → ${destination} on ${departureAt}`);

    const flights = await tpSearchFlights({
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureAt,
      returnAt:    returnAt || null,
      limit:       limit ? parseInt(limit, 10) : 20,
    });

    console.log(`✅ TP flight search complete — ${flights.length} result(s)`);

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: { flights, count: flights.length },
    });
  } catch (error) {
    console.error('❌ TP flight search error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Flight search failed',
      error: error.message,
    });
  }
};
