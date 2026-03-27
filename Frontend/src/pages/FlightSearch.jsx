import React, { useState } from 'react';
import FlightSearchForm from '../components/FlightSearchForm/FlightSearchForm';
import FlightCardGF from '../components/FlightCard/FlightCardGF';
import { searchFlightsGoogle } from '../services/flightService';
import './FlightSearch.css';

const TP_MARKER = '370056';

const buildAviasalesUrl = ({ originCode, destinationCode, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  let path = `${originCode}${fmt(departureDate)}${destinationCode}`;
  if (returnDate) path += `${destinationCode}${fmt(returnDate)}${originCode}`;
  path += String(adults || 1);
  return `https://www.aviasales.com/search/${path}?marker=${TP_MARKER}`;
};

// Skeleton card shown while loading
const SkeletonCard = () => (
  <div className="fcgf-skeleton">
    <div className="fcgf-skeleton__logo pulse" />
    <div className="fcgf-skeleton__body">
      <div className="fcgf-skeleton__line pulse" />
      <div className="fcgf-skeleton__line fcgf-skeleton__line--short pulse" />
    </div>
    <div className="fcgf-skeleton__price pulse" />
  </div>
);

const FlightSearch = () => {
  const [flights,    setFlights]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [searched,   setSearched]   = useState(false);
  const [lastSearch, setLastSearch] = useState(null);

  const handleSearch = async (params) => {
    setIsLoading(true);
    setError('');
    setFlights([]);
    setSearched(true);
    setLastSearch(params);
    try {
      const result = await searchFlightsGoogle({
        originCode:      params.originCode,
        destinationCode: params.destinationCode,
        departureDate:   params.departureDate,
        returnDate:      params.returnDate || null,
        adults:          params.adults,
      });
      setFlights(result.flights || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="flight-hero">
        <div className="container">
          <div className="flight-hero__content text-center">
            <h4 className="mb-2 theme1">Search & Compare</h4>
            <h1 className="mb-3">Find Your <span className="theme">Perfect Flight</span></h1>
            <p className="flight-hero__subtitle">
              Real-time flights from Google Flights. Compare prices and book via Aviasales — your Travelpayouts affiliate.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Results */}
      {searched && (
        <section className="flight-results-section">
          <div className="container">

            {/* Loading skeletons */}
            {isLoading && (
              <div>
                <div className="flight-loading">
                  <div className="flight-loading__spinner" />
                  <p>Searching real-time flights…</p>
                </div>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div className="flight-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                <h3>Search failed</h3>
                <p style={{ marginBottom: 16 }}>{error}</p>
                <a
                  href={buildAviasalesUrl(lastSearch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fsf-search-btn"
                  style={{ textDecoration: 'none', display: 'inline-flex' }}
                >
                  Search on Aviasales ↗
                </a>
              </div>
            )}

            {/* No results */}
            {!isLoading && !error && flights.length === 0 && (
              <div className="flight-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                <h3>No flights found</h3>
                <p>
                  No results for <strong>{lastSearch?.originCode} → {lastSearch?.destinationCode}</strong> on{' '}
                  <strong>{lastSearch?.departureDate}</strong>. Try different dates.
                </p>
                <a
                  href={buildAviasalesUrl(lastSearch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fsf-search-btn"
                  style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 16 }}
                >
                  Search on Aviasales ↗
                </a>
              </div>
            )}

            {/* Results */}
            {!isLoading && !error && flights.length > 0 && (
              <>
                <div className="flight-results-header">
                  <h2 className="flight-results-title">
                    {flights.length} flight{flights.length !== 1 ? 's' : ''} found
                    <span className="flight-results-route">
                      {' '}— {lastSearch?.originCode} → {lastSearch?.destinationCode}
                    </span>
                  </h2>
                  <p className="flight-results-note">
                    Prices per person · Powered by Google Flights · Book via Aviasales (affiliate)
                  </p>
                </div>
                {flights.map(flight => (
                  <FlightCardGF key={flight.id} flight={flight} />
                ))}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default FlightSearch;
