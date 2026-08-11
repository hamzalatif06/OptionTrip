const gtag = (...args) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
};

export const trackPageView = (path) => {
  gtag('event', 'page_view', { page_path: path });
};

export const trackSearch = (type, query) => {
  gtag('event', 'search', {
    search_type: type,
    search_term: query,
  });
};

export const trackBookingClick = (provider, bookingType, destination, price) => {
  gtag('event', 'booking_click', {
    provider,
    booking_type: bookingType,
    destination,
    value: price || 0,
    currency: 'USD',
  });
};

export const trackTripGenerated = (destination, duration) => {
  gtag('event', 'trip_generated', {
    destination,
    duration_days: duration,
  });
};

export const trackPlanMyDayGenerated = (location, vibe) => {
  gtag('event', 'plan_my_day_generated', {
    location,
    vibe,
  });
};

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
