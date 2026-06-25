/**
 * Leaflet shared utilities.
 *
 * Leaflet is loaded globally via CDN in `Frontend/index.html` (`window.L`),
 * so this module focuses on:
 *   1. Waiting for the CDN script to be ready before we try to use it
 *   2. A registry of free tile providers (no API key) we can swap between
 *   3. Helpers for building the route lines / fit-bounds we use across the app
 *
 * No npm install needed — keeps the bundle leaner.
 */

/**
 * Resolves with `window.L` once the Leaflet CDN script has finished loading.
 * Polls a few times to cover the "page just loaded" race. Rejects after a
 * generous timeout so calling code can fall back gracefully.
 */
export const ensureLeafletReady = ({ timeoutMs = 4000, pollMs = 80 } = {}) =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR: no window'));
    if (window.L) return resolve(window.L);

    const start = Date.now();
    const tick = () => {
      if (window.L) return resolve(window.L);
      if (Date.now() - start > timeoutMs) return reject(new Error('Leaflet failed to load'));
      setTimeout(tick, pollMs);
    };
    tick();
  });

/**
 * Free tile providers — every one is API-key-free. The "label" / "preview"
 * fields drive the style-picker UI in TripMapTab.
 */
export const TILE_PROVIDERS = {
  streets: {
    id: 'streets',
    label: 'Streets',
    url:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    preview: { bg: '#fdf8e8', road: '#e8a030', block: '#f0e0b0' }
  },
  voyager: {
    id: 'voyager',
    label: 'Voyager',
    url:  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap'
    },
    preview: { bg: '#fff8eb', road: '#f0a060', block: '#fce4a2' }
  },
  outdoors: {
    id: 'outdoors',
    label: 'Outdoors',
    url:  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      subdomains: 'abc',
      attribution: 'Map data: &copy; <a href="https://www.opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    },
    preview: { bg: '#d4e8cc', road: '#90b870', block: '#b8d8a0' }
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
    },
    preview: { bg: '#1a3820', road: '#3a6030', block: '#2e5028', type: 'satellite' }
  },
  hybrid: {
    id: 'hybrid',
    label: 'Hybrid',
    url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Imagery &copy; Esri'
    },
    overlay: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      options: { maxZoom: 19 }
    },
    preview: { bg: '#1e3820', road: '#e8a030', block: '#2e5028', type: 'satellite' }
  },
  light: {
    id: 'light',
    label: 'Light',
    url:  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap'
    },
    preview: { bg: '#f4f6f8', road: '#c8cdd4', block: '#dde2e8' }
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    url:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap'
    },
    preview: { bg: '#1a2236', road: '#2e3f60', block: '#243050' }
  }
};

/** Default order shown in the TripMapTab style picker. */
export const TILE_STYLE_ORDER = [
  'streets', 'voyager', 'outdoors', 'satellite', 'hybrid', 'light', 'dark'
];

/**
 * Attach a tile layer (and optional overlay for "hybrid") to a Leaflet map.
 * Removes any previously-attached managed layers first.
 *
 * The map is decorated with `_optMainTile` / `_optOverlayTile` so we can find
 * and remove them on the next switch.
 */
export const applyTileStyle = (L, map, styleId) => {
  const provider = TILE_PROVIDERS[styleId] || TILE_PROVIDERS.streets;

  if (map._optMainTile)    { map.removeLayer(map._optMainTile);    map._optMainTile = null; }
  if (map._optOverlayTile) { map.removeLayer(map._optOverlayTile); map._optOverlayTile = null; }

  map._optMainTile = L.tileLayer(provider.url, provider.options).addTo(map);

  if (provider.overlay) {
    map._optOverlayTile = L.tileLayer(provider.overlay.url, provider.overlay.options).addTo(map);
  }
};

/** Linear distance-sorted polyline — straight lat/lng segments between stops. */
export const buildRouteLatLngs = (points) => {
  if (!Array.isArray(points) || points.length < 2) return [];
  return points
    .filter(p => typeof p?.lat === 'number' && typeof p?.lng === 'number')
    .map(p => [p.lat, p.lng]);
};

/**
 * Fit the map to a list of coords. Single-point: fly to with a moderate zoom.
 * Multi-point: fit bounds with padding so all pins sit inside the viewport.
 */
export const fitMapToPoints = (L, map, points, opts = {}) => {
  const {
    singleZoom  = 11,
    maxZoom     = 15,
    paddingPx   = [60, 60],
    duration    = 1.0
  } = opts;

  const coords = points
    .filter(p => typeof p?.lat === 'number' && typeof p?.lng === 'number')
    .map(p => [p.lat, p.lng]);

  if (!coords.length) return;

  if (coords.length === 1) {
    map.flyTo(coords[0], singleZoom, { duration, animate: true });
    return;
  }

  const bounds = L.latLngBounds(coords);
  map.flyToBounds(bounds, { padding: paddingPx, maxZoom, duration });
};
