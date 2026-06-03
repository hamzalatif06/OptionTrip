import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchCarLocations, searchCars } from '../../../services/carRentalService';
import './CarRentalTab.css';

const PAGE_SIZE = 8;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Pagination ────────────────────────────────────────────────────────────── */
const Pagination = ({ page, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const getVisible = () => {
    if (total <= 7) return pages;
    if (page <= 4) return [...pages.slice(0, 5), '…', total];
    if (page >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };
  return (
    <div className="cr-pagination">
      <button className="cr-page-btn cr-page-btn--nav" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getVisible().map((p, i) =>
        p === '…'
          ? <span key={`e-${i}`} className="cr-page-ellipsis">…</span>
          : <button key={p} className={`cr-page-btn${p === page ? ' cr-page-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="cr-page-btn cr-page-btn--nav" onClick={() => onChange(page + 1)} disabled={page === total}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

/* ── Location autocomplete field ───────────────────────────────────────────── */
const LocationField = ({ label, icon, value, onSelect, error, placeholder }) => {
  const [query,       setQuery]       = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const ref            = useRef(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (value?.name !== undefined && query !== value.name) setQuery(value?.name || '');
  }, [value?.name]); // eslint-disable-line

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setSuggestions([]); setOpen(false); return; }
    if (value?.name === debouncedQuery) return;
    setLoading(true);
    searchCarLocations(debouncedQuery).then(locs => {
      setSuggestions(locs.slice(0, 7));
      setOpen(locs.length > 0);
      setLoading(false);
    });
  }, [debouncedQuery]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className={`cr-field cr-field--autocomplete${error ? ' cr-field--error' : ''}`}>
      <label className="cr-field__label">{label}</label>
      <div className="cr-ac-wrap">
        {icon}
        <input className="cr-field__input" placeholder={placeholder} value={query}
          onChange={e => { setQuery(e.target.value); onSelect(null); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off" spellCheck={false} />
        {loading && <span className="cr-ac-spin" />}
      </div>
      {error && <span className="cr-field__err">{error}</span>}
      {open && suggestions.length > 0 && (
        <ul className="cr-ac-dropdown">
          {suggestions.map(loc => (
            <li key={loc.placeId} className="cr-ac-item" onMouseDown={() => {
              setQuery(loc.name || loc.address);
              setSuggestions([]); setOpen(false);
              onSelect(loc);
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="cr-ac-pin">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#029e9d" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="2"/>
              </svg>
              <div>
                <span className="cr-ac-name">{loc.name}</span>
                {loc.address && loc.address !== loc.name && (
                  <span className="cr-ac-addr">{loc.address}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Car card ──────────────────────────────────────────────────────────────── */
const CarCard = ({ car, days }) => {
  const perDay  = car.price?.perDay  || (days > 0 ? (car.price?.total / days) : 0);
  const total   = car.price?.total   || 0;
  const currency = car.price?.currency || 'USD';
  const fmt = (n) => n > 0 ? `${currency} ${Math.round(n).toLocaleString()}` : '—';

  const handleBook = () => {
    if (car.bookUrl) { window.open(car.bookUrl, '_blank', 'noopener'); return; }
    // Fallback deeplink to Rentalcars.com
    window.open('https://www.rentalcars.com/', '_blank', 'noopener');
  };

  return (
    <div className="cr-car-card">
      {/* Image */}
      <div className="cr-car-card__img-wrap">
        {car.image
          ? <img src={car.image} alt={car.name} className="cr-car-card__img" loading="lazy" />
          : (
            <div className="cr-car-card__img-placeholder">
              <svg viewBox="0 0 64 40" fill="none" width="64" height="40">
                <rect x="4" y="14" width="56" height="20" rx="4" fill="#e2e8f0"/>
                <ellipse cx="16" cy="34" rx="6" ry="6" fill="#94a3b8"/>
                <ellipse cx="48" cy="34" rx="6" ry="6" fill="#94a3b8"/>
                <path d="M10 14l8-10h28l8 10" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
          )
        }
        <span className="cr-car-card__category">{car.category}</span>
      </div>

      {/* Details */}
      <div className="cr-car-card__body">
        <div className="cr-car-card__top">
          <h3 className="cr-car-card__name">{car.name}</h3>
          {car.rating > 0 && (
            <span className="cr-car-card__rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {car.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Supplier */}
        <div className="cr-car-card__supplier">
          {car.supplier.logo
            ? <img src={car.supplier.logo} alt={car.supplier.name} className="cr-car-card__supplier-logo" />
            : <span className="cr-car-card__supplier-name">{car.supplier.name}</span>
          }
        </div>

        {/* Features row */}
        <div className="cr-car-card__features">
          <span className="cr-car-card__feat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8"/></svg>
            {car.seats} seats
          </span>
          <span className="cr-car-card__feat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg>
            {car.bags} bag{car.bags !== 1 ? 's' : ''}
          </span>
          <span className="cr-car-card__feat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            {car.transmission}
          </span>
          {car.hasAC && (
            <span className="cr-car-card__feat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              A/C
            </span>
          )}
        </div>

        {/* Policy row */}
        <div className="cr-car-card__policy">
          <span><strong>Fuel:</strong> {car.fuelPolicy}</span>
          <span><strong>Mileage:</strong> {car.mileage}</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="cr-car-card__cta">
        <div className="cr-car-card__price">
          {perDay > 0 && <span className="cr-car-card__per-day">{fmt(perDay)}<small>/day</small></span>}
          {total > 0 && days > 1 && <span className="cr-car-card__total">{fmt(total)} total</span>}
        </div>
        <button className="cr-book-btn" onClick={handleBook}>Book Now</button>
      </div>
    </div>
  );
};

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
const CarSkeleton = () => (
  <div className="cr-skeleton">
    {[1, 2, 3].map(i => (
      <div key={i} className="cr-skeleton__card">
        <div className="cr-skeleton__img pulse" />
        <div className="cr-skeleton__body">
          <div className="cr-skeleton__line cr-skeleton__line--title pulse" />
          <div className="cr-skeleton__line pulse" />
          <div className="cr-skeleton__line cr-skeleton__line--short pulse" />
        </div>
        <div className="cr-skeleton__cta pulse" />
      </div>
    ))}
  </div>
);

/* ── Main tab ──────────────────────────────────────────────────────────────── */
const CarRentalTab = ({ tripData }) => {
  const defaultPickUpDate  = tripData?.dates?.start_date || '';
  const defaultDropOffDate = tripData?.dates?.end_date   || '';
  const destName = tripData?.destination?.name || '';

  const [pickUp,   setPickUp]   = useState(null);
  const [dropOff,  setDropOff]  = useState(null);
  const [sameLocation, setSameLocation] = useState(true);
  const [form, setForm] = useState({
    pickUpDate:   defaultPickUpDate,
    dropOffDate:  defaultDropOffDate,
    pickUpTime:   '10:00',
    dropOffTime:  '10:00',
    driverAge:    30,
  });
  const [errors,      setErrors]      = useState({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [cars,        setCars]        = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searched,    setSearched]    = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  // Auto-resolve destination location on mount
  const autoFetched = useRef(false);
  useEffect(() => {
    if (autoFetched.current || !destName) return;
    autoFetched.current = true;
    searchCarLocations(destName.split(',')[0]).then(locs => {
      if (locs.length > 0) {
        const best = locs.find(l => l.name?.toLowerCase().includes(destName.toLowerCase().split(',')[0].toLowerCase())) || locs[0];
        setPickUp(best);
        setDropOff(best);
      }
    });
  }, [destName]);

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const days = useMemo(() => {
    if (!form.pickUpDate || !form.dropOffDate) return 0;
    return Math.max(0, Math.round((new Date(form.dropOffDate) - new Date(form.pickUpDate)) / 86400000));
  }, [form.pickUpDate, form.dropOffDate]);

  const validate = () => {
    const errs = {};
    if (!pickUp?.placeId)      errs.pickUp    = 'Select a pickup location';
    if (!sameLocation && !dropOff?.placeId) errs.dropOff = 'Select a drop-off location';
    if (!form.pickUpDate)  errs.pickUpDate  = 'Pick a pickup date';
    if (!form.dropOffDate) errs.dropOffDate = 'Pick a drop-off date';
    if (form.pickUpDate && form.dropOffDate && form.dropOffDate <= form.pickUpDate)
      errs.dropOffDate = 'Drop-off must be after pickup';
    if (form.driverAge < 18 || form.driverAge > 99) errs.driverAge = 'Age must be 18–99';
    return errs;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setSearchError(null);
    setCars([]);
    setSearched(false);

    try {
      const result = await searchCars({
        pickUpPlaceId:  pickUp.placeId,
        dropOffPlaceId: sameLocation ? pickUp.placeId : dropOff?.placeId,
        pickUpDate:    form.pickUpDate,
        dropOffDate:   form.dropOffDate,
        pickUpTime:    form.pickUpTime,
        dropOffTime:   form.dropOffTime,
        driverAge:     form.driverAge,
      });
      setCars(result.cars || []);
      setCurrentPage(1);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Search failed');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const locationIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="cr-city-icon">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#029e9d" strokeWidth="2"/>
      <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="2"/>
    </svg>
  );

  const totalPages = Math.ceil(cars.length / PAGE_SIZE);
  const paginated  = cars.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="cr-root">
      <form className="cr-card" onSubmit={handleSearch}>

        {/* Header */}
        <div className="cr-card__header">
          <div className="cr-card__header-icon">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="16" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="7"  cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 5H7v5h5V5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="cr-card__title">Find Rental Cars</h3>
            <p className="cr-card__sub">Compare cars from top rental companies</p>
          </div>
        </div>

        {/* Pickup location */}
        <div className="cr-location-row">
          <LocationField
            label="Pick-up Location"
            icon={locationIcon}
            value={pickUp}
            onSelect={v => { setPickUp(v); if (sameLocation) setDropOff(v); setErrors(p => ({ ...p, pickUp: '' })); }}
            error={errors.pickUp}
            placeholder="City, airport or station"
          />
        </div>

        {/* Same / different drop-off toggle */}
        <div className="cr-same-row">
          <label className="cr-checkbox">
            <input type="checkbox" checked={sameLocation} onChange={e => setSameLocation(e.target.checked)} />
            <span>Return to same location</span>
          </label>
        </div>

        {!sameLocation && (
          <div className="cr-location-row">
            <LocationField
              label="Drop-off Location"
              icon={locationIcon}
              value={dropOff}
              onSelect={v => { setDropOff(v); setErrors(p => ({ ...p, dropOff: '' })); }}
              error={errors.dropOff}
              placeholder="City, airport or station"
            />
          </div>
        )}

        {/* Dates + times */}
        <div className="cr-options-row">
          <div className={`cr-field${errors.pickUpDate ? ' cr-field--error' : ''}`}>
            <label className="cr-field__label">Pick-up Date</label>
            <input type="date" className="cr-field__input" min={today}
              value={form.pickUpDate} onChange={e => setField('pickUpDate', e.target.value)} />
            {errors.pickUpDate && <span className="cr-field__err">{errors.pickUpDate}</span>}
          </div>

          <div className="cr-field">
            <label className="cr-field__label">Pick-up Time</label>
            <input type="time" className="cr-field__input"
              value={form.pickUpTime} onChange={e => setField('pickUpTime', e.target.value)} />
          </div>

          <div className={`cr-field${errors.dropOffDate ? ' cr-field--error' : ''}`}>
            <label className="cr-field__label">Drop-off Date</label>
            <input type="date" className="cr-field__input" min={form.pickUpDate || today}
              value={form.dropOffDate} onChange={e => setField('dropOffDate', e.target.value)} />
            {errors.dropOffDate
              ? <span className="cr-field__err">{errors.dropOffDate}</span>
              : <span className="cr-field__sub">{days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : 'Return date'}</span>}
          </div>

          <div className="cr-field">
            <label className="cr-field__label">Drop-off Time</label>
            <input type="time" className="cr-field__input"
              value={form.dropOffTime} onChange={e => setField('dropOffTime', e.target.value)} />
          </div>

          <div className={`cr-field cr-field--age${errors.driverAge ? ' cr-field--error' : ''}`}>
            <label className="cr-field__label">Driver Age</label>
            <input type="number" className="cr-field__input" min={18} max={99}
              value={form.driverAge} onChange={e => setField('driverAge', Number(e.target.value))} />
            {errors.driverAge
              ? <span className="cr-field__err">{errors.driverAge}</span>
              : <span className="cr-field__sub">18 – 99</span>}
          </div>
        </div>

        {/* Search button */}
        <div className="cr-search-row">
          <button type="submit" className="cr-search-btn" disabled={isLoading}>
            {isLoading ? (
              <><span className="cr-spinner" />Searching…</>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Search Cars
              </>
            )}
          </button>
        </div>

        <div className="cr-disclaimer">
          Powered by Booking.com Cars · We may earn a commission from bookings.
        </div>
      </form>

      {/* Skeletons */}
      {isLoading && <CarSkeleton />}

      {/* Results */}
      {searched && !isLoading && (
        <div className="cr-results">
          {searchError ? (
            <div className="cr-empty">
              <div className="cr-empty__icon">🚗</div>
              <h3>Search failed</h3>
              <p>{searchError}</p>
              <a href="https://www.rentalcars.com/" target="_blank" rel="noopener noreferrer" className="cr-search-btn" style={{ display: 'inline-flex', textDecoration: 'none', marginTop: 12 }}>
                Search on Rentalcars.com ↗
              </a>
            </div>
          ) : cars.length === 0 ? (
            <div className="cr-empty">
              <div className="cr-empty__icon">🚗</div>
              <h3>No cars found</h3>
              <p>Try different dates or a nearby location.</p>
              <a href="https://www.rentalcars.com/" target="_blank" rel="noopener noreferrer" className="cr-search-btn" style={{ display: 'inline-flex', textDecoration: 'none', marginTop: 12 }}>
                Search on Rentalcars.com ↗
              </a>
            </div>
          ) : (
            <>
              <div className="cr-results__header">
                <h3>{cars.length} car{cars.length !== 1 ? 's' : ''} available</h3>
                <p>
                  {pickUp?.name}
                  {!sameLocation && dropOff?.name ? ` → ${dropOff.name}` : ''}
                  {days > 0 ? ` · ${days} day${days !== 1 ? 's' : ''}` : ''}
                  {' · '}Prices in USD
                </p>
              </div>
              <div className="cr-cars-grid">
                {paginated.map(car => <CarCard key={car.id} car={car} days={days} />)}
              </div>
              {totalPages > 1 && (
                <Pagination page={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CarRentalTab;
