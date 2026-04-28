import React, { useState } from 'react';
import useCurrency from '../../hooks/useCurrency';
import './FlightCardDuffel.css';

/* ── SVG icon set ── */
const Ic = {
  airplane:   <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  seat:       <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5 4v9M19 4v9M5 13h14a2 2 0 010 4H5a2 2 0 010-4zM10 21h4M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  carryOn:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M9 4a3 3 0 016 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2h1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 11v4M10 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  luggage:    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="5" y="8" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 13h8M12 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  changeable: <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  refund:     <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M3 12a9 9 0 109-9H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 4v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cross:      <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

/* ── Helpers ── */
const StopBadge = ({ stops }) =>
  stops === 0
    ? <span className="fc-badge fc-badge--direct">Direct</span>
    : <span className="fc-badge fc-badge--stops">{stops} stop{stops > 1 ? 's' : ''}</span>;

const ConditionPill = ({ allowed, label }) => {
  if (allowed === null || allowed === undefined) return null;
  return (
    <span className={`fcdf-cond${allowed ? ' fcdf-cond--yes' : ' fcdf-cond--no'}`}>
      <span className="fcdf-cond__icon">{allowed ? Ic.check : Ic.cross}</span>
      {label}
    </span>
  );
};

const AirlineLogo = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img src={src} alt={name} className="fcdf__logo" onError={() => setErr(true)} />;
  return <div className="fcdf__logo-fallback">{(name || '?').slice(0, 2).toUpperCase()}</div>;
};

/* ── Single flight leg row ── */
const Leg = ({ logo, airline, time1, iata1, city1, duration, stops, time2, iata2, city2, flightNum }) => (
  <div className="fcdf__leg">
    <div className="fcdf__logo-wrap">
      <AirlineLogo src={logo} name={airline} />
    </div>
    <div className="fcdf__airline-label">
      <span className="fcdf__airline-name">{airline || 'Airline'}</span>
      {flightNum && <span className="fcdf__flight-num">{flightNum}</span>}
    </div>
    <div className="fcdf__leg-route">
      <div className="fcdf__time-col">
        <span className="fcdf__time">{time1 || '—'}</span>
        <span className="fcdf__iata">{iata1}</span>
        {city1 && <span className="fcdf__city">{city1}</span>}
      </div>

      <div className="fcdf__route-mid">
        <span className="fcdf__duration">{duration}</span>
        <div className="fcdf__route-track">
          <div className="fcdf__route-dash" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="fcdf__route-arrow">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <StopBadge stops={stops} />
      </div>

      <div className="fcdf__time-col fcdf__time-col--right">
        <span className="fcdf__time">{time2 || '—'}</span>
        <span className="fcdf__iata">{iata2}</span>
        {city2 && <span className="fcdf__city">{city2}</span>}
      </div>
    </div>
  </div>
);

/* ── InfoChip for expanded ── */
const InfoChip = ({ icon, label, value, highlight }) => (
  <div className={`fcdf__chip${highlight ? ' fcdf__chip--hl' : ''}`}>
    <div className="fcdf__chip-icon">{icon}</div>
    <div>
      <div className="fcdf__chip-label">{label}</div>
      <div className="fcdf__chip-value">{value}</div>
    </div>
  </div>
);

/* ── Main card ── */
const FlightCardDuffel = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);
  const { formatPriceFromCurrency } = useCurrency();

  const {
    departureTime, arrivalTime, duration, stops,
    origin, destination, originName, destName,
    airline, airlineLogo, flightNumber, aircraft,
    cabinClass, price, currency,
    changeable, refundable, bags, layovers,
    bookingUrl,
    isRoundTrip, returnOrigin, returnDestination,
    returnDepartureTime, returnArrivalTime, returnDuration, returnStops,
    returnFlightNumber,
  } = flight;

  const displayPrice = price != null ? formatPriceFromCurrency(price, currency || 'USD') : null;

  return (
    <div className="fcdf">
      <div className="fcdf__top">

        {/* ── Legs ── */}
        <div className="fcdf__legs">
          <Leg
            logo={airlineLogo} airline={airline} flightNum={flightNumber}
            time1={departureTime} iata1={origin} city1={originName}
            duration={duration} stops={stops}
            time2={arrivalTime} iata2={destination} city2={destName}
          />
          {isRoundTrip && returnOrigin && (
            <Leg
              logo={airlineLogo} airline={airline} flightNum={returnFlightNumber}
              time1={returnDepartureTime} iata1={returnOrigin}
              duration={returnDuration} stops={returnStops ?? 0}
              time2={returnArrivalTime} iata2={returnDestination}
            />
          )}
        </div>

        {/* ── Price panel ── */}
        <div className="fcdf__price-panel">
          <button className="fcdf__wishlist" aria-label="Save">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="fcdf__price-row">
            <span className="fcdf__price-from">from</span>
            <span className="fcdf__price-amount">
              {displayPrice ?? '—'}
            </span>
            <span className="fcdf__price-per">/ person</span>
          </div>

          <div className="fcdf__conditions">
            <ConditionPill allowed={refundable} label="Refundable" />
          </div>

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcdf__select-btn">
            Book Now <span className="fcdf__btn-arrow">→</span>
          </a>

          <button className="fcdf__details-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? '▲ Hide details' : '▾ View details'}
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="fcdf__details">
          <div className="fcdf__chips">
            {aircraft   && <InfoChip icon={Ic.airplane}   label="Aircraft"     value={aircraft} />}
            {cabinClass && <InfoChip icon={Ic.seat}       label="Cabin class"  value={cabinClass} highlight />}
            <InfoChip icon={Ic.carryOn}  label="Carry-on"
              value={bags?.carry_on > 0 ? `${bags.carry_on} bag included` : 'Not included'}
              highlight={bags?.carry_on > 0} />
            <InfoChip icon={Ic.luggage} label="Checked bag"
              value={bags?.checked > 0 ? `${bags.checked} bag included` : 'Not included'}
              highlight={bags?.checked > 0} />
            <InfoChip icon={Ic.changeable} label="Change fee"
              value={changeable === null ? 'Unknown' : changeable ? 'Changeable' : 'Non-changeable'}
              highlight={changeable === true} />
            <InfoChip icon={Ic.refund} label="Refund"
              value={refundable === null ? 'Unknown' : refundable ? 'Refundable' : 'Non-refundable'}
              highlight={refundable === true} />
          </div>

          {layovers?.length > 0 && (
            <div className="fcdf__layovers">
              <div className="fcdf__layovers-title">Layovers</div>
              {layovers.map((l, i) => (
                <div key={i} className="fcdf__layover">
                  <div className="fcdf__layover-dot" />
                  <span className="fcdf__layover-name">
                    {l.name} {l.id && <span className="fcdf__layover-code">({l.id})</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcdf__select-btn fcdf__select-btn--full">
            Book on Aviasales ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default FlightCardDuffel;
