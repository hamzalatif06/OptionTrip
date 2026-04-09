/**
 * Google Flights Service (via RapidAPI)
 * Returns real-time flight results. Book Now redirects via Aviasales affiliate.
 */

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY  || '';
const RAPIDAPI_HOST = 'google-flights2.p.rapidapi.com';
const TP_MARKER     = process.env.TRAVELPAYOUTS_MARKER || '370056';

// Build Aviasales affiliate booking URL from flight data
const buildBookingUrl = ({ origin, destination, departureDate, returnDate, adults }) => {
  // Aviasales format: /search/{FROM}{DD}{MM}{TO}[{TO}{DD}{MM}{FROM}]{adults}
  const fmt = (dateStr) => {
    const [, mm, dd] = dateStr.split('-'); // YYYY-MM-DD
    return `${dd}${mm}`;
  };
  let path = `${origin}${fmt(departureDate)}${destination}`;
  if (returnDate) path += `${destination}${fmt(returnDate)}${origin}`;
  path += String(adults);
  return `https://www.aviasales.com/search/${path}?marker=${TP_MARKER}`;
};

// Extract HH:MM from time strings like "2025-2-1 08:34" or "01-02-2025 08:34 AM"
const extractTime = (raw) => {
  if (!raw) return '';
  // "2025-2-1 08:34" → "08:34"
  // "01-02-2025 08:34 AM" → "08:34 AM"
  const parts = String(raw).trim().split(' ');
  return parts.length >= 2 ? parts.slice(1).join(' ') : raw;
};

// duration field in segments can be a number (minutes) or {raw,text}
const durationText = (d) => {
  if (!d) return '';
  if (typeof d === 'number') {
    const h = Math.floor(d / 60), m = d % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  }
  return d.text || '';
};

// Parse price to a clean per-person integer.
// google-flights2 returns the TOTAL price for all passengers, so divide by adults.
const parsePrice = (raw, adults = 1) => {
  const val = raw.price ?? null;
  if (val === null || val === undefined) return null;
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : Number(val);
  if (isNaN(n) || n <= 0) return null;
  return Math.round(n / Math.max(1, adults));
};

// Extract key amenities from the extensions array
const parseAmenities = (extensions = []) => {
  const result = { wifi: false, power: false, video: false, usb: false };
  for (const ext of extensions) {
    const s = String(ext).toLowerCase();
    if (s.includes('wi-fi'))                 result.wifi  = true;
    if (s.includes('power'))                 result.power = true;
    if (s.includes('usb'))                   result.usb   = true;
    if (s.includes('video') || s.includes('entertainment')) result.video = true;
  }
  return result;
};

// Normalise a raw API itinerary into a clean object
const normalise = (raw, { origin, destination, departureDate, returnDate, adults }) => {
  const segs = raw.flights || [];
  const first = segs[0] || {};
  const last  = segs[segs.length - 1] || first;

  // All unique airlines for multi-stop
  const airlines = [...new Set(segs.map(s => s.airline).filter(Boolean))];

  // Layovers — docs format: { airport_code, airport_name, duration_label, duration, city }
  const layovers = (raw.layovers || []).map(l => ({
    id:       l.airport_code || '',
    name:     l.airport_name || l.city || '',
    duration: l.duration_label || durationText(l.duration) || '',
    overnight: !!l.overnight,
  }));

  return {
    id:            raw.next_token || raw.booking_token || `${origin}-${destination}-${Date.now()}-${Math.random()}`,
    departureTime: extractTime(first.departure_airport?.time) || raw.departure_time || '',
    arrivalTime:   extractTime(last.arrival_airport?.time)   || raw.arrival_time   || '',
    duration:      raw.duration?.text || durationText(raw.duration) || '',
    origin:        first.departure_airport?.airport_code || origin,
    destination:   last.arrival_airport?.airport_code   || destination,
    originName:    first.departure_airport?.airport_name || '',
    destName:      last.arrival_airport?.airport_name   || '',
    stops:         segs.length > 1 ? segs.length - 1 : (raw.stops ?? 0),
    layovers,
    airline:       airlines.join(' · '),
    airlineLogo:   first.airline_logo || raw.airline_logo || '',
    flightNumber:  segs.map(s => s.flight_number).filter(Boolean).join(', '),
    aircraft:      first.aircraft || '',
    price:         parsePrice(raw, adults),
    currency:      'USD',
    bags:          raw.bags || { carry_on: 0, checked: 0 },
    legroom:       first.legroom || '',
    seatType:      first.seat   || '',   // e.g. "Above average legroom"
    amenities:     parseAmenities(first.extensions || []),
    co2:           raw.carbon_emissions?.difference_percent ?? null,
    bookingUrl:    buildBookingUrl({ origin, destination, departureDate, returnDate, adults }),
  };
};

/**
 * Search real-time flights via Google Flights (RapidAPI).
 *
 * @param {{ origin, destination, departureDate, returnDate?, adults, travelClass? }}
 * @returns {Promise<Array>}
 */
export const searchFlightsGoogle = async ({
  origin,
  destination,
  departureDate,
  returnDate  = null,
  adults      = 1,
  travelClass = 'ECONOMY',
}) => {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const params = new URLSearchParams({
    departure_id:  origin.toUpperCase(),
    arrival_id:    destination.toUpperCase(),
    outbound_date: departureDate,
    travel_class:  travelClass,
    adults:        String(adults),
    currency:      'USD',
    language_code: 'en-US',
    country_code:  'US',
    search_type:   'best',
    show_hidden:   '1',
  });
  if (returnDate) params.set('return_date', returnDate);

  const url = `https://${RAPIDAPI_HOST}/api/v1/searchFlights?${params.toString()}`;
  console.log(`✈️  Google Flights search: ${origin} → ${destination} on ${departureDate}`);

  const RETRIES = 3;
  let res;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key':  RAPIDAPI_KEY,
        'Content-Type':    'application/json',
      },
    });
    if (res.ok) break;
    if ((res.status === 502 || res.status === 504) && attempt < RETRIES) {
      const delay = attempt * 1500;
      console.log(`⚠️  Google Flights ${res.status} — retry ${attempt}/${RETRIES - 1} in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new Error(`Google Flights API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.status) {
    const msg = Array.isArray(data.message)
      ? data.message.map(m => Object.values(m).join(', ')).join('; ')
      : data.message || 'Unknown API error';
    throw new Error(msg);
  }

  const ctx = { origin: origin.toUpperCase(), destination: destination.toUpperCase(), departureDate, returnDate, adults };

  // API returns either data.topFlights or data.itineraries.topFlights depending on version
  const itins  = data.data?.itineraries || data.data || {};
  const top    = (itins.topFlights   || []).map(f => normalise(f, ctx));
  const other  = (itins.otherFlights || []).map(f => normalise(f, ctx));
  const all    = [...top, ...other].filter(f => f.price !== null);

  console.log(`✅ Google Flights: ${all.length} result(s) for ${origin}→${destination}`);
  return all;
};
