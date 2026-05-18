import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import Map, { ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import RouteLayer from './RouteLayer';
import PremiumMarker, { UserLocationMarker } from './PremiumMarker';
import MapTimeline from './MapTimeline';
import MapBottomSheet from './MapBottomSheet';
import MapFloatingControls from './MapFloatingControls';
import './PremiumMapView.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const STATUS_COLORS = {
  confirmed: '#22c55e',
  itinerary_generated: '#3b82f6',
  option_selected: '#f59e0b',
  options_generated: '#8b5cf6',
  draft: '#94a3b8',
  archived: '#ef4444',
};

const CAT_TO_TYPE = {
  hotel: 'hotel', accommodation: 'hotel',
  restaurant: 'restaurant', dining: 'restaurant', food: 'restaurant',
  flight: 'flight', airport: 'flight', transport: 'flight',
  culture: 'museum', museum: 'museum', historical: 'museum',
  photography: 'photo', photo: 'photo',
  car: 'car', taxi: 'car',
  sightseeing: 'activity', nature: 'activity', adventure: 'activity',
  relaxation: 'activity', wellness: 'activity',
};

// ── Data builders ──────────────────────────────────────────────────────────

const buildTravelMarkers = (trips) =>
  trips
    .filter((t) => t.destination?.geometry?.lat && t.destination?.geometry?.lng)
    .map((t) => ({
      id: t.trip_id,
      lng: t.destination.geometry.lng,
      lat: t.destination.geometry.lat,
      type: 'destination',
      title: t.destination.name,
      subtitle: t.dates?.start_date
        ? new Date(t.dates.start_date).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })
        : '',
      status: t.status,
      tripId: t.trip_id,
      data: t,
    }));

const buildTripMarkers = (daysData, activeDay) => {
  const day = daysData.find((d) => d.day_number === activeDay);
  if (!day) return [];
  return (day.activities || [])
    .filter(
      (a) => a.location?.coordinates?.lat && a.location?.coordinates?.lng
    )
    .map((a, i) => ({
      id: `${activeDay}-${i}`,
      lng: a.location.coordinates.lng,
      lat: a.location.coordinates.lat,
      type: CAT_TO_TYPE[(a.category || '').toLowerCase()] || 'activity',
      title: a.title || a.name,
      subtitle: [a.time, a.duration].filter(Boolean).join(' · '),
      index: i,
      data: a,
    }));
};

const buildTravelWaypoints = (trips) =>
  trips
    .filter((t) => t.destination?.geometry?.lat && t.destination?.geometry?.lng)
    .map((t) => [t.destination.geometry.lng, t.destination.geometry.lat]);

const buildTripWaypoints = (daysData, activeDay) => {
  const day = daysData.find((d) => d.day_number === activeDay);
  if (!day) return [];
  return (day.activities || [])
    .filter((a) => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
    .map((a) => [a.location.coordinates.lng, a.location.coordinates.lat]);
};

const buildTravelTimeline = (trips) =>
  trips.map((t) => ({
    id: t.trip_id,
    title: t.destination?.name || 'Unknown',
    subtitle: t.dates?.start_date
      ? `${new Date(t.dates.start_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })} · ${t.dates.duration_days || 0}d`
      : '',
    icon: '✈️',
    status: t.status,
    statusColor: STATUS_COLORS[t.status],
    meta: [
      t.dates?.duration_days ? `${t.dates.duration_days} days` : null,
      t.budget ? t.budget : null,
    ].filter(Boolean),
    data: t,
  }));

const buildTripTimeline = (daysData) =>
  daysData.map((d) => ({
    id: d.day_number,
    title: `Day ${d.day_number}${d.title ? ': ' + d.title : ''}`,
    subtitle: (d.summary || '').slice(0, 64) + (d.summary?.length > 64 ? '…' : ''),
    icon: '📅',
    meta: d.activities?.length ? [`${d.activities.length} activities`] : [],
    data: d,
  }));

// ── 3D Buildings layer config ──────────────────────────────────────────────
const BUILDINGS_LAYER = {
  id: 'pm-3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['get', 'height'],
      0,   '#0d1b2a',
      80,  '#152336',
      200, '#1e3045',
    ],
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.82,
  },
};

// ── Component ──────────────────────────────────────────────────────────────

const PremiumMapView = ({
  mode = 'travel',
  trips = [],
  tripData = null,
  daysData = [],
  isDark = true,
  onTripSelect,
  className = '',
}) => {
  const mapRef = useRef(null);

  const initialViewState = useMemo(() => {
    if (mode === 'trip' && tripData?.destination?.geometry) {
      const { lat, lng } = tripData.destination.geometry;
      return { longitude: lng || 20, latitude: lat || 20, zoom: 11, pitch: 30, bearing: 0 };
    }
    if (mode === 'travel' && trips.length > 0) {
      const first = trips.find((t) => t.destination?.geometry);
      if (first) {
        return {
          longitude: first.destination.geometry.lng,
          latitude: first.destination.geometry.lat,
          zoom: 2.4,
          pitch: 0,
          bearing: 0,
        };
      }
    }
    return { longitude: 25, latitude: 20, zoom: 1.8, pitch: 0, bearing: 0 };
  }, []); // intentionally static — only used for initial render

  const [viewState, setViewState] = useState(initialViewState);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeDay, setActiveDay] = useState(daysData[0]?.day_number || 1);
  const [show3D, setShow3D] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [mapStyle, setMapStyle] = useState(
    isDark
      ? 'mapbox://styles/mapbox/dark-v11'
      : new Date().getHours() >= 18 || new Date().getHours() < 6
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
  );
  const [userLocation, setUserLocation] = useState(null);
  const [trackingUser, setTrackingUser] = useState(false);
  const [sheetState, setSheetState] = useState('closed');
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Refs so style.load handler always reads current values
  const show3DRef = useRef(false);
  const showTerrainRef = useRef(false);
  useEffect(() => { show3DRef.current = show3D; }, [show3D]);
  useEffect(() => { showTerrainRef.current = showTerrain; }, [showTerrain]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const markers = useMemo(
    () =>
      mode === 'travel'
        ? buildTravelMarkers(trips)
        : buildTripMarkers(daysData, activeDay),
    [mode, trips, daysData, activeDay]
  );

  const waypoints = useMemo(
    () =>
      mode === 'travel'
        ? buildTravelWaypoints(trips)
        : buildTripWaypoints(daysData, activeDay),
    [mode, trips, daysData, activeDay]
  );

  const timelineItems = useMemo(
    () =>
      mode === 'travel'
        ? buildTravelTimeline(trips)
        : buildTripTimeline(daysData),
    [mode, trips, daysData]
  );

  // ── Map style helpers (add 3D + terrain + fog on each style load) ─────────
  const applyMapEnhancements = useCallback((mb) => {
    try {
      mb.setFog({
        color: 'rgb(10, 14, 26)',
        'high-color': 'rgb(18, 36, 90)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(3, 5, 14)',
        'star-intensity': 0.75,
      });
    } catch (_) {}
    try {
      if (!mb.getSource('mapbox-dem')) {
        mb.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
    } catch (_) {}
    try {
      if (showTerrainRef.current) {
        mb.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      }
    } catch (_) {}
    try {
      if (show3DRef.current && !mb.getLayer('pm-3d-buildings')) {
        mb.addLayer(BUILDINGS_LAYER);
      }
    } catch (_) {}
  }, []); // no state deps — reads via refs

  const handleMapLoad = useCallback(
    (e) => {
      setMapLoaded(true);
      applyMapEnhancements(e.target);
      e.target.on('style.load', () => applyMapEnhancements(e.target));
    },
    [applyMapEnhancements]
  );

  // ── Toggle 3D buildings ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    const mb = mapRef.current?.getMap?.();
    if (!mb) return;
    try {
      if (show3D) {
        if (!mb.getLayer('pm-3d-buildings')) mb.addLayer(BUILDINGS_LAYER);
      } else {
        if (mb.getLayer('pm-3d-buildings')) mb.removeLayer('pm-3d-buildings');
      }
    } catch (_) {}
  }, [show3D, mapLoaded]);

  // ── Toggle terrain ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    const mb = mapRef.current?.getMap?.();
    if (!mb) return;
    try {
      mb.setTerrain(showTerrain ? { source: 'mapbox-dem', exaggeration: 1.5 } : null);
    } catch (_) {}
  }, [showTerrain, mapLoaded]);

  // ── Live location tracking ───────────────────────────────────────────────
  useEffect(() => {
    if (!trackingUser) {
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setTrackingUser(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setTrackingUser(false),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingUser]);

  // Fly to user when tracking starts
  useEffect(() => {
    if (userLocation && trackingUser) {
      mapRef.current?.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        pitch: 40,
        duration: 1600,
        essential: true,
      });
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // ── Camera helpers ───────────────────────────────────────────────────────
  const flyToMarker = useCallback((marker, zoom = 13) => {
    mapRef.current?.flyTo({
      center: [marker.lng, marker.lat],
      zoom,
      pitch: 45,
      bearing: 15,
      duration: 1800,
      essential: true,
    });
  }, []);

  const flyToDay = useCallback((dayData) => {
    if (!dayData?.activities?.length) return;
    const acts = dayData.activities.filter(
      (a) => a.location?.coordinates?.lat && a.location?.coordinates?.lng
    );
    if (!acts.length) return;
    const center = acts.reduce(
      (acc, a) => ({
        lng: acc.lng + a.location.coordinates.lng / acts.length,
        lat: acc.lat + a.location.coordinates.lat / acts.length,
      }),
      { lng: 0, lat: 0 }
    );
    mapRef.current?.flyTo({
      center: [center.lng, center.lat],
      zoom: 12,
      pitch: 40,
      bearing: 8,
      duration: 1800,
      essential: true,
    });
  }, []);

  // ── Event handlers ───────────────────────────────────────────────────────
  const handleMarkerClick = useCallback(
    (marker) => {
      setSelectedItem(marker);
      setSheetState('peek');
      flyToMarker(marker);
      if (mode === 'travel') onTripSelect?.(marker.data);
    },
    [mode, onTripSelect, flyToMarker]
  );

  const handleTimelineSelect = useCallback(
    (item) => {
      if (mode === 'trip') {
        setActiveDay(item.id);
        flyToDay(item.data);
      } else {
        const m = markers.find((mk) => mk.id === item.id);
        if (m) handleMarkerClick(m);
      }
    },
    [mode, markers, handleMarkerClick, flyToDay]
  );

  const handleViewFull = useCallback((item) => {
    if (item.tripId) window.location.href = `/planned-trip/${item.tripId}`;
  }, []);

  const handleMapClick = useCallback((e) => {
    // Only close if clicking bare map, not a marker
    if (e.originalEvent?.target?.closest?.('.pm-wrap')) return;
    setSelectedItem(null);
    setSheetState('closed');
  }, []);

  // ── Sheet item builder ───────────────────────────────────────────────────
  const sheetItem = useMemo(() => {
    if (!selectedItem) return null;
    if (mode === 'travel') {
      const t = selectedItem.data;
      return {
        title: t.destination?.name,
        subtitle: [
          t.dates?.start_date &&
            new Date(t.dates.start_date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          t.dates?.duration_days && `${t.dates.duration_days} days`,
        ]
          .filter(Boolean)
          .join(' · '),
        status: t.status,
        tripId: t.trip_id,
        description: t.description,
        activities: t.options
          ?.flatMap((o) => o.itinerary || [])
          .flatMap((d) => d.activities || []),
        meta: [
          t.dates?.duration_days
            ? { icon: '📅', label: 'Duration', value: `${t.dates.duration_days} days` }
            : null,
          t.budget
            ? { icon: '💰', label: 'Budget', value: t.budget }
            : null,
          t.guests?.total
            ? { icon: '👥', label: 'Guests', value: String(t.guests.total) }
            : null,
        ].filter(Boolean),
      };
    }
    const a = selectedItem.data;
    return {
      title: a.title || a.name,
      subtitle: [a.time, a.duration].filter(Boolean).join(' · '),
      description: a.description,
      meta: [
        a.time ? { icon: '⏰', label: 'Time', value: a.time } : null,
        a.duration ? { icon: '⏱️', label: 'Duration', value: a.duration } : null,
        a.cost ? { icon: '💰', label: 'Est. Cost', value: `$${a.cost}` } : null,
        a.rating ? { icon: '⭐', label: 'Rating', value: `${a.rating}/5` } : null,
      ].filter(Boolean),
    };
  }, [selectedItem, mode]);

  // ── Stats overlay ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (mode === 'travel') {
      return [
        { label: 'Trips', value: trips.length },
        {
          label: 'Countries',
          value: new Set(
            trips.map((t) => t.destination?.name?.split(',').pop()?.trim())
          ).size,
        },
        {
          label: 'Days',
          value: trips.reduce((s, t) => s + (t.dates?.duration_days || 0), 0),
        },
      ];
    }
    const day = daysData.find((d) => d.day_number === activeDay);
    return [
      { label: 'Day', value: `${activeDay} / ${daysData.length}` },
      { label: 'Activities', value: day?.activities?.length || 0 },
      {
        label: 'Est. Cost',
        value: `$${day?.total_cost || 0}`,
      },
    ];
  }, [mode, trips, daysData, activeDay]);

  // ── No token ─────────────────────────────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className={`pmv-root ${className}`}>
        <div className="pmv-no-token">
          <div className="pmv-no-token__card">
            <svg viewBox="0 0 24 24" fill="none" width="52" height="52">
              <path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                stroke="#029e9d"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="1.8" />
            </svg>
            <h2>Mapbox Token Required</h2>
            <p>
              Add <code>VITE_MAPBOX_TOKEN=pk.xxx</code> to your{' '}
              <code>Frontend/.env</code> file to enable the premium map.
            </p>
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="pmv-no-token__link"
            >
              Get a free Mapbox token →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const isEmpty =
    mode === 'travel' ? trips.length === 0 : daysData.length === 0;

  return (
    <div className={`pmv-root ${className}`}>
      {/* Timeline sidebar */}
      <MapTimeline
        mode={mode}
        items={timelineItems}
        activeId={mode === 'trip' ? activeDay : selectedItem?.id}
        onSelect={handleTimelineSelect}
        isOpen={timelineOpen}
        onToggle={() => setTimelineOpen((o) => !o)}
      />

      {/* Map area */}
      <div className={`pmv-map${timelineOpen ? ' pmv-map--shifted' : ''}`}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
        >
          <ScaleControl position="bottom-left" style={{ margin: '0 0 12px 12px' }} />

          {/* Animated route */}
          {waypoints.length > 1 && (
            <RouteLayer
              waypoints={waypoints}
              mapRef={mapRef}
              id={`${mode}-route`}
              color="#029e9d"
              glowColor="#00e5d5"
              animate
            />
          )}

          {/* Destination / activity markers */}
          {markers.map((m, i) => (
            <PremiumMarker
              key={m.id}
              longitude={m.lng}
              latitude={m.lat}
              type={m.type}
              title={m.title}
              isSelected={selectedItem?.id === m.id}
              isActive={mode === 'trip' && i === 0}
              index={m.index !== undefined ? m.index : undefined}
              onClick={() => handleMarkerClick(m)}
            />
          ))}

          {/* User location */}
          {userLocation && (
            <UserLocationMarker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
            />
          )}
        </Map>

        {/* Floating controls */}
        <MapFloatingControls
          mapRef={mapRef}
          show3D={show3D}
          onToggle3D={() => setShow3D((s) => !s)}
          showTerrain={showTerrain}
          onToggleTerrain={() => setShowTerrain((s) => !s)}
          trackingUser={trackingUser}
          onToggleTracking={() => setTrackingUser((s) => !s)}
          currentStyle={mapStyle}
          onStyleChange={setMapStyle}
        />

        {/* Stats overlay */}
        {!isEmpty && (
          <div className="pmv-stats">
            {stats.map((s, i) => (
              <div key={i} className="pmv-stat-chip">
                {s.label}: <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="pmv-empty">
            <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <h3>{mode === 'travel' ? 'No trips yet' : 'No itinerary yet'}</h3>
            <p>
              {mode === 'travel'
                ? 'Create your first trip and it will appear on the map.'
                : 'Your day activities will appear here once generated.'}
            </p>
            {mode === 'travel' && (
              <a href="/trip-planner" className="pmv-empty__btn">
                Plan a Trip →
              </a>
            )}
          </div>
        )}

        {/* Bottom sheet */}
        <MapBottomSheet
          item={sheetItem}
          state={sheetState}
          onStateChange={setSheetState}
          onClose={() => {
            setSelectedItem(null);
            setSheetState('closed');
          }}
          onViewFull={handleViewFull}
        />
      </div>
    </div>
  );
};

export default PremiumMapView;
