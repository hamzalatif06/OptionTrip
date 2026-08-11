import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeBookingSection.css';

const TODAY    = new Date().toISOString().split('T')[0];
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const TABS = [
  {
    id: 'flights',
    label: 'Flights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'hotels',
    label: 'Stays',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'cars',
    label: 'Car Rental',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
        <circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'esim',
    label: 'eSIM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 16h.01M12 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5"/>
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const SwapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <path d="M7 16V4m0 0L3 8m4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Stepper = ({ value, min = 1, max = 9, onChange }) => (
  <div className="hbs-stepper">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
    <span>{value}</span>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
  </div>
);

const HomeBookingSection = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('flights');

  const [fFrom,        setFFrom]        = useState('');
  const [fTo,          setFTo]          = useState('');
  const [fDate,        setFDate]        = useState('');
  const [fReturn,      setFReturn]      = useState('');
  const [fTripType,    setFTripType]    = useState('one-way');
  const [fPassengers,  setFPassengers]  = useState(1);

  const [hCity,      setHCity]      = useState('');
  const [hCheckIn,   setHCheckIn]   = useState(TODAY);
  const [hCheckOut,  setHCheckOut]  = useState(TOMORROW);
  const [hGuests,    setHGuests]    = useState(1);
  const [hRooms,     setHRooms]     = useState(1);

  const [cPickup,     setCPickup]     = useState('');
  const [cDropoff,    setCDropoff]    = useState('');
  const [cPickupDate, setCPickupDate] = useState('');
  const [cReturnDate, setCReturnDate] = useState('');

  const handleFlightSearch = (e) => {
    e.preventDefault();
    navigate('/flights', {
      state: {
        autoFill: true,
        fromDisplay: fFrom, toDisplay: fTo,
        departureDate: fDate, returnDate: fReturn,
        adults: fPassengers, tripType: fTripType,
      }
    });
  };

  const handleHotelSearch = (e) => {
    e.preventDefault();
    navigate('/hotels', {
      state: { autoFill: true, cityQuery: hCity, checkIn: hCheckIn, checkOut: hCheckOut, adults: hGuests, rooms: hRooms }
    });
  };

  const handleCarSearch = (e) => {
    e.preventDefault();
    navigate('/car-rental');
  };

  const handleEsimGo = (e) => {
    e.preventDefault();
    navigate('/esim');
  };

  return (
    <section className="hbs">
      <div className="hbs__card">


        <div className="hbs__tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`hbs__tab${tab === t.id ? ' hbs__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="hbs__tab-icon">{t.icon}</span>
              <span className="hbs__tab-label">{t.label}</span>
            </button>
          ))}
        </div>


        {tab === 'flights' && (
          <form className="hbs__form" onSubmit={handleFlightSearch}>
            <div className="hbs__trip-type">
              {['one-way', 'round-trip'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`hbs__pill${fTripType === type ? ' hbs__pill--on' : ''}`}
                  onClick={() => setFTripType(type)}
                >
                  {type === 'one-way' ? 'One way' : 'Round trip'}
                </button>
              ))}
            </div>

            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow2">
                <label className="hbs__label">From</label>
                <input
                  className="hbs__input"
                  type="text"
                  placeholder="City or airport"
                  value={fFrom}
                  onChange={e => setFFrom(e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                className="hbs__swap"
                title="Swap origin and destination"
                onClick={() => { const tmp = fFrom; setFFrom(fTo); setFTo(tmp); }}
              >
                <SwapIcon />
              </button>

              <div className="hbs__field hbs__field--grow2">
                <label className="hbs__label">To</label>
                <input
                  className="hbs__input"
                  type="text"
                  placeholder="City or airport"
                  value={fTo}
                  onChange={e => setFTo(e.target.value)}
                  required
                />
              </div>

              <div className="hbs__field">
                <label className="hbs__label">Depart</label>
                <input className="hbs__input" type="date" value={fDate} min={TODAY} onChange={e => setFDate(e.target.value)} required />
              </div>

              {fTripType === 'round-trip' && (
                <div className="hbs__field">
                  <label className="hbs__label">Return</label>
                  <input className="hbs__input" type="date" value={fReturn} min={fDate || TODAY} onChange={e => setFReturn(e.target.value)} required />
                </div>
              )}

              <div className="hbs__field hbs__field--narrow">
                <label className="hbs__label">Passengers</label>
                <Stepper value={fPassengers} onChange={setFPassengers} />
              </div>

              <button type="submit" className="hbs__search-btn">
                <SearchIcon /> Search
              </button>
            </div>
          </form>
        )}


        {tab === 'hotels' && (
          <form className="hbs__form" onSubmit={handleHotelSearch}>
            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow3">
                <label className="hbs__label">Destination</label>
                <input
                  className="hbs__input"
                  type="text"
                  placeholder="City, region, or property name"
                  value={hCity}
                  onChange={e => setHCity(e.target.value)}
                  required
                />
              </div>

              <div className="hbs__field">
                <label className="hbs__label">Check in</label>
                <input className="hbs__input" type="date" value={hCheckIn} min={TODAY} onChange={e => setHCheckIn(e.target.value)} required />
              </div>

              <div className="hbs__field">
                <label className="hbs__label">Check out</label>
                <input className="hbs__input" type="date" value={hCheckOut} min={hCheckIn || TODAY} onChange={e => setHCheckOut(e.target.value)} required />
              </div>

              <div className="hbs__field hbs__field--narrow">
                <label className="hbs__label">Guests</label>
                <Stepper value={hGuests} max={8} onChange={setHGuests} />
              </div>

              <div className="hbs__field hbs__field--narrow">
                <label className="hbs__label">Rooms</label>
                <Stepper value={hRooms} max={4} onChange={setHRooms} />
              </div>

              <button type="submit" className="hbs__search-btn">
                <SearchIcon /> Search
              </button>
            </div>
          </form>
        )}


        {tab === 'cars' && (
          <form className="hbs__form" onSubmit={handleCarSearch}>
            <div className="hbs__row">
              <div className="hbs__field hbs__field--grow2">
                <label className="hbs__label">Pick-up location</label>
                <input
                  className="hbs__input"
                  type="text"
                  placeholder="City, airport, or hotel"
                  value={cPickup}
                  onChange={e => setCPickup(e.target.value)}
                />
              </div>

              <div className="hbs__field hbs__field--grow2">
                <label className="hbs__label">Drop-off location</label>
                <input
                  className="hbs__input"
                  type="text"
                  placeholder="Same as pick-up"
                  value={cDropoff}
                  onChange={e => setCDropoff(e.target.value)}
                />
              </div>

              <div className="hbs__field">
                <label className="hbs__label">Pick-up date</label>
                <input className="hbs__input" type="date" value={cPickupDate} min={TODAY} onChange={e => setCPickupDate(e.target.value)} />
              </div>

              <div className="hbs__field">
                <label className="hbs__label">Return date</label>
                <input className="hbs__input" type="date" value={cReturnDate} min={cPickupDate || TODAY} onChange={e => setCReturnDate(e.target.value)} />
              </div>

              <button type="submit" className="hbs__search-btn">
                <SearchIcon /> Find Cars
              </button>
            </div>
          </form>
        )}


        {tab === 'esim' && (
          <form className="hbs__form" onSubmit={handleEsimGo}>
            <div className="hbs__esim-promo">
              <p className="hbs__esim-promo__text">
                Instant travel data plans for 200+ destinations — no roaming fees, activated by QR code.
              </p>
              <button type="submit" className="hbs__search-btn">
                <SearchIcon /> Browse eSIM Plans
              </button>
            </div>
          </form>
        )}

      </div>
    </section>
  );
};

export default HomeBookingSection;
