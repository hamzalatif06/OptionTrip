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

const PAGE_SIZE = 8;

const Pagination = ({ page, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const getVisible = () => {
    if (total <= 7) return pages;
    if (page <= 4) return [...pages.slice(0, 5), '…', total];
    if (page >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };
  return (
    <div className="fs-pagination">
      <button className="fs-page-btn fs-page-btn--nav" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getVisible().map((p, i) =>
        p === '…'
          ? <span key={`e-${i}`} className="fs-page-ellipsis">…</span>
          : <button key={p} className={`fs-page-btn${p === page ? ' fs-page-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="fs-page-btn fs-page-btn--nav" onClick={() => onChange(page + 1)} disabled={page === total}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

const FlightSearch = () => {
  const [flights,      setFlights]      = useState([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [searched,     setSearched]     = useState(false);
  const [lastSearch,   setLastSearch]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);

  const handleSearch = async (params) => {
    setIsLoading(true);
    setError('');
    setFlights([]);
    setSearched(true);
    setCurrentPage(1);
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
            {!isLoading && !error && flights.length > 0 && (() => {
              const totalPages = Math.ceil(flights.length / PAGE_SIZE);
              const paginated  = flights.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
              return (
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
                  {paginated.map(flight => <FlightCardGF key={flight.id} flight={flight} />)}
                  {totalPages > 1 && (
                    <Pagination page={currentPage} total={totalPages} onChange={setCurrentPage} />
                  )}
                </>
              );
            })()}
          </div>
        </section>
      )}
    </>
  );
};

export default FlightSearch;
