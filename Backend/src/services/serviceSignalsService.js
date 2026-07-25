/**
 * Service Signals Service
 * Deterministic (non-AI) detection of moments where nudging a user toward one
 * of OptionTrip's own services (eSIM, stays, car rental, tours, flights) is
 * genuinely useful — not just "AI decided to upsell". Used by both Vi's chat
 * replies (chatService.js) and the notification sweep (Phase 2).
 */

const ROAD_TRIP_TYPES = ['road trip', 'adventure', 'nature', 'safari', 'countryside'];
const CULTURAL_TYPES  = ['cultural', 'culture', 'adventure', 'city break', 'history', 'sightseeing'];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
};

const hasActivityForDestination = (activities, type, destination) => {
  if (!destination) return activities.some(a => a.type === type);
  const dest = destination.toLowerCase();
  return activities.some(a => {
    if (a.type !== type) return false;
    const md = a.metadata || {};
    const candidate = (md.destination || md.city || '').toLowerCase();
    return candidate.includes(dest) || dest.includes(candidate);
  });
};

const matchesAny = (value, list) => {
  if (!value) return false;
  const v = value.toLowerCase();
  return list.some(t => v.includes(t));
};

/**
 * @param {object} user
 * @param {object|null} trip  The current trip in focus (context.currentTrip).
 * @param {Array} recentActivities  UserActivity docs (fed or unfed).
 * @returns {Array<{service:string, reason:string, destination:string, url:string}>}
 */
export const computeServiceSignals = (user, trip, recentActivities = []) => {
  if (!trip) return [];

  const signals = [];
  const destination = trip.destination?.name || trip.destination?.text || '';
  const daysOut = daysUntil(trip.dates?.start_date);
  const isUpcoming = daysOut !== null && daysOut >= 0;

  // eSIM — upcoming international-feeling trip, no eSIM activity logged yet.
  if (isUpcoming && daysOut <= 14 && !hasActivityForDestination(recentActivities, 'esim', destination)) {
    signals.push({
      service: 'esim',
      reason: `trip to ${destination || 'their destination'} in ${daysOut} day(s), no eSIM activity logged`,
      destination,
      url: '/esim'
    });
  }

  // Car rental — road-trip/adventure style or a larger party, not yet booked.
  const roadTripSignal = matchesAny(trip.trip_type, ROAD_TRIP_TYPES) || (trip.guests?.total || 0) >= 3;
  if (roadTripSignal && !trip.selectedCar?.bookingUrl && !hasActivityForDestination(recentActivities, 'car', destination)) {
    signals.push({
      service: 'car',
      reason: `trip_type/party size suggests a car (${trip.trip_type || 'n/a'}, ${trip.guests?.total || 0} travelers), none booked`,
      destination,
      url: '/car-rental'
    });
  }

  // Stays — an option is selected/itinerary built but no hotel booked or searched.
  if (['option_selected', 'itinerary_generated'].includes(trip.status) &&
      !trip.selectedHotel?.bookingUrl &&
      !hasActivityForDestination(recentActivities, 'hotel', destination)) {
    signals.push({
      service: 'hotel',
      reason: `trip status is ${trip.status}, no stay selected or searched`,
      destination,
      url: '/hotels'
    });
  }

  // Tours — cultural/adventure interest signal, nothing booked/viewed yet.
  const culturalSignal = matchesAny(trip.trip_type, CULTURAL_TYPES) ||
    recentActivities.some(a => ['plan_my_day', 'destination'].includes(a.type) &&
      matchesAny(a.metadata?.vibe || a.metadata?.tripType, CULTURAL_TYPES));
  if (culturalSignal && !hasActivityForDestination(recentActivities, 'tours', destination)) {
    signals.push({
      service: 'tours',
      reason: `cultural/adventure interest detected, no tours activity for ${destination || 'this destination'}`,
      destination,
      url: '/tours'
    });
  }

  // Flights — an option is chosen but no flight booked.
  if (trip.status === 'option_selected' && !trip.selectedFlight?.bookingUrl) {
    signals.push({
      service: 'flight',
      reason: 'trip option selected, no flight booked yet',
      destination,
      url: '/flights'
    });
  }

  return signals;
};

export default { computeServiceSignals };
