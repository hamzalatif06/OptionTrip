import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import {
  getMyTrips,
  getMapData,
  getVisitedLocations,
  addVisitedLocation,
  removeVisitedLocation,
} from '../../services/tripsService';
import TravelMapTab from './TravelMapTab';
import VisitedPlacesTab from './VisitedPlacesTab';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import Loader from '../../components/Loader/Loader';
import './MyTripsPage.css';

// ── Destination → Unsplash image ──────────────────────────────────────────────
const DEST_IMAGES = {
  Paris: 'photo-1502602898657-3e91760cbb34',
  London: 'photo-1513635269975-59663e0ac1ad',
  Rome: 'photo-1552832230-c0197dd311b5',
  Barcelona: 'photo-1583422409516-2895a77efded',
  Amsterdam: 'photo-1534351590666-13e3e96b5017',
  Istanbul: 'photo-1524231757912-21f4fe3a7200',
  Prague: 'photo-1592906209472-a36b1f3782ef',
  Venice: 'photo-1514890547357-a9ee288728e0',
  Athens: 'photo-1555993539-1732b0258235',
  Tokyo: 'photo-1540959733332-eab4deabeeaf',
  Dubai: 'photo-1512453979798-5ea266f8880c',
  Singapore: 'photo-1525625293386-3f8f99389edd',
  Bali: 'photo-1537996194471-e657df975ab4',
  Bangkok: 'photo-1528181304800-259b08848526',
  'New York': 'photo-1496442226666-8d4d0e62e6e9',
  'Los Angeles': 'photo-1534190239940-9ba8944ea261',
  Miami: 'photo-1533106418989-88406c7cc8ca',
  Sydney: 'photo-1506973035872-a4ec16b8e8d9',
  Cairo: 'photo-1539768942893-daf53e448371',
  Morocco: 'photo-1489749798305-4fea3ae63d43',
  Maldives: 'photo-1514282401047-d79a71a590e8',
};

const getDestinationImage = (name) => {
  const key = (name || '').split(',')[0].trim();
  const id  = DEST_IMAGES[key] || 'photo-1488646953014-85cb44e25828';
  return `https://images.unsplash.com/${id}?w=400&h=220&fit=crop&q=80`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const BUDGET_LABELS = { budget: 'Budget', moderate: 'Moderate', luxury: 'Luxury', premium: 'Premium' };

// ── My Trips tab: cards grid ───────────────────────────────────────────────────
const MyTripsGrid = ({ trips, onSaveVisit }) => {
  if (trips.length === 0) {
    return (
      <div className="mtp__empty">
        <div className="mtp__empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="48" height="48">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3>No trips saved yet</h3>
        <p>Generate your first trip and click "Save Trip" to see it here.</p>
        <Link to="/" className="mtp__cta-btn">Plan Your First Trip</Link>
      </div>
    );
  }

  return (
    <div className="mtp__grid">
      {trips.map((trip) => {
        const dest = trip.destination?.name || 'Unknown Destination';
        return (
          <div key={trip.trip_id} className="mtp__card">
            <div
              className="mtp__card-img"
              style={{ backgroundImage: `url(${getDestinationImage(dest)})` }}
            >
              <span className="mtp__card-badge">{trip.dates?.duration_days || 0} Days</span>
              {trip.trip_type && (
                <span className="mtp__card-type-badge">{trip.trip_type}</span>
              )}
            </div>

            <div className="mtp__card-body">
              <h3 className="mtp__card-title">{dest}</h3>

              <div className="mtp__card-meta">
                <span className="mtp__card-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {fmtDate(trip.dates?.start_date)} – {fmtDate(trip.dates?.end_date)}
                </span>
                {(trip.guests?.total || 0) > 0 && (
                  <span className="mtp__card-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    {trip.guests.total} traveler{trip.guests.total !== 1 ? 's' : ''}
                  </span>
                )}
                {trip.budget && (
                  <span className="mtp__card-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    {BUDGET_LABELS[trip.budget] || trip.budget}
                  </span>
                )}
              </div>

              <div className="mtp__card-actions">
                <Link to={`/planned-trip/${trip.trip_id}`} className="mtp__card-btn primary">
                  View Itinerary
                </Link>
                <Link to={`/trips/${trip.trip_id}`} className="mtp__card-btn secondary">
                  Options
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
const MyTripsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab]       = useState('trips');
  const [trips, setTrips]               = useState([]);
  const [mapTrips, setMapTrips]         = useState([]);
  const [visited, setVisited]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/my-trips' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load all data
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAccessToken();

        const [tripsRes, mapRes, visitedRes] = await Promise.allSettled([
          getMyTrips(token),
          getMapData(token),
          getVisitedLocations(token),
        ]);

        const savedTrips = tripsRes.status === 'fulfilled' && tripsRes.value?.success
          ? (tripsRes.value.data?.trips || [])
          : [];
        setTrips(savedTrips);

        // Prefer map-data (includes activity coordinates as fallback);
        // if it fails or returns nothing, use the regular trips list
        if (mapRes.status === 'fulfilled' && mapRes.value?.success && (mapRes.value.trips || []).length > 0) {
          setMapTrips(mapRes.value.trips);
        } else {
          setMapTrips(savedTrips);
        }
        if (visitedRes.status === 'fulfilled' && visitedRes.value?.success) {
          setVisited(visitedRes.value.data?.locations || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // Visited location handlers
  const handleAddVisited = async (data) => {
    try {
      const token = getAccessToken();
      const res   = await addVisitedLocation(data, token);
      if (res?.success && res.data?.location) {
        setVisited((prev) => [res.data.location, ...prev]);
      }
    } catch (err) {
      console.error('Add visited error:', err);
    }
  };

  const handleRemoveVisited = async (id) => {
    try {
      const token = getAccessToken();
      await removeVisitedLocation(id, token);
      setVisited((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error('Remove visited error:', err);
    }
  };

  // Dashboard stats
  const stats = useMemo(() => ({
    trips:       trips.length,
    destinations: new Set(trips.map((t) => t.destination?.name).filter(Boolean)).size,
    days:        trips.reduce((s, t) => s + (t.dates?.duration_days || 0), 0),
    visited:     visited.length,
  }), [trips, visited]);

  const TABS = [
    { id: 'trips',   label: 'My Trips',       icon: '🗺️' },
    { id: 'map',     label: 'Travel Map',      icon: '🌍' },
    { id: 'visited', label: 'Visited Places',  icon: '📍' },
  ];

  if (authLoading || loading) {
    return <Loader size="fullpage" text="Loading your travel dashboard..." />;
  }

  return (
    <div className="mtp">
      {/* ── Header ── */}
      <header className="mtp__header">
        <div className="mtp__header-inner">
          <Link to="/" className="mtp__logo">
            <img src="/images/newLogo.png" alt="OptionTrip" />
          </Link>
          <nav className="mtp__nav">
            <Link to="/" className="mtp__nav-link">Home</Link>
            <Link to="/blog" className="mtp__nav-link">Blog</Link>
          </nav>
          <Link to="/" className="mtp__plan-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Plan New Trip
          </Link>
        </div>
      </header>

      {/* ── Hero / Stats ── */}
      <section className="mtp__hero">
        <div className="mtp__hero-inner">
          <div className="mtp__hero-left">
            <div className="mtp__hero-avatar">
              {user?.profileImage
                ? <img src={user.profileImage} alt={user.name} />
                : <span>{(user?.name || 'U')[0].toUpperCase()}</span>}
            </div>
            <div>
              <h1 className="mtp__hero-title">Hi, {user?.name?.split(' ')[0] || 'Traveler'}!</h1>
              <p className="mtp__hero-sub">Here's your travel story so far.</p>
            </div>
          </div>

          <div className="mtp__stats">
            <div className="mtp__stat">
              <span className="mtp__stat-val">{stats.trips}</span>
              <span className="mtp__stat-label">Trips Saved</span>
            </div>
            <div className="mtp__stat-div" />
            <div className="mtp__stat">
              <span className="mtp__stat-val">{stats.destinations}</span>
              <span className="mtp__stat-label">Destinations</span>
            </div>
            <div className="mtp__stat-div" />
            <div className="mtp__stat">
              <span className="mtp__stat-val">{stats.days}</span>
              <span className="mtp__stat-label">Days Planned</span>
            </div>
            <div className="mtp__stat-div" />
            <div className="mtp__stat">
              <span className="mtp__stat-val">{stats.visited}</span>
              <span className="mtp__stat-label">Places Visited</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tab Nav ── */}
      <div className="mtp__tabs-wrap">
        <div className="mtp__tabs-inner">
          <nav className="mtp__tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`mtp__tab${activeTab === t.id ? ' mtp__tab--active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="mtp__tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="mtp__content">
        <div className="mtp__content-inner">
          {error && (
            <div className="mtp__error">
              <span>⚠️ {error}</span>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {activeTab === 'trips' && (
            <MyTripsGrid trips={trips} />
          )}

          {activeTab === 'map' && (
            <div className="mtp__map-section">
              <p className="mtp__map-hint">
                {mapTrips.length > 0
                  ? `Showing ${mapTrips.length} saved trip destination${mapTrips.length !== 1 ? 's' : ''}. Click a marker for details.`
                  : 'Save trips to see them pinned on your world map.'}
              </p>
              <TravelMapTab mapTrips={mapTrips} />
            </div>
          )}

          {activeTab === 'visited' && (
            <div className="mtp__map-section">
              <p className="mtp__map-hint">
                Track every place you've been. Pin locations on your map and build your travel story.
              </p>
              <VisitedPlacesTab
                locations={visited}
                trips={trips}
                onAdd={handleAddVisited}
                onRemove={handleRemoveVisited}
              />
            </div>
          )}
        </div>
      </main>

      <ViAssistant />
    </div>
  );
};

export default MyTripsPage;
