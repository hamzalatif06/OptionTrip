import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FlightCardDuffel from '../components/FlightCard/FlightCardDuffel';
import { EXPLORE_DESTINATIONS, getExploreImageUrl } from '../data/exploreDestinations';
import { exploreDestinations, searchAirports, searchFlightsDuffel } from '../services/flightService';
import { getExploreDestinationImageId } from '../utils/exploreDestinationMedia';
import './FlightSearch.css';
import './ExploreAnywhereDetailPage.css';

const formatPriceBand = (price) => {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return null;
  const lower = Math.max(100, Math.floor(numericPrice / 100) * 100);
  const upper = lower + 200;
  return `$${lower} - $${upper}`;
};

const INITIAL_VISIBLE_CARDS = 12;
const LOAD_MORE_STEP = 12;
const FALLBACK_DESTINATION_PHOTO = 'photo-1469474968028-56623f02e42e';

const getDestinationImageUrl = ({ iata, city, country, photo }) => {
  if (photo && photo !== FALLBACK_DESTINATION_PHOTO) {
    return getExploreImageUrl(photo);
  }

  const photoId = getExploreDestinationImageId({ iata, city, country });
  return getExploreImageUrl(photoId);
};

const normalizeDuffelFlight = (flight, fallbackOrigin, fallbackDestination) => {
  const departureTime = flight.departureTime || flight.departureAt || null;
  const arrivalTime = flight.arrivalTime || null;
  return {
    ...flight,
    origin: flight.origin || fallbackOrigin,
    destination: flight.destination || fallbackDestination,
    departureTime,
    arrivalTime,
    bookingUrl: flight.bookingUrl || flight.url || null,
  };
};

const ExploreAnywhereDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [priceMap, setPriceMap] = useState({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [visibleCards, setVisibleCards] = useState(INITIAL_VISIBLE_CARDS);
  const [placeNamesByIata, setPlaceNamesByIata] = useState({});
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [tickets, setTickets] = useState([]);
  const lookedUpIatasRef = useRef(new Set());
  const inFlightIatasRef = useRef(new Set());

  const origin = searchParams.get('origin') || '';
  const originDisplay = searchParams.get('originDisplay') || origin;
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = Number(searchParams.get('adults') || 1);

  const allDestinations = useMemo(() => {
    const staticMetaByIata = EXPLORE_DESTINATIONS.reduce((acc, item) => {
      acc[item.iata] = item;
      return acc;
    }, {});

    const mergedIatas = new Set([
      ...Object.keys(priceMap || {}),
      ...EXPLORE_DESTINATIONS.map(item => item.iata),
    ]);

    return Array.from(mergedIatas).map((iata) => {
      const api = priceMap?.[iata] || {};
      const meta = staticMetaByIata[iata] || {};
      const resolved = placeNamesByIata[iata] || {};
      const city = api.city || meta.city || resolved.city || resolved.name || iata;
      const country = api.country || meta.country || resolved.country || 'Destination';

      return {
        iata,
        city,
        country,
        photo: meta.photo || FALLBACK_DESTINATION_PHOTO,
        price: Number(api.price),
        isNameResolved: city.toUpperCase() !== iata,
      };
    }).sort((a, b) => {
      const aHasPrice = Number.isFinite(a.price);
      const bHasPrice = Number.isFinite(b.price);
      if (aHasPrice && bHasPrice) return a.price - b.price;
      if (aHasPrice) return -1;
      if (bHasPrice) return 1;
      return a.city.localeCompare(b.city);
    });
  }, [priceMap, placeNamesByIata]);

  const visibleDestinations = useMemo(
    () => allDestinations.slice(0, visibleCards),
    [allDestinations, visibleCards]
  );

  useEffect(() => {
    if (!origin) return undefined;

    let mounted = true;
    setIsBootstrapping(true);
    setIsLoadingPrices(true);
    exploreDestinations(origin).then((prices) => {
      if (!mounted) return;
      setPriceMap(prices || {});
      setIsLoadingPrices(false);
    }).catch(() => {
      if (!mounted) return;
      setPriceMap({});
      setIsLoadingPrices(false);
    });

    return () => { mounted = false; };
  }, [origin]);

  useEffect(() => {
    setVisibleCards(INITIAL_VISIBLE_CARDS);
    setIsBootstrapping(true);
  }, [origin, departureDate]);

  useEffect(() => {
    const needsLookup = visibleDestinations
      .filter((destination) => {
        const label = String(destination.city || '').toUpperCase();
        const iata = destination.iata;
        return (
          label === iata
          && !placeNamesByIata[iata]
          && !lookedUpIatasRef.current.has(iata)
          && !inFlightIatasRef.current.has(iata)
        );
      })
      .map((destination) => destination.iata);

    if (needsLookup.length === 0) return;

    needsLookup.forEach((iata) => inFlightIatasRef.current.add(iata));

    let mounted = true;
    Promise.all(
      needsLookup.map(async (iata) => {
        try {
          const matches = await searchAirports(iata);
          const candidate = (matches || []).find((item) => item?.iataCode === iata) || matches?.[0];
          if (!candidate) return [iata, null];
          return [
            iata,
            {
              city: candidate.cityName || candidate.name || iata,
              name: candidate.name || candidate.cityName || iata,
              country: candidate.countryName || 'Destination',
            },
          ];
        } catch {
          return [iata, null];
        }
      })
    ).then((entries) => {
      if (!mounted) return;

      setPlaceNamesByIata((prev) => {
        const next = { ...prev };
        for (const [iata, resolved] of entries) {
          if (resolved) next[iata] = resolved;
          lookedUpIatasRef.current.add(iata);
          inFlightIatasRef.current.delete(iata);
        }
        return next;
      });
      setIsBootstrapping(false);
    });

    return () => {
      mounted = false;
    };
  }, [visibleDestinations, placeNamesByIata]);

  useEffect(() => {
    if (!isLoadingPrices && visibleDestinations.length > 0 && isBootstrapping) {
      const unresolvedVisible = visibleDestinations.some((destination) => {
        const label = String(destination.city || '').toUpperCase();
        return label === destination.iata;
      });

      if (!unresolvedVisible) {
        setIsBootstrapping(false);
      }
    }
  }, [isLoadingPrices, visibleDestinations, isBootstrapping]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleCardClick = async (destination) => {
    if (!origin || !departureDate) return;

    setSelectedDestination(destination);
    setIsModalOpen(true);
    setIsLoadingTickets(true);
    setTicketError('');
    setTickets([]);

    try {
      const response = await searchFlightsDuffel({
        originCode: origin,
        destinationCode: destination.iata,
        departureDate,
        returnDate: returnDate || null,
        adults,
      });

      const normalized = (response?.flights || []).map((flight) =>
        normalizeDuffelFlight(flight, origin, destination.iata)
      );

      setTickets(normalized);
      if (normalized.length === 0) {
        setTicketError('No real-time Duffel tickets found for this route.');
      }
    } catch (error) {
      setTicketError(error.message || 'Failed to load real-time tickets.');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDestination(null);
    setTickets([]);
    setTicketError('');
    setIsLoadingTickets(false);
  };

  const handleViewMore = () => {
    setVisibleCards((prev) => Math.min(prev + LOAD_MORE_STEP, allDestinations.length));
  };

  const isPageLoading = isLoadingPrices || isBootstrapping;

  return (
    <div className="explore-detail-page">
      <section className="explore-detail-hero">
        <div className="container">
          <div className="explore-detail-hero__content">
            <div>
              <p className="explore-detail-hero__eyebrow">Explore Anywhere</p>
              <h1>Pick a destination and compare fares instantly</h1>
              <p className="explore-detail-hero__sub">
                {originDisplay ? `From ${originDisplay}` : 'Choose a departure airport first'}
                {departureDate ? ` · ${departureDate}` : ''}
                {adults ? ` · ${adults} adult${adults !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <button className="explore-detail-hero__back" onClick={() => navigate('/flights')}>
              Back to flights
            </button>
          </div>
        </div>
      </section>

      <section className="flight-results-section explore-detail-section">
        <div className="container">
          {!origin || !departureDate ? (
            <div className="explore-detail-empty">
              <h2>Complete the search form first</h2>
              <p>Enter a departure airport, choose a date, and then open Explore Anywhere again.</p>
              <button className="explore-detail-empty__btn" onClick={() => navigate('/flights')}>
                Go back
              </button>
            </div>
          ) : (
            <>
              {isPageLoading ? (
                <div className="explore-skeleton-grid" aria-busy="true" aria-live="polite">
                  {Array.from({ length: INITIAL_VISIBLE_CARDS }).map((_, index) => (
                    <div key={index} className="fcdf explore-flight-card explore-flight-card--skeleton">
                      <div className="fcdf__top explore-flight-card__top">
                        <div className="fcdf__legs explore-flight-card__legs explore-flight-card__legs--skeleton">
                          <div className="explore-skeleton-card__media pulse" />
                          <div className="explore-skeleton-card__body">
                            <div className="explore-skeleton-card__line explore-skeleton-card__line--title pulse" />
                            <div className="explore-skeleton-card__line pulse" />
                            <div className="explore-skeleton-card__line explore-skeleton-card__line--short pulse" />
                          </div>
                        </div>

                        <div className="fcdf__price-panel explore-flight-card__price-panel explore-flight-card__price-panel--skeleton">
                          <button className="fcdf__wishlist" aria-label="Loading">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          <div className="fcdf__price-row">
                            <span className="fcdf__price-from">from</span>
                            <span className="fcdf__price-amount explore-skeleton-card__price-line pulse" />
                            <span className="fcdf__price-per">/ trip</span>
                          </div>

                          <div className="fcdf__conditions">
                            <span className="explore-skeleton-card__pill pulse" />
                          </div>

                          <button type="button" className="fcdf__select-btn explore-skeleton-card__btn" disabled aria-hidden="true">
                            <span className="explore-skeleton-card__btn-text pulse" />
                          </button>

                          <button type="button" className="fcdf__details-btn explore-skeleton-card__details" disabled aria-hidden="true">
                            <span className="explore-skeleton-card__details-text pulse" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="explore-anywhere-cards">
                {visibleDestinations.map((destination) => {
                  const priceBand = formatPriceBand(priceMap[destination.iata]?.price);
                  const displayPrice = priceBand || (isLoadingPrices ? 'Loading fare...' : 'Price unavailable');
                  const displayCity = destination.isNameResolved ? destination.city : 'Loading destination...';
                  const displayCountry = destination.isNameResolved
                    ? `${destination.country} · ${destination.iata}`
                    : destination.iata;

                  return (
                    <div
                      key={destination.iata}
                      className="fcdf explore-flight-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCardClick(destination)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleCardClick(destination);
                        }
                      }}
                    >
                      <div className="fcdf__top explore-flight-card__top">
                        <div className="fcdf__legs explore-flight-card__legs">
                          <div className="explore-flight-card__media">
                            <img
                              src={getDestinationImageUrl(destination)}
                              alt={destination.isNameResolved ? destination.city : destination.iata}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = getExploreImageUrl(getExploreDestinationImageId(destination));
                              }}
                            />
                          </div>
                          <div className="explore-flight-card__body">
                            <div className="fcdf__airline-label explore-flight-card__label">
                              <span className="fcdf__airline-name">{displayCity}</span>
                              <span className="fcdf__flight-num">{displayCountry}</span>
                            </div>
                            <div className="explore-flight-card__route">
                              <span className="explore-flight-card__route-from">{originDisplay}</span>
                              <span className="explore-flight-card__route-arrow">→</span>
                              <span className="explore-flight-card__route-to">{destination.iata}</span>
                            </div>
                            <div className="explore-flight-card__hint">
                              {isLoadingPrices ? 'Loading Travelpayouts fares...' : 'Travelpayouts prices available'}
                            </div>
                          </div>
                        </div>

                        <div className="fcdf__price-panel explore-flight-card__price-panel">
                          <button className="fcdf__wishlist" aria-label="Save">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          <div className="fcdf__price-row">
                            <span className="fcdf__price-from">from</span>
                            <span className="fcdf__price-amount">{displayPrice}</span>
                            <span className="fcdf__price-per">/ trip</span>
                          </div>

                          <div className="fcdf__conditions">
                            <span className="fc-badge fc-badge--direct">Travelpayouts</span>
                          </div>

                          <button type="button" className="fcdf__select-btn">
                            View Tickets <span className="fcdf__btn-arrow">→</span>
                          </button>

                          <button type="button" className="fcdf__details-btn">
                            ▾ View details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {!isPageLoading && allDestinations.length > visibleDestinations.length && (
                <div className="explore-anywhere-view-more-wrap">
                  <button type="button" className="explore-anywhere-view-more" onClick={handleViewMore}>
                    View more destinations
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {isModalOpen && selectedDestination && (
        <div className="explore-ticket-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="explore-ticket-modal">
            <button className="explore-ticket-modal__close" onClick={closeModal} aria-label="Close ticket modal">×</button>

            <div className="explore-ticket-modal__head">
              <h3>Real-time tickets for {selectedDestination.city}</h3>
              <p>{originDisplay} → {selectedDestination.iata} · {departureDate}{returnDate ? ` · return ${returnDate}` : ''}</p>
            </div>

            {isLoadingTickets && <div className="explore-ticket-modal__state">Loading real-time tickets...</div>}

            {!isLoadingTickets && ticketError && (
              <div className="explore-ticket-modal__state explore-ticket-modal__state--error">
                <p>{ticketError}</p>
              </div>
            )}

            {!isLoadingTickets && !ticketError && tickets.length > 0 && (
              <div className="explore-ticket-modal__cards">
                {tickets.map((flight) => (
                  <FlightCardDuffel key={flight.id} flight={flight} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreAnywhereDetailPage;
