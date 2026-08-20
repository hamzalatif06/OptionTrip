import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureLeafletReady, applyTileStyle, fitMapToPoints } from '../../utils/leafletUtils';
import { buildDestinationIcon, buildActivityIcon } from '../../components/TravelMap/markerIcons';
import { getMyTripStoryEntries } from '../../services/tripStoryService';
import LeaveTripStoryModal from '../../components/TripStory/LeaveTripStoryModal';
import './TravelMapTab.css';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

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
  const [tips, setTips]         = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    getMyTripStoryEntries().then((res) => {
      if (res?.success) setTips(res.data.entries || []);
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    ensureLeafletReady().then((L) => {
      if (!containerRef.current) return;
      if (mapRef.current)
        return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapRef.current = map;
      map.setView([20, 0], 2);
      applyTileStyle(L, map, 'voyager');

      const points = [];

      (mapTrips || []).forEach((trip) => {
        const coords = getCoords(trip);
        if (!coords) return;

        points.push({ lat: coords.lat, lng: coords.lng });

        const hasDestCoords = trip.destination?.geometry?.lat && trip.destination?.geometry?.lng;
        const icon = hasDestCoords
          ? buildDestinationIcon(L, { name: trip.destination?.name || 'Trip' })
          : buildActivityIcon(L, { category: 'destination', title: trip.destination?.name || 'Trip' });

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

      tips.forEach((tip) => {
        const lat = tip.location?.coordinates?.lat;
        const lng = tip.location?.coordinates?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        points.push({ lat, lng });
        const icon = buildActivityIcon(L, { category: 'activity', title: tip.location?.name });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        const safeText = String(tip.text || '').replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch]));
        marker.bindPopup(`
          <div style="min-width:200px;max-width:240px;font-family:inherit;padding:4px 0">
            <strong style="font-size:13px;color:#122d46;display:block;margin-bottom:4px">
              📍 ${tip.location?.name || 'Tip'}
            </strong>
            <span style="font-size:12.5px;color:#475569;line-height:1.5">${safeText}</span>
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
  }, [mapTrips, tips]);

  const allTrips = mapTrips || [];

  return (
    <div className="travel-map-tab">

      <aside className="tmt__sidebar">
        <h3 className="tmt__sidebar-title">
          Your Destinations
          <span className="tmt__sidebar-count">{allTrips.length}</span>
        </h3>

        <button type="button" className="tmt__add-tip-btn" onClick={() => setShowLeaveModal(true)}>
          + Leave a travel tip
        </button>

        {tips.length > 0 && (
          <p className="tmt__tips-count">{tips.length} tip{tips.length !== 1 ? 's' : ''} on your map</p>
        )}

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


      <div className="tmt__map" ref={containerRef} />

      {showLeaveModal && (
        <LeaveTripStoryModal
          onClose={() => setShowLeaveModal(false)}
          onCreated={(entry) => setTips((prev) => [entry, ...prev])}
        />
      )}
    </div>
  );
};

export default TravelMapTab;
