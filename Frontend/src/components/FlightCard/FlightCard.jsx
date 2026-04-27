import React from 'react';
import useCurrency from '../../hooks/useCurrency';
import './FlightCard.css';

/**
 * Formats "2024-11-15T08:45:00" → "08:45"
 */
const formatTime = (isoStr) => {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Formats "2024-11-15T08:45:00" → "15 Nov"
 */
const formatDate = (isoStr) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const FlightCard = ({ flight }) => {
  const { formatPriceFromCurrency } = useCurrency();
  const outbound = flight.itineraries?.[0];
  const inbound  = flight.itineraries?.[1]; // round-trip return leg
  const firstSeg = outbound?.segments?.[0];
  const lastSeg  = outbound?.segments?.[outbound.segments.length - 1];

  const stopsLabel = flight.numberOfStops === 0
    ? 'Non-stop'
    : `${flight.numberOfStops} stop${flight.numberOfStops > 1 ? 's' : ''}`;

  return (
    <div className="flight-card">
      <div className="flight-card__body">

        {/* Outbound leg */}
        <div className="flight-leg">
          <div className="flight-leg__carrier">
            <span className="carrier-badge">{flight.validatingCarrier || firstSeg?.carrierCode || '??'}</span>
            <span className="flight-number">{firstSeg?.flightNumber ? `${firstSeg.carrierCode}${firstSeg.flightNumber}` : ''}</span>
          </div>

          <div className="flight-leg__route">
            <div className="route-point">
              <span className="route-time">{formatTime(firstSeg?.departure?.time)}</span>
              <span className="route-iata">{firstSeg?.departure?.iataCode}</span>
              <span className="route-date">{formatDate(firstSeg?.departure?.time)}</span>
            </div>

            <div className="route-middle">
              <span className="route-duration">{outbound?.totalDuration}</span>
              <div className="route-line">
                <span className="route-line__bar"></span>
                <i className="fa fa-plane route-line__plane"></i>
              </div>
              <span className={`route-stops ${flight.numberOfStops === 0 ? 'nonstop' : 'has-stops'}`}>
                {stopsLabel}
              </span>
            </div>

            <div className="route-point route-point--right">
              <span className="route-time">{formatTime(lastSeg?.arrival?.time)}</span>
              <span className="route-iata">{lastSeg?.arrival?.iataCode}</span>
              <span className="route-date">{formatDate(lastSeg?.arrival?.time)}</span>
            </div>
          </div>
        </div>

        {/* Return leg (round-trip) */}
        {inbound && (() => {
          const retFirst = inbound.segments?.[0];
          const retLast  = inbound.segments?.[inbound.segments.length - 1];
          const retStops = (inbound.segments?.length || 1) - 1;
          return (
            <div className="flight-leg flight-leg--return">
              <div className="flight-leg__carrier">
                <span className="carrier-badge">{retFirst?.carrierCode || '??'}</span>
                <span className="flight-number">{retFirst ? `${retFirst.carrierCode}${retFirst.flightNumber}` : ''}</span>
              </div>
              <div className="flight-leg__route">
                <div className="route-point">
                  <span className="route-time">{formatTime(retFirst?.departure?.time)}</span>
                  <span className="route-iata">{retFirst?.departure?.iataCode}</span>
                  <span className="route-date">{formatDate(retFirst?.departure?.time)}</span>
                </div>
                <div className="route-middle">
                  <span className="route-duration">{inbound.totalDuration}</span>
                  <div className="route-line">
                    <span className="route-line__bar"></span>
                    <i className="fa fa-plane route-line__plane"></i>
                  </div>
                  <span className={`route-stops ${retStops === 0 ? 'nonstop' : 'has-stops'}`}>
                    {retStops === 0 ? 'Non-stop' : `${retStops} stop${retStops > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="route-point route-point--right">
                  <span className="route-time">{formatTime(retLast?.arrival?.time)}</span>
                  <span className="route-iata">{retLast?.arrival?.iataCode}</span>
                  <span className="route-date">{formatDate(retLast?.arrival?.time)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Price + CTA */}
      <div className="flight-card__cta">
        <div className="flight-price">
          <span className="price-amount">{flight.price != null ? formatPriceFromCurrency(flight.price, flight.currency || 'USD') : '—'}</span>
          <span className="price-label">/ person</span>
        </div>
        <a
          href={flight.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flight-book-btn"
        >
          Book Now
        </a>
      </div>
    </div>
  );
};

export default FlightCard;
