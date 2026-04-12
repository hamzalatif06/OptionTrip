import React, { useState, useEffect } from 'react';
import { exploreDestinations, searchAirports } from '../../services/flightService';
import './ExploreDestinations.css';

/* ── Curated popular destinations with Unsplash photo IDs ── */
const DESTINATIONS = [
  { iata: 'DXB', city: 'Dubai',         country: 'UAE',          photo: 'photo-1518684079-3c830dcef090' },
  { iata: 'BKK', city: 'Bangkok',        country: 'Thailand',     photo: 'photo-1508009603885-50cf7c579365' },
  { iata: 'LHR', city: 'London',         country: 'UK',           photo: 'photo-1513635269975-59663e0ac1ad' },
  { iata: 'CDG', city: 'Paris',          country: 'France',       photo: 'photo-1502602898657-3e91760cbb34' },
  { iata: 'JFK', city: 'New York',       country: 'USA',          photo: 'photo-1496442226666-8d4d0e62e6e9' },
  { iata: 'NRT', city: 'Tokyo',          country: 'Japan',        photo: 'photo-1540959733332-eab4deabeeaf' },
  { iata: 'SIN', city: 'Singapore',      country: 'Singapore',    photo: 'photo-1525625293386-3f8f99389edd' },
  { iata: 'IST', city: 'Istanbul',       country: 'Turkey',       photo: 'photo-1541432901042-2d8bd64b4a9b' },
  { iata: 'FCO', city: 'Rome',           country: 'Italy',        photo: 'photo-1552832230-c0197dd311b5' },
  { iata: 'BCN', city: 'Barcelona',      country: 'Spain',        photo: 'photo-1539037116277-4db20889f2d4' },
  { iata: 'SYD', city: 'Sydney',         country: 'Australia',    photo: 'photo-1506973035872-a4ec16b8e8d9' },
  { iata: 'DPS', city: 'Bali',           country: 'Indonesia',    photo: 'photo-1537996194471-e657df975ab4' },
  { iata: 'KUL', city: 'Kuala Lumpur',   country: 'Malaysia',     photo: 'photo-1596422846543-75c6fc197f11' },
  { iata: 'MLE', city: 'Maldives',       country: 'Maldives',     photo: 'photo-1514282401047-d79a71a590e8' },
  { iata: 'ICN', city: 'Seoul',          country: 'South Korea',  photo: 'photo-1517154421773-0529f29ea451' },
  { iata: 'ATH', city: 'Athens',         country: 'Greece',       photo: 'photo-1555993539-1732b0258235' },
  { iata: 'AMS', city: 'Amsterdam',      country: 'Netherlands',  photo: 'photo-1534351590666-13e3e96b5017' },
  { iata: 'CAI', city: 'Cairo',          country: 'Egypt',        photo: 'photo-1572252009286-268acec5ca0a' },
  { iata: 'GRU', city: 'São Paulo',      country: 'Brazil',       photo: 'photo-1554224155-8d04cb21cd6c' },
  { iata: 'CPT', city: 'Cape Town',      country: 'South Africa', photo: 'photo-1580060839134-75a5edca2e99' },
];

const imgUrl = (photo) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&q=75`;

/** Resolve city string → { iata, display } or null */
const resolveOrigin = async (cityName) => {
  const locs = await searchAirports(cityName);
  if (!locs[0]) return null;
  const loc = locs[0];
  return {
    iata:    loc.iataCode,
    display: `${loc.cityName || loc.name} (${loc.iataCode})`,
  };
};

/** Reverse-geocode lat/lon → city string using Nominatim */
const reverseGeocode = (lat, lon) =>
  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
    .then(r => r.json())
    .then(d => {
      const city    = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
      const country = d.address?.country || '';
      return city && country ? `${city}, ${country}` : city || country || '';
    })
    .catch(() => '');

const ExploreDestinations = ({ onSelect, originCode, onOriginDetected }) => {
  const [prices,    setPrices]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [origin,    setOrigin]    = useState(originCode || '');   // IATA string
  const [originObj, setOriginObj] = useState(null);               // { iata, display }
  const [geoStatus, setGeoStatus] = useState('idle');             // 'idle'|'detecting'|'done'|'denied'

  /** Set origin from a resolved { iata, display } object */
  const applyOrigin = (result) => {
    if (!result) return;
    setOrigin(result.iata);
    setOriginObj(result);
    onOriginDetected?.(result);
  };

  /* Auto-detect origin on mount if not provided by parent */
  useEffect(() => {
    if (originCode) { setOrigin(originCode); return; }

    // 1. Try cached location first (set by Header or previous visit)
    const cached   = localStorage.getItem('userLocation') || '';
    const cachedAt = parseInt(localStorage.getItem('userLocationTime') || '0', 10);
    const fresh    = Date.now() - cachedAt < 60 * 60 * 1000; // 1-hour TTL

    if (cached && fresh) {
      const city = cached.split(',')[0].trim();
      resolveOrigin(city).then(applyOrigin);
      return;
    }

    // 2. Request browser geolocation
    if (!('geolocation' in navigator)) { setGeoStatus('denied'); return; }

    setGeoStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const locationStr = await reverseGeocode(latitude, longitude);
        if (locationStr) {
          localStorage.setItem('userLocation',     locationStr);
          localStorage.setItem('userLocationTime', Date.now().toString());
          const city = locationStr.split(',')[0].trim();
          await resolveOrigin(city).then(applyOrigin);
        }
        setGeoStatus('done');
      },
      () => {
        // Permission denied — fall back to stale cache if any
        const city = cached.split(',')[0].trim();
        if (city) resolveOrigin(city).then(applyOrigin);
        setGeoStatus('denied');
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []); // eslint-disable-line

  /* Sync when parent passes a new originCode */
  useEffect(() => {
    if (originCode && originCode !== origin) setOrigin(originCode);
  }, [originCode]); // eslint-disable-line

  /* Fetch prices whenever origin is resolved */
  useEffect(() => {
    if (!origin) return;
    setLoading(true);
    exploreDestinations(origin).then(p => {
      setPrices(p);
      setLoading(false);
    });
  }, [origin]);

  return (
    <section className="explore-section">
      <div className="container">

        {/* Header */}
        <div className="explore-header">
          <div className="explore-header__left">
            <div className="explore-header__icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h2 className="explore-header__title">Explore Anywhere</h2>
              <p className="explore-header__sub">
                {origin
                  ? `Cheapest fares from ${origin} · Click any destination to search`
                  : geoStatus === 'detecting'
                    ? 'Detecting your location to show personalised fares…'
                    : geoStatus === 'denied'
                      ? 'Location access denied · Click any destination to search'
                      : 'Discover your next adventure · Click any destination to search'}
              </p>
            </div>
          </div>
          {geoStatus === 'detecting' && !origin && (
            <span className="explore-header__loading">Detecting your location…</span>
          )}
          {loading && <span className="explore-header__loading">Fetching prices…</span>}
        </div>

        {/* Destination grid */}
        <div className="explore-grid">
          {DESTINATIONS.map(dest => {
            const priceData = prices[dest.iata];
            return (
              <button
                key={dest.iata}
                className="explore-card"
                onClick={() => onSelect({ iata: dest.iata, city: dest.city, country: dest.country })}
              >
                {/* Photo */}
                <div className="explore-card__img-wrap">
                  <img
                    src={imgUrl(dest.photo)}
                    alt={dest.city}
                    className="explore-card__img"
                    loading="lazy"
                  />
                  <div className="explore-card__overlay" />
                </div>

                {/* IATA badge */}
                <span className="explore-card__iata">{dest.iata}</span>

                {/* Bottom info */}
                <div className="explore-card__info">
                  <div className="explore-card__city">{dest.city}</div>
                  <div className="explore-card__country">{dest.country}</div>
                  {priceData ? (
                    <div className="explore-card__price">
                      <span className="explore-card__price-from">from</span>
                      <span className="explore-card__price-amount">${Math.round(priceData.price)}</span>
                    </div>
                  ) : (
                    <div className="explore-card__price explore-card__price--na">
                      View flights →
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExploreDestinations;
