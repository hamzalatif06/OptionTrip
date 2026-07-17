import React, { useState, useEffect, useRef } from 'react';
import { exploreDestinations, searchAirports } from '../../services/flightService';
import { EXPLORE_DESTINATIONS, getExploreImageUrl } from '../../data/exploreDestinations';
import { getPlaceImagesForMultiplePlaces } from '../../utils/destinationImages';
import { addToWishlist } from '../../services/wishlistService';
import useCurrency from '../../hooks/useCurrency';
import './ExploreDestinations.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fetchAISuggestions = async (query) => {
  const res = await fetch(`${API_BASE}/api/trips/suggest-destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('suggestion_failed');
  const data = await res.json();
  return data.success ? data.data : [];
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
  const { formatPrice } = useCurrency();
  const [prices,    setPrices]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [origin,    setOrigin]    = useState(originCode || '');   // IATA string
  const [originObj, setOriginObj] = useState(null);               // { iata, display }
  const [geoStatus, setGeoStatus] = useState('idle');             // 'idle'|'detecting'|'done'|'denied'
  const [imageMap,  setImageMap]  = useState({});                 // iata → imageUrl
  const [loadedImages, setLoadedImages] = useState({});           // iata → true once <img> fires onLoad

  // AI destination suggestions
  const [aiQuery,       setAiQuery]       = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiError,       setAiError]       = useState('');
  const aiSearched = useRef(false);

  // Wishlist saves (iata → true)
  const [wishlisted, setWishlisted] = useState({});

  const handleWishlist = async (e, dest, imageUrl) => {
    e.stopPropagation();
    if (wishlisted[dest.iata]) return;
    try {
      await addToWishlist({ destinationName: dest.city, country: dest.country, imageUrl: imageUrl || '' });
      setWishlisted(prev => ({ ...prev, [dest.iata]: true }));
    } catch (err) {
      if (err.message === 'not_authenticated') {
        window.location.href = '/login';
      }
    }
  };

  const handleAiSearch = async (e) => {
    e?.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestions([]);
    aiSearched.current = true;
    try {
      const results = await fetchAISuggestions(aiQuery.trim());
      setAiSuggestions(results);
    } catch {
      setAiError('Could not fetch suggestions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAi = () => {
    setAiQuery('');
    setAiSuggestions([]);
    setAiError('');
    aiSearched.current = false;
  };

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

        {/* AI destination search */}
        <form className="explore-ai-search" onSubmit={handleAiSearch}>
          <input
            className="explore-ai-input"
            type="text"
            placeholder="Describe your dream trip... e.g. 'warm beach in May under $1000'"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
          />
          <button type="submit" className="explore-ai-btn" disabled={aiLoading || !aiQuery.trim()}>
            {aiLoading ? 'Searching…' : 'Find Destinations'}
          </button>
          {aiSearched.current && (
            <button type="button" className="explore-ai-clear" onClick={clearAi}>Show all</button>
          )}
        </form>

        {/* AI suggestions */}
        {aiLoading && (
          <div className="explore-ai-loading">
            <div className="explore-ai-spinner" />
            <span>Finding the perfect destinations for you…</span>
          </div>
        )}
        {aiError && <p className="explore-ai-error">{aiError}</p>}
        {aiSuggestions.length > 0 && (
          <>
            <p className="explore-ai-label">Vi's Suggestions for "{aiQuery}"</p>
            <div className="explore-grid explore-grid--ai">
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="explore-card explore-card--ai"
                  onClick={() => onSelect({ city: s.destination, country: s.country, query: `${s.destination}, ${s.country}` })}
                >
                  <div className="explore-card__img-wrap">
                    {s.imageUrl && (
                      <img src={s.imageUrl} alt={s.destination} className="explore-card__img is-loaded" loading="lazy" />
                    )}
                    {!s.imageUrl && <div className="explore-card__img-skeleton" />}
                    <div className="explore-card__overlay" />
                  </div>
                  <div className="explore-card__info">
                    <div className="explore-card__city">{s.destination}</div>
                    <div className="explore-card__country">{s.country}</div>
                    <div className="explore-card__why">{s.why}</div>
                    <div className="explore-card__best-months">{s.bestMonths}</div>
                  </div>
                  <span className="explore-card__plan-cta">Plan this trip →</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Destination grid */}
        {!aiSuggestions.length && <div className="explore-grid">
          {EXPLORE_DESTINATIONS.map(dest => {
            const priceData = prices[dest.iata];
            return (
              <button
                key={dest.iata}
                className="explore-card"
                onClick={() => onSelect({ iata: dest.iata, city: dest.city, country: dest.country })}
              >
                {/* Wishlist heart */}
                <button
                  className={`explore-card__heart${wishlisted[dest.iata] ? ' explore-card__heart--saved' : ''}`}
                  onClick={(e) => handleWishlist(e, dest, imageMap[dest.iata])}
                  title={wishlisted[dest.iata] ? 'Saved to wishlist' : 'Save to wishlist'}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill={wishlisted[dest.iata] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>

                {/* Photo */}
                <div className="explore-card__img-wrap">
                  {imageMap[dest.iata] && (
                    <img
                      src={imageMap[dest.iata]}
                      alt={dest.city}
                      className={`explore-card__img${loadedImages[dest.iata] ? ' is-loaded' : ''}`}
                      loading="lazy"
                      onLoad={() => setLoadedImages(prev => prev[dest.iata] ? prev : { ...prev, [dest.iata]: true })}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        // Mark as loaded so the skeleton disappears even on error
                        setLoadedImages(prev => prev[dest.iata] ? prev : { ...prev, [dest.iata]: true });
                      }}
                    />
                  )}
                  {!loadedImages[dest.iata] && (
                    <div className="explore-card__img-skeleton" aria-hidden="true" />
                  )}
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
                      <span className="explore-card__price-amount">{formatPrice(priceData.price) || 'Price unavailable'}</span>
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
        </div>}
      </div>
    </section>
  );
};

export default ExploreDestinations;
