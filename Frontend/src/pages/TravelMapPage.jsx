import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMyTrips } from '../services/tripsService';
import PremiumMapView from '../components/map/PremiumMapView';
import './TravelMapPage.css';

const TravelMapPage = () => {
  const { isDark } = useTheme();
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyTrips(accessToken, { limit: 100 })
      .then((data) => {
        const list = data?.trips || data?.data || data || [];
        setTrips(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Map trips fetch error:', err))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="tmp-page">
      {loading ? (
        <div className="tmp-loading">
          <div className="tmp-loading__orb" />
          <div className="tmp-loading__label">
            <span>Loading your trips</span>
            <div className="tmp-loading__dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      ) : (
        <PremiumMapView
          mode="travel"
          trips={trips}
          isDark={isDark}
          className="tmp-fill"
        />
      )}
    </div>
  );
};

export default TravelMapPage;
