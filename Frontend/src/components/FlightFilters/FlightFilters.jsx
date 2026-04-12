import React, { useMemo, useState } from 'react';
import './FlightFilters.css';

export const DEFAULT_FILTERS = {
  stops:       'all',
  priceMin:    0,
  priceMax:    Infinity,
  airlines:    [],
  depTimes:    [],
  maxDuration: null,
};

const DEP_TIME_SLOTS = [
  { id: 'morning',   label: 'Morning',   sub: '6 – 12',  hourMin: 6,  hourMax: 12 },
  { id: 'afternoon', label: 'Afternoon', sub: '12 – 18', hourMin: 12, hourMax: 18 },
  { id: 'evening',   label: 'Evening',   sub: '18 – 24', hourMin: 18, hourMax: 24 },
  { id: 'night',     label: 'Night',     sub: '0 – 6',   hourMin: 0,  hourMax: 6  },
];

/**
 * Pure filter function — works for both TP and GF flight shapes.
 * TP: { stops, price, airline, departureAt (ISO), durationMinutes }
 * GF: { stops, price, airline, departureTime (HH:MM), durationMinutes }
 */
export function applyFilters(flights, filters) {
  return flights.filter(f => {
    // Stops
    if (filters.stops !== 'all') {
      const s = Number(f.stops ?? 0);
      if (filters.stops === '0'  && s !== 0)  return false;
      if (filters.stops === '1'  && s !== 1)  return false;
      if (filters.stops === '2+' && s < 2)    return false;
    }

    // Price
    const price = f.price ?? 0;
    if (filters.priceMin > 0       && price < filters.priceMin)    return false;
    if (filters.priceMax < Infinity && price > filters.priceMax)    return false;

    // Airlines
    if (filters.airlines.length > 0) {
      const airlineStr = (f.airline || '').split('|')[0].trim(); // GF may pipe-join
      if (!filters.airlines.includes(airlineStr)) return false;
    }

    // Departure time
    if (filters.depTimes.length > 0) {
      // TP: departureAt = ISO string; GF: departureTime = "HH:MM"
      let hour = null;
      if (f.departureAt) {
        hour = new Date(f.departureAt).getHours();
      } else if (f.departureTime) {
        hour = parseInt(f.departureTime.split(':')[0], 10);
      }
      if (hour !== null) {
        const inSlot = filters.depTimes.some(slotId => {
          const slot = DEP_TIME_SLOTS.find(s => s.id === slotId);
          if (!slot) return false;
          if (slot.id === 'night') return hour >= 0 && hour < 6;
          return hour >= slot.hourMin && hour < slot.hourMax;
        });
        if (!inSlot) return false;
      }
    }

    // Max duration
    if (filters.maxDuration !== null && f.durationMinutes != null) {
      if (f.durationMinutes > filters.maxDuration) return false;
    }

    return true;
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */

const FlightFilters = ({ flights, filters, onChange }) => {
  const [open, setOpen] = useState(false); // mobile toggle

  const stats = useMemo(() => {
    if (!flights.length) return { minPrice: 0, maxPrice: 1000, airlines: [], maxDur: null };
    const prices = flights.map(f => f.price ?? 0).filter(Boolean);
    const durs   = flights.map(f => f.durationMinutes).filter(v => v != null);
    const airlineSet = new Set();
    flights.forEach(f => {
      const a = (f.airline || '').split('|')[0].trim();
      if (a) airlineSet.add(a);
    });
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 9999,
      airlines: [...airlineSet].sort(),
      maxDur:   durs.length   ? Math.max(...durs)   : null,
    };
  }, [flights]);

  const set = (key, value) => onChange({ ...filters, [key]: value });

  const toggleAirline = (airline) => {
    const next = filters.airlines.includes(airline)
      ? filters.airlines.filter(a => a !== airline)
      : [...filters.airlines, airline];
    set('airlines', next);
  };

  const toggleDepTime = (id) => {
    const next = filters.depTimes.includes(id)
      ? filters.depTimes.filter(t => t !== id)
      : [...filters.depTimes, id];
    set('depTimes', next);
  };

  const activeCount = [
    filters.stops !== 'all',
    filters.priceMin > 0 || filters.priceMax < Infinity,
    filters.airlines.length > 0,
    filters.depTimes.length > 0,
    filters.maxDuration !== null,
  ].filter(Boolean).length;

  const resetAll = () => onChange({
    ...DEFAULT_FILTERS,
    priceMin: 0,
    priceMax: Infinity,
  });

  const maxDurHours = stats.maxDur ? Math.ceil(stats.maxDur / 60) : 24;
  const sliderMax   = Math.max(maxDurHours, 1) * 60;

  return (
    <aside className="flf-aside">
      {/* Mobile toggle */}
      <button className="flf-mobile-toggle" onClick={() => setOpen(v => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        Filters
        {activeCount > 0 && <span className="flf-badge">{activeCount}</span>}
        <svg className={`flf-chevron${open ? ' flf-chevron--up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={`flf-panel${open ? ' flf-panel--open' : ''}`}>
        {/* Header */}
        <div className="flf-header">
          <span className="flf-header__title">Filters</span>
          {activeCount > 0 && (
            <button className="flf-reset" onClick={resetAll}>Reset all</button>
          )}
        </div>

        {/* ── Stops ── */}
        <div className="flf-section">
          <div className="flf-section__label">Stops</div>
          <div className="flf-stops">
            {[
              { value: 'all', label: 'Any' },
              { value: '0',   label: 'Non-stop' },
              { value: '1',   label: '1 Stop' },
              { value: '2+',  label: '2+ Stops' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`flf-stop-pill${filters.stops === opt.value ? ' flf-stop-pill--active' : ''}`}
                onClick={() => set('stops', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Price range ── */}
        <div className="flf-section">
          <div className="flf-section__label">Price (USD)</div>
          <div className="flf-price-row">
            <div className="flf-price-field">
              <label className="flf-price-label">Min</label>
              <input
                className="flf-price-input"
                type="number"
                min={0}
                max={filters.priceMax < Infinity ? filters.priceMax : undefined}
                placeholder={`$${stats.minPrice}`}
                value={filters.priceMin > 0 ? filters.priceMin : ''}
                onChange={e => set('priceMin', e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <span className="flf-price-dash">–</span>
            <div className="flf-price-field">
              <label className="flf-price-label">Max</label>
              <input
                className="flf-price-input"
                type="number"
                min={filters.priceMin}
                placeholder={`$${stats.maxPrice}`}
                value={filters.priceMax < Infinity ? filters.priceMax : ''}
                onChange={e => set('priceMax', e.target.value ? Number(e.target.value) : Infinity)}
              />
            </div>
          </div>
        </div>

        {/* ── Airlines ── */}
        {stats.airlines.length > 0 && (
          <div className="flf-section">
            <div className="flf-section__label">Airlines</div>
            <div className="flf-airlines">
              {stats.airlines.slice(0, 8).map(airline => (
                <label key={airline} className="flf-checkbox-row">
                  <input
                    type="checkbox"
                    className="flf-checkbox"
                    checked={filters.airlines.includes(airline)}
                    onChange={() => toggleAirline(airline)}
                  />
                  <span className="flf-checkbox-label">{airline}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Departure time ── */}
        <div className="flf-section">
          <div className="flf-section__label">Departure time</div>
          <div className="flf-time-grid">
            {DEP_TIME_SLOTS.map(slot => (
              <button
                key={slot.id}
                className={`flf-time-pill${filters.depTimes.includes(slot.id) ? ' flf-time-pill--active' : ''}`}
                onClick={() => toggleDepTime(slot.id)}
              >
                <span className="flf-time-pill__name">{slot.label}</span>
                <span className="flf-time-pill__sub">{slot.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Max duration ── */}
        {stats.maxDur && (
          <div className="flf-section">
            <div className="flf-section__label">
              Max duration
              {filters.maxDuration !== null
                ? ` — ${Math.floor(filters.maxDuration / 60)}h ${filters.maxDuration % 60}m`
                : ' — Any'}
            </div>
            <input
              className="flf-slider"
              type="range"
              min={60}
              max={sliderMax}
              step={30}
              value={filters.maxDuration ?? sliderMax}
              onChange={e => {
                const val = Number(e.target.value);
                set('maxDuration', val >= sliderMax ? null : val);
              }}
            />
            <div className="flf-slider-labels">
              <span>1h</span>
              <span>{Math.ceil(sliderMax / 60)}h</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default FlightFilters;
