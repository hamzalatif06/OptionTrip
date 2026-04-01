/**
 * Booking.com Hotel Service (via RapidAPI booking-com15)
 */

const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const AID           = process.env.TRAVELPAYOUTS_MARKER || '370056';

const getHeaders = () => ({
  'Content-Type':    'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key':  process.env.RAPIDAPI_KEY || '',
});

const apiFetch = async (path, params) => {
  const url = `https://${RAPIDAPI_HOST}${path}?${new URLSearchParams(params)}`;
  console.log(`🌐 ${path} →`, Object.fromEntries(new URLSearchParams(params)));
  const res  = await fetch(url, { method: 'GET', headers: getHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Booking API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  if (!json.status) {
    // message can be a string, object, or array of objects
    const msg = Array.isArray(json.message)
      ? json.message.map(m => (typeof m === 'object' ? (m.message || m.messages || JSON.stringify(m)) : String(m))).join('; ')
      : (typeof json.message === 'object' ? JSON.stringify(json.message) : String(json.message || 'API error'));
    console.error(`❌ API returned status=false: ${msg}`, json);
    throw new Error(msg);
  }
  return json.data;
};

// ── Destination autocomplete ──────────────────────────────────────────────────
export const searchDestination = async (query) => {
  if (!process.env.RAPIDAPI_KEY) { console.error('❌ RAPIDAPI_KEY not set'); return []; }
  console.log(`🔍 Hotel destination search: "${query}"`);
  try {
    const data = await apiFetch('/api/v1/hotels/searchDestination', { query: query.trim() });
    const list = Array.isArray(data) ? data : [];
    console.log(`📍 Destination items: ${list.length}`);
    return list
      .filter(d => d.dest_id)
      .slice(0, 8)
      .map(d => ({
        destId:      d.dest_id,
        searchType:  (d.dest_type || d.search_type || 'city').toUpperCase(),
        name:        d.city_name || d.name || '',
        label:       d.label || d.name || d.city_name || '',
        countryName: d.country || '',
      }));
  } catch (err) {
    console.error('❌ Destination search:', err.message);
    return [];
  }
};

// ── Hotel search ──────────────────────────────────────────────────────────────
export const searchHotels = async ({ destId, searchType = 'CITY', checkIn, checkOut, adults = 1, rooms = 1, cityName = '' }) => {
  if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');
  console.log(`🏨 Hotel search: ${cityName || destId} | ${checkIn} → ${checkOut}`);
  const data = await apiFetch('/api/v1/hotels/searchHotels', {
    dest_id:       destId,
    search_type:   searchType,
    arrival_date:  checkIn,
    departure_date: checkOut,
    adults:        String(adults),
    room_qty:      String(rooms),
    page_number:   '1',
    languagecode:  'en-us',
    currency_code: 'USD',
    units:         'metric',
    location:      'US',
  });
  const raw = data?.hotels || [];
  console.log(`✅ Booking.com: ${raw.length} hotel(s)`);
  return raw.map(h => normaliseHotel(h, { checkIn, checkOut, adults, destId, searchType, cityName }));
};

// ── Hotel details + facilities ────────────────────────────────────────────────
export const getHotelDetails = async (hotelId) => {
  const data = await apiFetch('/api/v1/hotels/getHotelDetails', { hotel_id: hotelId, languagecode: 'en-us' });
  const facilities = (data?.facilities_block?.facilities || []).slice(0, 12).map(f => f.name || f.facility_name || '').filter(Boolean);
  const description = data?.description?.description || data?.hotel_description || '';
  const photos = (data?.photos || []).slice(0, 10).map(p => p.url_max1280 || p.url_original || p.url || '').filter(Boolean);
  return { facilities, description, photos };
};

// ── Room list with prices ─────────────────────────────────────────────────────
export const getRoomList = async ({ hotelId, checkIn, checkOut, adults }) => {
  const data = await apiFetch('/api/v1/hotels/getRoomList', {
    hotel_id:       hotelId,
    arrival_date:   checkIn,
    departure_date: checkOut,
    adults:         String(adults),
    room_qty:       '1',
    currency_code:  'USD',
    languagecode:   'en-us',
    units:          'metric',
    location:       'US',
  });

  const roomsMeta = data?.rooms || {};
  const blocks    = data?.block  || [];

  return blocks.slice(0, 8).map(b => {
    const meta  = roomsMeta[b.room_id] || {};
    const photo = (meta.photos || [])[0];
    const bed   = (meta.bed_configurations || [])[0]?.bed_types?.[0]?.name_with_count || '';
    const price = b.min_price?.price ?? b.price_breakdown?.gross_price ?? null;
    const currency = b.min_price?.currency ?? b.price_breakdown?.currency ?? 'USD';

    // Booking URL
    let bookingUrl = b.url || '';
    if (bookingUrl) {
      bookingUrl = bookingUrl.includes('?') ? `${bookingUrl}&aid=${AID}` : `${bookingUrl}?aid=${AID}`;
    } else {
      bookingUrl = `https://www.booking.com/hotel/x/${hotelId}.html?checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&aid=${AID}`;
    }

    return {
      blockId:     b.block_id || b.room_id || '',
      name:        b.name || meta.room_name || 'Room',
      photo:       photo?.url_max1280 || photo?.url_original || '',
      bed,
      facilities:  (meta.facilities || []).slice(0, 5).map(f => f.name || '').filter(Boolean),
      price,
      currency,
      refundable:  !!b.refundable,
      breakfast:   !!(b.free_breakfast || b.breakfast_included),
      bookingUrl,
    };
  }).filter(r => r.price !== null);
};

// ── Hotel photos ──────────────────────────────────────────────────────────────
export const getHotelPhotos = async (hotelId) => {
  try {
    const data = await apiFetch('/api/v1/hotels/getHotelPhotos', { hotel_id: hotelId });
    return (Array.isArray(data) ? data : [])
      .slice(0, 12)
      .map(p => p.url_max1280 || p.url_original || p.url || '')
      .filter(Boolean);
  } catch {
    return [];
  }
};

// ── Review scores ─────────────────────────────────────────────────────────────
export const getReviewScores = async (hotelId) => {
  try {
    const data = await apiFetch('/api/v1/hotels/getHotelReviewScores', { hotel_id: hotelId, languagecode: 'en-us' });
    const cats = (data?.review_score_breakdown || data?.score_breakdown || []).slice(0, 6).map(c => ({
      name:  c.question || c.category || '',
      score: parseFloat(c.score || c.average_score || 0).toFixed(1),
    }));
    return { overall: data?.review_score || null, word: data?.review_score_word || '', categories: cats };
  } catch {
    return null;
  }
};

// ── Normaliser ────────────────────────────────────────────────────────────────
const normaliseHotel = (h, { checkIn, checkOut, adults, destId, searchType, cityName }) => {
  const prop = h.property || {};
  const id   = prop.id ?? h.hotel_id ?? '';

  const grossPrice = prop.priceBreakdown?.grossPrice;
  const price      = grossPrice?.value ?? prop.priceBreakdown?.excludedPrice?.value ?? null;
  const currency   = grossPrice?.currency ?? 'USD';

  const photos = (prop.photoUrls || []).slice(0, 5);

  let bookingUrl = '';
  if (prop.url) {
    bookingUrl = prop.url.includes('?') ? `${prop.url}&aid=${AID}` : `${prop.url}?aid=${AID}`;
  } else {
    const bp = new URLSearchParams({ dest_id: destId, dest_type: searchType.toLowerCase(), checkin: checkIn, checkout: checkOut, group_adults: String(adults), aid: AID, no_rooms: '1' });
    if (id) bp.set('hotel_id', String(id));
    bookingUrl = `https://www.booking.com/searchresults.html?${bp}`;
  }

  return {
    hotelId:     String(id),
    name:        prop.name ?? h.hotel_name ?? '',
    stars:       prop.starRating ?? prop.class ?? 0,
    rating:      prop.reviewScore ?? null,
    ratingWord:  prop.reviewScoreWord ?? '',
    reviewCount: prop.reviewCount ?? 0,
    photos,
    imageUrl:    photos[0] || '',
    location:    { name: prop.wishlistName ?? cityName ?? '', country: prop.countryCode ?? '' },
    price,
    currency,
    checkin:     prop.checkin?.fromTime ?? '',
    checkout:    prop.checkout?.untilTime ?? '',
    bookingUrl,
    checkIn,
    checkOut,
    adults,
  };
};
