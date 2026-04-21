import React, { useState, useEffect } from 'react';
import { exploreDestinations, searchAirports } from '../../services/flightService';
import { EXPLORE_DESTINATIONS, getExploreImageUrl } from '../../data/exploreDestinations';
import { getPlaceImagesForMultiplePlaces } from '../../utils/destinationImages';
import './ExploreDestinations.css';

const formatPriceBand = (price) => {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return null;
  const lower = Math.max(100, Math.floor(numericPrice / 100) * 100);
  const upper = lower + 200;
  return `$${lower} - $${upper}`;
};

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
  const [imageMap,  setImageMap]  = useState({});                 // iata → imageUrl

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

  /* Batch-fetch Google Places images once on mount (browser cache avoids repeat calls) */
  useEffect(() => {
    let mounted = true;
    const queries = EXPLORE_DESTINATIONS.map(d => `${d.city}, ${d.country}`);
    getPlaceImagesForMultiplePlaces(queries).then(result => {
      if (!mounted) return;
      const map = {};
      EXPLORE_DESTINATIONS.forEach(d => {
        const key = `${d.city}, ${d.country}`;
        const url = result[key]?.imageUrl;
        if (url) map[d.iata] = url;
      });
      setImageMap(map);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
                  ? `Cheapest fares from ${origin} · Click any destination to view tickets`
                  : geoStatus === 'detecting'
                    ? 'Detecting your location to show personalised fares…'
                    : geoStatus === 'denied'
                      ? 'Location access denied · Click any destination to view tickets'
                      : 'Discover your next adventure · Click any destination to view tickets'}
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
          {EXPLORE_DESTINATIONS.map(dest => {
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
                    src={imageMap[dest.iata] || getExploreImageUrl(dest.photo)}
                    alt={dest.city}
                    className="explore-card__img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getExploreImageUrl(dest.photo); }}
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
                      <span className="explore-card__price-amount">{formatPriceBand(priceData.price) || 'Price unavailable'}</span>
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
