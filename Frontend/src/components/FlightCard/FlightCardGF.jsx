import React, { useState } from 'react';
import './FlightCardGF.css';

const StopBadge = ({ stops }) => {
  if (stops === 0) return <span className="fcgf-stop fcgf-stop--direct">Direct</span>;
  return <span className="fcgf-stop fcgf-stop--connecting">{stops} stop{stops > 1 ? 's' : ''}</span>;
};

const FlightCardGF = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    departureTime, arrivalTime, duration,
    origin, destination, originName, destName,
    stops, airline, airlineLogo, flightNumber, aircraft,
    price, currency, bags, legroom, bookingUrl, layovers,
  } = flight;

  // Time already extracted by backend — just display as-is
  const fmt = (t) => t || '';

  return (
    <div className="fcgf">
      <div className="fcgf__main">
        {/* Airline */}
        <div className="fcgf__airline">
          {airlineLogo && (
            <img src={airlineLogo} alt={airline} className="fcgf__airline-logo" />
          )}
          <div>
            <span className="fcgf__airline-name">{airline}</span>
            {flightNumber && <span className="fcgf__flight-num">{flightNumber}</span>}
          </div>
        </div>

        {/* Route timeline */}
        <div className="fcgf__route">
          <div className="fcgf__point">
            <span className="fcgf__time">{fmt(departureTime)}</span>
            <span className="fcgf__code">{origin}</span>
            {originName && <span className="fcgf__airport">{originName}</span>}
          </div>

          <div className="fcgf__line">
            <div className="fcgf__duration">{duration}</div>
            <div className="fcgf__track">
              <div className="fcgf__track-dot"></div>
              <div className="fcgf__track-bar"></div>
              <svg className="fcgf__track-plane" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="fcgf__track-dot"></div>
            </div>
            <StopBadge stops={stops} />
          </div>

          <div className="fcgf__point fcgf__point--right">
            <span className="fcgf__time">{fmt(arrivalTime)}</span>
            <span className="fcgf__code">{destination}</span>
            {destName && <span className="fcgf__airport">{destName}</span>}
          </div>
        </div>

        {/* Price + Book */}
        <div className="fcgf__cta">
          <div className="fcgf__price">
            <span className="fcgf__price-from">from</span>
            <span className="fcgf__price-amount">${price}</span>
            <span className="fcgf__price-pp">/ person</span>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fcgf__book-btn"
          >
            Book Now
          </a>
          <button className="fcgf__details-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Hide details ▲' : 'Details ▼'}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="fcgf__details">
          <div className="fcgf__details-grid">
            {aircraft && (
              <div className="fcgf__detail-item">
                <span className="fcgf__detail-label">Aircraft</span>
                <span className="fcgf__detail-value">{aircraft}</span>
              </div>
            )}
            {legroom && (
              <div className="fcgf__detail-item">
                <span className="fcgf__detail-label">Legroom</span>
                <span className="fcgf__detail-value">{legroom}</span>
              </div>
            )}
            <div className="fcgf__detail-item">
              <span className="fcgf__detail-label">Carry-on</span>
              <span className="fcgf__detail-value">
                {bags?.carry_on > 0 ? `${bags.carry_on} included` : 'Not included'}
              </span>
            </div>
            <div className="fcgf__detail-item">
              <span className="fcgf__detail-label">Checked bag</span>
              <span className="fcgf__detail-value">
                {bags?.checked > 0 ? `${bags.checked} included` : 'Not included'}
              </span>
            </div>
          </div>

          {layovers?.length > 0 && (
            <div className="fcgf__layovers">
              <h4 className="fcgf__layovers-title">Layovers</h4>
              {layovers.map((l, i) => (
                <div key={i} className="fcgf__layover-item">
                  <i className="fa fa-clock-o"></i>
                  <span>{l.name} ({l.id}) · {l.duration}</span>
                  {l.overnight && <span className="fcgf__overnight">Overnight</span>}
                </div>
              ))}
            </div>
          )}

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fcgf__book-btn fcgf__book-btn--full"
          >
            Book on Aviasales ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default FlightCardGF;
