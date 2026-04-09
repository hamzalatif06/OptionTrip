import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchHotelLocations, searchHotels } from '../../../services/hotelService';
import HotelCard from '../../../components/HotelCard/HotelCard';
import './HotelTab.css';

const PAGE_SIZE = 8;

const Pagination = ({ page, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const getVisible = () => {
    if (total <= 7) return pages;
    if (page <= 4) return [...pages.slice(0, 5), '…', total];
    if (page >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };
  return (
    <div className="ht-pagination">
      <button className="ht-page-btn ht-page-btn--nav" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getVisible().map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="ht-page-ellipsis">…</span>
          : <button key={p} className={`ht-page-btn${p === page ? ' ht-page-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="ht-page-btn ht-page-btn--nav" onClick={() => onChange(page + 1)} disabled={page === total}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const HotelSkeleton = () => (
  <div className="ht-skeleton">
    {[1, 2, 3].map((i) => (
      <div key={i} className="ht-skeleton__card">
        <div className="ht-skeleton__img pulse" />
        <div className="ht-skeleton__body">
          <div className="ht-skeleton__line ht-skeleton__line--title pulse" />
          <div className="ht-skeleton__line pulse" />
          <div className="ht-skeleton__line ht-skeleton__line--short pulse" />
        </div>
        <div className="ht-skeleton__cta pulse" />
      </div>
    ))}
  </div>
);

const HotelTab = ({ tripData }) => {
  const defaultCheckIn  = tripData?.dates?.start_date || '';
  const defaultCheckOut = tripData?.dates?.end_date   || '';
  const defaultAdults   = tripData?.guests?.adults    || 1;

  // Destination autocomplete
  const [cityQuery,    setCityQuery]    = useState(tripData?.destination?.name || '');
  const [destId,       setDestId]       = useState('');
  const [searchType,   setSearchType]   = useState('CITY');
  const [suggestions,  setSuggestions]  = useState([]);
  const [cityLoading,  setCityLoading]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const cityRef        = useRef(null);
  const debouncedQuery = useDebounce(cityQuery, 350);

  const [form, setForm] = useState({
    checkIn:  defaultCheckIn,
    checkOut: defaultCheckOut,
    adults:   defaultAdults,
  });
  const [showGuests,  setShowGuests]  = useState(false);
  const [errors,      setErrors]      = useState({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [hotels,      setHotels]      = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searched,    setSearched]    = useState(false);
  const [lastCityName, setLastCityName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  // Auto-search destination on mount if tripData has a destination
  useEffect(() => {
    const destName = tripData?.destination?.name;
    if (!destName || destId) return;
    searchHotelLocations(destName).then((locs) => {
      if (locs.length > 0) {
        setDestId(locs[0].destId);
        setSearchType(locs[0].searchType || 'CITY');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData?.destination?.name]);

  // Fetch suggestions on debounced query
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]); setShowDropdown(false); return;
    }
    setCityLoading(true);
    searchHotelLocations(debouncedQuery).then((locs) => {
      setSuggestions(locs.slice(0, 7));
      setShowDropdown(locs.length > 0);
      setCityLoading(false);
    });
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const nights = useMemo(() => form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0, [form.checkIn, form.checkOut]);

  const validate = () => {
    const errs = {};
    if (!cityQuery.trim()) errs.city     = 'Enter a destination';
    if (!destId)           errs.city     = 'Select a destination from the list';
    if (!form.checkIn)     errs.checkIn  = 'Pick a check-in date';
    if (!form.checkOut)    errs.checkOut = 'Pick a check-out date';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn)
      errs.checkOut = 'Check-out must be after check-in';
    return errs;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setSearchError(null);
    setHotels([]);
    setSearched(false);
    setShowGuests(false);
    setShowDropdown(false);
    setLastCityName(cityQuery);

    try {
      const result = await searchHotels({
        destId, searchType,
        checkIn: form.checkIn, checkOut: form.checkOut,
        adults: form.adults, cityName: cityQuery,
      });
      setHotels(result.hotels || []);
      setCurrentPage(1);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Search failed');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ht-root">
      <form className="ht-card" onSubmit={handleSearch}>

        {/* Destination autocomplete */}
        <div className="ht-city-row">
          <div
            ref={cityRef}
            className={`ht-field ht-field--city ht-field--autocomplete${errors.city ? ' ht-field--error' : ''}`}
          >
            <label className="ht-field__label">Destination</label>
            <div className="ht-ac-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="ht-city-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                  stroke="#029e9d" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="2" />
              </svg>
              <input
                className="ht-field__input"
                placeholder="City, region or hotel name"
                value={cityQuery}
                onChange={(e) => { setCityQuery(e.target.value); setDestId(''); setErrors(p => ({ ...p, city: '' })); }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
                spellCheck={false}
              />
              {cityLoading && <span className="ht-ac-spin" />}
            </div>
            {errors.city && <span className="ht-field__err">{errors.city}</span>}
            {showDropdown && suggestions.length > 0 && (
              <ul className="ht-ac-dropdown">
                {suggestions.map((loc) => (
                  <li
                    key={loc.destId}
                    className="ht-ac-item"
                    onMouseDown={() => {
                      setCityQuery(loc.label || loc.name);
                      setDestId(loc.destId);
                      setSearchType(loc.searchType || 'CITY');
                      setSuggestions([]);
                      setShowDropdown(false);
                      setErrors(p => ({ ...p, city: '' }));
                    }}
                  >
                    <span className="ht-ac-name">
                      {loc.name}{loc.countryName ? `, ${loc.countryName}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Dates + Guests */}
        <div className="ht-options-row">
          <div className={`ht-field${errors.checkIn ? ' ht-field--error' : ''}`}>
            <label className="ht-field__label">Check-in</label>
            <input type="date" className="ht-field__input" min={today}
              value={form.checkIn}
              onChange={(e) => setField('checkIn', e.target.value)} />
            {errors.checkIn
              ? <span className="ht-field__err">{errors.checkIn}</span>
              : <span className="ht-field__sub">Arrival date</span>}
          </div>

          <div className={`ht-field${errors.checkOut ? ' ht-field--error' : ''}`}>
            <label className="ht-field__label">Check-out</label>
            <input type="date" className="ht-field__input" min={form.checkIn || today}
              value={form.checkOut}
              onChange={(e) => setField('checkOut', e.target.value)} />
            {errors.checkOut
              ? <span className="ht-field__err">{errors.checkOut}</span>
              : <span className="ht-field__sub">
                  {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Departure date'}
                </span>}
          </div>

          <div className="ht-field ht-field--guests">
            <label className="ht-field__label">Guests</label>
            <button type="button" className="ht-field__pax-btn" onClick={() => setShowGuests(v => !v)}>
              {form.adults} Adult{form.adults !== 1 ? 's' : ''}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showGuests && (
              <div className="ht-pax-dropdown">
                <div className="ht-pax-row">
                  <span className="ht-pax-label">Adults</span>
                  <div className="ht-pax-counter">
                    <button type="button" onClick={() => setField('adults', Math.max(1, form.adults - 1))}>−</button>
                    <span>{form.adults}</span>
                    <button type="button" onClick={() => setField('adults', Math.min(9, form.adults + 1))}>+</button>
                  </div>
                </div>
                <button type="button" className="ht-pax-done" onClick={() => setShowGuests(false)}>Done</button>
              </div>
            )}
          </div>
        </div>

        {/* Search button */}
        <div className="ht-search-row">
          <button type="submit" className="ht-search-btn" disabled={isLoading}>
            {isLoading ? (
              <><span className="ht-spinner" />Searching…</>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Search Hotels
              </>
            )}
          </button>
        </div>

        <div className="ht-redirect-info">
          <p className="ht-affiliate-disclaimer">
            Powered by Booking.com · We may earn a commission from bookings.
          </p>
        </div>
      </form>

      {/* Skeletons */}
      {isLoading && <HotelSkeleton />}

      {/* Results */}
      {searched && !isLoading && (
        <div className="ht-results">
          {searchError ? (
            <div className="ht-empty">
              <div className="ht-empty__icon">🏨</div>
              <h3>Search failed</h3>
              <p>{searchError}</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="ht-empty">
              <div className="ht-empty__icon">🏨</div>
              <h3>No hotels found</h3>
              <p>No results for <strong>{lastCityName}</strong>. Try different dates or a nearby city.</p>
            </div>
          ) : (() => {
            const totalPages = Math.ceil(hotels.length / PAGE_SIZE);
            const paginated  = hotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
            return (
              <>
                <div className="ht-results__header">
                  <h3>{hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found</h3>
                  <p>
                    {lastCityName}
                    {nights > 0 ? ` · ${nights} night${nights !== 1 ? 's' : ''}` : ''}
                    {` · ${form.adults} adult${form.adults !== 1 ? 's' : ''}`}
                    {' · '}Prices in USD
                  </p>
                </div>
                {paginated.map(hotel => <HotelCard key={hotel.hotelId} hotel={hotel} />)}
                {totalPages > 1 && (
                  <Pagination page={currentPage} total={totalPages} onChange={setCurrentPage} />
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default HotelTab;
