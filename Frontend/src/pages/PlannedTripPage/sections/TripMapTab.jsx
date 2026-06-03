import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, ScaleControl, Popup } from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './TripMapTab.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const CATEGORY_COLORS = {
  flight:     '#029e9d',
  hotel:      '#2563eb',
  activity:   '#16a34a',
  restaurant: '#ea580c',
  car:        '#7c3aed',
  default:    '#029e9d',
};

/* ── Map style definitions ─────────────────────────────────────────────────── */
const MAP_STYLES = [
  {
    id: 'standard',
    label: 'Standard',
    url: 'mapbox://styles/mapbox/standard',
    hasPresets: true,
    preview: { bg: '#dce8f2', road: '#8aaac8', block: '#b0c8de' },
  },
  {
    id: 'standard-satellite',
    label: '3D Satellite',
    url: 'mapbox://styles/mapbox/standard-satellite',
    hasPresets: true,
    preview: { bg: '#1e3c1e', road: '#4a7a4a', block: '#2e5c2e', type: 'satellite' },
  },
  {
    id: 'streets',
    label: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    preview: { bg: '#fdf8e8', road: '#e8a030', block: '#f0e0b0' },
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v12',
    preview: { bg: '#d4e8cc', road: '#90b870', block: '#b8d8a0' },
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    preview: { bg: '#1a3820', road: '#3a6030', block: '#2e5028', type: 'satellite' },
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    preview: { bg: '#1e3820', road: '#e8a030', block: '#2e5028', type: 'satellite' },
  },
  {
    id: 'light',
    label: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    preview: { bg: '#f4f6f8', road: '#c8cdd4', block: '#dde2e8' },
  },
  {
    id: 'dark',
    label: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    preview: { bg: '#1a2236', road: '#2e3f60', block: '#243050' },
  },
];

const LIGHT_PRESETS = [
  { id: 'dawn',  label: 'Dawn',  emoji: '🌅' },
  { id: 'day',   label: 'Day',   emoji: '☀️' },
  { id: 'dusk',  label: 'Dusk',  emoji: '🌇' },
  { id: 'night', label: 'Night', emoji: '🌙' },
];

/* ── Style thumbnail SVG ───────────────────────────────────────────────────── */
const StylePreview = ({ preview }) => {
  if (preview.type === 'satellite') {
    return (
      <svg viewBox="0 0 52 38" fill="none" width="52" height="38" style={{ display: 'block' }}>
        <rect width="52" height="38" fill={preview.bg} />
        <rect x="0"  y="0"  width="16" height="16" fill={preview.block} opacity="0.85" />
        <rect x="18" y="0"  width="15" height="16" fill={preview.block} opacity="0.65" />
        <rect x="35" y="0"  width="17" height="16" fill={preview.block} opacity="0.9" />
        <rect x="0"  y="22" width="16" height="16" fill={preview.block} opacity="0.7" />
        <rect x="18" y="22" width="15" height="16" fill={preview.block} opacity="0.8" />
        <rect x="35" y="22" width="17" height="16" fill={preview.block} opacity="0.6" />
        <rect x="0"  y="16" width="52" height="3.5" fill={preview.road} opacity="0.75" />
        <rect x="16" y="0"  width="2.5" height="38" fill={preview.road} opacity="0.75" />
        <rect x="33" y="0"  width="2.5" height="38" fill={preview.road} opacity="0.75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 52 38" fill="none" width="52" height="38" style={{ display: 'block' }}>
      <rect width="52" height="38" fill={preview.bg} />
      <rect x="0"  y="16.5" width="52" height="5"   fill={preview.road} opacity="0.9" />
      <rect x="22" y="0"    width="4.5" height="38" fill={preview.road} opacity="0.9" />
      <rect x="2"  y="2"    width="17" height="12"  fill={preview.block} opacity="0.45" rx="1.5" />
      <rect x="30" y="2"    width="20" height="12"  fill={preview.block} opacity="0.45" rx="1.5" />
      <rect x="2"  y="24"   width="17" height="11"  fill={preview.block} opacity="0.45" rx="1.5" />
      <rect x="30" y="24"   width="20" height="11"  fill={preview.block} opacity="0.45" rx="1.5" />
    </svg>
  );
};

/* ── Pins ──────────────────────────────────────────────────────────────────── */
const PIN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ActivityPin = ({ activity }) => {
  const [hovered, setHovered] = useState(false);
  const cat   = (activity.category || 'activity').toLowerCase();
  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
  const lng   = activity.location?.coordinates?.lng;
  const lat   = activity.location?.coordinates?.lat;
  if (!lng || !lat) return null;

  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div
        className={`tmt-pin tmt-pin--sm${hovered ? ' tmt-pin--hover' : ''}`}
        style={{ '--pc': color }}
        title={activity.title}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="tmt-pin__dot" />
        {hovered && <div className="tmt-pin__tooltip">{activity.title}</div>}
      </div>
    </Marker>
  );
};

const ROUTE_LAYER = {
  id: 'trip-route', type: 'line',
  paint: { 'line-color': '#029e9d', 'line-width': 2, 'line-opacity': 0.55, 'line-dasharray': [4, 3] },
};

/* ── Main component ────────────────────────────────────────────────────────── */
const TripMapTab = ({ tripData, daysData }) => {
  const mapRef = useRef(null);
  const [popupOpen,     setPopupOpen]     = useState(false);
  const [activeStyleId, setActiveStyleId] = useState('hybrid');
  const [lightPreset,   setLightPreset]   = useState('day');
  const [mapLoaded,     setMapLoaded]     = useState(false);

  const lng      = tripData?.destination?.geometry?.lng;
  const lat      = tripData?.destination?.geometry?.lat;
  const destName = tripData?.destination?.name || 'Destination';

  const activities = (daysData || [])
    .flatMap(d => d.activities || [])
    .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
    .slice(0, 40);

  const hasCoords  = !!(lng && lat);
  const initialView = hasCoords
    ? { longitude: lng, latitude: lat, zoom: 11 }
    : { longitude: 20, latitude: 20, zoom: 1.5 };

  const [viewState, setViewState] = useState(initialView);

  // Fit map to all pins — only runs after the map GL instance has fired onLoad
  useEffect(() => {
    if (!mapLoaded || !hasCoords || !mapRef.current) return;

    const allCoords = [
      [lng, lat],
      ...activities.map(a => [a.location.coordinates.lng, a.location.coordinates.lat]),
    ];

    if (allCoords.length === 1) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1000, essential: true });
      return;
    }

    const lngs = allCoords.map(c => c[0]);
    const lats = allCoords.map(c => c[1]);

    mapRef.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 80, bottom: 80, left: 60, right: 60 }, maxZoom: 15, duration: 1200, essential: true }
    );
  }, [mapLoaded, lng, lat, activities.length]);

  // Apply light preset after style change
  useEffect(() => {
    const styleConf = MAP_STYLES.find(s => s.id === activeStyleId);
    if (!styleConf?.hasPresets || !mapRef.current) return;
    const timer = setTimeout(() => {
      try {
        const map = typeof mapRef.current.getMap === 'function'
          ? mapRef.current.getMap()
          : mapRef.current;
        map.setConfigProperty('basemap', 'lightPreset', lightPreset);
      } catch (_) { /* style may still be loading */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [activeStyleId, lightPreset]);

  const routeGeoJSON = {
    type: 'FeatureCollection',
    features: activities
      .filter((_, i) => i < activities.length - 1)
      .map((act, i) => {
        const next = activities[i + 1];
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [act.location.coordinates.lng, act.location.coordinates.lat],
              [next.location.coordinates.lng, next.location.coordinates.lat],
            ],
          },
        };
      }),
  };

  const currentStyleConf = MAP_STYLES.find(s => s.id === activeStyleId) || MAP_STYLES[0];

  if (!MAPBOX_TOKEN) {
    return (
      <div className="tmt-no-token">
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#029e9d" strokeWidth="1.8"/>
          <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="1.8"/>
        </svg>
        <h3>Mapbox Token Required</h3>
        <p>Add <code>VITE_MAPBOX_TOKEN=pk.xxx</code> to your <code>Frontend/.env</code> file.</p>
      </div>
    );
  }

  return (
    <div className="tmt-root">

      {/* ── Style picker bar ──────────────────────────────────────────────── */}
      <div className="tmt-style-bar">
        {MAP_STYLES.map(style => (
          <button
            key={style.id}
            className={`tmt-style-tab${activeStyleId === style.id ? ' tmt-style-tab--active' : ''}`}
            onClick={() => setActiveStyleId(style.id)}
            title={style.label}
          >
            <div className="tmt-style-tab__preview">
              <StylePreview preview={style.preview} />
            </div>
            <span className="tmt-style-tab__label">{style.label}</span>
          </button>
        ))}
      </div>

      {/* ── Light preset bar (Standard styles only) ───────────────────────── */}
      {currentStyleConf.hasPresets && (
        <div className="tmt-preset-bar">
          <span className="tmt-preset-bar__label">Lighting</span>
          {LIGHT_PRESETS.map(p => (
            <button
              key={p.id}
              className={`tmt-preset-chip${lightPreset === p.id ? ' tmt-preset-chip--active' : ''}`}
              onClick={() => setLightPreset(p.id)}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div className="tmt-wrap">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          onLoad={() => setMapLoaded(true)}
          mapStyle={currentStyleConf.url}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl  position="top-right" />
          <ScaleControl       position="bottom-right" />

          {activities.length > 1 && (
            <Source id="trip-route" type="geojson" data={routeGeoJSON}>
              <Layer {...ROUTE_LAYER} />
            </Source>
          )}

          {/* Destination marker */}
          {hasCoords && (
            <Marker longitude={lng} latitude={lat} anchor="bottom"
              onClick={e => { e.originalEvent.stopPropagation(); setPopupOpen(true); }}>
              <div className="tmt-pin tmt-pin--dest" style={{ '--pc': '#029e9d' }} title={destName}>
                <span className="tmt-pin__pulse" />
                <span className="tmt-pin__dot tmt-pin__dot--lg">{PIN_ICON}</span>
                <span className="tmt-pin__label">{destName}</span>
              </div>
            </Marker>
          )}

          {/* Activity pins */}
          {activities.map((act, i) => (
            <ActivityPin key={`act-${i}`} activity={act} />
          ))}

          {/* Destination popup */}
          {hasCoords && popupOpen && (
            <Popup longitude={lng} latitude={lat} anchor="bottom" offset={[0, -14]}
              onClose={() => setPopupOpen(false)} closeButton={false} maxWidth="260px">
              <div className="tmt-popup">
                <button className="tmt-popup__close" onClick={() => setPopupOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <h4 className="tmt-popup__title">{destName}</h4>
                {tripData?.dates?.start_date && (
                  <p className="tmt-popup__dates">
                    {new Date(tripData.dates.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {tripData.dates.end_date && tripData.dates.start_date !== tripData.dates.end_date && (
                      <> → {new Date(tripData.dates.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </p>
                )}
                {tripData?.dates?.duration_days > 0 && (
                  <p className="tmt-popup__days">{tripData.dates.duration_days} day{tripData.dates.duration_days !== 1 ? 's' : ''}</p>
                )}
                <p className="tmt-popup__activities">{activities.length} activity pin{activities.length !== 1 ? 's' : ''} on this map</p>
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <div className="tmt-legend">
          <div className="tmt-legend__item">
            <span className="tmt-legend__dot" style={{ background: '#029e9d' }} />
            <span>Destination</span>
          </div>
          <div className="tmt-legend__item">
            <span className="tmt-legend__dot" style={{ background: '#16a34a' }} />
            <span>Activities ({activities.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMapTab;
