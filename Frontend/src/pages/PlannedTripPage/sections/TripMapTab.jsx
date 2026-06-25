import React, { useEffect, useRef, useState } from 'react';

import {
  ensureLeafletReady,
  applyTileStyle,
  fitMapToPoints,
  buildRouteLatLngs,
  TILE_PROVIDERS,
  TILE_STYLE_ORDER
} from '../../../utils/leafletUtils';
import {
  buildDestinationIcon,
  buildActivityIcon
} from '../../../components/TravelMap/markerIcons';

import './TripMapTab.css';

/**
 * Trip detail map — shows the trip's destination plus every itinerary activity
 * with sequential dashed route lines connecting them. Backed entirely by
 * Leaflet (loaded via CDN), no API key required.
 */

const MAP_STYLES = TILE_STYLE_ORDER.map(id => TILE_PROVIDERS[id]).filter(Boolean);

/* ── Style thumbnail SVG (matches the old preview look) ────────────────────── */
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

const TripMapTab = ({ tripData, daysData }) => {
  const containerRef         = useRef(null);
  const mapRef               = useRef(null);
  const destMarkerRef        = useRef(null);
  const activityMarkersRef   = useRef([]);
  const routeLineRef         = useRef(null);
  const popupRef             = useRef(null);

  const [activeStyleId, setActiveStyleId] = useState('hybrid');
  const [mapReady,      setMapReady]      = useState(false);

  const lng      = tripData?.destination?.geometry?.lng;
  const lat      = tripData?.destination?.geometry?.lat;
  const destName = tripData?.destination?.name || 'Destination';
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  const activities = (daysData || [])
    .flatMap(d => d.activities || [])
    .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
    .slice(0, 40);

  // ── Initialise the map once ──────────────────────────────────────────────
  useEffect(() => {
    let disposed = false;

    ensureLeafletReady().then(L => {
      if (disposed || !containerRef.current) return;

      const initialView = hasCoords ? [lat, lng] : [20, 20];
      const initialZoom = hasCoords ? 11 : 2;

      const map = L.map(containerRef.current, {
        center: initialView,
        zoom:   initialZoom,
        worldCopyJump: true,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

      // Custom fullscreen button (Leaflet has no built-in)
      const Fullscreen = L.Control.extend({
        options: { position: 'topright' },
        onAdd: () => {
          const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control tmt-fs-btn');
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

      applyTileStyle(L, map, activeStyleId);

      mapRef.current = map;
      setMapReady(true);
    }).catch(err => console.error('Leaflet init failed (TripMapTab):', err));

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tile style switch ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L || !mapReady) return;
    applyTileStyle(window.L, map, activeStyleId);
  }, [activeStyleId, mapReady]);

  // ── Plot destination + activity markers + route polyline ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L || !mapReady) return;

    // Clear everything we manage
    if (destMarkerRef.current)        { map.removeLayer(destMarkerRef.current); destMarkerRef.current = null; }
    if (routeLineRef.current)         { map.removeLayer(routeLineRef.current);  routeLineRef.current = null; }
    activityMarkersRef.current.forEach(m => map.removeLayer(m));
    activityMarkersRef.current = [];

    // Destination pin
    if (hasCoords) {
      const marker = L.marker([lat, lng], {
        icon: buildDestinationIcon(L, { name: destName, isSelected: true, color: '#029e9d' }),
        zIndexOffset: 1000
      });

      const popupHtml = `
        <div class="tmt-popup">
          <h4 class="tmt-popup__title">${destName.replace(/[<>&"]/g, '')}</h4>
          ${tripData?.dates?.start_date ? `
            <p class="tmt-popup__dates">
              ${new Date(tripData.dates.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              ${tripData.dates.end_date && tripData.dates.end_date !== tripData.dates.start_date
                ? ` → ${new Date(tripData.dates.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : ''}
            </p>` : ''}
          ${tripData?.dates?.duration_days > 0
            ? `<p class="tmt-popup__days">${tripData.dates.duration_days} day${tripData.dates.duration_days !== 1 ? 's' : ''}</p>`
            : ''}
          <p class="tmt-popup__activities">${activities.length} activity pin${activities.length !== 1 ? 's' : ''} on this map</p>
        </div>`;

      const popup = L.popup({
        offset:        [0, -36],
        closeButton:   true,
        autoClose:     false,
        closeOnClick:  false,
        className:     'tmt-popup-wrap',
        maxWidth:      260
      }).setContent(popupHtml);

      marker.bindPopup(popup);
      marker.addTo(map);
      destMarkerRef.current = marker;
      popupRef.current = popup;
    }

    // Activity pins
    activities.forEach(act => {
      const lt = act.location.coordinates.lat;
      const ln = act.location.coordinates.lng;
      const marker = L.marker([lt, ln], {
        icon: buildActivityIcon(L, { category: act.category, title: act.title })
      });
      marker.bindTooltip(act.title || 'Activity', { direction: 'top', offset: [0, -8] });
      marker.addTo(map);
      activityMarkersRef.current.push(marker);
    });

    // Route line between activities (in itinerary order)
    if (activities.length >= 2) {
      const latLngs = buildRouteLatLngs(
        activities.map(a => ({ lat: a.location.coordinates.lat, lng: a.location.coordinates.lng }))
      );
      routeLineRef.current = L.polyline(latLngs, {
        color:      '#029e9d',
        weight:     2.5,
        opacity:    0.65,
        dashArray:  '6 6',
        interactive: false
      }).addTo(map);
    }

    // Fit bounds to show everything
    const allPoints = [
      ...(hasCoords ? [{ lat, lng }] : []),
      ...activities.map(a => ({
        lat: a.location.coordinates.lat,
        lng: a.location.coordinates.lng
      }))
    ];
    if (allPoints.length) {
      fitMapToPoints(L, map, allPoints, {
        singleZoom: 14,
        maxZoom:    15,
        paddingPx:  [70, 60],
        duration:   1.0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, hasCoords, lat, lng, destName, activities.length]);

  return (
    <div className="tmt-root">
      {/* Style picker bar */}
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

      {/* Map */}
      <div className="tmt-wrap">
        <div ref={containerRef} className="tmt-leaflet" />

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
