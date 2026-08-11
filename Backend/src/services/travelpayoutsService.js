import { TP_CONFIG } from '../config/travelpayouts.js';

const _cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

const cacheGet = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.data;
};
const cacheSet = (key, data) => _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });

const buildAffiliateLink = ({ hotelId, checkIn, checkOut, adults }) => {
  const params = new URLSearchParams({
    hotelId:  String(hotelId),
    checkIn,
    checkOut,
    adults:   String(adults),
    language: 'en',
    marker:   TP_CONFIG.marker,
  });
  return `${TP_CONFIG.bookBase}/?${params.toString()}`;
};

export const searchHotelLocations = async (term) => {
  if (!term || term.trim().length < 2) return [];

  const cacheKey = `loc:${term.trim().toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const query = new URLSearchParams({
      locale: 'en',
      'types[]': 'city',
      term:   term.trim(),
      limit:  '8',
    });
    const res = await fetch(`${TP_CONFIG.autocompleteUrl}?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const locations = (Array.isArray(data) ? data : []).map(item => ({
      cityCode: item.code || item.iata || '',
      name:        item.name || item.city_name || '',
      countryName: item.country_name || '',
    })).filter(l => l.cityCode);

    cacheSet(cacheKey, locations);
    return locations;
  } catch {
    return [];
  }
};

export const searchHotels = async ({ cityCode, checkIn, checkOut, adults, limit = 20 }) => {
  const cacheKey = `hotels:${cityCode}:${checkIn}:${checkOut}:${adults}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log(`📦 Hotel cache hit for ${cityCode}`);
    return cached;
  }

  const query = new URLSearchParams({
    location: cityCode.toUpperCase(),
    checkIn,
    checkOut,
    adults:   String(adults),
    limit:    String(limit),
    token:    TP_CONFIG.token,
  });

  const url = `${TP_CONFIG.cacheUrl}?${query.toString()}`;
  console.log(`🏨 Hotellook search: ${cityCode} | ${checkIn} → ${checkOut} | adults: ${adults}`);

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!res.ok) {
    console.log(`ℹ️  Hotellook returned ${res.status} for ${cityCode} — falling back to Booking.com redirect`);
    return [];
  }

  const data = await res.json();

  const hotels = (Array.isArray(data) ? data : []).map(h => {
    const hotelId = h.id || h.hotelId;
    return {
      hotelId:     String(hotelId),
      name:        h.hotelName || h.name || 'Unknown Hotel',
      stars:       Number(h.stars) || 0,
      rating: h.guestScore ? (h.guestScore / 10) : null,
      reviewCount: h.guestScoreCount || 0,
      price:       h.priceFrom ? Math.round(h.priceFrom) : null,
      currency:    h.currency || 'USD',
      imageUrl:    `${TP_CONFIG.photoBase}/${hotelId}/800/520.auto`,
      bookingUrl:  buildAffiliateLink({ hotelId, checkIn, checkOut, adults }),
      location: {
        name:    h.locationName || cityCode,
        country: h.country || '',
      },
    };
  }).filter(h => h.price !== null);

  console.log(`✅ Hotellook returned ${hotels.length} hotel(s) for ${cityCode}`);
  cacheSet(cacheKey, hotels);
  return hotels;
};
