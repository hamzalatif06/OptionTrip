/**
 * PlannedTripPage - Main Planned Trip View
 *
 * Structure adapted from TripTap's PublicTripPageWrapper + TripIndex
 * Displays complete trip itinerary after trip generation
 *
 * Data Flow:
 * 1. Receives tripId from route params
 * 2. Fetches trip data from API
 * 3. If itinerary not generated, triggers progressive day-by-day generation
 * 4. Renders HeroSection (trip metadata)
 * 5. Renders ActivitiesSection (day-by-day itinerary with tabs)
 *
 * Components Used (from TripTap structure):
 * - HeroSection: Trip header with info cards
 * - ActivitiesSection: Main itinerary with multi-tab view
 *   - Tab 0: Itinerary (day-by-day activities)
 *   - Tab 1: Map View (optional)
 *   - Tab 2: Calendar View (optional)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import ActivitiesSection from './sections/ActivitiesSection';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import Loader from '../../components/Loader/Loader';
import {
  getTripById,
  generateAllDaysProgressively,
  getCachedItinerary,
  setCachedItinerary
} from '../../services/tripsService';
import './PlannedTripPage.css';

// Simple Header Component for Planned Trip Page
const PlannedTripHeader = ({ tripId }) => {
  return (
    <header className="planned-trip-header">
      <div className="planned-trip-header__container">
        <Link to="/" className="planned-trip-header__logo">
          <img src="/images/newLogo.png" alt="OptionTrip" />
        </Link>

        <nav className="planned-trip-header__nav">
          <Link to="/" className="planned-trip-header__link">
            Home
          </Link>
          {tripId && (
            <Link to={`/trips/${tripId}`} className="planned-trip-header__link">
              Trip Options
            </Link>
          )}
          <Link to="/blog" className="planned-trip-header__link">
            Blogs
          </Link>
        </nav>
      </div>
    </header>
  );
};

const PlannedTripPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const generationStarted = useRef(false);

  // State management
  const [tripData, setTripData] = useState(null);
  const [tripDaysData, setTripDaysData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Progressive loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (tripId) {
      loadTripData();
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  // Start progressive generation when trip data loads and itinerary is empty
  useEffect(() => {
    if (tripData && tripDaysData.length === 0 && !generationStarted.current && !isGenerating) {
      const selectedOption = tripData.options?.find(opt => opt.option_id === tripData.selected_option_id);
      if (selectedOption && tripData.selected_option_id) {
        startProgressiveGeneration(tripData.selected_option_id, selectedOption);
      }
    }
  }, [tripData, tripDaysData]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTripById(tripId);

      if (response.success && response.data) {
        setTripData(response.data);
        // Get the selected option's itinerary
        const selectedOption = response.data.options?.find(opt => opt.option_id === response.data.selected_option_id);
        const existingItinerary = selectedOption?.itinerary || [];

        // Check localStorage cache first
        if (existingItinerary.length === 0 && response.data.selected_option_id) {
          const cachedData = getCachedItinerary(tripId, response.data.selected_option_id);
          if (cachedData && cachedData.length > 0) {
            console.log('✅ Using cached itinerary from localStorage');
            setTripDaysData(cachedData);
            setLoading(false);
            return;
          }
        }

        setTripDaysData(existingItinerary);
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

  const startProgressiveGeneration = async (optionId, selectedOption) => {
    if (generationStarted.current) return;
    generationStarted.current = true;

    const totalDays = tripData?.dates?.duration_days || 3;
    console.log(`🚀 Starting progressive generation for ${totalDays} days...`);

    setIsGenerating(true);
    setGenerationProgress({ completed: 0, total: totalDays });

    try {
      await generateAllDaysProgressively(
        tripId,
        optionId,
        totalDays,
        // onDayComplete - called when each day finishes
        (dayNumber, dayData, fromCache) => {
          console.log(`✅ Day ${dayNumber} loaded${fromCache ? ' (cached)' : ''}`);

          setTripDaysData(prev => {
            const newDays = [...prev.filter(d => d.day_number !== dayNumber), dayData]
              .sort((a, b) => a.day_number - b.day_number);
            return newDays;
          });

          setGenerationProgress(prev => ({
            ...prev,
            completed: prev.completed + 1
          }));
        },
        // onAllComplete - called when all days are done
        (completedDays, results) => {
          console.log('✅ All days generated!', completedDays.length);
          // Save to localStorage cache
          setCachedItinerary(tripId, optionId, completedDays);
          setIsGenerating(false);
        },
        // onError - called when a day fails
        (dayNumber, error) => {
          console.error(`❌ Day ${dayNumber} failed:`, error);
        }
      );
    } catch (err) {
      console.error('Error in progressive generation:', err);
      setError('Failed to generate itinerary. Please try again.');
      setIsGenerating(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__loading">
          <Loader size="large" text="Loading..." />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__error">
          <div className="planned-trip-page__error-icon">⚠️</div>
          <h2 className="planned-trip-page__error-title">Oops! Something went wrong</h2>
          <p className="planned-trip-page__error-message">{error}</p>
          <button
            className="planned-trip-page__error-button"
            onClick={loadTripData}
          >
            Try Again
          </button>
          <button
            className="planned-trip-page__error-button planned-trip-page__error-button--secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Empty State - Show if no trip data at all (not just empty itinerary)
  if (!tripData) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__empty">
          <div className="planned-trip-page__empty-icon">🗺️</div>
          <h2 className="planned-trip-page__empty-title">No Trip Data Available</h2>
          <p className="planned-trip-page__empty-text">
            This trip may not exist or has been deleted.
          </p>
          <button
            className="planned-trip-page__error-button"
            onClick={() => navigate('/')}
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="planned-trip-page">
      <PlannedTripHeader tripId={tripId} />
      {/* Hero Section - Trip Header with Metadata */}
      <HeroSection
        tripData={tripData}
        destination={tripData.destination}
        dates={tripData.dates}
        guests={tripData.guests}
        budget={tripData.budget}
      />

      {/* Activities Section - Main Itinerary Content with Progressive Loading */}
      <ActivitiesSection
        tripId={tripId}
        tripData={tripData}
        daysData={tripDaysData}
        selectedOptionId={tripData.selected_option_id}
        onRefreshData={loadTripData}
        isGenerating={isGenerating}
        totalDays={generationProgress.total}
      />
      <ViAssistant />
    </div>
  );
};

export default PlannedTripPage;
