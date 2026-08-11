import React from 'react';
import './DaySkeleton.css';

const DaySkeleton = ({ dayNumber }) => {
  return (
    <div className="day-skeleton">
      <div className="day-skeleton__header">
        <div className="day-skeleton__day-badge">
          <span className="day-skeleton__day-number">Day {dayNumber}</span>
          <div className="day-skeleton__loading-indicator">
            <div className="day-skeleton__spinner"></div>
            <span>Generating...</span>
          </div>
        </div>
        <div className="day-skeleton__title skeleton-shimmer"></div>
        <div className="day-skeleton__date skeleton-shimmer"></div>
      </div>

      <div className="day-skeleton__activities">

        {[1, 2, 3].map((activityNum) => (
          <div key={activityNum} className="day-skeleton__activity">
            <div className="day-skeleton__activity-time skeleton-shimmer"></div>
            <div className="day-skeleton__activity-content">
              <div className="day-skeleton__activity-image skeleton-shimmer"></div>
              <div className="day-skeleton__activity-details">
                <div className="day-skeleton__activity-title skeleton-shimmer"></div>
                <div className="day-skeleton__activity-description skeleton-shimmer"></div>
                <div className="day-skeleton__activity-description skeleton-shimmer" style={{ width: '60%' }}></div>
                <div className="day-skeleton__activity-meta">
                  <div className="day-skeleton__activity-duration skeleton-shimmer"></div>
                  <div className="day-skeleton__activity-cost skeleton-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="day-skeleton__footer">
        <div className="day-skeleton__total-cost skeleton-shimmer"></div>
      </div>
    </div>
  );
};

export const ItinerarySkeleton = ({ totalDays = 3, loadedDays = [] }) => {
  return (
    <div className="itinerary-skeleton">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
        const isLoaded = loadedDays.includes(dayNum);
        if (isLoaded)
          return null;
        return <DaySkeleton key={dayNum} dayNumber={dayNum} />;
      })}
    </div>
  );
};

export const ActivitySkeleton = () => {
  return (
    <div className="activity-skeleton">
      <div className="activity-skeleton__time skeleton-shimmer"></div>
      <div className="activity-skeleton__content">
        <div className="activity-skeleton__image skeleton-shimmer"></div>
        <div className="activity-skeleton__details">
          <div className="activity-skeleton__title skeleton-shimmer"></div>
          <div className="activity-skeleton__description skeleton-shimmer"></div>
          <div className="activity-skeleton__meta skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default DaySkeleton;
