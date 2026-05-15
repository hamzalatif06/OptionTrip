import React, { useState } from 'react';
import './TravelSidebar.css';

const FILTERS = ['All', 'Confirmed', 'Active', 'Draft', 'Archived'];

const STATUS_DOT = {
  confirmed:           '#16a34a',
  itinerary_generated: '#2563eb',
  option_selected:     '#ca8a04',
  options_generated:   '#7c3aed',
  draft:               '#94a3b8',
  archived:            '#dc2626',
};

const statusLabel = (s) =>
  (s || 'draft').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const matchesFilter = (trip, filter) => {
  if (filter === 'All')       return true;
  if (filter === 'Confirmed') return trip.status === 'confirmed' || trip.status === 'itinerary_generated';
  if (filter === 'Active')    return ['option_selected', 'options_generated'].includes(trip.status);
  if (filter === 'Draft')     return trip.status === 'draft';
  if (filter === 'Archived')  return trip.status === 'archived';
  return true;
};

const TravelSidebar = ({ trips = [], selectedTrip, onSelectTrip, isOpen, onToggle }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const visible = trips.filter(t =>
    matchesFilter(t, filter) &&
    (!search || (t.destination?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Mobile toggle */}
      <button className="tsb-toggle" onClick={onToggle} title={isOpen ? 'Close sidebar' : 'Open trips'}>
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          {isOpen
            ? <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            : <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>}
        </svg>
      </button>

      <aside className={`tsb${isOpen ? ' tsb--open' : ''}`}>
        {/* Header */}
        <div className="tsb-header">
          <div className="tsb-header__title">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>My Trips</span>
          </div>
          <span className="tsb-count">{visible.length}</span>
        </div>

        {/* Search */}
        <div className="tsb-search">
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search destination…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="tsb-search__clear">✕</button>
          )}
        </div>

        {/* Filters */}
        <div className="tsb-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`tsb-filter${filter === f ? ' tsb-filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Trip list */}
        <div className="tsb-list">
          {visible.length === 0 ? (
            <div className="tsb-empty">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p>No trips found</p>
            </div>
          ) : (
            visible.map(trip => (
              <button
                key={trip.trip_id}
                className={`tsb-card${selectedTrip?.trip_id === trip.trip_id ? ' tsb-card--active' : ''}`}
                onClick={() => onSelectTrip(trip)}
              >
                <div className="tsb-card__body">
                  <div className="tsb-card__top">
                    <span className="tsb-card__dest">{trip.destination?.name || 'Unknown'}</span>
                    <span
                      className="tsb-card__dot"
                      style={{ background: STATUS_DOT[trip.status] || '#94a3b8' }}
                      title={statusLabel(trip.status)}
                    />
                  </div>
                  {trip.dates?.start_date && (
                    <div className="tsb-card__dates">
                      <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {new Date(trip.dates.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {trip.dates.duration_days > 0 && (
                        <span className="tsb-card__dur">· {trip.dates.duration_days}d</span>
                      )}
                    </div>
                  )}
                  <div className="tsb-card__status">{statusLabel(trip.status)}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="tsb-card__arrow">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default TravelSidebar;
