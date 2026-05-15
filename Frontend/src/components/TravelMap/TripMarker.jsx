import React, { useState } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import './TripMarker.css';

/* ── Category icons ─────────────────────────────────────────────────────── */
const CategoryIcon = ({ category, size = 18 }) => {
  const icons = {
    flight:      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>,
    hotel:       <path d="M2 20h20M3 20V8a2 2 0 012-2h4v14M9 20v-8h6v8M15 20V6a2 2 0 012-2h3v16"/>,
    activity:    <path d="M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z"/>,
    restaurant:  <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
    car:         <><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
    destination: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  };
  const d = icons[category] || icons.destination;
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      {Array.isArray(d) ? d.map((el, i) => React.cloneElement(el, { key: i, stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }))
        : React.cloneElement(d, { stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })}
    </svg>
  );
};

/* ── Colour per category ─────────────────────────────────────────────────── */
const CATEGORY_COLORS = {
  flight:      '#029e9d',
  hotel:       '#2563eb',
  activity:    '#16a34a',
  restaurant:  '#ea580c',
  car:         '#7c3aed',
  destination: '#029e9d',
};

/* ── Destination marker (pulsing ring) ───────────────────────────────────── */
export const DestinationMarker = ({ trip, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS.destination;

  return (
    <Marker
      longitude={trip.destination?.geometry?.lng || 0}
      latitude={trip.destination?.geometry?.lat || 0}
      anchor="bottom"
      onClick={e => { e.originalEvent.stopPropagation(); onClick(trip); }}
    >
      <div
        className={`tm-marker tm-marker--dest${isSelected ? ' tm-marker--selected' : ''}${hovered ? ' tm-marker--hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ '--mc': color }}
        title={trip.destination?.name}
      >
        {isSelected && <span className="tm-marker__pulse" />}
        <span className="tm-marker__dot">
          <CategoryIcon category="destination" size={16} />
        </span>
        <span className="tm-marker__label">{trip.destination?.name}</span>
      </div>
    </Marker>
  );
};

/* ── Activity marker (smaller, category-coloured) ────────────────────────── */
export const ActivityMarker = ({ activity, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const cat   = (activity.category || 'activity').toLowerCase();
  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.activity;
  const lng   = activity.location?.coordinates?.lng;
  const lat   = activity.location?.coordinates?.lat;
  if (!lng || !lat) return null;

  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom"
      onClick={e => { e.originalEvent.stopPropagation(); onClick?.(activity); }}>
      <div
        className={`tm-marker tm-marker--activity${hovered ? ' tm-marker--hovered' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ '--mc': color }}
        title={activity.title}
      >
        <span className="tm-marker__dot tm-marker__dot--sm">
          <CategoryIcon category={cat} size={12} />
        </span>
      </div>
    </Marker>
  );
};
