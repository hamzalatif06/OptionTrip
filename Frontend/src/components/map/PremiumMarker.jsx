import React, { useState } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import './PremiumMarker.css';

const MARKER_DEFS = {
  destination: {
    color: '#029e9d',
    paths: [
      'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z',
      'M12 7a3 3 0 100 6 3 3 0 000-6z',
    ],
  },
  hotel: {
    color: '#3b82f6',
    paths: [
      'M2 20h20',
      'M3 20V8a2 2 0 012-2h4v14',
      'M9 20v-8h6v8',
      'M15 20V6a2 2 0 012-2h3v16',
    ],
  },
  restaurant: {
    color: '#f97316',
    paths: [
      'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2',
      'M7 2v20',
      'M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
    ],
  },
  flight: {
    color: '#8b5cf6',
    paths: [
      'M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    ],
  },
  activity: {
    color: '#22c55e',
    paths: [
      'M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z',
    ],
  },
  photo: {
    color: '#ec4899',
    paths: [
      'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z',
      'M12 17a4 4 0 100-8 4 4 0 000 8z',
    ],
  },
  museum: {
    color: '#eab308',
    paths: [
      'M3 22V9',
      'M21 22V9',
      'M12 22V9',
      'M1 9l11-7 11 7H1z',
      'M5 22h14',
    ],
  },
  car: {
    color: '#64748b',
    paths: [
      'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2',
      'M7 17a2 2 0 100 4 2 2 0 000-4z',
      'M17 17a2 2 0 100 4 2 2 0 000-4z',
    ],
  },
};

const PremiumMarker = ({
  longitude,
  latitude,
  type = 'destination',
  title = '',
  isActive = false,
  isSelected = false,
  index,
  size = 'normal',
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const cfg = MARKER_DEFS[type] || MARKER_DEFS.destination;
  const showLabel = hovered || isSelected;

  const handleClick = (e) => {
    e.originalEvent?.stopPropagation();
    onClick?.();
  };

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom" onClick={handleClick}>
      <div
        className={[
          'pm-wrap',
          size === 'small' ? 'pm-wrap--sm' : '',
          isActive ? 'pm-wrap--active' : '',
          isSelected ? 'pm-wrap--selected' : '',
          hovered ? 'pm-wrap--hovered' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--mc': cfg.color }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {(isActive || isSelected) && (
          <>
            <span className="pm-ring pm-ring--1" />
            <span className="pm-ring pm-ring--2" />
          </>
        )}
        <div className="pm-pin">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width={size === 'small' ? 12 : 16}
            height={size === 'small' ? 12 : 16}
            className="pm-pin__icon"
          >
            {cfg.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
          {index !== undefined && <span className="pm-num">{index + 1}</span>}
        </div>
        {showLabel && title && <div className="pm-label">{title}</div>}
      </div>
    </Marker>
  );
};

export const UserLocationMarker = ({ longitude, latitude }) => (
  <Marker longitude={longitude} latitude={latitude} anchor="center">
    <div className="pm-user-outer">
      <div className="pm-user-dot" />
    </div>
  </Marker>
);

export default PremiumMarker;
