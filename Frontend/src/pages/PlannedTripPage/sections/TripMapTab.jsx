import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from '../../../contexts/ThemeContext';
import './TripMapTab.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// ── Day colour palette (matches ActivitiesSection accent colours) ──────────

const DAY_COLORS = [
  '#0A539D', // blue  (day 1 — matches ActivitiesSection active tab)
  '#e91e8c', // pink
  '#22c55e', // green
  '#f97316', // orange
  '#8b5cf6', // purple
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
  '#f43f5e', // rose
];
const getDayColor = (i) => DAY_COLORS[i % DAY_COLORS.length];

// ── Map styles ─────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'light',     label: 'Light',     url: 'mapbox://styles/mapbox/light-v11',             icon: '☀️' },
  { id: 'dark',      label: 'Dark',      url: 'mapbox://styles/mapbox/dark-v11',              icon: '🌙' },
  { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: '🛰️' },
  { id: 'streets',   label: 'Streets',   url: 'mapbox://styles/mapbox/navigation-night-v1',   icon: '🗺️' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const CAT_ICONS = {
  dining: '🍽️', restaurant: '🍽️', food: '🍽️', breakfast: '☕', cafe: '☕',
  hotel: '🏨', accommodation: '🏨',
  museum: '🏛️', culture: '🎭', historical: '🏰',
  sightseeing: '👁️', adventure: '🧗', activity: '⭐',
  shopping: '🛍️', nature: '🌿', beach: '🏖️',
  transport: '🚂', flight: '✈️',
  photography: '📸', nightlife: '🌙', entertainment: '🎪',
  sports: '⚽', wellness: '🧘', outdoor: '🌄',
};
const getIcon = (cat) => CAT_ICONS[(cat || '').toLowerCase()] || '📍';

const getCost = (cost) => {
  if (!cost) return null;
  if (cost < 20) return '$';
  if (cost < 60) return '$$';
  if (cost < 150) return '$$$';
  return '$$$$';
};

const formatStars = (r) => {
  const n = Math.round(r || 0);
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
};

// Build a GeoJSON FeatureCollection of line segments between consecutive points
const buildSegments = (acts) => ({
  type: 'FeatureCollection',
  features: acts.slice(0, -1).map((a, i) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [a.location.coordinates.lng, a.location.coordinates.lat],
        [acts[i + 1].location.coordinates.lng, acts[i + 1].location.coordinates.lat],
      ],
    },
  })),
});

// Build a single-segment GeoJSON connecting two points (between days)
const buildConnector = (from, to) => ({
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [from.location.coordinates.lng, from.location.coordinates.lat],
        [to.location.coordinates.lng, to.location.coordinates.lat],
      ],
    },
  }],
});

// ── Floating map controls ──────────────────────────────────────────────────

const MapControls = ({ mapRef, currentStyle, onStyleChange }) => {
  const [open, setOpen] = useState(false);
  const currentS = STYLES.find((s) => s.url === currentStyle) || STYLES[0];

  return (
    <div className="tmt-controls">
      <div className="tmt-ctrl-group">
        <button
          className={`tmt-ctrl-btn ${open ? 'tmt-ctrl-btn--active' : ''}`}
          onClick={() => setOpen((v) => !v)}
          title="Change map style"
        >
          {currentS.icon}
        </button>
        {open && (
          <div className="tmt-style-picker">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={`tmt-style-opt ${currentStyle === s.url ? 'tmt-style-opt--active' : ''}`}
                onClick={() => { onStyleChange(s.url); setOpen(false); }}
              >
                <span className="tmt-style-opt__icon">{s.icon}</span>
                <span className="tmt-style-opt__label">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tmt-ctrl-group">
        <button className="tmt-ctrl-btn" onClick={() => mapRef.current?.zoomIn({ duration: 300 })} title="Zoom in">+</button>
        <button className="tmt-ctrl-btn tmt-ctrl-btn--border-top" onClick={() => mapRef.current?.zoomOut({ duration: 300 })} title="Zoom out">−</button>
      </div>

      <div className="tmt-ctrl-group">
        <button className="tmt-ctrl-btn" onClick={() => mapRef.current?.resetNorthPitch({ duration: 500 })} title="Reset bearing">⊙</button>
      </div>
    </div>
  );
};

// ── Numbered map marker ────────────────────────────────────────────────────

const NumMarker = ({ lng, lat, num, name, rating, selected, onClick, color = '#0A539D', dimmed = false }) => {
  const [hov, setHov] = useState(false);
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom"
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick?.(); }}
    >
      <div
        className={`tmt-pin ${selected ? 'tmt-pin--sel' : ''} ${hov ? 'tmt-pin--hov' : ''} ${dimmed ? 'tmt-pin--dim' : ''}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {(hov || selected) && !dimmed && (
          <div className="tmt-pin__popup">
            <span className="tmt-pin__popup-num">{num}.</span>
            <span className="tmt-pin__popup-name">{name}</span>
            {rating != null && (
              <span className="tmt-pin__popup-rating">
                <span className="tmt-pin__popup-star">★</span>{rating}
              </span>
            )}
          </div>
        )}
        <div className="tmt-pin__bubble" style={{ background: color, boxShadow: `0 3px 12px ${color}55` }}>
          <span className="tmt-pin__num">{num}</span>
        </div>
      </div>
    </Marker>
  );
};

// ── Activity card ──────────────────────────────────────────────────────────

const ActivityRow = ({ act, num, selected, onClick, accentColor }) => {
  const cat = (act.category || 'activity').toLowerCase();
  const cost = getCost(act.cost);
  return (
    <div
      className={`tmt-card ${selected ? 'tmt-card--sel' : ''}`}
      style={selected ? { borderLeftColor: accentColor } : {}}
      onClick={onClick}
    >
      <div className="tmt-card__body">
        <div className="tmt-card__meta">
          <span className="tmt-card__icon">{getIcon(cat)}</span>
          {act.time && <span className="tmt-card__time">{act.time}</span>}
          {act.category && (
            <span className="tmt-card__cat">
              {act.category.charAt(0).toUpperCase() + act.category.slice(1)}
            </span>
          )}
        </div>
        <div className="tmt-card__title-row">
          <span className="tmt-card__num" style={{ color: accentColor }}>{num}.</span>
          <h4 className="tmt-card__name">
            {(act.title || act.name || '').length > 22
              ? (act.title || act.name || '').slice(0, 22) + '…'
              : act.title || act.name}
          </h4>
          {act.rating != null && (
            <span className="tmt-card__rating">
              <span className="tmt-card__score">{act.rating}</span>
              <span className="tmt-card__stars">{formatStars(act.rating)}</span>
            </span>
          )}
          {cost && <span className="tmt-card__cost">{cost}</span>}
        </div>
        {act.description && (
          <p className="tmt-card__desc">
            {act.description.length > 110 ? act.description.slice(0, 110) + '…' : act.description}
          </p>
        )}
        {act.tags && act.tags.length > 0 && (
          <div className="tmt-card__tags">
            {act.tags.slice(0, 3).map((t, i) => <span key={i} className="tmt-card__tag">{t}</span>)}
          </div>
        )}
        {act.address && (
          <div className="tmt-card__addr">
            <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            {act.address.split(',').slice(0, 2).join(',')}
          </div>
        )}
      </div>
      {act.image && (
        <div className="tmt-card__img">
          <img src={act.image} alt={act.title} loading="lazy" />
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const TripMapTab = ({ tripData, daysData }) => {
  const { isDark } = useTheme();
  const mapRef = useRef(null);
  const listRef = useRef(null);
  const cardRefs = useRef({});

  const days = daysData || [];

  const [activeDay, setActiveDay] = useState(days[0]?.day_number ?? 1);
  const [selIdx, setSelIdx] = useState(null);
  const [mapStyle, setMapStyle] = useState(isDark ? STYLES[1].url : STYLES[0].url);
  const [viewState, setViewState] = useState({
    longitude: tripData?.destination?.geometry?.lng || 2.35,
    latitude: tripData?.destination?.geometry?.lat || 48.85,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  });

  // Sync map base style with app theme (unless user switched to satellite/streets)
  useEffect(() => {
    setMapStyle((prev) => {
      if (prev === STYLES[0].url || prev === STYLES[1].url) {
        return isDark ? STYLES[1].url : STYLES[0].url;
      }
      return prev;
    });
  }, [isDark]);

  // All days enriched: filtered activities + assigned colour
  const allDaysData = useMemo(
    () =>
      days.map((d, i) => ({
        dayNumber: d.day_number,
        dayIndex: i,
        color: getDayColor(i),
        title: d.title,
        date: d.date,
        activities: (d.activities || []).filter(
          (a) => a.location?.coordinates?.lat && a.location?.coordinates?.lng
        ),
      })),
    [days]
  );

  // Active day object
  const activeDayObj = useMemo(
    () => allDaysData.find((d) => d.dayNumber === activeDay),
    [allDaysData, activeDay]
  );

  const activities = activeDayObj?.activities || [];
  const activeDayColor = activeDayObj?.color || DAY_COLORS[0];

  // Between-day connectors (last act of day N → first act of day N+1)
  const connectors = useMemo(() => {
    const result = [];
    for (let i = 0; i < allDaysData.length - 1; i++) {
      const cur = allDaysData[i].activities;
      const next = allDaysData[i + 1].activities;
      if (cur.length && next.length) {
        result.push({
          id: `conn-${i}`,
          geoJSON: buildConnector(cur[cur.length - 1], next[0]),
        });
      }
    }
    return result;
  }, [allDaysData]);

  // Render inactive days first so active day is always on top
  const sortedDaysData = useMemo(
    () => [
      ...allDaysData.filter((d) => d.dayNumber !== activeDay),
      ...allDaysData.filter((d) => d.dayNumber === activeDay),
    ],
    [allDaysData, activeDay]
  );

  const flyTo = useCallback((act, zoom = 15) => {
    const c = act?.location?.coordinates;
    if (!c || !mapRef.current) return;
    mapRef.current.flyTo({ center: [c.lng, c.lat], zoom, duration: 900, essential: true });
  }, []);

  const flyToDay = useCallback((acts) => {
    if (!acts.length || !mapRef.current) return;
    const lngs = acts.map((a) => a.location.coordinates.lng);
    const lats = acts.map((a) => a.location.coordinates.lat);
    mapRef.current.flyTo({
      center: [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2],
      zoom: 13,
      duration: 1100,
    });
  }, []);

  useEffect(() => {
    setSelIdx(null);
    if (activities.length) flyToDay(activities);
  }, [activeDay]);

  const handleSelect = useCallback(
    (idx) => {
      setSelIdx(idx);
      flyTo(activities[idx]);
      cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [activities, flyTo]
  );

  // ── Early returns ──────────────────────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="tmt-notoken">
        <svg viewBox="0 0 24 24" fill="none" width="44" height="44">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#029e9d" strokeWidth="1.8" />
          <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="1.8" />
        </svg>
        <h3>Mapbox Token Required</h3>
        <p>Add <code>VITE_MAPBOX_TOKEN=pk.xxx</code> to <code>Frontend/.env</code></p>
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="tmt-notoken">
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Generating your itinerary… Map will appear once activities load.
        </p>
      </div>
    );
  }

  return (
    <div className="tmt-layout">

      {/* ── Day pill tabs — same style as ActivitiesSection ────────────── */}
      <div className="tmt-daynav">
        <div className="tmt-daytabs">
          {days.map((day, i) => (
            <button
              key={day.day_number}
              className={`tmt-daytab ${activeDay === day.day_number ? 'tmt-daytab--active' : ''}`}
              style={activeDay === day.day_number ? { background: getDayColor(i), borderColor: getDayColor(i) } : {}}
              onClick={() => setActiveDay(day.day_number)}
              title={day.title || `Day ${day.day_number}`}
            >
              <span className="tmt-daytab__dot" style={{ background: getDayColor(i) }} />
              Day {day.day_number}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split body ───────────────────────────────────────────────────── */}
      <div className="tmt-body">

        {/* Left: activity list */}
        <aside className="tmt-list" ref={listRef}>
          {/* Day header */}
          {activeDayObj && (
            <header className="tmt-list__hdr" style={{ borderLeftColor: activeDayColor }}>
              <div className="tmt-list__hdr-top">
                <span className="tmt-list__hdr-day" style={{ color: activeDayColor }}>
                  Day {activeDay}
                </span>
                <h3 className="tmt-list__hdr-title">{activeDayObj.title || 'Explore'}</h3>
              </div>
              {activeDayObj.date && (
                <span className="tmt-list__hdr-date">
                  {new Date(activeDayObj.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
            </header>
          )}

          {/* Activity cards */}
          {activities.length === 0 ? (
            <div className="tmt-list__empty">No mapped locations for this day.</div>
          ) : (
            activities.map((act, i) => (
              <div key={i} ref={(el) => (cardRefs.current[i] = el)}>
                <ActivityRow
                  act={act}
                  num={i + 1}
                  selected={selIdx === i}
                  onClick={() => handleSelect(i)}
                  accentColor={activeDayColor}
                />
              </div>
            ))
          )}
        </aside>

        {/* Right: map */}
        <div className="tmt-maparea">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(e) => setViewState(e.viewState)}
            mapStyle={mapStyle}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            onClick={() => setSelIdx(null)}
          >
            {/* ── Within-day route segments (inactive days first, active last) */}
            {sortedDaysData.map(({ dayNumber, color, activities: dayActs }) =>
              dayActs.length > 1 ? (
                <Source key={`seg-${dayNumber}`} id={`tmt-seg-${dayNumber}`} type="geojson" data={buildSegments(dayActs)}>
                  <Layer
                    id={`tmt-seg-line-${dayNumber}`}
                    type="line"
                    paint={{
                      'line-color': color,
                      'line-width': dayNumber === activeDay ? 3.5 : 1.5,
                      'line-opacity': dayNumber === activeDay ? 0.9 : 0.25,
                      'line-dasharray': [5, 3],
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                </Source>
              ) : null
            )}

            {/* ── Between-day connectors (last act → next day's first act) */}
            {connectors.map(({ id, geoJSON }) => (
              <Source key={id} id={id} type="geojson" data={geoJSON}>
                <Layer
                  id={`${id}-line`}
                  type="line"
                  paint={{
                    'line-color': '#94a3b8',
                    'line-width': 1.5,
                    'line-opacity': 0.45,
                    'line-dasharray': [2, 5],
                  }}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                />
              </Source>
            ))}

            {/* ── Markers (inactive days first, active day on top) */}
            {sortedDaysData.map(({ dayNumber, color, activities: dayActs }) =>
              dayActs.map((act, i) => (
                <NumMarker
                  key={`${dayNumber}-${i}`}
                  lng={act.location.coordinates.lng}
                  lat={act.location.coordinates.lat}
                  num={i + 1}
                  name={act.title || act.name}
                  rating={act.rating}
                  selected={dayNumber === activeDay && selIdx === i}
                  color={color}
                  dimmed={dayNumber !== activeDay}
                  onClick={() => dayNumber !== activeDay ? setActiveDay(dayNumber) : handleSelect(i)}
                />
              ))
            )}
          </Map>

          {/* Floating controls */}
          <MapControls mapRef={mapRef} currentStyle={mapStyle} onStyleChange={setMapStyle} />

          {/* Day colour legend */}
          {days.length > 1 && (
            <div className="tmt-legend">
              {allDaysData.map(({ dayNumber, dayIndex, color }) => (
                <button
                  key={dayNumber}
                  className={`tmt-legend__item ${activeDay === dayNumber ? 'tmt-legend__item--active' : ''}`}
                  style={{ '--day-color': color }}
                  onClick={() => setActiveDay(dayNumber)}
                  title={`Day ${dayNumber}`}
                >
                  <span className="tmt-legend__dot" />
                  <span className="tmt-legend__label">D{dayNumber}</span>
                </button>
              ))}
            </div>
          )}

          {/* Badge */}
          <div className="tmt-mapbadge">
            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            {activities.length} stop{activities.length !== 1 ? 's' : ''} · Day {activeDay}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMapTab;
