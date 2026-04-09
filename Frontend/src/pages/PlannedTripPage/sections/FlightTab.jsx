import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchAirports, searchFlightsGoogle, getCheapPrice } from '../../../services/flightService';
import FlightCardGF from '../../../components/FlightCard/FlightCardGF';
import './FlightTab.css';

const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Pagination ─────────────────────────────────────────────────────────────── */
const Pagination = ({ page, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  // Show max 7 page numbers, with ellipsis
  const getVisible = () => {
    if (total <= 7) return pages;
    if (page <= 4) return [...pages.slice(0, 5), '…', total];
    if (page >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };
  return (
    <div className="ft-pagination">
      <button className="ft-page-btn ft-page-btn--nav" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getVisible().map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="ft-page-ellipsis">…</span>
          : <button key={p} className={`ft-page-btn${p === page ? ' ft-page-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="ft-page-btn ft-page-btn--nav" onClick={() => onChange(page + 1)} disabled={page === total}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

/* ── Airport autocomplete field ─────────────────────────────────────────────── */
const AirportField = ({ label, value, onSelect, error, placeholder }) => {
  const [query,       setQuery]       = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const ref            = useRef(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (value?.name !== undefined && query !== value.name) setQuery(value?.name || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.name]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setSuggestions([]); setOpen(false); return; }
    if (value?.name === debouncedQuery) return;
    setLoading(true);
    searchAirports(debouncedQuery).then(locs => {
      setSuggestions(locs.slice(0, 6));
      setOpen(locs.length > 0);
      setLoading(false);
    });
  }, [debouncedQuery]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (loc) => {
    const label = `${loc.cityName || loc.name} (${loc.iataCode})`;
    setQuery(label); setSuggestions([]); setOpen(false);
    onSelect({ code: loc.iataCode, name: label });
  };

  return (
    <div ref={ref} className={`ft-field ft-field--lg ft-field--autocomplete${error ? ' ft-field--error' : ''}`}>
      <label className="ft-field__label">{label}</label>
      <div className="ft-ac-wrap">
        <input className="ft-field__input" placeholder={placeholder} value={query}
          onChange={e => { setQuery(e.target.value); onSelect(null); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off" spellCheck={false} />
        {loading && <span className="ft-ac-spin" />}
      </div>
      {error && <span className="ft-field__err">{error}</span>}
      {open && suggestions.length > 0 && (
        <ul className="ft-ac-dropdown">
          {suggestions.map(loc => (
            <li key={loc.iataCode} className="ft-ac-item" onMouseDown={() => handleSelect(loc)}>
              <span className="ft-ac-iata">{loc.iataCode}</span>
              <span className="ft-ac-name">{loc.cityName || loc.name}{loc.countryName ? `, ${loc.countryName}` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Main component ─────────────────────────────────────────────────────────── */
const FlightTab = ({ tripData }) => {
  const defaultDeparture = tripData?.dates?.start_date || '';
  const defaultReturn    = tripData?.dates?.end_date   || '';
  const defaultAdults    = tripData?.guests?.adults    || 1;

  const [tripType, setTripType] = useState(defaultReturn ? 'round-trip' : 'one-way');
  const [origin,   setOrigin]   = useState(null);
  const [dest,     setDest]     = useState(null);
  const [form, setForm] = useState({
    departureDate: defaultDeparture,
    returnDate:    defaultReturn,
    adults:        defaultAdults,
    cabin:         'Economy',
  });
  const [showPassengers, setShowPassengers] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [isLoading,    setIsLoading]    = useState(false);
  const [flights,      setFlights]      = useState([]);
  const [searchError,  setSearchError]  = useState(null);
  const [searched,     setSearched]     = useState(false);

  // Auto-fetch state
  const [autoFetching,  setAutoFetching]  = useState(false);
  const [autoFlights,   setAutoFlights]   = useState([]);
  const [autoError,     setAutoError]     = useState(null);
  const [cheapPrice,    setCheapPrice]    = useState(null); // { price, airline, transfers }
  const [autoOrigin,    setAutoOrigin]    = useState(null);
  const [autoDest,      setAutoDest]      = useState(null);
  const autoFetched = useRef(false);

  // Pagination
  const PAGE_SIZE = 8;
  const [autoPage,    setAutoPage]    = useState(1);
  const [manualPage,  setManualPage]  = useState(1);

  const today = new Date().toISOString().split('T')[0];

  // ── Auto-fetch on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (autoFetched.current) return;
    const destName = tripData?.destination?.name;
    if (!destName) return;
    autoFetched.current = true;
    runAutoFetch(destName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData?.destination?.name]);

  const runAutoFetch = async (destName) => {
    setAutoFetching(true);
    setAutoError(null);
    try {
      // 1. Get user city from localStorage (set by Header.jsx geolocation)
      const userLocationStr = localStorage.getItem('userLocation') || '';
      const cityName = userLocationStr.split(',')[0].trim();
      if (!cityName) { setAutoError('Enable location access to see suggested flights.'); return; }

      // 2. Resolve both IATA codes in parallel
      const [originLocs, destLocs] = await Promise.all([
        searchAirports(cityName),
        searchAirports(destName),
      ]);

      if (!originLocs.length) { setAutoError(`No airport found near "${cityName}".`); return; }
      if (!destLocs.length)   { setAutoError(`No airport found for "${destName}".`);  return; }

      const oCode    = originLocs[0].iataCode;
      const oDisplay = `${originLocs[0].cityName || originLocs[0].name} (${oCode})`;
      const dCode    = destLocs[0].iataCode;
      const dDisplay = `${destLocs[0].cityName || destLocs[0].name} (${dCode})`;

      // 3. Pre-fill form fields
      const oObj = { code: oCode, name: oDisplay };
      const dObj = { code: dCode, name: dDisplay };
      setAutoOrigin(oObj);
      setAutoDest(dObj);
      setOrigin(oObj);
      setDest(dObj);

      const departureDate = tripData?.dates?.start_date || getFutureDate(30);
      const returnDate    = tripData?.dates?.end_date   || null;
      setForm(p => ({ ...p, departureDate, returnDate: returnDate || '' }));
      if (returnDate) setTripType('round-trip');

      // 4. Fetch TP cheap price (instant) + Google Flights (detailed) in parallel
      const [tpResult, gfResult] = await Promise.allSettled([
        getCheapPrice({ origin: oCode, destination: dCode, departDate: departureDate }),
        searchFlightsGoogle({ originCode: oCode, destinationCode: dCode, departureDate, returnDate, adults: defaultAdults }),
      ]);

      if (tpResult.status === 'fulfilled' && tpResult.value) setCheapPrice(tpResult.value);
      if (gfResult.status === 'fulfilled') { setAutoFlights(gfResult.value?.flights || []); setAutoPage(1); }
      else setAutoError('Could not load suggested flights. Use the form below to search manually.');
    } catch (err) {
      setAutoError(err.message || 'Auto-fetch failed.');
    } finally {
      setAutoFetching(false);
    }
  };

  // ── Manual search ────────────────────────────────────────────────────────────
  const buildAviasalesUrl = () => {
    if (!origin?.code || !dest?.code || !form.departureDate) return 'https://aviasales.tpm.lv/6oZw8XRa';
    const [, depM, depD] = form.departureDate.split('-');
    let path = `${origin.code}${depD}${depM}${dest.code}`;
    if (tripType === 'round-trip' && form.returnDate) {
      const [, retM, retD] = form.returnDate.split('-');
      path += `${dest.code}${retD}${retM}${origin.code}`;
    }
    return `https://www.aviasales.com/search/${path + String(form.adults)}?marker=370056`;
  };

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
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
    if (origin?.code && dest?.code && origin.code === dest.code) errs.dest = 'Origin and destination must differ';
    if (!form.departureDate) errs.departureDate = 'Pick a departure date';
    if (tripType === 'round-trip' && !form.returnDate) errs.returnDate = 'Pick a return date';
    return errs;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true); setSearchError(null); setFlights([]); setSearched(false); setShowPassengers(false);
    try {
      const result = await searchFlightsGoogle({
        originCode: origin.code, destinationCode: dest.code,
        departureDate: form.departureDate,
        returnDate: tripType === 'round-trip' ? form.returnDate || null : null,
        adults: form.adults,
      });
      setFlights(result.flights || []);
      setManualPage(1);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Search failed.');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const swapAirports = () => { const t = origin; setOrigin(dest); setDest(t); setErrors({}); };

  return (
    <div className="ft-root">

      {/* ── Discounted Flights (auto-fetched) ────────────────────────────────── */}
      <div className="ft-suggested">
        <div className="ft-disc-header">
          <div className="ft-disc-header__left">
            <div className="ft-disc-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="ft-disc-title">Discounted Flights</h3>
              <p className="ft-disc-subtitle">
                {autoOrigin && autoDest
                  ? `${autoOrigin.name} → ${autoDest.name}`
                  : `Best fares to ${tripData?.destination?.name || 'your destination'}`}
              </p>
            </div>
          </div>
          {cheapPrice && (
            <div className="ft-disc-price-pill">
              <span className="ft-disc-price-pill__from">prices from</span>
              <span className="ft-disc-price-pill__amount">${Math.round(cheapPrice.price)}</span>
              <span className="ft-disc-price-pill__tag">
                {cheapPrice.transfers === 0 ? 'Direct' : `${cheapPrice.transfers} stop`}
              </span>
            </div>
          )}
        </div>

        {autoFetching && (
          <div className="ft-auto-loading">
            <span className="ft-spinner" />
            <span>Searching discounted flights from your location to <strong>{tripData?.destination?.name}</strong>…</span>
          </div>
        )}

        {!autoFetching && autoError && (
          <div className="ft-auto-error">{autoError}</div>
        )}

        {!autoFetching && !autoError && autoFlights.length > 0 && (() => {
          const totalPages = Math.ceil(autoFlights.length / PAGE_SIZE);
          const paginated  = autoFlights.slice((autoPage - 1) * PAGE_SIZE, autoPage * PAGE_SIZE);
          return (
            <>
              <p className="ft-suggested__sub">
                Based on your location · {tripData?.dates?.start_date || 'Upcoming'} · {defaultAdults} adult{defaultAdults !== 1 ? 's' : ''}
                {' · '}Book via Aviasales · {autoFlights.length} flights found
              </p>
              {paginated.map(f => <FlightCardGF key={f.id} flight={f} />)}
              {totalPages > 1 && (
                <Pagination page={autoPage} total={totalPages} onChange={setAutoPage} />
              )}
            </>
          );
        })()}

        {!autoFetching && !autoError && autoFlights.length === 0 && autoFetched.current && (
          <p className="ft-suggested__empty">No discounted flights found. Try the search form below.</p>
        )}
      </div>

      {/* ── Manual search form ───────────────────────────────────────────────── */}
      <div className="ft-manual-section">
        <h4 className="ft-manual-title">Search Different Dates or Routes</h4>

        <div className="ft-toggle">
          <button type="button" className={`ft-toggle-btn${tripType === 'one-way' ? ' active' : ''}`} onClick={() => setTripType('one-way')}>One Way</button>
          <button type="button" className={`ft-toggle-btn${tripType === 'round-trip' ? ' active' : ''}`} onClick={() => setTripType('round-trip')}>Round Trip</button>
        </div>

        <form className="ft-card" onSubmit={handleSearch}>
          <div className="ft-route-row">
            <AirportField label="From" value={origin}
              onSelect={v => { setOrigin(v); setErrors(p => ({ ...p, origin: '' })); }}
              error={errors.origin} placeholder="City or airport" />
            <button type="button" className="ft-swap-btn" onClick={swapAirports} title="Swap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <AirportField label="To" value={dest}
              onSelect={v => { setDest(v); setErrors(p => ({ ...p, dest: '' })); }}
              error={errors.dest} placeholder="City or airport" />
          </div>

          <div className="ft-options-row">
            <div className="ft-field">
              <label className="ft-field__label">Class</label>
              <select className="ft-field__select" value={form.cabin} onChange={e => setField('cabin', e.target.value)}>
                {CABIN_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="ft-field ft-field--passengers">
              <label className="ft-field__label">Passengers</label>
              <button type="button" className="ft-field__pax-btn" onClick={() => setShowPassengers(v => !v)}>
                {passengerLabel}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                  <button type="button" className="ft-pax-done" onClick={() => setShowPassengers(false)}>Done</button>
                </div>
              )}
            </div>

            <div className={`ft-field${errors.departureDate ? ' ft-field--error' : ''}`}>
              <label className="ft-field__label">Departure</label>
              <input type="date" className="ft-field__input" min={today} value={form.departureDate}
                onChange={e => setField('departureDate', e.target.value)} />
              {errors.departureDate ? <span className="ft-field__err">{errors.departureDate}</span> : <span className="ft-field__sub">At any time</span>}
            </div>

            {tripType === 'round-trip' && (
              <div className={`ft-field${errors.returnDate ? ' ft-field--error' : ''}`}>
                <label className="ft-field__label">Return</label>
                <input type="date" className="ft-field__input" min={form.departureDate || today} value={form.returnDate}
                  onChange={e => setField('returnDate', e.target.value)} />
                {errors.returnDate ? <span className="ft-field__err">{errors.returnDate}</span> : <span className="ft-field__sub">At any time</span>}
              </div>
            )}
          </div>

          <div className="ft-search-row">
            <button type="submit" className="ft-search-btn" disabled={isLoading}>
              {isLoading ? <><span className="ft-spinner" />Searching…</> : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg> Search Flights</>
              )}
            </button>
          </div>
          <div className="ft-redirect-info">
            <p className="ft-affiliate-disclaimer">We may earn a commission from bookings made through our partners.</p>
          </div>
        </form>
      </div>

      {/* Manual search loading */}
      {isLoading && <div className="ft-loading"><div className="ft-loading__spinner" />Searching for flights…</div>}

      {/* Manual search results */}
      {searched && !isLoading && (
        <div className="ft-results">
          {searchError ? (
            <div className="ft-empty">
              <div className="ft-empty__icon">✈️</div>
              <h3>Search failed</h3>
              <p style={{ marginBottom: 12 }}>{searchError}</p>
              <a href={buildAviasalesUrl()} target="_blank" rel="noopener noreferrer"
                className="ft-search-btn" style={{ display: 'inline-flex', marginTop: 8, textDecoration: 'none' }}>
                Search on Aviasales ↗
              </a>
            </div>
          ) : flights.length === 0 ? (
            <div className="ft-empty">
              <div className="ft-empty__icon">✈️</div>
              <h3>No flights found</h3>
              <p>Try different dates or nearby airports.</p>
              <a href={buildAviasalesUrl()} target="_blank" rel="noopener noreferrer"
                className="ft-search-btn" style={{ display: 'inline-flex', marginTop: 12, textDecoration: 'none' }}>
                Search on Aviasales ↗
              </a>
            </div>
          ) : (() => {
            const totalPages = Math.ceil(flights.length / PAGE_SIZE);
            const paginated  = flights.slice((manualPage - 1) * PAGE_SIZE, manualPage * PAGE_SIZE);
            return (
              <>
                <div className="ft-results__header">
                  <h3>{flights.length} flight{flights.length !== 1 ? 's' : ''} found</h3>
                  <p>{origin?.name || origin?.code} → {dest?.name || dest?.code} · {form.departureDate} · Book via Aviasales</p>
                </div>
                {paginated.map(f => <FlightCardGF key={f.id} flight={f} />)}
                {totalPages > 1 && (
                  <Pagination page={manualPage} total={totalPages} onChange={setManualPage} />
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Helper: YYYY-MM-DD for N days from today
function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default FlightTab;
