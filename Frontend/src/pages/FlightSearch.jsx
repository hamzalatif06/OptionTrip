import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  // Aviasales format: {FROM}{DDMM}{TO}[{DDMM_RETURN}]{pax}
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  const pax = String(adults || 1);
  const returnPart = returnDate ? fmt(returnDate) : '';
  return `https://www.aviasales.com/search/${originCode}${fmt(departureDate)}${destinationCode}${returnPart}${pax}?marker=${TP_MARKER}`;
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

const EXPLORE_MODAL_LIMIT = 8;

const formatModalTime = (value) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatModalPrice = (currency, amount) => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return null;
  const symbol = currency === 'USD' ? '$' : `${currency || ''} `;
  return `${symbol}${Math.round(parsed).toLocaleString()}`;
};

const normalizeExploreFlight = (flight, source, fallbackOrigin, fallbackDestination) => {
  if (source === 'amadeus') {
    const outbound = flight.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound.segments.length - 1];
    return {
      id: flight.id || `${source}-${firstSeg?.id || Math.random()}`,
      airline: flight.validatingCarrier || firstSeg?.carrierCode || 'Airline',
      origin: firstSeg?.departure?.iataCode || fallbackOrigin,
      destination: lastSeg?.arrival?.iataCode || fallbackDestination,
      departureTime: firstSeg?.departure?.time || null,
      arrivalTime: lastSeg?.arrival?.time || null,
      duration: outbound?.totalDuration || 'N/A',
      stops: Number.isFinite(flight.numberOfStops)
        ? flight.numberOfStops
        : Math.max((outbound?.segments?.length || 1) - 1, 0),
      price: flight.price,
      currency: flight.currency || 'USD',
      bookingUrl: flight.bookingUrl || null,
    };
  }

  return {
    id: flight.id || `${source}-${flight.flightNumber || Math.random()}`,
    airline: flight.airline || 'Airline',
    origin: flight.origin || fallbackOrigin,
    destination: flight.destination || fallbackDestination,
    departureTime: flight.departureTime || flight.departureAt || null,
    arrivalTime: flight.arrivalTime || null,
    duration: flight.duration || 'N/A',
    stops: Number.isFinite(flight.stops) ? flight.stops : 0,
    price: flight.price,
    currency: flight.currency || 'USD',
    bookingUrl: flight.bookingUrl || null,
  };
};

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
  const [filters,             setFilters]            = useState(DEFAULT_FILTERS);
  const [exploreTripType,     setExploreTripType]     = useState('one-way');
  const [exploreReturnDate,   setExploreReturnDate]   = useState('');
  const [exploreModal,        setExploreModal]        = useState({
    isOpen: false,
    isLoading: false,
    error: '',
    destination: null,
    originDisplay: '',
    tickets: [],
    source: '',
  });

  const navigate = useNavigate();
  const formRef    = useRef(null);
  const exploreRef = useRef(null);

  useEffect(() => {
    if (exploreModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [exploreModal.isOpen]);

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

  const handleExploreAnywhereFromForm = (tripContext) => {
    const originCode = tripContext?.originCode || '';
    const originDisplay = tripContext?.originDisplay || originCode;

    if (!originCode || !tripContext?.departureDate) {
      setOriginFieldError('Select a departure airport or allow location access to use Explore Anywhere');
      return;
    }

    const query = new URLSearchParams({
      origin: originCode,
      departureDate: tripContext.departureDate,
      adults: String(tripContext.adults || 1),
    });

    if (tripContext.returnDate) query.set('returnDate', tripContext.returnDate);
    if (originDisplay) query.set('originDisplay', originDisplay);

    navigate(`/flights/explore?${query.toString()}`);
  };

  const handleOriginDetected = (result) => {
    setDetectedOrigin(result); // { iata, display }
  };

  const closeExploreModal = () => {
    setExploreModal(prev => ({ ...prev, isOpen: false }));
    setExploreTripType('one-way');
    setExploreReturnDate('');
  };

  const fetchExploreTickets = async ({ originCode, destinationCode, departureDate, returnDate = null, adults }) => {
    let duffelResult = null;
    try {
      duffelResult = await searchFlightsDuffel({
        originCode,
        destinationCode,
        departureDate,
        returnDate,
        adults,
      });
    } catch { /* continue fallback chain */ }
    if (duffelResult?.flights?.length) return { source: 'duffel', flights: duffelResult.flights };

    let gfResult = null;
    try {
      gfResult = await searchFlightsGoogle({
        originCode,
        destinationCode,
        departureDate,
        returnDate,
        adults,
      });
    } catch { /* continue fallback chain */ }
    const gfFlights = [...(gfResult?.topFlights || []), ...(gfResult?.otherFlights || [])];
    if (gfFlights.length) return { source: 'gf', flights: gfFlights };

    let tpResult = null;
    try {
      tpResult = await searchFlightsTP({
        origin:      originCode,
        destination: destinationCode,
        departureAt: departureDate,
        returnAt:    returnDate || null,
        limit:       20,
      });
    } catch { /* continue fallback chain */ }
    if (tpResult?.flights?.length) return { source: 'tp', flights: tpResult.flights };

    let amadeusResult = null;
    try {
      amadeusResult = await searchFlightsAmadeus({
        originCode,
        destinationCode,
        departureDate,
        returnDate,
        adults,
      });
    } catch { /* no more fallback */ }
    if (amadeusResult?.flights?.length) return { source: 'amadeus', flights: amadeusResult.flights };

    return { source: 'none', flights: [] };
  };

  const openExploreTicketsModal = async ({ destination, returnDate = null }) => {
    const originCode = detectedOrigin?.iata || '';
    const originDisplay = detectedOrigin?.display || '';

    setExploreModal({
      isOpen: true,
      isLoading: true,
      error: '',
      destination,
      originDisplay,
      tickets: [],
      source: '',
    });

    if (!originCode) {
      setExploreModal(prev => ({
        ...prev,
        isLoading: false,
        error: 'Please set your departure city first so we can show available tickets.',
      }));
      return;
    }

    const departureDate = getFutureDate(30);

    try {
      const result = await fetchExploreTickets({
        originCode,
        destinationCode: destination.iata,
        departureDate,
        returnDate,
        adults: 1,
      });

      const tickets = (result.flights || [])
        .slice(0, EXPLORE_MODAL_LIMIT)
        .map(f => normalizeExploreFlight(f, result.source, originCode, destination.iata));

      setExploreModal(prev => ({
        ...prev,
        isLoading: false,
        tickets,
        source: result.source,
        error: tickets.length ? '' : 'No tickets found for this destination right now. Try another one or a different date.',
      }));
    } catch (err) {
      setExploreModal(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Unable to load available tickets right now.',
      }));
    }
  };

  const handleExploreTripTypeChange = (newType) => {
    setExploreTripType(newType);
    if (newType === 'one-way') {
      setExploreReturnDate('');
      if (exploreModal.destination) {
        openExploreTicketsModal({ destination: exploreModal.destination, returnDate: null });
      }
    }
    // If switching to round-trip, wait for user to pick return date
  };

  const handleExploreReturnDateChange = (date) => {
    setExploreReturnDate(date);
    if (date && exploreModal.destination) {
      openExploreTicketsModal({ destination: exploreModal.destination, returnDate: date });
    }
  };

  const handleModalGoToSearch = () => {
    closeExploreModal();
    setOriginFieldError('Enter your departure city or allow location access to view available tickets');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleExploreSelect = ({ iata, city }) => {
    const dest = { code: iata, display: `${city} (${iata})` };
    setPrefillDest(dest);
    setPrefillOrigin(detectedOrigin ? { code: detectedOrigin.iata, display: detectedOrigin.display } : null);
    setOriginFieldError('');

    openExploreTicketsModal({ destination: { iata, city } });
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

      {exploreModal.isOpen && (
        <div className="explore-ticket-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeExploreModal(); }}>
          <div className="explore-ticket-modal" role="dialog" aria-modal="true" aria-label="Available tickets">
            <button className="explore-ticket-modal__close" onClick={closeExploreModal} aria-label="Close ticket modal">
              ×
            </button>

            <div className="explore-ticket-modal__head">
              <h3>
                Available Tickets: {exploreModal.destination?.city} ({exploreModal.destination?.iata})
              </h3>
              <p>
                {exploreModal.originDisplay
                  ? `From ${exploreModal.originDisplay} · ${EXPLORE_MODAL_LIMIT} best options`
                  : 'Set departure city to load available tickets'}
              </p>

              {/* Trip type toggle */}
              <div className="explore-trip-type-row" style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className={`explore-trip-type-btn${exploreTripType === 'one-way' ? ' explore-trip-type-btn--active' : ''}`}
                  onClick={() => handleExploreTripTypeChange('one-way')}
                >
                  One Way
                </button>
                <button
                  className={`explore-trip-type-btn${exploreTripType === 'round-trip' ? ' explore-trip-type-btn--active' : ''}`}
                  onClick={() => handleExploreTripTypeChange('round-trip')}
                >
                  Round Trip
                </button>
                {exploreTripType === 'round-trip' && (
                  <div className="explore-return-date-picker" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label htmlFor="fs-explore-return-date" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Return:</label>
                    <input
                      id="fs-explore-return-date"
                      type="date"
                      value={exploreReturnDate}
                      min={getFutureDate(31)}
                      onChange={(e) => handleExploreReturnDateChange(e.target.value)}
                      className="explore-return-date-input"
                    />
                  </div>
                )}
              </div>
            </div>

            {exploreModal.isLoading && (
              <div className="explore-ticket-modal__state">Loading available tickets...</div>
            )}

            {!exploreModal.isLoading && exploreModal.error && (
              <div className="explore-ticket-modal__state explore-ticket-modal__state--error">
                <p>{exploreModal.error}</p>
                {!exploreModal.originDisplay && (
                  <button className="explore-ticket-modal__action" onClick={handleModalGoToSearch}>
                    Set departure city
                  </button>
                )}
              </div>
            )}

            {!exploreModal.isLoading && !exploreModal.error && exploreModal.tickets.length > 0 && (
              <>
                <div className="explore-ticket-modal__meta">
                  <span>{exploreModal.tickets.length} ticket{exploreModal.tickets.length !== 1 ? 's' : ''}</span>
                  <span>Source: {exploreModal.source}</span>
                </div>

                <div className="explore-ticket-modal__list">
                  {exploreModal.tickets.map((ticket) => {
                    const price = formatModalPrice(ticket.currency, ticket.price);
                    const stopsText = ticket.stops === 0
                      ? 'Direct'
                      : `${ticket.stops} stop${ticket.stops > 1 ? 's' : ''}`;

                    return (
                      <div className="explore-ticket-item" key={ticket.id}>
                        <div className="explore-ticket-item__top">
                          <strong>{ticket.airline}</strong>
                          <span className="explore-ticket-item__stops">{stopsText}</span>
                        </div>

                        <div className="explore-ticket-item__route">
                          <span>{ticket.origin} {formatModalTime(ticket.departureTime)}</span>
                          <span>{ticket.duration}</span>
                          <span>{ticket.destination} {formatModalTime(ticket.arrivalTime)}</span>
                        </div>

                        <div className="explore-ticket-item__bottom">
                          <span className="explore-ticket-item__price">{price || 'Price unavailable'}</span>
                          {ticket.bookingUrl ? (
                            <a href={ticket.bookingUrl} target="_blank" rel="noopener noreferrer" className="explore-ticket-item__book">
                              Book now
                            </a>
                          ) : (
                            <span className="explore-ticket-item__book explore-ticket-item__book--disabled">No booking link</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
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
