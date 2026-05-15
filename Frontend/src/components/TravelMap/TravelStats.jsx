import React, { useMemo } from 'react';
import './TravelStats.css';

const extractCountry = (destinationName = '') => {
  // "Paris, France" → "France"  |  "Tokyo" → "Tokyo"
  const parts = destinationName.split(',');
  return parts[parts.length - 1].trim();
};

const TravelStats = ({ trips = [] }) => {
  const stats = useMemo(() => {
    const countries = new Set(trips.map(t => extractCountry(t.destination?.name || '')));
    const totalDays  = trips.reduce((sum, t) => sum + (t.dates?.duration_days || 0), 0);
    const confirmed  = trips.filter(t => t.status === 'confirmed' || t.status === 'itinerary_generated').length;
    return {
      total:     trips.length,
      countries: countries.size,
      days:      totalDays,
      confirmed,
    };
  }, [trips]);

  const items = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      value: stats.total,
      label: 'Trips',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      value: stats.countries,
      label: 'Countries',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      value: stats.days,
      label: 'Days Planned',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      value: stats.confirmed,
      label: 'Confirmed',
    },
  ];

  return (
    <div className="tst-panel">
      {items.map(item => (
        <div key={item.label} className="tst-item">
          <span className="tst-icon">{item.icon}</span>
          <div className="tst-body">
            <span className="tst-value">{item.value}</span>
            <span className="tst-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TravelStats;
