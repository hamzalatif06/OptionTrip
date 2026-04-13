import React, { useState, useRef } from 'react';
import FlightSearchForm from '../components/FlightSearchForm/FlightSearchForm';
import FlightCardGF     from '../components/FlightCard/FlightCardGF';
import FlightCardTP     from '../components/FlightCard/FlightCardTP';
import FlightCard       from '../components/FlightCard/FlightCard';
import FlightCardDuffel from '../components/FlightCard/FlightCardDuffel';
import ExploreDestinations from '../components/ExploreDestinations/ExploreDestinations';
import FlightFilters, { DEFAULT_FILTERS, applyFilters } from '../components/FlightFilters/FlightFilters';
import { searchFlightsDuffel, searchFlightsGoogle, searchFlightsTP, searchFlights as searchFlightsAmadeus } from '../services/flightService';
import './FlightSearch.css';

const TP_MARKER = '370056';

const buildAviasalesUrl = ({ originCode, destinationCode, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  let path = `${originCode}${fmt(departureDate)}${destinationCode}`;
  if (returnDate) path += `${destinationCode}${fmt(returnDate)}${originCode}`;
  path += String(adults || 1);
  return `https://www.aviasales.com/search/${path}?marker=${TP_MARKER}`;
};

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

const FlightSectionHeader = ({ type, count, route }) => {
  const isTop = type === 'top';
  return (
    <div className={`fs-section-header fs-section-header--${isTop ? 'top' : 'other'}`}>
      <div className="fs-section-header__left">
        <div className="fs-section-header__icon">
          {isTop ? (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div>
          <div className="fs-section-header__title">{isTop ? 'Top Flights' : 'Other Flights'}</div>
          <div className="fs-section-header__sub">
            {isTop ? `Best value & fastest — ${route}` : `More options for ${route}`}
          </div>
        </div>
      </div>
      <span className="fs-section-header__badge">{count} flight{count !== 1 ? 's' : ''}</span>
    </div>
  );
};

const SourceHeader = ({ source, count, route }) => {
  const cfg = {
    duffel: { cls: 'top',   title: 'Option Trip Flights',    sub: `Real-time fares · ${route}` },
    tp:     { cls: 'top',   title: 'Option Trip Flights',    sub: `Best available fares · ${route}` },
    amadeus:{ cls: 'other', title: 'Option Trip Flights',    sub: `Real-time fares · ${route}` },
  }[source] || {};
  return (
    <div className={`fs-section-header fs-section-header--${cfg.cls}`} style={{ marginTop: 0 }}>
      <div className="fs-section-header__left">
        <div className="fs-section-header__icon">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="fs-section-header__title">{cfg.title}</div>
          <div className="fs-section-header__sub">{cfg.sub}</div>
        </div>
      </div>
      <span className="fs-section-header__badge">{count} flight{count !== 1 ? 's' : ''}</span>
    </div>
  );
};

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

// 'duffel' | 'gf' | 'tp' | 'amadeus'
const SOURCE_NONE = null;

const FlightSearch = () => {
  const [source,        setSource]       = useState(SOURCE_NONE); // which API won
  const [duffelFlights, setDuffelFlights]= useState([]);          // Duffel
  const [topFlights,    setTopFlights]   = useState([]);          // GF top
  const [otherFlights,  setOtherFlights] = useState([]);          // GF other
  const [tpFlights,     setTpFlights]    = useState([]);          // TP
  const [amadFlights,   setAmadFlights]  = useState([]);          // Amadeus

  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [searched,     setSearched]     = useState(false);
  const [lastSearch,   setLastSearch]   = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [prefillDest,     setPrefillDest]     = useState(null);
  const [prefillOrigin,   setPrefillOrigin]   = useState(null);
  const [originFieldError,setOriginFieldError]= useState('');
  const [detectedOrigin,  setDetectedOrigin]  = useState(null); // { iata, display }
  const [filters,         setFilters]         = useState(DEFAULT_FILTERS);

  const formRef    = useRef(null);
  const exploreRef = useRef(null);

  const resetResults = () => {
    setSource(SOURCE_NONE);
    setDuffelFlights([]);
    setTopFlights([]); setOtherFlights([]);
    setTpFlights([]); setAmadFlights([]);
    setError(''); setCurrentPage(1); setFilters(DEFAULT_FILTERS);
  };

  const handleSearch = async (params) => {
    setIsLoading(true);
    setSearched(true);
    setLastSearch(params);
    resetResults();

    try {
      /* ── Stage 0: Duffel ─────────────────────────────────────── */
      let duffelResult = null;
      try {
        duffelResult = await searchFlightsDuffel({
          originCode:      params.originCode,
          destinationCode: params.destinationCode,
          departureDate:   params.departureDate,
          returnDate:      params.returnDate || null,
          adults:          params.adults,
        });
      } catch { /* fall through */ }

      if (duffelResult?.flights?.length > 0) {
        setSource('duffel');
        setDuffelFlights(duffelResult.flights);
        return;
      }

      /* ── Stage 1: Google Flights ─────────────────────────────── */
      let gfResult = null;
      try {
        gfResult = await searchFlightsGoogle({
          originCode:      params.originCode,
          destinationCode: params.destinationCode,
          departureDate:   params.departureDate,
          returnDate:      params.returnDate || null,
          adults:          params.adults,
        });
      } catch { /* fall through */ }

      const gfCount = (gfResult?.topFlights?.length || 0) + (gfResult?.otherFlights?.length || 0);

      if (gfCount >= 5) {
        setSource('gf');
        setTopFlights(gfResult.topFlights || []);
        setOtherFlights(gfResult.otherFlights || []);
        return;
      }

      /* ── Stage 2: Travelpayouts ──────────────────────────────── */
      let tpResult = null;
      try {
        tpResult = await searchFlightsTP({
          origin:      params.originCode,
          destination: params.destinationCode,
          departureAt: params.departureDate,
          returnAt:    params.returnDate || null,
          limit:       30,
        });
      } catch { /* fall through */ }

      if (tpResult?.flights?.length > 0) {
        setSource('tp');
        setTpFlights(tpResult.flights);
        return;
      }

      /* ── Stage 3: Amadeus ────────────────────────────────────── */
      let amadResult = null;
      try {
        amadResult = await searchFlightsAmadeus({
          originCode:      params.originCode,
          destinationCode: params.destinationCode,
          departureDate:   params.departureDate,
          returnDate:      params.returnDate || null,
          adults:          params.adults,
        });
      } catch { /* fall through */ }

      if (amadResult?.flights?.length > 0) {
        setSource('amadeus');
        setAmadFlights(amadResult.flights);
        return;
      }

      /* ── All sources empty — show whatever GF returned ────────── */
      setSource('gf');
      setTopFlights(gfResult?.topFlights || []);
      setOtherFlights(gfResult?.otherFlights || []);

    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreAnywhereFromForm = () => {
    // If results are showing, reset so ExploreDestinations becomes visible again
    if (searched) {
      setSearched(false);
      resetResults();
    }
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleOriginDetected = (result) => {
    setDetectedOrigin(result); // { iata, display }
  };

  const handleExploreSelect = ({ iata, city }) => {
    const dest = { code: iata, display: `${city} (${iata})` };
    setPrefillDest(dest);

    if (detectedOrigin) {
      // Origin known — pre-fill origin field and auto-search with a default date
      setPrefillOrigin({ code: detectedOrigin.iata, display: detectedOrigin.display });
      setOriginFieldError('');
      const defaultDate = getFutureDate(30);
      handleSearch({
        originCode:      detectedOrigin.iata,
        destinationCode: iata,
        departureDate:   defaultDate,
        adults:          1,
      });
    } else {
      // No origin — scroll to form and show error on origin field
      setPrefillOrigin(null);
      setOriginFieldError('Enter your departure city or allow location access to auto-search');
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  /* ── Derived data for filters ─────────────────────────────────── */
  const allRaw = source === 'duffel'
    ? duffelFlights
    : source === 'gf'
      ? [...topFlights, ...otherFlights]
      : source === 'tp'
        ? tpFlights
        : amadFlights;

  // Filters only apply to Duffel, GF, and TP; Amadeus uses a different schema
  const filterable = source !== 'amadeus';
  const filtered   = filterable ? applyFilters(allRaw, filters) : allRaw;

  const sourceNote = {
    duffel: 'Option Trip · Real-time fares · Refundable options available',
    gf:     'Option Trip · Best prices per person',
    tp:     'Option Trip · Best available fares',
    amadeus:'Option Trip · Real-time fares',
  }[source] || '';

  return (
    <>
      {/* Hero */}
      <section className="flight-hero">
        <div className="container">
          <div className="flight-hero__content text-center">
            <h1 className="mb-3">Find Your <span className="theme">Perfect Flight</span></h1>
            <p className="flight-hero__subtitle">
              Search, compare, and book flights بسهولة from trusted sources—all in one platform.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <div ref={formRef}>
        <FlightSearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          prefillDest={prefillDest}
          prefillOrigin={prefillOrigin}
          originError={originFieldError}
          onOriginErrorClear={() => setOriginFieldError('')}
          onExploreAnywhere={handleExploreAnywhereFromForm}
        />
      </div>

      {/* Explore Anywhere */}
      {!searched && (
        <div ref={exploreRef}>
          <ExploreDestinations
            onSelect={handleExploreSelect}
            onOriginDetected={handleOriginDetected}
          />
        </div>
      )}

      {/* Results */}
      {searched && (
        <section className="flight-results-section">
          <div className="container">

            {isLoading && (
              <div>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {!isLoading && error && (
              <div className="flight-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                <h3>Search failed</h3>
                <p style={{ marginBottom: 16 }}>{error}</p>
                <a href={buildAviasalesUrl(lastSearch)} target="_blank" rel="noopener noreferrer"
                  className="fsf-search-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  Search on Aviasales ↗
                </a>
              </div>
            )}

            {!isLoading && !error && allRaw.length === 0 && (
              <div className="flight-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                <h3>No flights found</h3>
                <p>
                  No results for <strong>{lastSearch?.originCode} → {lastSearch?.destinationCode}</strong> on{' '}
                  <strong>{lastSearch?.departureDate}</strong>. Try different dates.
                </p>
                <a href={buildAviasalesUrl(lastSearch)} target="_blank" rel="noopener noreferrer"
                  className="fsf-search-btn" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 16 }}>
                  Search on Aviasales ↗
                </a>
              </div>
            )}

            {!isLoading && !error && allRaw.length > 0 && (() => {
              const route      = `${lastSearch?.originCode} → ${lastSearch?.destinationCode}`;
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              const safePage   = Math.min(currentPage, Math.max(1, totalPages));

              return (
                <>
                  <div className="flight-results-header">
                    <h2 className="flight-results-title">
                      {filtered.length} flight{filtered.length !== 1 ? 's' : ''} found
                      <span className="flight-results-route"> — {route}</span>
                    </h2>
                    <p className="flight-results-note">{sourceNote}</p>
                  </div>

                  <div className="fs-results-layout">
                    {/* Filters sidebar — skip for Amadeus (different schema) */}
                    {filterable && (
                      <FlightFilters
                        flights={allRaw}
                        filters={filters}
                        onChange={f => { setFilters(f); setCurrentPage(1); }}
                      />
                    )}

                    <div className="fs-results-col">

                      {/* ── Duffel ── */}
                      {source === 'duffel' && (() => {
                        const filtDuffel = applyFilters(duffelFlights, filters);
                        const pSlice     = filtDuffel.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return (
                          <>
                            <SourceHeader source="duffel" count={duffelFlights.length} route={route} />
                            {pSlice.length === 0
                              ? <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>No flights match your filters.</p>
                              : pSlice.map(f => <FlightCardDuffel key={f.id} flight={f} />)
                            }
                          </>
                        );
                      })()}

                      {/* ── Google Flights ── */}
                      {source === 'gf' && (() => {
                        const filtTop   = applyFilters(topFlights,   filters);
                        const filtOther = applyFilters(otherFlights,  filters);
                        const allFilt   = [...filtTop, ...filtOther];
                        const pSlice    = allFilt.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        const pTop      = pSlice.filter(f => filtTop.includes(f));
                        const pOther    = pSlice.filter(f => filtOther.includes(f));
                        return (
                          <>
                            {pTop.length > 0 && (
                              <>
                                <FlightSectionHeader type="top"   count={filtTop.length}   route={route} />
                                {pTop.map(f => <FlightCardGF key={f.id} flight={f} />)}
                              </>
                            )}
                            {pOther.length > 0 && (
                              <>
                                <FlightSectionHeader type="other" count={filtOther.length} route={route} />
                                {pOther.map(f => <FlightCardGF key={f.id} flight={f} />)}
                              </>
                            )}
                            {allFilt.length === 0 && (
                              <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>
                                No flights match your filters.
                              </p>
                            )}
                          </>
                        );
                      })()}

                      {/* ── Travelpayouts ── */}
                      {source === 'tp' && (() => {
                        const filtTP  = applyFilters(tpFlights, filters);
                        const pSlice  = filtTP.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return (
                          <>
                            <SourceHeader source="tp" count={tpFlights.length} route={route} />
                            {pSlice.length === 0
                              ? <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>No flights match your filters.</p>
                              : pSlice.map(f => <FlightCardTP key={f.id} flight={f} />)
                            }
                          </>
                        );
                      })()}

                      {/* ── Amadeus ── */}
                      {source === 'amadeus' && (() => {
                        const pSlice = amadFlights.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return (
                          <>
                            <SourceHeader source="amadeus" count={amadFlights.length} route={route} />
                            {pSlice.map((f, i) => <FlightCard key={f.id || i} flight={f} />)}
                          </>
                        );
                      })()}

                      {totalPages > 1 && filtered.length > 0 && (
                        <Pagination page={safePage} total={totalPages} onChange={setCurrentPage} />
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}
    </>
  );
};

/** Return YYYY-MM-DD for N days from today */
function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default FlightSearch;
