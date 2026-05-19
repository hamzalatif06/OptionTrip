import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, ScaleControl, Popup } from 'react-map-gl/mapbox';
import { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from '../../../contexts/ThemeContext';
import './TripMapTab.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const CATEGORY_COLORS = {
  flight:      '#029e9d',
  hotel:       '#2563eb',
  activity:    '#16a34a',
  restaurant:  '#ea580c',
  car:         '#7c3aed',
  default:     '#029e9d',
};

const PIN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ActivityPin = ({ activity, idx }) => {
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

const TripMapTab = ({ tripData, daysData }) => {
  const { isDark } = useTheme();
  const mapRef    = useRef(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const lng = tripData?.destination?.geometry?.lng;
  const lat = tripData?.destination?.geometry?.lat;
  const destName = tripData?.destination?.name || 'Destination';

  const activities = (daysData || [])
    .flatMap(d => d.activities || [])
    .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
    .slice(0, 40);

  const hasCoords = !!(lng && lat);

  const initialView = hasCoords
    ? { longitude: lng, latitude: lat, zoom: 11 }
    : { longitude: 20, latitude: 20, zoom: 1.5 };

  const [viewState, setViewState] = useState(initialView);

  useEffect(() => {
    if (hasCoords && mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 11, duration: 1200, essential: true });
    }
  }, [lng, lat]);

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

  const mapStyle = isDark
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

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
    <div className="tmt-wrap">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        mapStyle={mapStyle}
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
          <ActivityPin key={`act-${i}`} activity={act} idx={i} />
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
  );
};

export default TripMapTab;
