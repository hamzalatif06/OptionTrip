/**
 * Hotelbeds API Service
 *
 * Availability API:  POST /hotel-api/1.0/hotels
 * Content API:       GET  /hotel-content-api/1.0/hotels
 * Auth:              Api-key header + X-Signature = SHA256(apiKey + secret + unixTimestamp)
 */

import { createHash } from 'crypto';

const API_KEY   = process.env.HOTELBEDS_API_KEY || '';
const SECRET    = process.env.HOTELBEDS_SECRET  || '';
const BASE      = process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com';
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER || '370056';

const PHOTO_BASE = 'https://photos.hotelbeds.com/giata';

// Hotel IDs are prefixed so the controller can route to the right service.
// Format: "HB_{hotelCode}_{destinationCode}"
export const HB_PREFIX = 'HB_';

// ── Auth ─────────────────────────────────────────────────────────────────────

const getSignature = () => {
  const ts = Math.floor(Date.now() / 1000);
  return createHash('sha256').update(`${API_KEY}${SECRET}${ts}`).digest('hex');
};

const getHeaders = () => ({
  'Api-key':        API_KEY,
  'X-Signature':    getSignature(),
  'Accept':         'application/json',
  'Accept-Encoding':'gzip',
  'Content-Type':   'application/json',
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const nightCount = (checkIn, checkOut) =>
  Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));

const buildBookingUrl = ({ destinationCode, hotelCode, checkIn, checkOut, adults }) => {
  const nights = nightCount(checkIn, checkOut);
  const params = new URLSearchParams({
    marker:      TP_MARKER,
    destination: destinationCode,
    hotel:       String(hotelCode),
    checkIn,
    nights:      String(nights),
    adults:      String(adults),
    lang:        'en',
  });
  return `https://search.hotellook.com/?${params.toString()}`;
};

const boardLabel = (code) => {
  const map = { RO: 'Room only', BB: 'Bed & Breakfast', HB: 'Half Board', FB: 'Full Board', AI: 'All Inclusive' };
  return map[code] || code || '';
};

// ── Normalisers ───────────────────────────────────────────────────────────────

const normaliseRoom = (room, rate, { checkIn, checkOut, adults, destinationCode, hotelCode, currency }) => {
  // Non-refundable: rateClass NRF or first cancellation policy has no free window
  const isRefundable = rate.rateClass !== 'NRF' &&
    (rate.cancellationPolicies || []).every(p => parseFloat(p.amount || '1') === 0);

  return {
    blockId:    `${hotelCode}-${room.code}-${rate.rateKey || ''}`,
    name:       room.name || room.code || 'Room',
    photo:      '',
    bed:        '',
    facilities: rate.boardName ? [boardLabel(rate.boardCode)] : [],
    price:      parseFloat(rate.net || 0),
    currency:   currency || 'EUR',
    refundable: isRefundable,
    breakfast:  ['BB', 'HB', 'FB', 'AI'].includes(rate.boardCode),
    bookingUrl: buildBookingUrl({ destinationCode, hotelCode, checkIn, checkOut, adults }),
  };
};

const normaliseHotel = (h, photos, { cityName, destinationCode, checkIn, checkOut, adults }) => {
  // Currency is at the hotel level, not the rate level
  const currency = h.currency || 'EUR';

  // Best (cheapest) rate across all room types
  let minPrice  = null;
  const preloadedRooms = [];

  for (const room of (h.rooms || [])) {
    for (const rate of (room.rates || [])) {
      const price = parseFloat(rate.net || 0);
      if (price <= 0) continue;
      if (minPrice === null || price < minPrice) minPrice = price;
      preloadedRooms.push(normaliseRoom(room, rate, { checkIn, checkOut, adults, destinationCode, hotelCode: h.code, currency }));
    }
  }

  const starMatch = (h.categoryCode || '').match(/^(\d)/);
  const stars     = starMatch ? parseInt(starMatch[1]) : 0;

  return {
    hotelId:        `${HB_PREFIX}${h.code}_${destinationCode}`,
    name:           h.name || '',
    stars,
    rating:         null,
    ratingWord:     '',
    reviewCount:    0,
    photos,
    imageUrl:       photos[0] || '',
    location:       { name: h.destinationName || cityName || destinationCode, country: h.countryCode || '' },
    price:          minPrice !== null ? Math.round(minPrice) : null,
    currency,
    checkin:        '',
    checkout:       '',
    bookingUrl:     buildBookingUrl({ destinationCode, hotelCode: h.code, checkIn, checkOut, adults }),
    checkIn,
    checkOut,
    adults,
    source:         'hotelbeds',
    preloadedRooms: preloadedRooms.filter(r => r.price > 0).sort((a, b) => a.price - b.price),
  };
};

// ── Batch image fetch ─────────────────────────────────────────────────────────

const PREFERRED_TYPES = new Set(['GEN', 'FAC', 'HAB', 'PIS', 'COM']);

const fetchImages = async (hotelCodes) => {
  if (!hotelCodes.length) return {};
  try {
    const url = `${BASE}/hotel-content-api/1.0/hotels?fields=images&codes=${hotelCodes.join(',')}&language=ENG&from=1&to=${hotelCodes.length}&useSecondaryLanguage=false`;
    const res  = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return {};
    const data = await res.json();
    const map  = {};
    for (const hotel of (data.hotels || [])) {
      map[hotel.code] = (hotel.images || [])
        .filter(i => PREFERRED_TYPES.has(i.imageTypeCode))
        .sort((a, b) => (a.visualOrder || a.order || 99) - (b.visualOrder || b.order || 99))
        .slice(0, 5)
        .map(i => `${PHOTO_BASE}/${i.path}`);
    }
    return map;
  } catch {
    return {};
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search available hotels via Hotelbeds Availability API.
 * @param {{ destinationCode, checkIn, checkOut, adults?, rooms?, cityName? }}
 * @returns {Promise<Array>} Normalised hotel objects sorted by price
 */
export const searchHotelsHotelbeds = async ({
  destinationCode,
  checkIn,
  checkOut,
  adults  = 1,
  rooms   = 1,
  cityName = '',
}) => {
  if (!API_KEY || !SECRET) throw new Error('Hotelbeds API not configured');

  const body = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms, adults, children: 0 }],
    destination: { code: destinationCode.toUpperCase() },
    filter:      { maxHotels: 30, maxRooms: 5, maxRatesPerRoom: 2 },
  };

  console.log(`🏨 Hotelbeds availability: ${destinationCode} | ${checkIn} → ${checkOut} | ${adults} adult(s)`);

  const res = await fetch(`${BASE}/hotel-api/1.0/hotels`, {
    method:  'POST',
    headers: getHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hotelbeds availability error (${res.status}): ${text}`);
  }

  const data      = await res.json();
  const hotelList = data.hotels?.hotels || [];
  console.log(`✅ Hotelbeds: ${hotelList.length} hotel(s) for ${destinationCode}`);

  if (!hotelList.length) return [];

  const imageMap = await fetchImages(hotelList.map(h => h.code));

  return hotelList
    .map(h => normaliseHotel(h, imageMap[h.code] || [], { cityName, destinationCode, checkIn, checkOut, adults }))
    .filter(h => h.price !== null)
    .sort((a, b) => a.price - b.price);
};

/**
 * Get hotel details (facilities, description, photos) for a single hotel.
 * @param {number|string} hotelCode  Raw Hotelbeds hotel code (without HB_ prefix)
 * @returns {Promise<{facilities, description, photos}>}
 */
export const getHotelbedsDetails = async (hotelCode) => {
  try {
    const url = `${BASE}/hotel-content-api/1.0/hotels?fields=images,facilities,description&codes=${hotelCode}&language=ENG&from=1&to=1&useSecondaryLanguage=false`;
    const res  = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return { facilities: [], description: '', photos: [] };

    const data  = await res.json();
    const hotel = (data.hotels || [])[0] || {};

    const facilities = (hotel.facilities || [])
      .slice(0, 12)
      .map(f => f.description?.content || '')
      .filter(Boolean);

    const description = hotel.description?.content || '';

    const photos = (hotel.images || [])
      .sort((a, b) => (a.visualOrder || 99) - (b.visualOrder || 99))
      .slice(0, 10)
      .map(i => `${PHOTO_BASE}/${i.path}`);

    return { facilities, description, photos };
  } catch {
    return { facilities: [], description: '', photos: [] };
  }
};

/**
 * Get available rooms for a specific Hotelbeds hotel.
 * Re-calls the availability API filtered to a single hotel.
 * @param {{ hotelCode, destinationCode, checkIn, checkOut, adults?, rooms? }}
 * @returns {Promise<Array>} Normalised room objects
 */
export const getHotelbedsRooms = async ({
  hotelCode,
  destinationCode,
  checkIn,
  checkOut,
  adults = 1,
  rooms  = 1,
}) => {
  if (!API_KEY || !SECRET) throw new Error('Hotelbeds API not configured');

  const body = {
    stay:        { checkIn, checkOut },
    occupancies: [{ rooms, adults, children: 0 }],
    destination: { code: destinationCode.toUpperCase() },
    hotels:      { hotels: [parseInt(hotelCode, 10)] },
    filter:      { maxHotels: 1, maxRooms: 10, maxRatesPerRoom: 3 },
  };

  const res = await fetch(`${BASE}/hotel-api/1.0/hotels`, {
    method:  'POST',
    headers: getHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hotelbeds rooms error (${res.status}): ${text}`);
  }

  const data     = await res.json();
  const hotel    = (data.hotels?.hotels || [])[0] || {};
  const currency = hotel.currency || 'EUR';
  const result   = [];

  for (const room of (hotel.rooms || [])) {
    for (const rate of (room.rates || [])) {
      const price = parseFloat(rate.net || 0);
      if (price <= 0) continue;
      result.push(normaliseRoom(room, rate, { checkIn, checkOut, adults, destinationCode, hotelCode, currency }));
    }
  }

  return result.filter(r => r.price > 0).sort((a, b) => a.price - b.price);
};
