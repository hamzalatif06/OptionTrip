import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ensureLeafletReady, applyTileStyle, fitMapToPoints } from '../../utils/leafletUtils';
import { buildActivityIcon } from '../../components/TravelMap/markerIcons';
import './VisitedPlacesTab.css';

const CATEGORIES = [
  { value: 'destination', label: 'Destination' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'dining', label: 'Dining' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'nature', label: 'Nature' },
  { value: 'beach', label: 'Beach' },
  { value: 'culture', label: 'Culture' },
  { value: 'other', label: 'Other' },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const VisitedPlacesTab = ({ locations = [], trips = [], onAdd, onRemove }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: '', city: '', country: '', category: 'destination', notes: '' });

  const rebuildMap = useCallback(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    ensureLeafletReady().then((L) => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapRef.current = map;
      applyTileStyle(L, map, 'voyager');

      const valid = locations.filter((l) => l.coordinates?.lat && l.coordinates?.lng);

      valid.forEach((loc) => {
        const icon   = buildActivityIcon(loc.category || 'activity', loc.name);
        const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:170px;font-family:inherit;padding:4px 0">
            <strong style="font-size:14px;color:#122d46;display:block">${loc.name}</strong>
            ${loc.city || loc.country ? `<span style="font-size:12px;color:#64748b">${[loc.city, loc.country].filter(Boolean).join(', ')}</span><br/>` : ''}
            <span style="font-size:12px;color:#94a3b8">Visited ${fmt(loc.visited_at)}</span><br/>
            <button
              id="rm-${loc._id}"
              style="margin-top:10px;padding:5px 12px;background:#ef4444;color:#fff;border:none;
                     border-radius:8px;font-size:12px;cursor:pointer;font-weight:600">
              Remove
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`rm-${loc._id}`);
          if (btn) btn.onclick = () => onRemove(loc._id);
        });
      });

      if (valid.length > 0) {
        fitMapToPoints(L, map, valid.map((l) => [l.coordinates.lat, l.coordinates.lng]));
      } else {
        map.setView([20, 0], 2);
      }
    });
  }, [locations, onRemove]);

  useEffect(() => {
    rebuildMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [rebuildMap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd({ ...form, name: form.name.trim() });
    setForm({ name: '', city: '', country: '', category: 'destination', notes: '' });
    setShowForm(false);
    setSaving(false);
  };

  const handleMarkTripVisited = async (trip) => {
    const lat = trip.destination?.geometry?.lat;
    const lng = trip.destination?.geometry?.lng;
    await onAdd({
      trip_id:     trip.trip_id,
      name:        trip.destination?.name || 'Trip destination',
      city:        trip.destination?.name,
      country:     (trip.destination?.text || '').split(',').slice(-1)[0]?.trim() || '',
      coordinates: lat && lng ? { lat, lng } : undefined,
      category:    'destination',
    });
  };

  return (
    <div className="visited-tab">
      {/* Sidebar */}
      <aside className="vt__sidebar">
        <div className="vt__sidebar-header">
          <h3 className="vt__sidebar-title">
            Visited Places
            <span className="vt__sidebar-count">{locations.length}</span>
          </h3>
          <button className="vt__add-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form className="vt__form" onSubmit={handleSubmit}>
            <input
              className="vt__input"
              placeholder="Place name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="vt__form-row">
              <input
                className="vt__input"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                className="vt__input"
                placeholder="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <select
              className="vt__select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              className="vt__input"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="submit" className="vt__submit-btn" disabled={saving}>
              {saving ? 'Adding...' : 'Add Place'}
            </button>
          </form>
        )}

        {/* Quick-mark trips as visited */}
        {trips.length > 0 && (
          <div className="vt__trips-section">
            <p className="vt__trips-label">Mark destination as visited:</p>
            <div className="vt__trips-chips">
              {trips.map((trip) => (
                <button
                  key={trip.trip_id}
                  className="vt__trip-chip"
                  onClick={() => handleMarkTripVisited(trip)}
                >
                  + {trip.destination?.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <div className="vt__list">
          {locations.length === 0 ? (
            <p className="vt__empty">
              No visited places yet. Use the "+ Add" button or mark a trip destination above.
            </p>
          ) : (
            locations.map((loc) => (
              <div key={loc._id} className="vt__item">
                <div
                  className="vt__item-dot"
                  style={{ background: CATEGORY_COLORS[loc.category] || '#029e9d' }}
                />
                <div className="vt__item-body">
                  <span className="vt__item-name">{loc.name}</span>
                  <span className="vt__item-meta">
                    {[loc.city, loc.country].filter(Boolean).join(', ')}
                    {loc.visited_at ? ` · ${fmt(loc.visited_at)}` : ''}
                  </span>
                </div>
                <button className="vt__remove-btn" onClick={() => onRemove(loc._id)} title="Remove">✕</button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="vt__map" ref={containerRef} />
    </div>
  );
};

const CATEGORY_COLORS = {
  destination:  '#029e9d',
  sightseeing:  '#2563eb',
  dining:       '#ea580c',
  adventure:    '#16a34a',
  nature:       '#16a34a',
  beach:        '#0891b2',
  culture:      '#7c3aed',
  other:        '#64748b',
};

export default VisitedPlacesTab;
