import React, { useState } from 'react';
import './MapFloatingControls.css';

const STYLES = [
  { id: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', icon: '🌙' },
  { id: 'light', label: 'Light', url: 'mapbox://styles/mapbox/light-v11', icon: '☀️' },
  { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12', icon: '🛰️' },
  { id: 'nav-night', label: 'Navigation', url: 'mapbox://styles/mapbox/navigation-night-v1', icon: '🗺️' },
];

const MapFloatingControls = ({
  mapRef,
  show3D,
  onToggle3D,
  showTerrain,
  onToggleTerrain,
  trackingUser,
  onToggleTracking,
  currentStyle,
  onStyleChange,
}) => {
  const [showStylePicker, setShowStylePicker] = useState(false);

  const zoomIn = () => mapRef?.current?.zoomIn({ duration: 260 });
  const zoomOut = () => mapRef?.current?.zoomOut({ duration: 260 });
  const resetCamera = () =>
    mapRef?.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });

  return (
    <div className="mfc-container">
      {/* Style picker */}
      {showStylePicker && (
        <div className="mfc-style-picker">
          {STYLES.map((s) => (
            <button
              key={s.id}
              className={`mfc-style-btn${currentStyle === s.url ? ' mfc-style-btn--active' : ''}`}
              onClick={() => {
                onStyleChange?.(s.url);
                setShowStylePicker(false);
              }}
              title={s.label}
            >
              <span className="mfc-style-btn__icon">{s.icon}</span>
              <span className="mfc-style-btn__label">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Controls panel */}
      <div className="mfc-panel">
        {/* Style toggle */}
        <button
          className={`mfc-btn${showStylePicker ? ' mfc-btn--active' : ''}`}
          onClick={() => setShowStylePicker((s) => !s)}
          title="Map Style"
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path
              d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 2v16M16 6v16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mfc-divider" />

        {/* 3D Buildings */}
        <button
          className={`mfc-btn${show3D ? ' mfc-btn--active' : ''}`}
          onClick={onToggle3D}
          title="3D Buildings"
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path
              d="M3 21h18M3 21V9l7-6 7 6v12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21v-6h6v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Terrain */}
        <button
          className={`mfc-btn${showTerrain ? ' mfc-btn--active' : ''}`}
          onClick={onToggleTerrain}
          title="3D Terrain"
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path
              d="M3 18l4.5-9L11 13l3.5-7L22 18H3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mfc-divider" />

        {/* Live location */}
        <button
          className={`mfc-btn${trackingUser ? ' mfc-btn--tracking' : ''}`}
          onClick={onToggleTracking}
          title={trackingUser ? 'Stop Tracking' : 'My Location'}
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mfc-divider" />

        {/* Zoom in */}
        <button className="mfc-btn" onClick={zoomIn} title="Zoom In">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Zoom out */}
        <button className="mfc-btn" onClick={zoomOut} title="Zoom Out">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Reset bearing/pitch */}
        <button className="mfc-btn" onClick={resetCamera} title="Reset View">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 6l1.5 4.5H18l-3.75 2.5 1.5 4.5L12 15l-3.75 2.5 1.5-4.5L6 10.5h4.5L12 6z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MapFloatingControls;
