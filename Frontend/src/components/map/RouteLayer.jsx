import React, { useEffect, useRef, useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/mapbox';

const DASH_SEQ = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
  [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1],
  [0, 3.5, 3, 0.5], [0, 4, 3, 0],
];

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const greatCircleCoords = (start, end, n = 64) => {
  const [lng1, lat1] = start.map(toRad);
  const [lng2, lat2] = end.map(toRad);
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (d < 0.001) return [start, end];
  const coords = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    coords.push([
      toDeg(Math.atan2(y, x)),
      toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    ]);
  }
  return coords;
};

const buildFeature = (p1, p2) => {
  const km = haversineKm(p1, p2);
  const coords = km > 300 ? greatCircleCoords(p1, p2) : [p1, p2];
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
};

const RouteLayer = ({
  waypoints = [],
  color = '#029e9d',
  glowColor = '#00e5d5',
  animate = true,
  mapRef = null,
  id = 'premium-route',
}) => {
  const rafRef = useRef(null);

  const geoJSON = useMemo(() => {
    const features = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      features.push(buildFeature(waypoints[i], waypoints[i + 1]));
    }
    return { type: 'FeatureCollection', features };
  }, [waypoints]);

  useEffect(() => {
    if (!animate) return;
    let lastStep = -1;
    const tick = (ts) => {
      const step = Math.floor(ts / 70) % DASH_SEQ.length;
      if (step !== lastStep) {
        try {
          const mb = mapRef?.current?.getMap?.();
          if (mb?.getLayer(`${id}-dash`)) {
            mb.setPaintProperty(`${id}-dash`, 'line-dasharray', DASH_SEQ[step]);
          }
        } catch (_) {}
        lastStep = step;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 600);
    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, mapRef, id]);

  if (!waypoints.length) return null;

  return (
    <Source id={`${id}-src`} type="geojson" data={geoJSON}>
      <Layer
        id={`${id}-atmos`}
        type="line"
        paint={{ 'line-color': glowColor, 'line-width': 30, 'line-opacity': 0.04, 'line-blur': 20 }}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      />
      <Layer
        id={`${id}-glow`}
        type="line"
        paint={{ 'line-color': glowColor, 'line-width': 12, 'line-opacity': 0.14, 'line-blur': 7 }}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      />
      <Layer
        id={`${id}-core`}
        type="line"
        paint={{ 'line-color': color, 'line-width': 2.5, 'line-opacity': 0.9 }}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      />
      <Layer
        id={`${id}-dash`}
        type="line"
        paint={{ 'line-color': '#ffffff', 'line-width': 1.8, 'line-dasharray': [0, 4, 3], 'line-opacity': 0.6 }}
        layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
      />
    </Source>
  );
};

export default RouteLayer;
