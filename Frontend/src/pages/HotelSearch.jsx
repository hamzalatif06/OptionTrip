import React, { useState, useEffect, useRef } from 'react';
import { searchHotelLocations, searchHotels } from '../services/hotelService';
import HotelCard from '../components/HotelCard/HotelCard';
import './HotelSearch.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SkeletonCard = () => (
  <div className="hs-skeleton">
    <div className="hs-skeleton__img pulse" />
    <div className="hs-skeleton__body">
      <div className="hs-skeleton__line pulse" />
      <div className="hs-skeleton__line hs-skeleton__line--short pulse" />
    </div>
    <div className="hs-skeleton__cta pulse" />
  </div>
);

const HotelSearch = () => {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Destination autocomplete
  const [cityQuery,    setCityQuery]    = useState('');
  const [destId,       setDestId]       = useState('');
  const [searchType,   setSearchType]   = useState('CITY');
  const [suggestions,  setSuggestions]  = useState([]);
  const [cityLoading,  setCityLoading]  = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const cityRef        = useRef(null);
  const debouncedQuery = useDebounce(cityQuery, 350);

  // Form fields
  const [checkIn,   setCheckIn]   = useState(today);
  const [checkOut,  setCheckOut]  = useState(tomorrow);
  const [adults,    setAdults]    = useState(1);
  const [errors,    setErrors]    = useState({});

  // Results
  const [isLoading,   setIsLoading]   = useState(false);
  const [hotels,      setHotels]      = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searched,    setSearched]    = useState(false);
  const [lastCityName, setLastCityName] = useState('');

  // Fetch destination suggestions
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

  const validate = () => {
    const errs = {};
    if (!cityQuery.trim()) errs.city    = 'Enter a destination';
    if (!destId)           errs.city    = 'Select a destination from the list';
    if (!checkIn)          errs.checkIn  = 'Select check-in date';
    if (!checkOut)         errs.checkOut = 'Select check-out date';
    if (checkIn && checkOut && checkOut <= checkIn) errs.checkOut = 'Check-out must be after check-in';
    return errs;
  };

  const buildBookingUrl = () => {
    const params = new URLSearchParams({
      ss: cityQuery.trim(), checkin: checkIn, checkout: checkOut,
      group_adults: String(adults), aid: '370056',
    });
    return `https://www.booking.com/searchresults.html?${params.toString()}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setSearchError(null);
    setHotels([]);
    setSearched(false);
    setLastCityName(cityQuery);

    try {
      const result = await searchHotels({ destId, searchType, checkIn, checkOut, adults, cityName: cityQuery });
      setHotels(result.hotels || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setSearchError(err.message || 'Search failed');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;

  return (
    <>
      {/* Hero */}
      <section className="hotel-search-hero">
        <div className="container">
          <div className="text-center">
            <h4 className="mb-2 theme1">Search & Compare</h4>
            <h1 className="mb-3">Find Your <span className="theme">Perfect Hotel</span></h1>
            <p className="hotel-search-hero__sub">
              Real-time hotel availability from Hotelbeds. Compare and book via our trusted partners.
            </p>
          </div>
        </div>
      </section>

      {/* Search form */}
      <section className="hotel-search-form-section">
        <div className="container">
          <form className="hs-form" onSubmit={handleSearch} noValidate>

            {/* Destination */}
            <div className={`hs-field hs-field--city${errors.city ? ' hs-field--error' : ''}`} ref={cityRef}>
              <label className="hs-field__label">Destination</label>
              <div className="hs-ac-wrap">
                <svg className="hs-field__icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/>
                </svg>
                <input
                  className="hs-field__input"
                  placeholder="City, region or hotel name"
                  value={cityQuery}
                  onChange={(e) => { setCityQuery(e.target.value); setDestId(''); setErrors(p => ({ ...p, city: '' })); }}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {cityLoading && <span className="hs-ac-spinner" />}
              </div>

              {showDropdown && suggestions.length > 0 && (
                <ul className="hs-ac-dropdown">
                  {suggestions.map((s) => (
                    <li key={s.destId}
                      onMouseDown={() => {
                        setCityQuery(s.label || s.name);
                        setDestId(s.destId);
                        setSearchType(s.searchType || 'CITY');
                        setShowDropdown(false);
                        setErrors(p => ({ ...p, city: '' }));
                      }}
                    >
                      <svg className="hs-ac-dropdown__icon" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/>
                      </svg>
                      <div>
                        <span className="hs-ac-dropdown__name">{s.name}</span>
                        {s.countryName && <span className="hs-ac-dropdown__country">{s.countryName}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {errors.city && <span className="hs-field__err">{errors.city}</span>}
            </div>

            <div className="hs-form__row">
              {/* Check-in */}
              <div className={`hs-field${errors.checkIn ? ' hs-field--error' : ''}`}>
                <label className="hs-field__label">Check-in</label>
                <input type="date" className="hs-field__input" min={today}
                  value={checkIn}
                  onChange={(e) => { setCheckIn(e.target.value); setErrors(p => ({ ...p, checkIn: '' })); }} />
                {errors.checkIn && <span className="hs-field__err">{errors.checkIn}</span>}
              </div>

              {/* Check-out */}
              <div className={`hs-field${errors.checkOut ? ' hs-field--error' : ''}`}>
                <label className="hs-field__label">Check-out</label>
                <input type="date" className="hs-field__input" min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => { setCheckOut(e.target.value); setErrors(p => ({ ...p, checkOut: '' })); }} />
                {errors.checkOut  && <span className="hs-field__err">{errors.checkOut}</span>}
                {!errors.checkOut && nights > 0 && <span className="hs-field__sub">{nights} night{nights !== 1 ? 's' : ''}</span>}
              </div>

              {/* Adults */}
              <div className="hs-field">
                <label className="hs-field__label">Adults</label>
                <select className="hs-field__input" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="hs-form__actions">
              <button type="submit" className="hs-search-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="hs-search-btn__spinner" /> Searching…</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg> Search Hotels</>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Loading skeletons */}
      {isLoading && (
        <section className="hotel-search-results">
          <div className="container">
            <div className="hs-results-grid">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {searched && !isLoading && (
        <section className="hotel-search-results">
          <div className="container">
            {searchError ? (
              <div className="hs-empty">
                <div className="hs-empty__icon">🏨</div>
                <h3>Search failed</h3>
                <p>{searchError}</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="hs-empty">
                <div className="hs-empty__icon">🏨</div>
                <h3>No hotels found</h3>
                <p>No results for <strong>{lastCityName}</strong>. Try different dates or a nearby city.</p>
              </div>
            ) : (
              <>
                <div className="hs-results-header">
                  <h2 className="hs-results-title">
                    Hotels in <span className="theme">{lastCityName}</span>
                  </h2>
                  <p className="hs-results-note">
                    {hotels.length} result{hotels.length !== 1 ? 's' : ''}
                    {nights > 0 ? ` · ${nights} night${nights !== 1 ? 's' : ''}` : ''}
                    {' · '}{adults} adult{adults !== 1 ? 's' : ''}
                    {' · '}Prices in USD
                  </p>
                </div>
                <div className="hs-results-grid">
                  {hotels.map(hotel => <HotelCard key={hotel.hotelId} hotel={hotel} />)}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default HotelSearch;
