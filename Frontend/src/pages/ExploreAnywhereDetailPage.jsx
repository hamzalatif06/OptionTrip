import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FlightCardDuffel from '../components/FlightCard/FlightCardDuffel';
import { EXPLORE_DESTINATIONS } from '../data/exploreDestinations';
import { exploreDestinations, searchAirports, searchFlightsDuffel } from '../services/flightService';
import { getDestinationFallbackImage, getPlaceImagesForMultiplePlaces } from '../utils/destinationImages';
import useCurrency from '../hooks/useCurrency';
import PageMeta from '../hooks/usePageMeta';
import { useAuth } from '../contexts/AuthContext';
import { getAccessToken } from '../services/authService';
import { getReviews, createReview, deleteReview } from '../services/reviewService';
import './FlightSearch.css';
import './ExploreAnywhereDetailPage.css';

const INITIAL_VISIBLE_CARDS = 12;
const LOAD_MORE_STEP = 12;

const DESTINATION_TAGS = {
  dubai: 'luxury',
  bangkok: 'food',
  london: 'luxury',
  paris: 'luxury',
  'new york': 'travel',
  tokyo: 'food',
  singapore: 'luxury',
  istanbul: 'travel',
  rome: 'travel',
  barcelona: 'travel',
  sydney: 'nature',
  bali: 'nature',
  'kuala lumpur': 'travel',
  maldives: 'nature',
  seoul: 'food',
  athens: 'travel',
  amsterdam: 'travel',
  cairo: 'travel',
  'são paulo': 'travel',
  'cape town': 'nature',
  lahore: 'food',
  karachi: 'food',
  skardu: 'hiking',
  quetta: 'travel',
  tashkent: 'travel',
  multan: 'travel',
  riyadh: 'luxury',
  almaty: 'nature',
  sukkur: 'travel',
};

const getDestinationTag = (city) => {
  const normalized = String(city || '').trim().toLowerCase();
  return DESTINATION_TAGS[normalized] || 'travel';
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

const StarRating = ({ value, onChange, size = 20 }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <svg
        key={n}
        width={size} height={size} viewBox="0 0 24 24"
        fill={n <= value ? '#f59e0b' : 'none'}
        stroke={n <= value ? '#f59e0b' : '#94a3b8'}
        strokeWidth="1.5"
        style={{ cursor: onChange ? 'pointer' : 'default' }}
        onClick={() => onChange?.(n)}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const ExploreAnywhereDetailPage = () => {
  const { formatPrice } = useCurrency();
  const { isAuthenticated, user } = useAuth();
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
  const [imageMap, setImageMap] = useState({});
  const [imageFetchKey, setImageFetchKey] = useState(0);
  const [tripType, setTripType] = useState('one-way');
  const [modalReturnDate, setModalReturnDate] = useState('');

  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsAvgRating, setReviewsAvgRating] = useState(0);

  const lookedUpIatasRef = useRef(new Set());
  const inFlightIatasRef = useRef(new Set());
  const imageRequestIdsRef = useRef(new Set());

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
    imageRequestIdsRef.current.clear();
    lookedUpIatasRef.current.clear();
    setImageMap({});
    setImageFetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const pending = visibleDestinations.filter((destination) => {
      const hasResolvedName = destination.isNameResolved;
      const cityLabel = String(destination.city || '').trim();
      const countryLabel = String(destination.country || '').trim();
      
      return hasResolvedName && 
             cityLabel && 
             countryLabel && 
             !imageMap[destination.iata] && 
             !imageRequestIdsRef.current.has(destination.iata);
    });

    if (pending.length === 0) return undefined;

    let mounted = true;
    pending.forEach((destination) => imageRequestIdsRef.current.add(destination.iata));

    (async () => {
      const queries = pending.map((d) => `${d.city}, ${d.country}`);
      console.log(`📷 Batch fetching ${queries.length} destination images`);

      let batchResult = {};
      try {
        batchResult = await getPlaceImagesForMultiplePlaces(queries);
      } catch (error) {
        console.error('Batch image fetch failed:', error);
      }

      if (!mounted) return;

      const imageUpdates = {};
      pending.forEach((destination) => {
        const query = `${destination.city}, ${destination.country}`;
        const result = batchResult[query];
        imageUpdates[destination.iata] = result?.imageUrl || getDestinationFallbackImage(query);
      });

      console.log(`✅ Loaded ${Object.keys(imageUpdates).length} images`);
      setImageMap((prev) => ({ ...prev, ...imageUpdates }));
    })();

    return () => {
      mounted = false;
    };
  }, [visibleDestinations, imageFetchKey]);

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

  const loadReviews = async (destination) => {
    if (!destination?.city) return;
    setIsLoadingReviews(true);
    setReviews([]);
    try {
      const res = await getReviews(destination.city);
      if (res.success) {
        setReviews(res.data.reviews || []);
        setReviewsAvgRating(res.data.avgRating || 0);
      }
    } catch {} finally { setIsLoadingReviews(false); }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const token = getAccessToken();
      const res = await createReview({
        destinationName: selectedDestination.city,
        country: selectedDestination.country,
        rating: reviewRating,
        text: reviewText.trim()
      }, token);
      if (res.success) {
        setReviews(prev => [res.data.review, ...prev]);
        setReviewText('');
        setReviewRating(5);
        setShowReviewForm(false);
      }
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally { setIsSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = getAccessToken();
      await deleteReview(reviewId, token);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch {}
  };

  const handleCardClick = async (destination) => {
    if (!origin || !departureDate) return;

    setSelectedDestination(destination);
    setIsModalOpen(true);
    setTripType('one-way');
    setModalReturnDate('');
    setIsLoadingTickets(true);
    setTicketError('');
    setTickets([]);
    setShowReviewForm(false);
    loadReviews(destination);

    try {
      const response = await searchFlightsDuffel({
        originCode: origin,
        destinationCode: destination.iata,
        departureDate,
        returnDate: null,
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
    setTripType('one-way');
    setModalReturnDate('');
    setReviews([]);
    setReviewError('');
    setShowReviewForm(false);
  };

  const handleTripTypeChange = async (newTripType) => {
    setTripType(newTripType);

    if (newTripType === 'round-trip' && !modalReturnDate) {
      return;
    }

    if (!selectedDestination)
      return;

    setIsLoadingTickets(true);
    setTicketError('');
    setTickets([]);

    try {
      const response = await searchFlightsDuffel({
        originCode: origin,
        destinationCode: selectedDestination.iata,
        departureDate,
        returnDate: newTripType === 'round-trip' ? (modalReturnDate || null) : null,
        adults,
      });

      const normalized = (response?.flights || []).map((flight) =>
        normalizeDuffelFlight(flight, origin, selectedDestination.iata)
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

  const handleReturnDateChange = async (date) => {
    setModalReturnDate(date);

    if (tripType === 'round-trip' && date && selectedDestination) {
      setIsLoadingTickets(true);
      setTicketError('');
      setTickets([]);

      try {
        const response = await searchFlightsDuffel({
          originCode: origin,
          destinationCode: selectedDestination.iata,
          departureDate,
          returnDate: date,
          adults,
        });

        const normalized = (response?.flights || []).map((flight) =>
          normalizeDuffelFlight(flight, origin, selectedDestination.iata)
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
    }
  };

  const handleViewMore = () => {
    setVisibleCards((prev) => Math.min(prev + LOAD_MORE_STEP, allDestinations.length));
  };

  const isPageLoading = isLoadingPrices || isBootstrapping;

  return (
    <div className="explore-detail-page">
      <PageMeta
        title="Explore Cheap Flight Destinations"
        description="Type your departure city and see everywhere you can fly cheaply, sorted by price. Perfect for open-ended trip planning and budget travel discovery."
        keywords="explore flights, cheap destinations, anywhere flights, budget travel, cheapest flights, flight ideas"
        path="/flights/explore"
      />
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
                  const rawPrice    = priceMap[destination.iata]?.price;
                  const displayPrice = rawPrice != null
                    ? formatPrice(rawPrice)
                    : (isLoadingPrices ? 'Loading fare...' : 'Price unavailable');
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
                              src={imageMap[destination.iata] || '/images/destination/destination13.jpg'}
                              alt={destination.isNameResolved ? destination.city : destination.iata}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = getDestinationFallbackImage([destination.city, destination.country].filter(Boolean).join(' '));
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
                            <span className={`fc-badge fc-badge--${getDestinationTag(destination.city)}`}>
                              {getDestinationTag(destination.city).charAt(0).toUpperCase() + getDestinationTag(destination.city).slice(1)}
                            </span>
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
              <p>{originDisplay} → {selectedDestination.iata} · {departureDate}{tripType === 'round-trip' && modalReturnDate ? ` · return ${modalReturnDate}` : ''}</p>
            </div>

            <div className="explore-ticket-modal__filters">
              <div className="explore-trip-type-filter">
                <button
                  className={`explore-trip-type-btn ${tripType === 'one-way' ? 'explore-trip-type-btn--active' : ''}`}
                  onClick={() => handleTripTypeChange('one-way')}
                >
                  One Way
                </button>
                <button
                  className={`explore-trip-type-btn ${tripType === 'round-trip' ? 'explore-trip-type-btn--active' : ''}`}
                  onClick={() => handleTripTypeChange('round-trip')}
                >
                  Round Trip
                </button>
              </div>

              {tripType === 'round-trip' && (
                <div className="explore-return-date-picker">
                  <label htmlFor="explore-return-date">Return Date:</label>
                  <input
                    id="explore-return-date"
                    type="date"
                    value={modalReturnDate}
                    onChange={(e) => handleReturnDateChange(e.target.value)}
                    min={departureDate}
                    className="explore-return-date-input"
                  />
                </div>
              )}
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


            <div className="explore-reviews">
              <div className="explore-reviews__header">
                <h4 className="explore-reviews__title">
                  Traveller Reviews
                  {reviewsAvgRating > 0 && (
                    <span className="explore-reviews__avg">
                      <StarRating value={Math.round(reviewsAvgRating)} size={14} />
                      {reviewsAvgRating.toFixed(1)}
                    </span>
                  )}
                </h4>
                {isAuthenticated && !showReviewForm && (
                  <button className="explore-reviews__write-btn" onClick={() => setShowReviewForm(true)}>
                    Write a review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="explore-reviews__form">
                  <StarRating value={reviewRating} onChange={setReviewRating} size={22} />
                  <textarea
                    className="explore-reviews__textarea"
                    placeholder={`Share your experience in ${selectedDestination?.city}…`}
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                  {reviewError && <p className="explore-reviews__error">{reviewError}</p>}
                  <div className="explore-reviews__form-actions">
                    <button className="explore-reviews__cancel" onClick={() => { setShowReviewForm(false); setReviewError(''); }}>Cancel</button>
                    <button className="explore-reviews__submit" disabled={isSubmittingReview || !reviewText.trim()} onClick={handleSubmitReview}>
                      {isSubmittingReview ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              {isLoadingReviews && <p className="explore-reviews__state">Loading reviews…</p>}

              {!isLoadingReviews && reviews.length === 0 && (
                <p className="explore-reviews__state">No reviews yet. Be the first!</p>
              )}

              {reviews.length > 0 && (
                <div className="explore-reviews__list">
                  {reviews.map(r => (
                    <div key={r._id} className="explore-reviews__item">
                      <div className="explore-reviews__item-header">
                        <span className="explore-reviews__author">{r.userId?.name || 'Traveller'}</span>
                        <StarRating value={r.rating} size={13} />
                        {user && r.userId?._id === user._id && (
                          <button className="explore-reviews__delete" onClick={() => handleDeleteReview(r._id)} title="Delete review">×</button>
                        )}
                      </div>
                      <p className="explore-reviews__text">{r.text}</p>
                      <span className="explore-reviews__date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreAnywhereDetailPage;
