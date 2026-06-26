import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ensureLeafletReady, applyTileStyle, fitMapToPoints } from '../../utils/leafletUtils';
import { buildDestinationIcon, buildActivityIcon } from '../../components/TravelMap/markerIcons';
import './TravelMapTab.css';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * Try destination.geometry first; if missing fall back to the first
 * activity coordinate found across any option's itinerary.
 */
const getCoords = (trip) => {
  const g = trip.destination?.geometry;
  if (g?.lat && g?.lng) return { lat: g.lat, lng: g.lng };

  for (const opt of trip.options || []) {
    for (const day of opt.itinerary || []) {
      for (const act of day.activities || []) {
        const c = act.location?.coordinates;
        if (c?.lat && c?.lng) return { lat: c.lat, lng: c.lng };
      }
    }
  }
  return null;
};

const TravelMapTab = ({ mapTrips }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy any existing map before rebuilding
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    ensureLeafletReady().then((L) => {
      if (!containerRef.current) return;
      // Guard against double-init if effect fires twice
      if (mapRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapRef.current = map;
      applyTileStyle(L, map, 'voyager');

      const points = [];

      (mapTrips || []).forEach((trip) => {
        const coords = getCoords(trip);
        if (!coords) return;

        points.push([coords.lat, coords.lng]);

        // Use destination icon when we have real geometry; activity icon as fallback
        const hasDestCoords = trip.destination?.geometry?.lat && trip.destination?.geometry?.lng;
        const icon = hasDestCoords
          ? buildDestinationIcon(trip.destination?.name || 'Trip')
          : buildActivityIcon('destination', trip.destination?.name || 'Trip');

        const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:200px;font-family:inherit;padding:4px 0">
            <strong style="font-size:15px;color:#122d46;display:block;margin-bottom:4px">
              ${trip.destination?.name || 'Trip'}
            </strong>
            <span style="font-size:12px;color:#64748b">
              ${fmt(trip.dates?.start_date)} – ${fmt(trip.dates?.end_date)}
            </span><br/>
            <span style="font-size:12px;color:#64748b">
              ${trip.dates?.duration_days || 0} days
            </span><br/>
            <a href="/planned-trip/${trip.trip_id}"
               style="display:inline-block;margin-top:10px;padding:6px 14px;background:#029e9d;
                      color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">
              View Itinerary →
            </a>
          </div>
        `);
      });

      if (points.length > 0) {
        fitMapToPoints(L, map, points);
      } else {
        map.setView([20, 0], 2);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapTrips]);

  // Sidebar shows all trips; dims those without any locatable coordinates
  const allTrips = mapTrips || [];

  return (
    <div className="travel-map-tab">
      {/* Sidebar */}
      <aside className="tmt__sidebar">
        <h3 className="tmt__sidebar-title">
          Your Destinations
          <span className="tmt__sidebar-count">{allTrips.length}</span>
        </h3>

        {allTrips.length === 0 ? (
          <p className="tmt__sidebar-empty">
            Save a trip to see it pinned on your world map.
          </p>
        ) : (
          <ul className="tmt__list">
            {allTrips.map((trip) => {
              const hasPin = !!getCoords(trip);
              return (
                <li key={trip.trip_id} className={`tmt__item${!hasPin ? ' tmt__item--no-pin' : ''}`}>
                  <div className="tmt__item-dot" style={{ background: hasPin ? '#029e9d' : '#cbd5e1' }} />
                  <div className="tmt__item-body">
                    <span className="tmt__item-name">{trip.destination?.name || 'Unknown'}</span>
                    <span className="tmt__item-dates">
                      {fmt(trip.dates?.start_date)} · {trip.dates?.duration_days || 0}d
                      {!hasPin && <span className="tmt__no-pin-note"> · no map pin</span>}
                    </span>
                  </div>
                  <Link to={`/planned-trip/${trip.trip_id}`} className="tmt__item-link">
                    →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Map */}
      <div className="tmt__map" ref={containerRef} />
    </div>
  );
};

export default TravelMapTab;
