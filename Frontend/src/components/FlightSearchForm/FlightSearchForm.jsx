import React, { useState } from 'react';
import './FlightSearchForm.css';

const today = new Date().toISOString().split('T')[0];

const FlightSearchForm = ({ onSearch, isLoading }) => {
  const [form, setForm] = useState({
    tripType: 'one-way',
    originCode: '',
    destinationCode: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.originCode.trim()) errs.originCode = 'Enter departure airport code (e.g. JFK)';
    else if (!/^[A-Za-z]{2,3}$/.test(form.originCode.trim())) errs.originCode = 'Must be a 2-3 letter IATA code';
    if (!form.destinationCode.trim()) errs.destinationCode = 'Enter destination airport code (e.g. LAX)';
    else if (!/^[A-Za-z]{2,3}$/.test(form.destinationCode.trim())) errs.destinationCode = 'Must be a 2-3 letter IATA code';
    if (form.originCode && form.destinationCode && form.originCode.toUpperCase() === form.destinationCode.toUpperCase()) {
      errs.destinationCode = 'Origin and destination must differ';
    }
    if (!form.departureDate) errs.departureDate = 'Select departure date';
    if (form.tripType === 'round-trip' && !form.returnDate) errs.returnDate = 'Select return date';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSearch({
      originCode: form.originCode.trim().toUpperCase(),
      destinationCode: form.destinationCode.trim().toUpperCase(),
      departureDate: form.departureDate,
      returnDate: form.tripType === 'round-trip' ? form.returnDate : undefined,
      adults: Number(form.adults),
      children: Number(form.children),
    });
  };

  return (
    <section className="flight-search-section">
      <div className="container">
        <div className="flight-search-card">
          {/* Trip type toggle */}
          <div className="trip-type-toggle mb-4">
            {['one-way', 'round-trip'].map(type => (
              <button
                key={type}
                type="button"
                className={`trip-type-btn${form.tripType === type ? ' active' : ''}`}
                onClick={() => set('tripType', type)}
              >
                {type === 'one-way' ? 'One-way' : 'Round Trip'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              {/* Origin */}
              <div className="col-lg-2 col-md-6">
                <label className="fsf-label">From</label>
                <input
                  className={`fsf-input${errors.originCode ? ' is-error' : ''}`}
                  type="text"
                  placeholder="e.g. JFK"
                  value={form.originCode}
                  onChange={e => set('originCode', e.target.value)}
                  maxLength={3}
                />
                {errors.originCode && <p className="fsf-error">{errors.originCode}</p>}
              </div>

              {/* Swap arrow (decorative) */}
              <div className="col-lg-1 col-md-12 text-center d-none d-lg-flex align-items-center justify-content-center" style={{paddingBottom: errors.originCode || errors.destinationCode ? '24px' : '8px'}}>
                <i className="fa fa-arrow-right fsf-arrow"></i>
              </div>

              {/* Destination */}
              <div className="col-lg-2 col-md-6">
                <label className="fsf-label">To</label>
                <input
                  className={`fsf-input${errors.destinationCode ? ' is-error' : ''}`}
                  type="text"
                  placeholder="e.g. LAX"
                  value={form.destinationCode}
                  onChange={e => set('destinationCode', e.target.value)}
                  maxLength={3}
                />
                {errors.destinationCode && <p className="fsf-error">{errors.destinationCode}</p>}
              </div>

              {/* Departure Date */}
              <div className="col-lg-2 col-md-6">
                <label className="fsf-label">Departure</label>
                <input
                  className={`fsf-input${errors.departureDate ? ' is-error' : ''}`}
                  type="date"
                  min={today}
                  value={form.departureDate}
                  onChange={e => set('departureDate', e.target.value)}
                />
                {errors.departureDate && <p className="fsf-error">{errors.departureDate}</p>}
              </div>

              {/* Return Date (round-trip only) */}
              {form.tripType === 'round-trip' && (
                <div className="col-lg-2 col-md-6">
                  <label className="fsf-label">Return</label>
                  <input
                    className={`fsf-input${errors.returnDate ? ' is-error' : ''}`}
                    type="date"
                    min={form.departureDate || today}
                    value={form.returnDate}
                    onChange={e => set('returnDate', e.target.value)}
                  />
                  {errors.returnDate && <p className="fsf-error">{errors.returnDate}</p>}
                </div>
              )}

              {/* Adults */}
              <div className="col-lg-1 col-md-3">
                <label className="fsf-label">Adults</label>
                <input
                  className="fsf-input"
                  type="number"
                  min={1} max={9}
                  value={form.adults}
                  onChange={e => set('adults', e.target.value)}
                />
              </div>

              {/* Children */}
              <div className="col-lg-1 col-md-3">
                <label className="fsf-label">Children</label>
                <input
                  className="fsf-input"
                  type="number"
                  min={0} max={8}
                  value={form.children}
                  onChange={e => set('children', e.target.value)}
                />
              </div>

              {/* Search Button */}
              <div className={`col-lg-${form.tripType === 'round-trip' ? '1' : '2'} col-md-6`}>
                <button
                  type="submit"
                  className="fsf-search-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Searching…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search"></i>
                      Search
                    </>
                  )}
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
