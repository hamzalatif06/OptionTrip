import React from 'react';
import './FlightCardTP.css';

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const FlightCardTP = ({ flight }) => {
  const stopsLabel =
    flight.stops === 0
      ? 'Non-stop'
      : `${flight.stops} stop${flight.stops !== 1 ? 's' : ''}`;

  return (
    <div className="ftc-card">
      {/* Main row: airline + route + cta */}
      <div className="ftc-card__main">
        {/* Airline badge */}
        <div className="ftc-airline">
          <span className="ftc-airline__code">{flight.airline}</span>
          {flight.flightNumber && (
            <span className="ftc-airline__num">{flight.airline} {flight.flightNumber}</span>
          )}
        </div>

        {/* Route visualization */}
        <div className="ftc-route">
          <div className="ftc-route__point">
            <span className="ftc-iata">{flight.origin}</span>
            <span className="ftc-time">{formatTime(flight.departureAt)}</span>
            <span className="ftc-date">{formatDate(flight.departureAt)}</span>
          </div>

          <div className="ftc-route__middle">
            {flight.duration && <span className="ftc-duration">{flight.duration}</span>}
            <div className="ftc-route__line">
              <div className="ftc-route__dot" />
              <div className="ftc-route__bar" />
              <svg className="ftc-plane-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="ftc-route__bar" />
              <div className="ftc-route__dot" />
            </div>
            <span className={`ftc-stops${flight.stops === 0 ? ' ftc-stops--direct' : ''}`}>{stopsLabel}</span>
          </div>

          <div className="ftc-route__point ftc-route__point--right">
            <span className="ftc-iata">{flight.destination}</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="ftc-cta">
          <div className="ftc-price">
            <span className="ftc-price__from">from</span>
            <span className="ftc-price__amount">
              {flight.currency} {flight.price?.toLocaleString()}
            </span>
          </div>
          <a
            href={flight.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ftc-book-btn"
          >
            Book Now
          </a>
          <p className="ftc-note">via Aviasales</p>
        </div>
      </div>

      {/* Return leg row (TP only has departure time) */}
      {flight.isRoundTrip && flight.returnDepartureTime && (
        <div className="ftc-return-row">
          <span className="ftc-return-label">↩ Return from {flight.returnOrigin}</span>
          <span className="ftc-return-time">{flight.returnDepartureTime}</span>
        </div>
      )}
    </div>
  );
};

export default FlightCardTP;
