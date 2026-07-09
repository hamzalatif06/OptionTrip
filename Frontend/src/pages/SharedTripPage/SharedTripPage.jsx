import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSharedTrip } from '../../services/tripsService';
import HeroSection from '../PlannedTripPage/sections/HeroSection';
import ActivitiesSection from '../PlannedTripPage/sections/ActivitiesSection';
import Loader from '../../components/Loader/Loader';
import './SharedTripPage.css';

const SharedTripPage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shareToken) { setError('Invalid share link'); setLoading(false); return; }
    getSharedTrip(shareToken)
      .then(res => { if (res.success) setTripData(res.data); else setError('Trip not found'); })
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="shared-trip-page">
        <div className="shared-trip-page__loading"><Loader size="large" text="Loading shared trip..." /></div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="shared-trip-page">
        <div className="shared-trip-page__error">
          <div className="shared-trip-page__error-icon">🔗</div>
          <h2>Trip not found</h2>
          <p>{error || 'This shared trip link is no longer active.'}</p>
          <Link to="/" className="shared-trip-page__cta">Plan your own trip</Link>
        </div>
      </div>
    );
  }

  const selectedOption = tripData.options?.find(o => o.option_id === tripData.selected_option_id);
  const daysData = selectedOption?.itinerary || [];

  return (
    <div className="shared-trip-page">
      <header className="shared-trip-page__header">
        <Link to="/" className="shared-trip-page__logo">
          <img src="/images/newLogo.png" alt="OptionTrip" />
        </Link>
        <div className="shared-trip-page__banner">
          Shared trip — <Link to="/">Plan your own trip →</Link>
        </div>
      </header>

      <HeroSection
        tripData={tripData}
        destination={tripData.destination}
        dates={tripData.dates}
        guests={tripData.guests}
        budget={tripData.budget}
        onSave={null}
        isSaved={false}
        isSaving={false}
        readOnly
      />

      <ActivitiesSection
        tripId={tripData.trip_id}
        tripData={tripData}
        daysData={daysData}
        selectedOptionId={tripData.selected_option_id}
        onRefreshData={() => {}}
        isGenerating={false}
        totalDays={tripData.dates?.duration_days || 0}
        onFlightSelected={() => {}}
        onHotelSelected={() => {}}
        readOnly
      />

      <div className="shared-trip-page__footer-cta">
        <p>Inspired? Plan your own personalised trip with AI.</p>
        <Link to="/" className="shared-trip-page__cta">Start planning for free →</Link>
      </div>
    </div>
  );
};

export default SharedTripPage;
