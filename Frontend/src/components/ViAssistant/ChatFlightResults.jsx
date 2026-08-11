import React from 'react';
import { trackBookingClick } from '../../services/analyticsService';
import { logActivity } from '../../services/activityService';
import './ChatFlightResults.css';

const SOURCE_LABELS = {
  duffel: 'Duffel',
  google_flights: 'Google',
  amadeus: 'Amadeus',
  travelpayouts: 'TP'
};

const STOP_LABEL = (stops) => (stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`);

/**
 * Compact inline flight result cards for Vi's chat bubble. Deliberately NOT
 * a reuse of the four page-level FlightCard* variants (built for ≥360-400px
 * grid columns and visually inconsistent with each other) — this is one
 * small, unified row design sized for the ~300-375px chat bubble width.
 */
const ChatFlightResults = ({ results, providerStatus, destination }) => {
  if (!results?.length) return null;

  const failedProviders = Object.entries(providerStatus || {}).filter(([, status]) => status !== 'ok');
  const totalProviders = Object.keys(providerStatus || {}).length;

  const handleBook = (flight) => {
    trackBookingClick(flight.source, 'flight', destination || flight.destination, flight.price);
    logActivity({
      type: 'flight',
      action: 'clicked',
      title: `Book Now — flight to ${destination || flight.destination}`,
      metadata: { provider: flight.source, destination: destination || flight.destination, price: flight.price, via: 'chat' }
    });
  };

  return (
    <div className="cfr-root">
      {results.map((flight) => (
        <a
          key={flight.id}
          className="cfr-row"
          href={flight.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBook(flight)}
        >
          <div className="cfr-row__top">
            <span className="cfr-row__airline">{flight.airline || 'Airline'}{flight.flightNumber ? ` · ${flight.flightNumber}` : ''}</span>
            <span className="cfr-row__source">{SOURCE_LABELS[flight.source] || flight.source}</span>
          </div>
          <div className="cfr-row__mid">
            <span className="cfr-row__route">
              {flight.origin} {flight.departureTime || ''} → {flight.destination} {flight.arrivalTime || ''}
            </span>
            <span className="cfr-row__stops">{STOP_LABEL(flight.stops)}</span>
          </div>
          <div className="cfr-row__bottom">
            <span className="cfr-row__duration">{flight.duration || ''}</span>
            <span className="cfr-row__price-wrap">
              <span className="cfr-row__price">{flight.currency === 'USD' ? '$' : `${flight.currency} `}{flight.price}</span>
              <span className="cfr-row__book">Book →</span>
            </span>
          </div>
        </a>
      ))}

      {failedProviders.length > 0 && (
        <p className="cfr-footnote">
          Showing results from {totalProviders - failedProviders.length} of {totalProviders} sources
        </p>
      )}
    </div>
  );
};

export default ChatFlightResults;
