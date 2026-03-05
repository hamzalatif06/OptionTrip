import React from 'react';
import RoomIcon from '@mui/icons-material/Room';
import './TripSummaryCard.css';

const iconMap = {
  clock: '⏱️',
  star: '⭐',
  heart: '❤️',
  users: '👥',
  coffee: '☕',
  bolt: '⚡',
};

const TripSummaryCard = ({ tripData, selectedOption, onConfirm }) => {
  if (!selectedOption) {
    return (
      <div className="trip-summary-card">
        <div className="trip-summary-card__empty">
          <div className="trip-summary-card__empty-icon">📋</div>
          <p className="trip-summary-card__empty-text">
            Select a trip option to view the summary and details
          </p>
        </div>
        <div className="trip-summary-card__action">
          <button
            className="trip-summary-card__button trip-summary-card__button--primary trip-summary-card__button--disabled"
            disabled
          >
            Select an Option to Continue
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="trip-summary-card">
      <div className="trip-summary-card__header">
        <h2 className="trip-summary-card__title">{selectedOption.title}</h2>
        <p className="trip-summary-card__subtitle">Trip Summary</p>
      </div>

      <div className="trip-summary-card__destination">
        <div className="trip-summary-card__destination-icon">
          <RoomIcon />
        </div>
        <div className="trip-summary-card__destination-info">
          <h3>{tripData.destination.name}</h3>
          <p>{tripData.trip_type}</p>
        </div>
      </div>

      <div className="trip-summary-card__section">
        <h3 className="trip-summary-card__section-title">Trip Details</h3>
        <div className="trip-summary-card__details-grid">
          <div className="trip-summary-card__detail">
            <div className="trip-summary-card__detail-label">Check-in</div>
            <div className="trip-summary-card__detail-value">
              {formatDate(tripData.dates.start_date)}
            </div>
          </div>
          <div className="trip-summary-card__detail">
            <div className="trip-summary-card__detail-label">Check-out</div>
            <div className="trip-summary-card__detail-value">
              {formatDate(tripData.dates.end_date)}
            </div>
          </div>
          <div className="trip-summary-card__detail">
            <div className="trip-summary-card__detail-label">Duration</div>
            <div className="trip-summary-card__detail-value">
              {selectedOption.total_days} Days
            </div>
          </div>
          {tripData.guests?.total > 0 && (
            <div className="trip-summary-card__detail">
              <div className="trip-summary-card__detail-label">Travelers</div>
              <div className="trip-summary-card__detail-value">
                {tripData.guests.total} {tripData.guests.total === 1 ? 'Guest' : 'Guests'}
              </div>
            </div>
          )}
          {tripData.budget && (
            <div className="trip-summary-card__detail">
              <div className="trip-summary-card__detail-label">Budget</div>
              <div className="trip-summary-card__detail-value">
                {tripData.budget.charAt(0).toUpperCase() + tripData.budget.slice(1)}
              </div>
            </div>
          )}
          <div className="trip-summary-card__detail">
            <div className="trip-summary-card__detail-label">Pace</div>
            <div className="trip-summary-card__detail-value">
              {selectedOption.pace.charAt(0).toUpperCase() + selectedOption.pace.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="trip-summary-card__section">
        <h3 className="trip-summary-card__section-title">Highlights</h3>
        <div className="trip-summary-card__highlights-list">
          {selectedOption.highlights.map((highlight, index) => (
            <div key={index} className="trip-summary-card__highlight-item">
              <div className="trip-summary-card__highlight-icon">
                {iconMap[highlight.icon] || '📍'}
              </div>
              <div className="trip-summary-card__highlight-text">
                <strong>{highlight.label}:</strong> {highlight.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trip-summary-card__cost-summary">
        <div className="trip-summary-card__cost-row">
          <span className="trip-summary-card__cost-label">Activities & Experiences</span>
          <span className="trip-summary-card__cost-value">
            ${Math.round(selectedOption.estimated_total_cost * 0.7).toLocaleString()}
          </span>
        </div>
        <div className="trip-summary-card__cost-row">
          <span className="trip-summary-card__cost-label">Estimated Add-ons</span>
          <span className="trip-summary-card__cost-value">
            ${Math.round(selectedOption.estimated_total_cost * 0.3).toLocaleString()}
          </span>
        </div>
        <div className="trip-summary-card__cost-row">
          <span className="trip-summary-card__cost-label">Total Estimated Cost</span>
          <span className="trip-summary-card__cost-value">
            ${selectedOption.estimated_total_cost.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="trip-summary-card__action">
        <button
          className="trip-summary-card__button trip-summary-card__button--primary"
          onClick={onConfirm}
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
};

export default TripSummaryCard;
