import React, { useState } from 'react';
import './HotelTab.css';

const HotelTab = ({ tripData }) => {
  const defaultCheckIn  = tripData?.dates?.start_date || '';
  const defaultCheckOut = tripData?.dates?.end_date   || '';
  const defaultAdults   = tripData?.guests?.adults    || 1;

  const [cityName, setCityName] = useState(tripData?.destination?.name || '');
  const [form, setForm] = useState({
    checkIn:  defaultCheckIn,
    checkOut: defaultCheckOut,
    adults:   defaultAdults,
  });
  const [showGuests, setShowGuests] = useState(false);
  const [errors, setErrors]         = useState({});
  const [isLoading, setIsLoading]   = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0;

  const validate = () => {
    const errs = {};
    if (!cityName.trim())  errs.city     = 'Enter a destination city';
    if (!form.checkIn)     errs.checkIn  = 'Pick a check-in date';
    if (!form.checkOut)    errs.checkOut = 'Pick a check-out date';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      errs.checkOut = 'Check-out must be after check-in';
    }
    return errs;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setShowGuests(false);

    setTimeout(() => {
      const params = new URLSearchParams({
        ss:           cityName.trim(),
        checkin:      form.checkIn,
        checkout:     form.checkOut,
        group_adults: String(form.adults),
        aid:          '123456',
      });
      window.open(`https://www.booking.com/searchresults.html?${params.toString()}`, '_blank');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="ht-root">
      <form className="ht-card" onSubmit={handleSearch}>

        {/* City input */}
        <div className="ht-city-row">
          <div className={`ht-field ht-field--city${errors.city ? ' ht-field--error' : ''}`}>
            <label className="ht-field__label">Destination City</label>
            <div className="ht-ac-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="ht-city-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                  stroke="#029e9d" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="10" r="3" stroke="#029e9d" strokeWidth="2"/>
              </svg>
              <input
                className="ht-field__input"
                placeholder="e.g. Paris, Dubai, Bangkok"
                value={cityName}
                onChange={e => { setCityName(e.target.value); setErrors(p => ({ ...p, city: '' })); }}
                autoComplete="off"
              />
            </div>
            {errors.city && <span className="ht-field__err">{errors.city}</span>}
          </div>
        </div>

        {/* Dates + Guests row */}
        <div className="ht-options-row">
          {/* Check-in */}
          <div className={`ht-field${errors.checkIn ? ' ht-field--error' : ''}`}>
            <label className="ht-field__label">Check-in</label>
            <input type="date" className="ht-field__input" min={today}
              value={form.checkIn}
              onChange={e => setField('checkIn', e.target.value)} />
            {errors.checkIn
              ? <span className="ht-field__err">{errors.checkIn}</span>
              : <span className="ht-field__sub">Arrival date</span>}
          </div>

          {/* Check-out */}
          <div className={`ht-field${errors.checkOut ? ' ht-field--error' : ''}`}>
            <label className="ht-field__label">Check-out</label>
            <input type="date" className="ht-field__input"
              min={form.checkIn || today}
              value={form.checkOut}
              onChange={e => setField('checkOut', e.target.value)} />
            {errors.checkOut
              ? <span className="ht-field__err">{errors.checkOut}</span>
              : <span className="ht-field__sub">
                  {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Departure date'}
                </span>}
          </div>

          {/* Guests */}
          <div className="ht-field ht-field--guests">
            <label className="ht-field__label">Guests</label>
            <button type="button" className="ht-field__pax-btn"
              onClick={() => setShowGuests(v => !v)}>
              {form.adults} Adult{form.adults !== 1 ? 's' : ''}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{marginLeft:6}}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
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
              <><span className="ht-spinner"></span>Redirecting…</>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Search Hotels
              </>
            )}
          </button>
        </div>

        {/* Affiliate info */}
        <div className="ht-redirect-info">
          <p className="ht-redirect-note">
            You will be redirected to our booking partner to complete your reservation.
          </p>
          <p className="ht-affiliate-disclaimer">
            We may earn a commission from bookings made through our partners.
          </p>
        </div>
      </form>
    </div>
  );
};

export default HotelTab;
