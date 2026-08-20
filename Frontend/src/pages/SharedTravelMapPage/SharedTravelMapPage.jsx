import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicTravelMap } from '../../services/travelMapService';
import { ensureLeafletReady, applyTileStyle, fitMapToPoints } from '../../utils/leafletUtils';
import { buildActivityIcon } from '../../components/TravelMap/markerIcons';
import Loader from '../../components/Loader/Loader';
import PageMeta from '../../hooks/usePageMeta';
import ShareButton from '../../components/ShareButton/ShareButton';
import './SharedTravelMapPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SharedTravelMapPage = () => {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const containerRef = useRef(null);
  const mapRef        = useRef(null);

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }
    getPublicTravelMap(token)
      .then(res => { if (res.success) setData(res.data); else setError('This travel map is not available.'); })
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!data?.locations?.length || !containerRef.current) return;

    ensureLeafletReady().then((L) => {
      if (!containerRef.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapRef.current = map;
      map.setView([20, 0], 2);
      applyTileStyle(L, map, 'voyager');

      const points = [];
      for (const loc of data.locations) {
        if (typeof loc.coordinates?.lat !== 'number' || typeof loc.coordinates?.lng !== 'number') continue;
        points.push({ lat: loc.coordinates.lat, lng: loc.coordinates.lng });
        const icon = buildActivityIcon(L, { category: loc.category, title: loc.name });
        L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong style="font-size:13px">${loc.name}</strong>`);
      }

      if (points.length > 0) fitMapToPoints(L, map, points);
      else map.setView([20, 0], 2);
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [data]);

  if (loading) {
    return (
      <div className="stm-page">
        <div className="stm-page__loading"><Loader size="large" text="Loading travel map..." /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stm-page">
        <div className="stm-page__error">
          <div className="stm-page__error-icon">🗺️</div>
          <h2>Map not found</h2>
          <p>{error || 'This travel map is private or no longer available.'}</p>
          <Link to="/" className="stm-page__cta">Explore OptionTrip</Link>
        </div>
      </div>
    );
  }

  const hasPins = data.locations?.some(l => typeof l.coordinates?.lat === 'number');

  return (
    <div className="stm-page">
      <PageMeta
        title={`${data.name}'s Travel Map`}
        description={`${data.name} has visited ${data.countriesVisited} countries on OptionTrip.`}
        noIndex
      />

      <header className="stm-header">
        <div className="stm-header__share">
          <ShareButton url={`/shared-map/${token}`} title={`${data.name}'s Travel Map on OptionTrip`} label="Share this map" />
        </div>
        <h1 className="stm-header__title">{data.name}'s Travel Map</h1>
        {data.level && <span className="stm-level-badge">🏆 {data.level.label}</span>}
        <div className="stm-stats">
          <div className="stm-stat">
            <span className="stm-stat__val">{data.countriesVisited}</span>
            <span className="stm-stat__label">Countries</span>
          </div>
          <div className="stm-stat">
            <span className="stm-stat__val">{data.citiesVisited}</span>
            <span className="stm-stat__label">Cities</span>
          </div>
          <div className="stm-stat">
            <span className="stm-stat__val">{data.tripsCreated}</span>
            <span className="stm-stat__label">Trips</span>
          </div>
        </div>
      </header>

      {hasPins && (
        <div className="stm-map-wrap">
          <div ref={containerRef} className="stm-map" />
        </div>
      )}

      {data.countries?.length > 0 && (
        <section className="stm-countries">
          <h3>Countries visited</h3>
          <div className="stm-countries__list">
            {data.countries.map((c) => (
              <span key={c} className="stm-country-chip">{c}</span>
            ))}
          </div>
        </section>
      )}

      <section className="stm-card">
        <h3>Shareable card</h3>
        <img src={`${API_BASE}/api/travel-map/${token}/card.svg`} alt={`${data.name}'s travel map summary`} className="stm-card__img" />
        <a
          className="stm-card__download"
          href={`${API_BASE}/api/travel-map/${token}/card.svg`}
          download={`${data.name.replace(/\s+/g, '-').toLowerCase()}-travel-map.svg`}
        >
          Download card
        </a>
      </section>

      <footer className="stm-footer">
        <Link to="/" className="stm-page__cta">Plan your own trip on OptionTrip</Link>
      </footer>
    </div>
  );
};

export default SharedTravelMapPage;
