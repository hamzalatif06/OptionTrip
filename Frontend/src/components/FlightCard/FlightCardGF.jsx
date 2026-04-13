import React, { useState } from 'react';
import './FlightCardGF.css';

/* ── Helpers ── */
const StopBadge = ({ stops }) =>
  stops === 0
    ? <span className="fc-badge fc-badge--direct">Direct</span>
    : <span className="fc-badge fc-badge--stops">{stops} stop{stops > 1 ? 's' : ''}</span>;

const AirlineLogo = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img src={src} alt={name} className="fcgf__logo" onError={() => setErr(true)} />;
  return <div className="fcgf__logo-fallback">{(name || '?').slice(0, 2).toUpperCase()}</div>;
};

/* ── Single flight leg row ── */
const Leg = ({ logo, airline, time1, iata1, city1, duration, stops, time2, iata2, city2, flightNum }) => (
  <div className="fcgf__leg">
    <div className="fcgf__logo-wrap">
      <AirlineLogo src={logo} name={airline} />
    </div>
    <div className="fcgf__airline-label">
      <span className="fcgf__airline-name">{airline || 'Airline'}</span>
      {flightNum && <span className="fcgf__flight-num">{flightNum}</span>}
    </div>
    <div className="fcgf__leg-route">
      <div className="fcgf__time-col">
        <span className="fcgf__time">{time1 || '—'}</span>
        <span className="fcgf__iata">{iata1}</span>
        {city1 && <span className="fcgf__city">{city1}</span>}
      </div>

      <div className="fcgf__route-mid">
        <span className="fcgf__duration">{duration}</span>
        <div className="fcgf__route-track">
          <div className="fcgf__route-dash" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="fcgf__route-arrow">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <StopBadge stops={stops} />
      </div>

      <div className="fcgf__time-col fcgf__time-col--right">
        <span className="fcgf__time">{time2 || '—'}</span>
        <span className="fcgf__iata">{iata2}</span>
        {city2 && <span className="fcgf__city">{city2}</span>}
      </div>
    </div>
  </div>
);

/* ── InfoChip for expanded ── */
const InfoChip = ({ icon, label, value, highlight }) => (
  <div className={`fcgf__chip${highlight ? ' fcgf__chip--hl' : ''}`}>
    <span>{icon}</span>
    <div>
      <div className="fcgf__chip-label">{label}</div>
      <div className="fcgf__chip-value">{value}</div>
    </div>
  </div>
);

/* ── Main card ── */
const FlightCardGF = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    departureTime, arrivalTime, duration, stops,
    origin, destination, originName, destName,
    airline, airlineLogo, flightNumber, aircraft,
    price, currency, bags, legroom, seatType, amenities, co2,
    bookingUrl, layovers,
    isRoundTrip, returnOrigin, returnDestination,
    returnDepartureTime, returnArrivalTime, returnDuration, returnStops,
    returnFlightNumber,
  } = flight;

  const sym          = currency === 'USD' ? '$' : (currency || '') + ' ';
  const displayPrice = price != null ? Math.round(price) : null;

  return (
    <div className="fcgf">
      <div className="fcgf__top">

        {/* ── Legs ── */}
        <div className="fcgf__legs">
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
        <div className="fcgf__price-panel">
          <button className="fcgf__wishlist" aria-label="Save">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="fcgf__price-row">
            <span className="fcgf__price-from">from</span>
            <span className="fcgf__price-amount">
              {displayPrice !== null ? `${sym}${displayPrice.toLocaleString()}` : '—'}
            </span>
            <span className="fcgf__price-per">/ person</span>
          </div>

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcgf__select-btn">
            Book Now <span className="fcgf__btn-arrow">→</span>
          </a>

          <button className="fcgf__details-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? '▲ Hide details' : '▾ View details'}
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="fcgf__details">
          <div className="fcgf__chips">
            {aircraft && <InfoChip icon="✈" label="Aircraft" value={aircraft} />}
            {(seatType || legroom) && (
              <InfoChip icon="💺" label="Seat"
                value={seatType ? `${seatType}${legroom ? ` · ${legroom}` : ''}` : legroom}
                highlight={seatType?.toLowerCase().includes('above')} />
            )}
            <InfoChip icon="🎒" label="Carry-on"
              value={bags?.carry_on > 0 ? `${bags.carry_on} bag included` : 'Not included'}
              highlight={bags?.carry_on > 0} />
            <InfoChip icon="🧳" label="Checked bag"
              value={bags?.checked > 0 ? `${bags.checked} bag included` : 'Not included'}
              highlight={bags?.checked > 0} />
          </div>

          {amenities && (amenities.wifi || amenities.power || amenities.usb || amenities.video) && (
            <div className="fcgf__amenities">
              {amenities.wifi  && <span className="fcgf__amenity">📶 Wi-Fi</span>}
              {amenities.power && <span className="fcgf__amenity">🔌 Power</span>}
              {amenities.usb   && <span className="fcgf__amenity">🔋 USB</span>}
              {amenities.video && <span className="fcgf__amenity">🎬 Video</span>}
              {co2 !== null && co2 !== undefined && (
                <span className={`fcgf__amenity${co2 < 0 ? ' fcgf__co2--good' : co2 > 20 ? ' fcgf__co2--bad' : ''}`}>
                  🌿 {co2 < 0 ? `${Math.abs(co2)}% less CO₂` : `${co2}% more CO₂`}
                </span>
              )}
            </div>
          )}

          {layovers?.length > 0 && (
            <div className="fcgf__layovers">
              <div className="fcgf__layovers-title">Layovers</div>
              {layovers.map((l, i) => (
                <div key={i} className="fcgf__layover">
                  <div className="fcgf__layover-dot" />
                  <span className="fcgf__layover-name">{l.name} <span className="fcgf__layover-code">({l.id})</span></span>
                  {l.duration && <span className="fcgf__layover-dur">{l.duration}</span>}
                  {l.overnight && <span className="fcgf__overnight">Overnight</span>}
                </div>
              ))}
            </div>
          )}

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcgf__select-btn fcgf__select-btn--full">
            Book on Aviasales ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default FlightCardGF;
