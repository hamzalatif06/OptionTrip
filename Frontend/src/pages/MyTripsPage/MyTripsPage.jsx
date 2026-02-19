import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import { getMyTrips } from '../../services/tripsService';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import Loader from '../../components/Loader/Loader';
import './MyTripsPage.css';

const MyTripsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/my-trips' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTrips();
    }
  }, [isAuthenticated]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      const response = await getMyTrips(token);

      if (response.success) {
        setTrips(response.data.trips || []);
      } else {
        setError('Failed to load trips');
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading) {
    return <Loader size="fullpage" text="Loading..." />;
  }

  return (
    <div className="my-trips-page">
      <header className="my-trips-page__header">
        <div className="my-trips-page__header-container">
          <Link to="/" className="my-trips-page__logo">
            <img src="/images/newLogo.png" alt="OptionTrip" />
          </Link>
          <nav className="my-trips-page__nav">
            <Link to="/" className="my-trips-page__nav-link">Home</Link>
            <Link to="/blog" className="my-trips-page__nav-link">Blog</Link>
          </nav>
        </div>
      </header>

      <main className="my-trips-page__content">
        <div className="my-trips-page__container">
          <div className="my-trips-page__title-section">
            <h1 className="my-trips-page__title">My Trips</h1>
            <p className="my-trips-page__subtitle">
              Your saved travel itineraries
            </p>
          </div>

          {loading ? (
            <div className="my-trips-page__loading">
              <Loader size="medium" text="Loading your trips..." />
            </div>
          ) : error ? (
            <div className="my-trips-page__error">
              <div className="my-trips-page__error-icon">!</div>
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button onClick={loadTrips} className="my-trips-page__retry-btn">
                Try Again
              </button>
            </div>
          ) : trips.length === 0 ? (
            <div className="my-trips-page__empty">
              <div className="my-trips-page__empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="my-trips-page__empty-title">No trips yet</h3>
              <p className="my-trips-page__empty-text">
                Start planning your next adventure and save your favorite itineraries here.
              </p>
              <Link to="/" className="my-trips-page__cta-btn">
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="my-trips-page__grid">
              {trips.map((trip) => (
                <div key={trip.trip_id} className="my-trips-page__card">
                  <div
                    className="my-trips-page__card-image"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop)`
                    }}
                  >
                    <div className="my-trips-page__card-badge">
                      {trip.dates?.duration_days || 0} Days
                    </div>
                  </div>
                  <div className="my-trips-page__card-content">
                    <h3 className="my-trips-page__card-title">
                      {trip.destination?.name || 'Unknown Destination'}
                    </h3>
                    <div className="my-trips-page__card-meta">
                      <span className="my-trips-page__card-dates">
                        {formatDate(trip.dates?.start_date)} - {formatDate(trip.dates?.end_date)}
                      </span>
                      <span className="my-trips-page__card-guests">
                        {trip.guests?.total || 0} Travelers
                      </span>
                    </div>
                    <div className="my-trips-page__card-info">
                      <span className="my-trips-page__card-type">
                        {trip.trip_type || 'Leisure'}
                      </span>
                      <span className="my-trips-page__card-budget">
                        {trip.budget ? trip.budget.charAt(0).toUpperCase() + trip.budget.slice(1) : 'Standard'} Budget
                      </span>
                    </div>
                    <div className="my-trips-page__card-actions">
                      <Link
                        to={`/planned-trip/${trip.trip_id}`}
                        className="my-trips-page__card-btn primary"
                      >
                        View Itinerary
                      </Link>
                      <Link
                        to={`/trips/${trip.trip_id}`}
                        className="my-trips-page__card-btn secondary"
                      >
                        View Options
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <ViAssistant />
    </div>
  );
};

export default MyTripsPage;
