import React, { useState } from 'react';
import FlightSearchForm from '../components/FlightSearchForm/FlightSearchForm';
import FlightCard from '../components/FlightCard/FlightCard';
import { searchFlights } from '../services/flightService';
import './FlightSearch.css';

const FlightSearch = () => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [lastSearch, setLastSearch] = useState(null);

  const handleSearch = async (params) => {
    setIsLoading(true);
    setError('');
    setSearched(true);
    setLastSearch(params);
    try {
      const result = await searchFlights(params);
      setFlights(result.flights || []);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setFlights([]);
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
              Search real-time flights powered by Amadeus. Compare prices, pick your seats, and book instantly.
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

            {/* Loading skeleton */}
            {isLoading && (
              <div className="flight-loading">
                <div className="flight-loading__spinner"></div>
                <p>Searching for the best flights…</p>
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div className="flight-error">
                <i className="fa fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && flights.length === 0 && (
              <div className="flight-empty">
                <i className="fa fa-plane-slash flight-empty__icon"></i>
                <h3>No flights found</h3>
                <p>
                  No flights were found for{' '}
                  <strong>{lastSearch?.originCode} → {lastSearch?.destinationCode}</strong>{' '}
                  on <strong>{lastSearch?.departureDate}</strong>.
                  <br />Try different dates or nearby airports.
                </p>
              </div>
            )}

            {/* Results list */}
            {!isLoading && !error && flights.length > 0 && (
              <>
                <div className="flight-results-header">
                  <h2 className="flight-results-title">
                    {flights.length} flight{flights.length !== 1 ? 's' : ''} found
                    <span className="flight-results-route">
                      {' '}— {lastSearch?.originCode} → {lastSearch?.destinationCode}
                    </span>
                  </h2>
                  <p className="flight-results-note">Prices per person · Click "Book Now" to complete your booking</p>
                </div>
                {flights.map(flight => (
                  <FlightCard key={flight.id} flight={flight} />
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
