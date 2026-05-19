import React, { useState, useMemo } from 'react';
import useCurrency from '../../../hooks/useCurrency';
import './ActivitiesSection.css';
import ActivityCard from '../../../components/ActivityCard/ActivityCard';
import AuthModal from '../../../components/AuthModal/AuthModal';
import { useAuth } from '../../../contexts/AuthContext';
import { getAccessToken } from '../../../services/authService';
import { saveTrip } from '../../../services/tripsService';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import MapIcon from '@mui/icons-material/Map';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExploreIcon from '@mui/icons-material/Explore';
import FlightTab from './FlightTab';
import HotelTab from './HotelTab';
import TripMapTab from './TripMapTab';

/**
 * ActivitiesSection - Main itinerary section with tab navigation
 * Structure adapted from TripTap's ActivitiesSection.jsx
 * Styling uses OptionTrip theme
 */

const ActivitiesSection = ({ tripId, tripData, daysData: propDaysData, isGenerating, totalDays }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localDaysData, setLocalDaysData] = useState([]);
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();

  // Sync local state with prop data
  React.useEffect(() => {
    if (propDaysData && propDaysData.length > 0) {
      setLocalDaysData(propDaysData);
    }
  }, [propDaysData]);

  // Use local state for days data (allows modifications like removing activities)
  const daysData = useMemo(() => {
    return localDaysData.length > 0 ? localDaysData : (propDaysData || []);
  }, [localDaysData, propDaysData]);

  // Tab configuration (from TripTap's TabsWrapper_V2 pattern)
  const tabs = useMemo(() => [
    {
      id: 'tab1',
      title: 'Your Trip',
      icon: ExploreIcon,
      value: 0,
    },
    {
      id: 'tab2',
      title: 'Hotels',
      icon: HotelIcon,
      value: 1,
    },
    {
      id: 'tab3',
      title: 'Flights',
      icon: FlightIcon,
      value: 2,
    },
    {
      id: 'tab4',
      title: 'Map Your Trip',
      icon: MapIcon,
      value: 3,
    },
    {
      id: 'tab5',
      title: 'Calendar',
      icon: CalendarMonthIcon,
      value: 4,
    },
  ], []);

  // Day tabs configuration - only show loaded days + one loading tab if generating
  const dayTabs = useMemo(() => {
    // Create tabs for loaded days only
    const loadedTabs = daysData.map((day, index) => ({
      value: day.day_number || index + 1,
      label: `Day ${day.day_number || index + 1}`,
      isLoading: false,
    }));

    // If still generating, add one "loading" tab for the next day being generated
    if (isGenerating && totalDays) {
      const nextDayNumber = daysData.length + 1;
      if (nextDayNumber <= totalDays) {
        loadedTabs.push({
          value: nextDayNumber,
          label: `Day ${nextDayNumber}`,
          isLoading: true,
        });
      }
    }

    return loadedTabs;
  }, [daysData, isGenerating, totalDays]);

  // Get current day's data
  const currentDayData = useMemo(() => {
    if (!daysData || daysData.length === 0) return null;
    return daysData[activeDayTab - 1];
  }, [daysData, activeDayTab]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle save trip
  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const token = getAccessToken();
      await saveTrip(tripId, token);
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving trip:', err);
      alert('Failed to save trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle successful auth - save trip after login/signup
  const handleAuthSuccess = () => {
    handleSaveTrip();
  };

  // Handle remove activity
  const handleRemoveActivity = (activityToRemove) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${activityToRemove.title || activityToRemove.name || 'this activity'}" from your itinerary?`
    );

    if (!confirmed) return;

    // Update local days data by removing the activity from the current day
    setLocalDaysData(prevDays => {
      return prevDays.map(day => {
        if (day.day_number === activeDayTab) {
          // Filter out the activity to remove
          const updatedActivities = day.activities.filter(activity => {
            // Match by title/name or unique identifier
            const activityId = activity.place_id || activity.title || activity.name;
            const removeId = activityToRemove.place_id || activityToRemove.title || activityToRemove.name;
            return activityId !== removeId;
          });

          // Recalculate total cost
          const newTotalCost = updatedActivities.reduce((sum, act) => {
            const cost = typeof act.cost === 'number' ? act.cost : (parseInt(act.cost) || 0);
            return sum + cost;
          }, 0);

          return {
            ...day,
            activities: updatedActivities,
            total_cost: newTotalCost
          };
        }
        return day;
      });
    });
  };

  // Handle open Google directions
  const handleOpenGoogleDirections = (activity) => {
    const destination = activity.address || activity.location?.name || activity.title;
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      window.open(url, '_blank');
    }
  };

  // Handle activity book - open location in Google Maps
  const handleActivityBook = (activity) => {
    // Build a search query combining place name with location context
    const placeName = activity.place_name || activity.title || activity.name || '';
    const address = activity.address || '';
    const destinationName = tripData?.destination?.name || '';
    const destinationCountry = tripData?.destination?.country || '';

    // Combine place name with destination for accurate search
    let searchQuery = placeName;

    if (address) {
      // If we have an address, use place name + address
      searchQuery = `${placeName}, ${address}`;
    } else if (destinationName) {
      // Otherwise use place name + destination city/country
      searchQuery = `${placeName}, ${destinationName}`;
      if (destinationCountry && !destinationName.includes(destinationCountry)) {
        searchQuery += `, ${destinationCountry}`;
      }
    }

    // If we have a Google place_id, use it for the most accurate result
    if (activity.place_id) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}&query_place_id=${activity.place_id}`;
      window.open(url, '_blank');
    } else {
      // Fall back to search query
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
      window.open(url, '_blank');
    }
  };

  // Render itinerary tab content (from TripTap's ItineraryDays pattern)
  const renderItineraryTab = () => {
    // Show generating message if no days loaded yet
    if (!daysData || daysData.length === 0) {
      if (isGenerating) {
        return (
          <div className="activities-section__loader-container">
            <img src="/images/loader.gif" alt="Generating itinerary..." className="activities-section__loader-gif" />
          </div>
        );
      }
      return (
        <div className="activities-section__empty">
          <div className="activities-section__empty-icon">📅</div>
          <p className="activities-section__empty-text">
            No itinerary available for this trip
          </p>
        </div>
      );
    }

    return (
      <div className="activities-section__itinerary">
        {/* Sticky Day Navigation (from TripTap's TogglerTabsWrapper_V2) */}
        <div className="activities-section__day-tabs-wrapper">
          <div className="activities-section__day-tabs">
            {dayTabs.map((dayTab) => (
              <button
                key={dayTab.value}
                className={`activities-section__day-tab ${
                  activeDayTab === dayTab.value ? 'active' : ''
                } ${dayTab.isLoading ? 'loading' : ''}`}
                onClick={() => !dayTab.isLoading && setActiveDayTab(dayTab.value)}
                disabled={dayTab.isLoading}
              >
                {dayTab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day Content (from TripTap's ItineraryDays structure) */}
        {currentDayData && (
          <div className="activities-section__day-content">
            {/* Day Header */}
            <div className="activities-section__day-header">
              <div className="activities-section__day-header-top">
                <h3 className="activities-section__day-title">
                  Day {activeDayTab}: {currentDayData.title || 'Explore the City'}
                </h3>
                <div className="activities-section__day-meta">
                  <span className="activities-section__day-date">
                    📅 {formatDate(currentDayData.date)}
                  </span>
                </div>
              </div>
              {currentDayData.summary && (
                <p className="activities-section__day-description">
                  {currentDayData.summary}
                </p>
              )}
            </div>

            {/* Activities List */}
            <div className="activities-section__activities">
              {currentDayData.activities && currentDayData.activities.length > 0 ? (
                currentDayData.activities.map((activity, index) => (
                  <div key={index} className="activities-section__activity-card-wrapper">
                    <ActivityCard
                      activity={activity}
                      searchCenter={{
                        title: tripData?.destination?.name,
                        geo_location: [
                          tripData?.destination?.geometry?.lng,
                          tripData?.destination?.geometry?.lat
                        ]
                      }}
                      dayData={currentDayData}
                      isEditable={true}
                      onActivityBook={handleActivityBook}
                      onSwapActivity={(activity) => console.log('Swap:', activity)}
                      onRemoveActivity={handleRemoveActivity}
                      onOpenGoogleDirections={handleOpenGoogleDirections}
                    />
                  </div>
                ))
              ) : (
                <div className="activities-section__empty-day">
                  <p className="activities-section__empty-text">
                    No activities planned for this day
                  </p>
                </div>
              )}
            </div>

            {/* Day Footer */}
            <div className="activities-section__day-footer">
              <div className="activities-section__day-footer-content">
                <span className="activities-section__day-footer-label">
                  Total Day Cost
                </span>
                <span className="activities-section__day-footer-value">
                  {formatPrice(currentDayData.total_cost || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="activities-section">
      <div className="activities-section__container">
        {/* Main Tabs (from TripTap's TabsWrapper_V2) */}
        <div className="activities-section__tabs-wrapper">
          <div className="activities-section__tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`activities-section__tab ${
                    activeTab === tab.value ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <IconComponent className="activities-section__tab-icon" />
                  <span className="activities-section__tab-title">{tab.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panels (from TripTap's FormTabPanel_V2) */}
        <div className="activities-section__tab-content">
          {activeTab === 0 && renderItineraryTab()}
          {activeTab === 1 && <HotelTab tripData={tripData} />}
          {activeTab === 2 && (
            <FlightTab tripData={tripData} />
          )}
          {activeTab === 3 && (
            <TripMapTab tripData={tripData} daysData={daysData} />
          )}
          {activeTab === 4 && (
            <div className="activities-section__coming-soon">
              <p>Calendar view coming soon</p>
            </div>
          )}
        </div>

        {/* Trip Actions Footer (from TripTap's TravelTicketWidget pattern) */}
        <div className="activities-section__actions">
          <div className="activities-section__actions-content">
            <div className="activities-section__actions-text">
              <h3 className="activities-section__actions-title">
                Your Trip, Ready to Go
              </h3>
              <p className="activities-section__actions-subtitle">
                Save it, share it, and start packing
              </p>
            </div>
            <div className="activities-section__actions-buttons">
              <button
                className={`activities-section__action-btn primary ${isSaved ? 'saved' : ''}`}
                onClick={handleSaveTrip}
                disabled={isSaving || isSaved}
              >
                {isSaving ? (
                  <>
                    <span className="activities-section__save-spinner"></span>
                    Saving...
                  </>
                ) : isSaved ? (
                  '✓ Saved'
                ) : (
                  '💾 Save Trip'
                )}
              </button>
              {/* TODO: Implement share functionality
              <button className="activities-section__action-btn secondary">
                📤 Share Trip
              </button>
              */}
              {/* TODO: Implement edit functionality
              <button className="activities-section__action-btn secondary">
                ✏️ Edit Trip
              </button>
              */}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialTab="login"
      />
    </section>
  );
};

export default ActivitiesSection;
