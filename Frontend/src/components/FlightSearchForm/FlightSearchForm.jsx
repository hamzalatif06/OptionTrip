import React, { useState, useEffect, useRef } from 'react';
import { searchAirports } from '../../services/flightService';
import './FlightSearchForm.css';

const today = new Date().toISOString().split('T')[0];

/* ── Debounce hook ─────────────────────────────────────────────── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Airport autocomplete input ────────────────────────────────── */
const AirportInput = ({ label, placeholder, value, iataCode, onChange, onSelect, error, onExploreAnywhere }) => {
  const [query,       setQuery]       = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [selected,    setSelected]    = useState(!!iataCode);
  const wrapRef   = useRef(null);
  const debounced = useDebounce(query, 300);

  // Sync when parent resets (e.g. swap)
  useEffect(() => {
    setQuery(value || '');
    setSelected(!!iataCode);
  }, [value, iataCode]);

  // Fetch suggestions
  useEffect(() => {
    if (selected || debounced.length < 2) { setSuggestions([]); if (!onExploreAnywhere) setOpen(false); return; }
    setLoading(true);
    searchAirports(debounced).then(results => {
      setSuggestions(results.slice(0, 7));
      setOpen(true);
      setLoading(false);
    });
  }, [debounced, selected]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setSelected(false);
    onChange('', e.target.value);
  };

  const handleSelect = (airport) => {
    const display = `${airport.cityName || airport.name} (${airport.iataCode})`;
    setQuery(display);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onSelect(airport.iataCode, display);
  };

  const handleClear = () => {
    setQuery('');
    setSelected(false);
    setSuggestions([]);
    setOpen(false);
    onChange('', '');
  };

  const handleFocus = () => {
    if (onExploreAnywhere) setOpen(true);
    else if (!selected && suggestions.length > 0) setOpen(true);
  };

  const showDropdown = open && (onExploreAnywhere || suggestions.length > 0);

  return (
    <div className={`fsf-ac-wrap${error ? ' fsf-ac-wrap--error' : ''}`} ref={wrapRef}>
      <label className="fsf-label">{label}</label>
      <div className={`fsf-ac-field${iataCode === 'EXPLORE_ANYWHERE' ? ' fsf-ac-field--explore' : ''}`}>
        <svg className="fsf-ac-icon" viewBox="0 0 24 24" fill="none">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
        {iataCode === 'EXPLORE_ANYWHERE' && (
          <span className="fsf-explore-chip" aria-hidden="true">
            <span className="fsf-explore-chip__icon">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="fsf-explore-chip__text">Explore Anywhere</span>
          </span>
        )}
        <input
          className="fsf-input fsf-input--ac"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="fsf-ac-spinner" />}
        {query && !loading && (
          <button type="button" className="fsf-ac-clear" onClick={handleClear} tabIndex={-1}>✕</button>
        )}
        {selected && iataCode && iataCode !== 'EXPLORE_ANYWHERE' && (
          <span className="fsf-ac-badge">{iataCode}</span>
        )}
      </div>

      {showDropdown && (
        <ul className="fsf-ac-dropdown">

          {/* ── Explore Anywhere option ── */}
          {onExploreAnywhere && (
            <li className="fsf-ac-item fsf-ac-item--explore" onMouseDown={(e) => { e.preventDefault(); setOpen(false); onExploreAnywhere?.(); }}>
              <div className="fsf-ac-item__left">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="fsf-explore-icon">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <span className="fsf-ac-item__name fsf-explore-label">Explore Anywhere</span>
                  <span className="fsf-ac-item__airport">Discover cheapest destinations</span>
                </div>
              </div>
              <span className="fsf-explore-arrow">→</span>
            </li>
          )}

          {/* ── Airport suggestions ── */}
          {suggestions.map(airport => (
            <li
              key={airport.iataCode}
              className="fsf-ac-item"
              onMouseDown={() => handleSelect(airport)}
            >
              <div className="fsf-ac-item__left">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#029e9d"/>
                </svg>
                <div>
                  <span className="fsf-ac-item__name">{airport.cityName || airport.name}</span>
                  {airport.name !== airport.cityName && airport.name && (
                    <span className="fsf-ac-item__airport">{airport.name}</span>
                  )}
                  {airport.countryName && (
                    <span className="fsf-ac-item__country">{airport.countryName}</span>
                  )}
                </div>
              </div>
              <span className="fsf-ac-item__iata">{airport.iataCode}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="fsf-error">{error}</p>}
    </div>
  );
};

/* ── Main form ─────────────────────────────────────────────────── */
const FlightSearchForm = ({ onSearch, isLoading, prefillDest, prefillOrigin, originError, onOriginErrorClear, onExploreAnywhere }) => {
  const [tripType,      setTripType]      = useState('one-way');
  const [originCode,    setOriginCode]    = useState('');
  const [originDisplay, setOriginDisplay] = useState('');
  const [isExploreAnywhere, setIsExploreAnywhere] = useState(false);
  const [destCode,      setDestCode]      = useState('');
  const [destDisplay,   setDestDisplay]   = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate,    setReturnDate]    = useState('');
  const [adults,        setAdults]        = useState(1);
  const [children,      setChildren]      = useState(0);
  const [errors,        setErrors]        = useState({});

  // Sync origin when Explore auto-detects user location
  useEffect(() => {
    if (prefillOrigin?.code && prefillOrigin?.display) {
      setOriginCode(prefillOrigin.code);
      setOriginDisplay(prefillOrigin.display);
      setIsExploreAnywhere(false);
      setErrors(p => ({ ...p, origin: '' }));
    }
  }, [prefillOrigin]); // eslint-disable-line

  // Sync destination when an Explore card is clicked
  useEffect(() => {
    if (prefillDest?.code && prefillDest?.display) {
      setDestCode(prefillDest.code);
      setDestDisplay(prefillDest.display);
      setIsExploreAnywhere(false);
      setErrors(p => ({ ...p, destination: '' }));
    }
  }, [prefillDest]); // eslint-disable-line

  const clearError = (field) => setErrors(p => ({ ...p, [field]: '' }));

  const handleSwap = () => {
    setOriginCode(destCode);      setOriginDisplay(destDisplay);
    setIsExploreAnywhere(false);
    setDestCode(originCode);      setDestDisplay(originDisplay);
  };

  const validate = () => {
    const errs = {};
    if (!isExploreAnywhere && !originCode)  errs.origin      = 'Select a departure airport';
    if (!isExploreAnywhere && !destCode)    errs.destination = 'Select a destination airport';
    if (!isExploreAnywhere && originCode && destCode && originCode === destCode) errs.destination = 'Origin and destination must differ';
    if (!departureDate) errs.departureDate = 'Select departure date';
    if (tripType === 'round-trip' && !returnDate) errs.returnDate = 'Select return date';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (isExploreAnywhere) {
      onExploreAnywhere?.({
        originCode,
        originDisplay,
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : '',
        adults: Number(adults),
        tripType,
        exploreAnywhere: true,
      });
      return;
    }
    onSearch({
      originCode,
      destinationCode: destCode,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      adults:   Number(adults),
      children: Number(children),
    });
  };

  return (
    <section className="flight-search-section">
      <div className="container">
        <div className="flight-search-card">

          {/* Trip type toggle */}
          <div className="trip-type-toggle">
            {['one-way', 'round-trip'].map(type => (
              <button
                key={type}
                type="button"
                className={`trip-type-btn${tripType === type ? ' active' : ''}`}
                onClick={() => setTripType(type)}
              >
                {type === 'one-way' ? 'One-way' : 'Round Trip'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="fsf-row">

              {/* From */}
              <div className="fsf-col fsf-col--airport">
                <AirportInput
                  label="From"
                  placeholder="City or airport (e.g. London, JFK)"
                  value={originDisplay}
                  iataCode={originCode}
                  onChange={(code, display) => {
                    setOriginCode(code); setOriginDisplay(display);
                    setIsExploreAnywhere(false);
                    clearError('origin'); onOriginErrorClear?.();
                  }}
                  onSelect={(code, display) => {
                    setOriginCode(code); setOriginDisplay(display);
                    setIsExploreAnywhere(false);
                    clearError('origin'); onOriginErrorClear?.();
                  }}
                  error={errors.origin || originError}
                />
              </div>

              {/* Swap button */}
              <div className="fsf-swap-col">
                <button type="button" className="fsf-swap-btn" onClick={handleSwap} title="Swap airports">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* To */}
              <div className="fsf-col fsf-col--airport">
                <AirportInput
                  label="To"
                  placeholder="City or airport (e.g. Dubai, CDG)"
                  value={destDisplay}
                  iataCode={destCode}
                  onChange={(code, display) => { setDestCode(code); setDestDisplay(display); setIsExploreAnywhere(false); clearError('destination'); }}
                  onSelect={(code, display) => { setDestCode(code); setDestDisplay(display); setIsExploreAnywhere(false); clearError('destination'); }}
                  error={errors.destination}
                  onExploreAnywhere={() => {
                    setDestCode('EXPLORE_ANYWHERE');
                    setDestDisplay('Explore Anywhere');
                    setIsExploreAnywhere(true);
                    setErrors((p) => ({ ...p, destination: '' }));
                  }}
                />
              </div>

              {/* Departure */}
              <div className="fsf-col fsf-col--date">
                <label className="fsf-label">Departure</label>
                <input
                  className={`fsf-input${errors.departureDate ? ' is-error' : ''}`}
                  type="date" min={today}
                  value={departureDate}
                  onChange={e => { setDepartureDate(e.target.value); clearError('departureDate'); }}
                />
                {errors.departureDate && <p className="fsf-error">{errors.departureDate}</p>}
              </div>

              {/* Return (round-trip only) */}
              {tripType === 'round-trip' && (
                <div className="fsf-col fsf-col--date">
                  <label className="fsf-label">Return</label>
                  <input
                    className={`fsf-input${errors.returnDate ? ' is-error' : ''}`}
                    type="date" min={departureDate || today}
                    value={returnDate}
                    onChange={e => { setReturnDate(e.target.value); clearError('returnDate'); }}
                  />
                  {errors.returnDate && <p className="fsf-error">{errors.returnDate}</p>}
                </div>
              )}

              {/* Adults */}
              <div className="fsf-col fsf-col--pax">
                <label className="fsf-label">Adults</label>
                <select className="fsf-input" value={adults} onChange={e => setAdults(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Children */}
              <div className="fsf-col fsf-col--pax">
                <label className="fsf-label">Children</label>
                <select className="fsf-input" value={children} onChange={e => setChildren(e.target.value)}>
                  {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Search */}
              <div className="fsf-col fsf-col--btn">
                <button type="submit" className="fsf-search-btn" disabled={isLoading}>
                  {isLoading
                    ? <><span className="btn-spinner" /> Searching…</>
                    : <><i className="fa fa-search" /> Search Flights</>}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FlightSearchForm;
