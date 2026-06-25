/**
 * Marker divIcon factories for Leaflet.
 *
 * These render the same HTML markup the old react-map-gl markers produced,
 * so the existing `TripMarker.css` styles (`tm-marker`, `tm-marker__dot`, etc.)
 * keep working with zero changes.
 */
import './TripMarker.css';

const CATEGORY_COLORS = {
  flight:      '#029e9d',
  hotel:       '#2563eb',
  activity:    '#16a34a',
  restaurant:  '#ea580c',
  car:         '#7c3aed',
  destination: '#029e9d'
};

const ICON_PATHS = {
  flight:      '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  hotel:       '<path d="M2 20h20M3 20V8a2 2 0 012-2h4v14M9 20v-8h6v8M15 20V6a2 2 0 012-2h3v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  activity:    '<path d="M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  restaurant:  '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  car:         '<path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="7" cy="17" r="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="2" fill="none"/>',
  destination: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/>'
};

const buildSvg = (category, size) => {
  const path = ICON_PATHS[category] || ICON_PATHS.destination;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${path}</svg>`;
};

/**
 * Destination marker — used for trip destinations and the "main" pin in
 * TripMapTab. Reuses the existing `tm-marker--dest` CSS so the pulsing ring
 * and label keep their visual styling.
 */
export const buildDestinationIcon = (L, { name, color, isSelected = false } = {}) => {
  const c = color || CATEGORY_COLORS.destination;
  const safeName = String(name || '').replace(/[<>&"]/g, ch => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
  }[ch]));

  const html = `
    <div class="tm-marker tm-marker--dest${isSelected ? ' tm-marker--selected' : ''}" style="--mc: ${c}" title="${safeName}">
      ${isSelected ? '<span class="tm-marker__pulse"></span>' : ''}
      <span class="tm-marker__dot">${buildSvg('destination', 16)}</span>
      ${safeName ? `<span class="tm-marker__label">${safeName}</span>` : ''}
    </div>`;

  return L.divIcon({
    html,
    className: 'tm-marker-wrap',
    iconSize:  [120, 56],
    iconAnchor: [60, 56]   // bottom of the pin
  });
};

/**
 * Activity marker — small category-coloured dot used everywhere we plot an
 * activity / point-of-interest.
 */
export const buildActivityIcon = (L, { category = 'activity', title } = {}) => {
  const cat   = (category || 'activity').toLowerCase();
  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.activity;
  const safeTitle = String(title || '').replace(/[<>&"]/g, ch => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
  }[ch]));

  const html = `
    <div class="tm-marker tm-marker--activity" style="--mc: ${color}" title="${safeTitle}">
      <span class="tm-marker__dot tm-marker__dot--sm">${buildSvg(cat, 12)}</span>
    </div>`;

  return L.divIcon({
    html,
    className: 'tm-marker-wrap',
    iconSize:  [28, 28],
    iconAnchor: [14, 14]
  });
};

export { CATEGORY_COLORS };
