import React, { useState } from 'react';
import ActivityCard from '../ActivityCard/ActivityCard';
import useCurrency from '../../hooks/useCurrency';
import './ItineraryDisplay.css';

const ItineraryDisplay = ({ itinerary, searchCenter }) => {
  const [activeDay, setActiveDay] = useState(0);
  const { formatPrice } = useCurrency();

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="itinerary-display">
        <div className="itinerary-display__empty">
          <div className="itinerary-display__empty-icon">📅</div>
          <p className="itinerary-display__empty-text">
            No itinerary available
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const currentDay = itinerary[activeDay];

  return (
    <div className="itinerary-display">
      <div className="itinerary-display__header">
        <h2 className="itinerary-display__title">Daily Itinerary</h2>
        <p className="itinerary-display__subtitle">
          {itinerary.length} days of unforgettable experiences
        </p>
      </div>

      <div className="itinerary-display__tabs">
        {itinerary.map((day, index) => (
          <button
            key={day.day_number}
            className={`itinerary-display__tab ${activeDay === index ? 'active' : ''}`}
            onClick={() => setActiveDay(index)}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="itinerary-display__day-content">
          <div className="itinerary-display__day-header">
            <h3 className="itinerary-display__day-title">{currentDay.title}</h3>
            <p className="itinerary-display__day-date">
              {formatDate(currentDay.date)}
            </p>
            {currentDay.summary && (
              <p className="itinerary-display__day-summary">{currentDay.summary}</p>
            )}
          </div>

          <div className="itinerary-display__activities">
            {currentDay.activities && currentDay.activities.length > 0 ? (
              currentDay.activities.map((activity, activityIndex) => (
                <div key={activityIndex} style={{ position: 'relative' }}>
                  <ActivityCard
                    activity={activity}
                    searchCenter={searchCenter}
                  />
                </div>
              ))
            ) : (
              <div className="itinerary-display__empty">
                <p className="itinerary-display__empty-text">
                  No activities planned for this day
                </p>
              </div>
            )}
          </div>

          <div className="itinerary-display__day-footer">
            <span className="itinerary-display__day-footer-label">
              Total Day Cost
            </span>
            <span className="itinerary-display__day-footer-value">
              {formatPrice(currentDay.total_cost || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;
