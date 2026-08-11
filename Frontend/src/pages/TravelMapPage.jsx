import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useTheme }     from '../contexts/ThemeContext';
import { useAuth }      from '../contexts/AuthContext';
import { getMyTrips }   from '../services/tripsService';
import PageMeta         from '../hooks/usePageMeta';
import TripMapPopup     from '../components/TravelMap/TripMapPopup';
import TravelSidebar    from '../components/TravelMap/TravelSidebar';
import TravelStats      from '../components/TravelMap/TravelStats';

import {
  ensureLeafletReady,
  applyTileStyle,
  buildRouteLatLngs,
  fitMapToPoints
} from '../utils/leafletUtils';
import {
  buildDestinationIcon,
  buildActivityIcon
} from '../components/TravelMap/markerIcons';

import './TravelMapPage.css';

const INITIAL_CENTER = [20, 30];
const INITIAL_ZOOM   = 2;

const tripHasCoords = (t) =>
  typeof t?.destination?.geometry?.lat === 'number' &&
  typeof t?.destination?.geometry?.lng === 'number';

const TravelMapPage = () => {
  const { isDark }      = useTheme();
  const { accessToken } = useAuth();

  const [trips,        setTrips]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [popupPos,     setPopupPos]     = useState(null);

  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const tripMarkersRef  = useRef([]);
  const activityMarkersRef = useRef([]);
  const routeLineRef    = useRef(null);
  const selectedTripRef = useRef(null);

  useEffect(() => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    getMyTrips(accessToken, { limit: 50 })
      .then(data => {
        const list = data?.trips || data?.data?.trips || data?.data || data || [];
        setTrips(Array.isArray(list) ? list : []);
      })
      .catch(err => console.error('Map trips fetch error:', err))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    let disposed = false;
    let L = null;

    ensureLeafletReady().then(_L => {
      if (disposed || !containerRef.current) return;
      L = _L;

      const map = L.map(containerRef.current, {
        center: INITIAL_CENTER,
        zoom:   INITIAL_ZOOM,
        worldCopyJump: true,
        zoomControl:  false,
        attributionControl: true
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

      const Fullscreen = L.Control.extend({
        options: { position: 'topright' },
        onAdd: () => {
          const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control tmp-fs-btn');
          btn.innerHTML = '⤢';
          btn.title = 'Toggle fullscreen';
          L.DomEvent.disableClickPropagation(btn);
          btn.onclick = () => {
            const el = containerRef.current?.parentElement || containerRef.current;
            if (!document.fullscreenElement) el?.requestFullscreen?.();
            else                              document.exitFullscreen?.();
          };
          return btn;
        }
      });
      new Fullscreen().addTo(map);

      map.on('click', () => setSelectedTrip(null));

      const refreshPopupPos = () => {
        const trip = selectedTripRef.current;
        if (!trip || !tripHasCoords(trip)) { setPopupPos(null); return; }
        const pt = map.latLngToContainerPoint([
          trip.destination.geometry.lat,
          trip.destination.geometry.lng
        ]);
        setPopupPos({ x: pt.x, y: pt.y });
      };
      map.on('move',  refreshPopupPos);
      map.on('zoom',  refreshPopupPos);
      map.on('resize', refreshPopupPos);

      mapRef.current = map;
      mapRef.current._refreshPopupPos = refreshPopupPos;
    }).catch(err => console.error('Leaflet init failed:', err));

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    applyTileStyle(window.L, map, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L) return;

    tripMarkersRef.current.forEach(({ marker }) => map.removeLayer(marker));
    tripMarkersRef.current = [];

    const withCoords = trips.filter(tripHasCoords);

    withCoords.forEach(trip => {
      const lat = trip.destination.geometry.lat;
      const lng = trip.destination.geometry.lng;
      const isSelected = selectedTrip?.trip_id === trip.trip_id;

      const marker = L.marker([lat, lng], {
        icon: buildDestinationIcon(L, {
          name: trip.destination?.name,
          isSelected,
          color: '#029e9d'
        }),
        keyboard: true
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        flyToTrip(trip);
      });

      marker.addTo(map);
      tripMarkersRef.current.push({ trip_id: trip.trip_id, marker });
    });

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    const routePts = withCoords.map(t => ({
      lat: t.destination.geometry.lat,
      lng: t.destination.geometry.lng
    }));
    const latLngs = buildRouteLatLngs(routePts);
    if (latLngs.length >= 2) {
      routeLineRef.current = L.polyline(latLngs, {
        color:       '#029e9d',
        weight:      2,
        opacity:     0.6,
        dashArray:   '6 6',
        interactive: false
      }).addTo(map);
    }

    if (withCoords.length && !selectedTrip) {
      fitMapToPoints(L, map, routePts, { maxZoom: 6, paddingPx: [60, 60], duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  useEffect(() => {
    const L = window.L;
    if (!L) return;
    selectedTripRef.current = selectedTrip;

    tripMarkersRef.current.forEach(({ trip_id, marker }) => {
      const trip = trips.find(t => t.trip_id === trip_id);
      if (!trip) return;
      marker.setIcon(buildDestinationIcon(L, {
        name: trip.destination?.name,
        isSelected: selectedTrip?.trip_id === trip_id,
        color: '#029e9d'
      }));
    });

    mapRef.current?._refreshPopupPos?.();
    if (!selectedTrip) setPopupPos(null);
  }, [selectedTrip, trips]);

  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L) return;

    activityMarkersRef.current.forEach(m => map.removeLayer(m));
    activityMarkersRef.current = [];

    if (!selectedTrip) return;

    const activities = (selectedTrip.options || [])
      .flatMap(o => o.itinerary || [])
      .flatMap(d => d.activities || [])
      .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
      .slice(0, 30);

    activities.forEach(act => {
      const lat = act.location.coordinates.lat;
      const lng = act.location.coordinates.lng;
      const marker = L.marker([lat, lng], {
        icon: buildActivityIcon(L, { category: act.category, title: act.title })
      });
      marker.addTo(map);
      activityMarkersRef.current.push(marker);
    });
  }, [selectedTrip]);

  const flyToTrip = useCallback((trip) => {
    const lat = trip.destination?.geometry?.lat;
    const lng = trip.destination?.geometry?.lng;
    if (!lat || !lng || !mapRef.current) return;
    mapRef.current.flyTo([lat, lng], 8, { duration: 1.2 });
    setSelectedTrip(trip);
  }, []);

  return (
    <div className="tmp-page">
      <PageMeta
        title="Your Travel Map"
        description="See every trip you've planned on a single interactive world map — routes, destinations, and activities in one view."
        keywords="travel map, trip visualization, world map trips, journey tracker, my travels"
        path="/travel-map"
      />
      <TravelSidebar
        trips={trips}
        selectedTrip={selectedTrip}
        onSelectTrip={flyToTrip}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className={`tmp-map-wrap${sidebarOpen ? ' tmp-map-wrap--shifted' : ''}`}>
        {loading && (
          <div className="tmp-loader">
            <div className="tmp-loader__spinner" />
            <span>Loading your trips…</span>
          </div>
        )}

        <div ref={containerRef} className="tmp-leaflet" />

        {selectedTrip && popupPos && (
          <TripMapPopup
            trip={selectedTrip}
            position={popupPos}
            onClose={() => setSelectedTrip(null)}
          />
        )}

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
