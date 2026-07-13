/**
 * Analytics Service
 *
 * Thin wrapper around GA4 (gtag). Every function is fire-and-forget and
 * never throws — analytics must never break a user flow.
 *
 * To enable: add VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX to Frontend/.env
 */

const gtag = (...args) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
};

/** Track a page view. Called automatically by react-router integration. */
export const trackPageView = (path) => {
  gtag('event', 'page_view', { page_path: path });
};

/**
 * Track a search event.
 * @param {'flight'|'hotel'|'car'|'trip'|'plan_my_day'} type
 * @param {string} query  — destination or search term
 */
export const trackSearch = (type, query) => {
  gtag('event', 'search', {
    search_type: type,
    search_term: query,
  });
};

/**
 * Track a "Book Now" affiliate click.
 * @param {string} provider   — 'duffel' | 'google_flights' | 'travelpayouts' | 'booking_com' | etc.
 * @param {'flight'|'hotel'|'car'} bookingType
 * @param {string} destination
 * @param {number} [price]
 */
export const trackBookingClick = (provider, bookingType, destination, price) => {
  gtag('event', 'booking_click', {
    provider,
    booking_type: bookingType,
    destination,
    value: price || 0,
    currency: 'USD',
  });
};

/** Track when a full AI trip is generated (Phase 1 options). */
export const trackTripGenerated = (destination, duration) => {
  gtag('event', 'trip_generated', {
    destination,
    duration_days: duration,
  });
};

/** Track when PlanMyDay returns a result. */
export const trackPlanMyDayGenerated = (location, vibe) => {
  gtag('event', 'plan_my_day_generated', {
    location,
    vibe,
  });
};

/** Track sign-up / login. */
export const trackAuth = (method, action) => {
  gtag('event', action === 'signup' ? 'sign_up' : 'login', { method });
};

export default {
  trackPageView,
  trackSearch,
  trackBookingClick,
  trackTripGenerated,
  trackPlanMyDayGenerated,
  trackAuth,
};
