import React from 'react';
import { Popup } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router-dom';
import './TripMapPopup.css';

const STATUS_COLORS = {
  confirmed:           { bg: '#dcfce7', text: '#15803d' },
  itinerary_generated: { bg: '#dbeafe', text: '#1d4ed8' },
  option_selected:     { bg: '#fef9c3', text: '#a16207' },
  options_generated:   { bg: '#f3e8ff', text: '#7c3aed' },
  draft:               { bg: '#f1f5f9', text: '#64748b' },
  archived:            { bg: '#fee2e2', text: '#dc2626' },
};

const StatusBadge = ({ status }) => {
  const { bg, text } = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Draft';
  return <span className="tmp-badge" style={{ background: bg, color: text }}>{label}</span>;
};

const TripMapPopup = ({ trip, onClose }) => {
  const navigate  = useNavigate();
  const { destination, dates, status, budget, description, trip_id } = trip;

  return (
    <Popup
      longitude={destination?.geometry?.lng || 0}
      latitude={destination?.geometry?.lat || 0}
      anchor="bottom"
      offset={[0, -10]}
      onClose={onClose}
      closeButton={false}
      maxWidth="320px"
    >
      <div className="tmp-card">
        {/* Header */}
        <div className="tmp-header">
          <div className="tmp-header__left">
            <h3 className="tmp-title">{destination?.name || 'Unknown Destination'}</h3>
            <StatusBadge status={status} />
          </div>
          <button className="tmp-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Dates */}
        {dates?.start_date && (
          <div className="tmp-dates">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>
              {new Date(dates.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {dates.end_date && dates.start_date !== dates.end_date && (
                <> → {new Date(dates.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
              )}
            </span>
            {dates.duration_days > 0 && (
              <span className="tmp-duration">{dates.duration_days} day{dates.duration_days !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        {/* Budget */}
        {budget && (
          <div className="tmp-meta">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H11a1.5 1.5 0 000 3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="tmp-budget">{budget.charAt(0).toUpperCase() + budget.slice(1)} budget</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="tmp-desc">{description.length > 100 ? description.slice(0, 97) + '…' : description}</p>
        )}

        {/* Actions */}
        <div className="tmp-actions">
          <button
            className="tmp-btn tmp-btn--primary"
            onClick={() => navigate(`/planned-trip/${trip_id}`)}
          >
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            View Trip
          </button>
          <button
            className="tmp-btn tmp-btn--secondary"
            onClick={() => navigate(`/trips/${trip_id}`)}
          >
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default TripMapPopup;
