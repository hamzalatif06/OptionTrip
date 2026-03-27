import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchAirports, searchFlightsGoogle } from '../../../services/flightService';
import FlightCardGF from '../../../components/FlightCard/FlightCardGF';
import './FlightTab.css';

const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

/* ── Debounce hook ─────────────────────────────────────────────────────────── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Airport autocomplete field ───────────────────────────────────────────── */
const AirportField = ({ label, value, onSelect, error, placeholder }) => {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const debouncedQuery = useDebounce(query, 350);

  // Sync when parent swaps or pre-fills value
  useEffect(() => {
    if (value?.name !== undefined && query !== value.name) {
      setQuery(value?.name || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.name]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    // Don't re-fetch when a selection was just made
    if (value?.name === debouncedQuery) return;

    setLoading(true);
    searchAirports(debouncedQuery).then((locs) => {
      const top = locs.slice(0, 6);
      setSuggestions(top);
      setOpen(top.length > 0);
      setLoading(false);
    });
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (loc) => {
    const label = `${loc.cityName || loc.name} (${loc.iataCode})`;
    setQuery(label);
    setSuggestions([]);
    setOpen(false);
    onSelect({ code: loc.iataCode, name: label });
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    onSelect(null); // clear selection on manual edit
  };

  return (
    <div
      ref={ref}
      className={`ft-field ft-field--lg ft-field--autocomplete${error ? ' ft-field--error' : ''}`}
    >
      <label className="ft-field__label">{label}</label>
      <div className="ft-ac-wrap">
        <input
          className="ft-field__input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="ft-ac-spin" />}
      </div>
      {error && <span className="ft-field__err">{error}</span>}
      {open && suggestions.length > 0 && (
        <ul className="ft-ac-dropdown">
          {suggestions.map((loc) => (
            <li
              key={loc.iataCode}
              className="ft-ac-item"
              onMouseDown={() => handleSelect(loc)}
            >
              <span className="ft-ac-iata">{loc.iataCode}</span>
              <span className="ft-ac-name">
                {loc.cityName || loc.name}
                {loc.countryName ? `, ${loc.countryName}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Main component ───────────────────────────────────────────────────────── */
const FlightTab = ({ tripData }) => {
  const defaultDeparture = tripData?.dates?.start_date || '';
  const defaultReturn    = tripData?.dates?.end_date   || '';
  const defaultAdults    = tripData?.guests?.adults    || 1;
  const defaultChildren  = tripData?.guests?.children  || 0;

  const [tripType, setTripType] = useState('round-trip');
  const [origin, setOrigin] = useState(null); // { code, name }
  const [dest,   setDest]   = useState(null); // { code, name }

  const [form, setForm] = useState({
    departureDate: defaultDeparture,
    returnDate:    defaultReturn,
    adults:        defaultAdults,
    children:      defaultChildren,
    cabin:         'Economy',
  });
  const [showPassengers, setShowPassengers] = useState(false);
  const [errors,    setErrors]    = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [flights,   setFlights]   = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searched,  setSearched]  = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Pre-fill "To" from trip destination on mount
  useEffect(() => {
    const destName = tripData?.destination?.name;
    if (!destName) return;
    searchAirports(destName).then((locs) => {
      if (locs.length > 0) {
        const loc = locs[0];
        const label = `${loc.cityName || loc.name} (${loc.iataCode})`;
        setDest({ code: loc.iataCode, name: label });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData?.destination?.name]);

  // Build an Aviasales direct search URL as fallback
  const buildAviasalesUrl = () => {
    if (!origin?.code || !dest?.code || !form.departureDate) return 'https://aviasales.tpm.lv/6oZw8XRa';
    const [, depMonth, depDay] = form.departureDate.split('-');
    let path = `${origin.code}${depDay}${depMonth}${dest.code}`;
    if (tripType === 'round-trip' && form.returnDate) {
      const [, retMonth, retDay] = form.returnDate.split('-');
      path += `${dest.code}${retDay}${retMonth}${origin.code}`;
    }
    path += String(form.adults);
    return `https://www.aviasales.com/search/${path}?marker=370056`;
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const passengerLabel = useMemo(() => {
    const parts = [`${form.adults} Adult${form.adults !== 1 ? 's' : ''}`];
    if (form.children > 0) parts.push(`${form.children} Child${form.children !== 1 ? 'ren' : ''}`);
    return parts.join(', ');
  }, [form.adults, form.children]);

  const validate = () => {
    const errs = {};
    if (!origin?.code) errs.origin = 'Select a departure airport';
    if (!dest?.code)   errs.dest   = 'Select a destination airport';
    if (origin?.code && dest?.code && origin.code === dest.code)
      errs.dest = 'Origin and destination must differ';
    if (!form.departureDate) errs.departureDate = 'Pick a departure date';
    if (tripType === 'round-trip' && !form.returnDate) errs.returnDate = 'Pick a return date';
    return errs;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setSearchError(null);
    setFlights([]);
    setSearched(false);
    setShowPassengers(false);

    try {
      const result = await searchFlightsGoogle({
        originCode:      origin.code,
        destinationCode: dest.code,
        departureDate:   form.departureDate,
        returnDate:      tripType === 'round-trip' ? form.returnDate || null : null,
        adults:          form.adults,
      });
      setFlights(result.flights || []);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Search failed. Please try again.');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const swapAirports = () => {
    const tmp = origin;
    setOrigin(dest);
    setDest(tmp);
    setErrors({});
  };

  return (
    <div className="ft-root">
      {/* Trip-type toggle */}
      <div className="ft-toggle">
        <button
          type="button"
          className={`ft-toggle-btn${tripType === 'one-way' ? ' active' : ''}`}
          onClick={() => setTripType('one-way')}
        >
          One Way
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${tripType === 'round-trip' ? ' active' : ''}`}
          onClick={() => setTripType('round-trip')}
        >
          Round Trip
        </button>
      </div>

      <form className="ft-card" onSubmit={handleSearch}>
        {/* From / To row */}
        <div className="ft-route-row">
          <AirportField
            label="From"
            value={origin}
            onSelect={(v) => { setOrigin(v); setErrors((p) => ({ ...p, origin: '' })); }}
            error={errors.origin}
            placeholder="City or airport (e.g. London, JFK)"
          />

          <button
            type="button"
            className="ft-swap-btn"
            onClick={swapAirports}
            title="Swap airports"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <AirportField
            label="To"
            value={dest}
            onSelect={(v) => { setDest(v); setErrors((p) => ({ ...p, dest: '' })); }}
            error={errors.dest}
            placeholder="City or airport (e.g. Dubai, CDG)"
          />
        </div>

        {/* Options row */}
        <div className="ft-options-row">
          {/* Cabin class */}
          <div className="ft-field">
            <label className="ft-field__label">Class</label>
            <select
              className="ft-field__select"
              value={form.cabin}
              onChange={(e) => setField('cabin', e.target.value)}
            >
              {CABIN_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Passengers */}
          <div className="ft-field ft-field--passengers">
            <label className="ft-field__label">Passengers</label>
            <button
              type="button"
              className="ft-field__pax-btn"
              onClick={() => setShowPassengers((v) => !v)}
            >
              {passengerLabel}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6, flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showPassengers && (
              <div className="ft-pax-dropdown">
                <div className="ft-pax-row">
                  <span className="ft-pax-label">Adults</span>
                  <div className="ft-pax-counter">
                    <button type="button" onClick={() => setField('adults', Math.max(1, form.adults - 1))}>−</button>
                    <span>{form.adults}</span>
                    <button type="button" onClick={() => setField('adults', Math.min(9, form.adults + 1))}>+</button>
                  </div>
                </div>
                <div className="ft-pax-row">
                  <span className="ft-pax-label">Children</span>
                  <div className="ft-pax-counter">
                    <button type="button" onClick={() => setField('children', Math.max(0, form.children - 1))}>−</button>
                    <span>{form.children}</span>
                    <button type="button" onClick={() => setField('children', Math.min(8, form.children + 1))}>+</button>
                  </div>
                </div>
                <button type="button" className="ft-pax-done" onClick={() => setShowPassengers(false)}>Done</button>
              </div>
            )}
          </div>

          {/* Departure date */}
          <div className={`ft-field${errors.departureDate ? ' ft-field--error' : ''}`}>
            <label className="ft-field__label">Departure date</label>
            <input
              type="date"
              className="ft-field__input"
              min={today}
              value={form.departureDate}
              onChange={(e) => setField('departureDate', e.target.value)}
            />
            {errors.departureDate
              ? <span className="ft-field__err">{errors.departureDate}</span>
              : <span className="ft-field__sub">At any time</span>}
          </div>

          {/* Return date */}
          {tripType === 'round-trip' && (
            <div className={`ft-field${errors.returnDate ? ' ft-field--error' : ''}`}>
              <label className="ft-field__label">Return date</label>
              <input
                type="date"
                className="ft-field__input"
                min={form.departureDate || today}
                value={form.returnDate}
                onChange={(e) => setField('returnDate', e.target.value)}
              />
              {errors.returnDate
                ? <span className="ft-field__err">{errors.returnDate}</span>
                : <span className="ft-field__sub">At any time</span>}
            </div>
          )}
        </div>

        {/* Search button */}
        <div className="ft-search-row">
          <button type="submit" className="ft-search-btn" disabled={isLoading}>
            {isLoading ? (
              <><span className="ft-spinner" />Searching…</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Search Flights
              </>
            )}
          </button>
        </div>

        <div className="ft-redirect-info">
          <p className="ft-affiliate-disclaimer">
            We may earn a commission from bookings made through our partners.
          </p>
        </div>
      </form>

      {/* ── Results ───────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="ft-loading">
          <div className="ft-loading__spinner" />
          Searching for flights…
        </div>
      )}

      {searched && !isLoading && (
        <div className="ft-results">
          {searchError ? (
            <div className="ft-empty">
              <div className="ft-empty__icon">✈️</div>
              <h3>Search failed</h3>
              <p style={{ marginBottom: 12 }}>{searchError}</p>
              <a
                href={buildAviasalesUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-search-btn"
                style={{ display: 'inline-flex', marginTop: 8, textDecoration: 'none' }}
              >
                Search on Aviasales ↗
              </a>
            </div>
          ) : flights.length === 0 ? (
            <div className="ft-empty">
              <div className="ft-empty__icon">✈️</div>
              <h3>No flights found</h3>
              <p>No results for this route and date. Try different dates or nearby airports.</p>
              <a
                href={buildAviasalesUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-search-btn"
                style={{ display: 'inline-flex', marginTop: 12, textDecoration: 'none' }}
              >
                Search on Aviasales ↗
              </a>
            </div>
          ) : (
            <>
              <div className="ft-results__header">
                <h3>{flights.length} flight{flights.length !== 1 ? 's' : ''} found</h3>
                <p>
                  {origin?.name || origin?.code} → {dest?.name || dest?.code} · {form.departureDate}
                  {tripType === 'round-trip' && form.returnDate ? ` → ${form.returnDate}` : ''}
                  {' '}· Book via Aviasales (affiliate)
                </p>
              </div>
              {flights.map((f) => <FlightCardGF key={f.id} flight={f} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightTab;
