import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { EXPLORE_DESTINATIONS, getExploreImageUrl } from '../../data/exploreDestinations';
import { getPublicEntriesNearCity } from '../../services/tripStoryService';
import PageMeta from '../../hooks/usePageMeta';
import ShareButton from '../../components/ShareButton/ShareButton';
import './DestinationPage.css';

const slugify = (city) => city.toLowerCase().replace(/\s+/g, '-');

const findDestination = (slug) =>
  EXPLORE_DESTINATIONS.find((d) => slugify(d.city) === slug) || null;

const QUICK_LINKS = [
  { icon: '🏨', label: 'Find stays', path: '/hotels' },
  { icon: '✈️', label: 'Search flights', path: '/flights' },
  { icon: '🎟️', label: 'Tours & activities', path: '/tours' },
  { icon: '🚗', label: 'Rent a car', path: '/car-rental' },
];

const DestinationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tips, setTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(true);

  const dest = findDestination(slug);
  const cityName = dest?.city || slug?.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ') || 'this destination';
  const country = dest?.country || '';

  useEffect(() => {
    setLoadingTips(true);
    getPublicEntriesNearCity(cityName)
      .then((res) => { if (res?.success) setTips(res.data.entries || []); })
      .finally(() => setLoadingTips(false));
  }, [cityName]);

  const handlePlanTrip = () => {
    navigate('/', { state: { destination: { city: cityName, country } } });
  };

  const heroImage = dest ? getExploreImageUrl(dest.photo) : '/images/destination/destination13.jpg';

  return (
    <div className="dest-page">
      <PageMeta
        title={`${cityName} Travel Guide`}
        description={`Plan a trip to ${cityName}${country ? `, ${country}` : ''} — flights, stays, tours, and real tips from travelers on OptionTrip.`}
        keywords={`${cityName} travel, ${cityName} trip planner, visit ${cityName}`}
        path={`/destination/${slug}`}
      />

      <div className="dest-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="dest-hero__overlay" />
        <div className="dest-hero__share">
          <ShareButton url={`/destination/${slug}`} title={`${cityName} Travel Guide — OptionTrip`} label="Share" />
        </div>
        <div className="dest-hero__content">
          <span className="dest-hero__eyebrow">Destination Guide</span>
          <h1 className="dest-hero__title">{cityName}</h1>
          {country && <p className="dest-hero__country">{country}</p>}
          <button type="button" className="dest-hero__cta" onClick={handlePlanTrip}>
            Plan a trip to {cityName} →
          </button>
        </div>
      </div>

      <div className="dest-body">
        <p className="dest-intro">
          Discover {cityName} — from must-see sights to hidden local gems, Vi can help you build a
          full itinerary in minutes, or browse flights, stays, and activities directly below.
        </p>

        <div className="dest-quicklinks">
          {QUICK_LINKS.map((q) => (
            <Link key={q.path} to={q.path} className="dest-quicklink">
              <span className="dest-quicklink__icon">{q.icon}</span>
              {q.label}
            </Link>
          ))}
        </div>

        <section className="dest-tips">
          <h2>Tips from travelers</h2>
          {loadingTips ? (
            <p className="dest-tips__empty">Loading tips…</p>
          ) : tips.length === 0 ? (
            <p className="dest-tips__empty">No tips yet for {cityName} — be the first to leave one from your Travel Map.</p>
          ) : (
            <div className="dest-tips__grid">
              {tips.map((tip) => (
                <div className="dest-tip-card" key={tip._id}>
                  <span className="dest-tip-card__place">📍 {tip.location?.name}</span>
                  <p className="dest-tip-card__text">{tip.text}</p>
                  {tip.user_id?.name && <span className="dest-tip-card__author">— {tip.user_id.name}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DestinationPage;
