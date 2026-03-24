import React, { useState, useMemo } from 'react';
import './FlightTab.css';

const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

const FlightTab = ({ tripData }) => {
  const defaultDeparture = tripData?.dates?.start_date || '';
  const defaultReturn    = tripData?.dates?.end_date   || '';
  const defaultAdults    = tripData?.guests?.adults    || 1;
  const defaultChildren  = tripData?.guests?.children  || 0;

  const [tripType, setTripType] = useState('round-trip');
  const [originCode, setOriginCode] = useState('');
  const [destCode,   setDestCode]   = useState('');
  const [form, setForm] = useState({
    departureDate: defaultDeparture,
    returnDate:    defaultReturn,
    adults:        defaultAdults,
    children:      defaultChildren,
    cabin:         'Economy',
  });
  const [showPassengers, setShowPassengers] = useState(false);
  const [errors, setErrors]   = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const passengerLabel = useMemo(() => {
    const parts = [`${form.adults} Adult${form.adults !== 1 ? 's' : ''}`];
    if (form.children > 0) parts.push(`${form.children} Child${form.children !== 1 ? 'ren' : ''}`);
    return parts.join(', ');
  }, [form.adults, form.children]);

  const iataRe = /^[A-Z]{2,3}$/;

  const validate = () => {
    const errs = {};
    if (!originCode || !iataRe.test(originCode))
      errs.origin = 'Enter a valid IATA code (e.g. JFK)';
    if (!destCode || !iataRe.test(destCode))
      errs.dest = 'Enter a valid IATA code (e.g. DXB)';
    if (originCode && destCode && originCode === destCode)
      errs.dest = 'Origin and destination must differ';
    if (!form.departureDate) errs.departureDate = 'Pick a departure date';
    if (tripType === 'round-trip' && !form.returnDate) errs.returnDate = 'Pick a return date';
    return errs;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setShowPassengers(false);

    setTimeout(() => {
      // Aviasales format: {FROM}{DDMM}{TO}[{TO}{DDMM}{FROM}]{ADULTS}
      const [, depMonth, depDay] = form.departureDate.split('-');
      let path = `${originCode}${depDay}${depMonth}${destCode}`;

      if (tripType === 'round-trip' && form.returnDate) {
        const [, retMonth, retDay] = form.returnDate.split('-');
        path += `${destCode}${retDay}${retMonth}${originCode}`;
      }

      path += String(form.adults);
      window.open(`https://www.aviasales.com/search/${path}?marker=123456`, '_blank');
      setIsLoading(false);
    }, 1500);
  };

  const swapAirports = () => {
    setOriginCode(destCode);
    setDestCode(originCode);
    setErrors({});
  };

  return (
    <div className="ft-root">
      {/* Trip-type toggle */}
      <div className="ft-toggle">
        <button type="button"
          className={`ft-toggle-btn${tripType === 'one-way' ? ' active' : ''}`}
          onClick={() => setTripType('one-way')}>
          One Way
        </button>
        <button type="button"
          className={`ft-toggle-btn${tripType === 'round-trip' ? ' active' : ''}`}
          onClick={() => setTripType('round-trip')}>
          Round Trip
        </button>
      </div>

      <form className="ft-card" onSubmit={handleSearch}>

        {/* From / To row */}
        <div className="ft-route-row">
          {/* From */}
          <div className={`ft-field ft-field--lg${errors.origin ? ' ft-field--error' : ''}`}>
            <label className="ft-field__label">From</label>
            <input
              className="ft-field__input"
              placeholder="IATA code (e.g. JFK, LHR)"
              value={originCode}
              onChange={e => { setOriginCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, origin: '' })); }}
              maxLength={3}
              autoCapitalize="characters"
              autoComplete="off"
            />
            {errors.origin && <span className="ft-field__err">{errors.origin}</span>}
          </div>

          {/* Swap */}
          <button type="button" className="ft-swap-btn" onClick={swapAirports} title="Swap airports">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* To */}
          <div className={`ft-field ft-field--lg${errors.dest ? ' ft-field--error' : ''}`}>
            <label className="ft-field__label">To</label>
            <input
              className="ft-field__input"
              placeholder="IATA code (e.g. DXB, CDG)"
              value={destCode}
              onChange={e => { setDestCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, dest: '' })); }}
              maxLength={3}
              autoCapitalize="characters"
              autoComplete="off"
            />
            {errors.dest && <span className="ft-field__err">{errors.dest}</span>}
          </div>
        </div>

        {/* Options row */}
        <div className="ft-options-row">
          {/* Cabin */}
          <div className="ft-field">
            <label className="ft-field__label">Class</label>
            <select className="ft-field__select" value={form.cabin}
              onChange={e => setField('cabin', e.target.value)}>
              {CABIN_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Passengers */}
          <div className="ft-field ft-field--passengers">
            <label className="ft-field__label">Passengers</label>
            <button type="button" className="ft-field__pax-btn"
              onClick={() => setShowPassengers(v => !v)}>
              {passengerLabel}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{marginLeft:6,flexShrink:0}}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
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
            <input type="date" className="ft-field__input" min={today}
              value={form.departureDate}
              onChange={e => setField('departureDate', e.target.value)} />
            {errors.departureDate
              ? <span className="ft-field__err">{errors.departureDate}</span>
              : <span className="ft-field__sub">At any time</span>}
          </div>

          {/* Return date */}
          {tripType === 'round-trip' && (
            <div className={`ft-field${errors.returnDate ? ' ft-field--error' : ''}`}>
              <label className="ft-field__label">Return date</label>
              <input type="date" className="ft-field__input"
                min={form.departureDate || today}
                value={form.returnDate}
                onChange={e => setField('returnDate', e.target.value)} />
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
              <><span className="ft-spinner"></span>Redirecting…</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Search Flights
              </>
            )}
          </button>
        </div>

        {/* Affiliate info */}
        <div className="ft-redirect-info">
          <p className="ft-redirect-note">
            You will be redirected to our booking partner to complete your reservation.
          </p>
          <p className="ft-affiliate-disclaimer">
            We may earn a commission from bookings made through our partners.
          </p>
        </div>
      </form>
    </div>
  );
};

export default FlightTab;
