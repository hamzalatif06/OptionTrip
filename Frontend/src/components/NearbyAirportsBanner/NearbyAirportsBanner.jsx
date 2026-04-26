import React from 'react';
import './NearbyAirportsBanner.css';

/**
 * Shown in the empty-results state when no flights were found and the user
 * has NOT yet tried the "include nearby airports" option.
 *
 * Props:
 *  lastSearch  — the params object from the last search
 *  onRetry     — called with { ...lastSearch, includeNearby: true }
 */
const NearbyAirportsBanner = ({ lastSearch, onRetry }) => {
  if (!lastSearch) return null;

  const { originCode, destinationCode, departureDate } = lastSearch;

  return (
    <div className="nab-wrap">
      <div className="nab-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <circle cx="12" cy="12" r="10" stroke="#029e9d" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="3"  fill="#029e9d"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#029e9d" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#029e9d" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>

      <div className="nab-body">
        <h3 className="nab-title">No flights found for this route</h3>
        <p className="nab-desc">
          We couldn't find direct flights from <strong>{originCode}</strong> to{' '}
          <strong>{destinationCode}</strong>
          {departureDate ? ` on ${departureDate}` : ''}.
          Try expanding the search to include nearby airports within 250 km — this often
          uncovers cheaper or more frequent options.
        </p>

        <button
          className="nab-btn"
          onClick={() => onRetry({ ...lastSearch, includeNearby: true })}
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Search with Nearby Airports
        </button>
      </div>
    </div>
  );
};

export default NearbyAirportsBanner;
