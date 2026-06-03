/**
 * Car Rental Service — Booking.com Cars via booking-com15 RapidAPI
 */

const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';

const getHeaders = () => ({
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key':  process.env.RAPIDAPI_KEY || '',
});

const apiFetch = async (path, params = {}) => {
  const url = `https://${RAPIDAPI_HOST}${path}?${new URLSearchParams(params)}`;
  console.log(`🚗 Cars API: ${path}`, Object.fromEntries(new URLSearchParams(params)));
  const res  = await fetch(url, { method: 'GET', headers: getHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Cars API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  if (json.status === false) {
    const msg = typeof json.message === 'string'
      ? json.message
      : JSON.stringify(json.message || 'API error');
    throw new Error(msg);
  }
  return json.data;
};

// ── Location autocomplete ─────────────────────────────────────────────────────

export const searchCarLocations = async (query) => {
  if (!process.env.RAPIDAPI_KEY) { console.error('❌ RAPIDAPI_KEY not set'); return []; }
  try {
    const data = await apiFetch('/api/v1/cars/searchDestination', { query: query.trim() });
    const list = Array.isArray(data) ? data : (data?.locations || []);
    return list.slice(0, 8).map(item => ({
      placeId:  item.place_id  || item.placeId || item.id || '',
      name:     item.city_name || item.name    || item.address || '',
      address:  item.address   || item.name    || '',
      type:     item.type      || 'CITY',
    })).filter(l => l.placeId);
  } catch (err) {
    console.error('❌ Car location search error:', err.message);
    return [];
  }
};

// ── Car search ────────────────────────────────────────────────────────────────

const normalisePrice = (raw) => {
  if (!raw) return null;
  // booking-com15 returns price in various shapes
  const total  = parseFloat(raw.total_price || raw.total || raw.amount || raw.price || 0);
  const perDay = parseFloat(raw.base_price  || raw.per_day || raw.daily || 0);
  const currency = raw.currency || raw.currencyCode || 'USD';
  if (!total && !perDay) return null;
  return { total, perDay, currency };
};

const normaliseCar = (item) => {
  const info  = item.vehicle_info  || item.vehicle || item;
  const price = normalisePrice(item.price || item.pricing || item.rate);
  if (!price) return null;

  return {
    id:           item.vehicle_id || item.id || `${Math.random()}`,
    name:         item.vehicle_name || info.name || info.model || 'Car',
    category:     info.category || info.car_class || info.type || 'Standard',
    seats:        info.seats  || info.passenger_quantity || 5,
    doors:        info.doors  || info.door_count || 4,
    bags:         info.bags   || info.baggage    || 1,
    transmission: info.transmission || 'Automatic',
    hasAC:        info.air_conditioning !== false,
    fuelPolicy:   info.fuel_policy || 'Full to Full',
    mileage:      info.mileage     || 'Unlimited',
    image:        item.image_url   || item.image || info.image || '',
    supplier: {
      name: item.supplier?.name || item.company?.name || item.vendor?.name || 'Rental Company',
      logo: item.supplier?.logo || item.company?.logo || item.vendor?.logo || '',
    },
    price,
    rating: parseFloat(item.rating || item.review_score || 0) || null,
    bookUrl: item.book_url || item.booking_url || '',
  };
};

export const searchCars = async ({
  pickUpPlaceId,
  dropOffPlaceId,
  pickUpDate,
  dropOffDate,
  pickUpTime  = '10:00',
  dropOffTime = '10:00',
  driverAge   = 30,
  currency    = 'USD',
}) => {
  if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not set');

  const params = {
    pick_up_place_id:  pickUpPlaceId,
    drop_off_place_id: dropOffPlaceId || pickUpPlaceId,
    pick_up_date:      pickUpDate,
    drop_off_date:     dropOffDate,
    pick_up_time:      pickUpTime,
    drop_off_time:     dropOffTime,
    driver_age:        String(driverAge),
    currency_code:     currency,
  };

  const data  = await apiFetch('/api/v1/cars/search', params);
  const raw   = Array.isArray(data) ? data : (data?.cars || data?.results || data?.search_results || []);

  const cars = raw
    .map(normaliseCar)
    .filter(Boolean)
    .sort((a, b) => (a.price?.total || 0) - (b.price?.total || 0));

  console.log(`✅ Cars found: ${cars.length}`);
  return cars;
};
