import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TripIterationsCarousel from '../../components/TripIterationsCarousel/TripIterationsCarousel';
import TripSummaryCard from '../../components/TripSummaryCard/TripSummaryCard';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTripById,
  selectTripOption
} from '../../services/tripsService';
import './TripIterationsPage.css';

// Simple Header Component for Trip Iterations Page
const TripIterationsHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const closeTimeout = useRef(null);

  const openDropdown = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    closeTimeout.current = setTimeout(() => setIsDropdownOpen(false), 150);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="trip-iterations-header">
      <div className="trip-iterations-header__container">
        <Link to="/" className="trip-iterations-header__logo">
          <img src="/images/newLogo.png" alt="OptionTrip" />
        </Link>

        <nav className="trip-iterations-header__nav">
          <Link to="/" className="trip-iterations-header__link">
            Home
          </Link>
          <Link to="/blog" className="trip-iterations-header__link">
            Blogs
          </Link>

          {/* Auth Section */}
          <div
            className="trip-iterations-header__auth"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button className="trip-iterations-header__auth-btn">
              {isAuthenticated ? (
                <>
                  <i className="icon-user"></i>
                  <span>{user?.name || 'Profile'}</span>
                  <i className={`icon-arrow-down ${isDropdownOpen ? 'open' : ''}`}></i>
                </>
              ) : (
                <>
                  <i className="icon-user"></i>
                  <span>Account</span>
                  <i className={`icon-arrow-down ${isDropdownOpen ? 'open' : ''}`}></i>
                </>
              )}
            </button>

            {isDropdownOpen && (
              <div className="trip-iterations-header__dropdown">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="trip-iterations-header__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="icon-user"></i>
                      <span>My Profile</span>
                    </Link>
                    <Link to="/my-trips" className="trip-iterations-header__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="icon-compass"></i>
                      <span>My Trips</span>
                    </Link>
                    <div className="trip-iterations-header__dropdown-divider"></div>
                    <button className="trip-iterations-header__dropdown-item trip-iterations-header__dropdown-item--logout" onClick={handleLogout}>
                      <i className="icon-logout"></i>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="trip-iterations-header__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="icon-login"></i>
                      <span>Login</span>
                    </Link>
                    <Link to="/signup" className="trip-iterations-header__dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="icon-user-add"></i>
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

const TripIterationsPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [tripData, setTripData] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tripId) {
      loadTripData();
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTripById(tripId);

      if (response.success && response.data) {
        setTripData(response.data);
        // Only set selected option if one was already selected (returning user)
        // Don't auto-select the first option for new trips
        if (response.data.selected_option_id) {
          setSelectedOptionId(response.data.selected_option_id);
        }
      } else {
        setError('Failed to load trip data');
      }
    } catch (err) {
      console.error('Error loading trip:', err);
      setError(err.message || 'Failed to load trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (optionId) => {
    setSelectedOptionId(optionId);

    // Update selection on backend
    try {
      await selectTripOption(tripId, optionId);
    } catch (err) {
      console.error('Error selecting option:', err);
      // Don't show error to user for selection failure, just log it
    }
  };

  const handleConfirm = async () => {
    // Make sure an option is selected
    if (!selectedOptionId) {
      alert('Please select a trip option first');
      return;
    }

    // Navigate to the planned trip page with the selected option
    navigate(`/planned-trip/${tripId}`);
  };

  const handleRetry = () => {
    loadTripData();
  };

  const handleBackToPlanner = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="trip-iterations-page">
        <TripIterationsHeader />
        <div className="trip-iterations-page__container">
          <div className="trip-iterations-page__loading">
            <Loader size="large" text="Loading your trip options..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trip-iterations-page">
        <TripIterationsHeader />
        <div className="trip-iterations-page__container">
          <div className="trip-iterations-page__error">
            <div className="trip-iterations-page__error-icon">⚠️</div>
            <h2 className="trip-iterations-page__error-title">Oops! Something went wrong</h2>
            <p className="trip-iterations-page__error-message">{error}</p>
            <button
              className="trip-iterations-page__error-button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedOption = tripData?.options?.find(
    (opt) => opt.option_id === selectedOptionId
  );

  return (
    <div className="trip-iterations-page">
      <TripIterationsHeader />
      <div className="trip-iterations-page__container">
        <div className="trip-iterations-page__breadcrumb">
          <Link to="/" className="trip-iterations-page__breadcrumb-link">
            Home
          </Link>
          <span className="trip-iterations-page__breadcrumb-separator">/</span>
          <span>Trip Options</span>
          {tripData?.destination?.name && (
            <>
              <span className="trip-iterations-page__breadcrumb-separator">/</span>
              <span>{tripData.destination.name}</span>
            </>
          )}
        </div>

        <div className="trip-iterations-page__header">
          <h1 className="trip-iterations-page__title">
            Your {tripData?.destination?.name || 'Trip'} Adventure Awaits
          </h1>
          <p className="trip-iterations-page__description">
            We've created multiple personalized itineraries based on your preferences.
            Choose the one that best fits your travel style and budget.
          </p>
        </div>

        <div className="trip-iterations-page__content">
          <div className="trip-iterations-page__main">
            <TripIterationsCarousel
              options={tripData?.options || []}
              selectedOptionId={selectedOptionId}
              onSelectOption={handleSelectOption}
              destination={tripData?.destination}
            />
          </div>

          <div className="trip-iterations-page__sidebar">
            <TripSummaryCard
              tripData={tripData}
              selectedOption={selectedOption}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      </div>
      <ViAssistant />
    </div>
  );
};

export default TripIterationsPage;
