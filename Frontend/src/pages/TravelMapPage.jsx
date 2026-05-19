import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useTheme }   from '../contexts/ThemeContext';
import { useAuth }    from '../contexts/AuthContext';
import { getMyTrips } from '../services/tripsService';
import { DestinationMarker, ActivityMarker } from '../components/TravelMap/TripMarker';
import TripMapPopup   from '../components/TravelMap/TripMapPopup';
import TravelSidebar  from '../components/TravelMap/TravelSidebar';
import TravelStats    from '../components/TravelMap/TravelStats';
import './TravelMapPage.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const INITIAL_VIEW = { longitude: 30, latitude: 20, zoom: 1.8 };

const buildRouteGeoJSON = (trips) => ({
  type: 'FeatureCollection',
  features: trips
    .filter(t => t.destination?.geometry?.lat && t.destination?.geometry?.lng)
    .map((t, i, arr) => {
      if (i === 0) return null;
      const prev = arr[i - 1];
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [prev.destination.geometry.lng, prev.destination.geometry.lat],
            [t.destination.geometry.lng,    t.destination.geometry.lat],
          ],
        },
      };
    })
    .filter(Boolean),
});

const ROUTE_LAYER = {
  id: 'route-line', type: 'line',
  paint: { 'line-color': '#029e9d', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [4, 3] },
};

const TravelMapPage = () => {
  const { isDark }      = useTheme();
  const { accessToken } = useAuth();

  const [trips,        setTrips]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [viewState,    setViewState]    = useState(INITIAL_VIEW);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    getMyTrips(accessToken, { limit: 50 })
      .then(data => { const list = data?.trips || data?.data || data || []; setTrips(Array.isArray(list) ? list : []); })
      .catch(err => console.error('Map trips fetch error:', err))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const flyToTrip = useCallback((trip) => {
    const { lat, lng } = trip.destination?.geometry || {};
    if (!lat || !lng || !mapRef.current) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 10, duration: 1400, essential: true });
    setSelectedTrip(trip);
  }, []);

  const activities = selectedTrip
    ? (selectedTrip.options || []).flatMap(o => o.itinerary || []).flatMap(d => d.activities || [])
        .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng).slice(0, 30)
    : [];

  const mapStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  if (!MAPBOX_TOKEN) {
    return (
      <div className="tmp-no-token">
        <div className="tmp-no-token__card">
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#029e9d" strokeWidth="1.8"/>
            <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="1.8"/>
          </svg>
          <h2>Mapbox Token Required</h2>
          <p>Add <code>VITE_MAPBOX_TOKEN=pk.xxx</code> to your <code>Frontend/.env</code> file.</p>
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="tmp-no-token__link">
            Get a free Mapbox token →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="tmp-page">
      <TravelSidebar
        trips={trips} selectedTrip={selectedTrip} onSelectTrip={flyToTrip}
        isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className={`tmp-map-wrap${sidebarOpen ? ' tmp-map-wrap--shifted' : ''}`}>
        {loading && (
          <div className="tmp-loader">
            <div className="tmp-loader__spinner" />
            <span>Loading your trips…</span>
          </div>
        )}

        <Map
          ref={mapRef}
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onClick={() => setSelectedTrip(null)}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl  position="top-right" />
          <ScaleControl       position="bottom-right" />

          <Source id="route" type="geojson" data={buildRouteGeoJSON(trips)}>
            <Layer {...ROUTE_LAYER} />
          </Source>

          {trips.map(trip => (
            <DestinationMarker key={trip.trip_id} trip={trip}
              isSelected={selectedTrip?.trip_id === trip.trip_id} onClick={flyToTrip} />
          ))}

          {activities.map((act, i) => (
            <ActivityMarker key={`act-${i}`} activity={act} />
          ))}

          {selectedTrip && (
            <TripMapPopup trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
          )}
        </Map>

        {!loading && trips.length > 0 && <TravelStats trips={trips} />}

        {!loading && trips.length === 0 && (
          <div className="tmp-empty">
            <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h3>No trips yet</h3>
            <p>Create your first trip and it will appear on the map.</p>
            <a href="/trip-planner" className="tmp-empty__btn">Plan a Trip →</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelMapPage;
