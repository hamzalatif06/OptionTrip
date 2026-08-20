import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import {
  getMyTrips,
  getMapData,
  getVisitedLocations,
  addVisitedLocation,
  removeVisitedLocation,
  deleteTrip,
  renameTrip,
} from '../../services/tripsService';
import { getWishlist, removeFromWishlist } from '../../services/wishlistService';
import { shareTravelMap } from '../../services/travelMapService';
import DashboardTab from './DashboardTab';
import TravelMapTab from './TravelMapTab';
import VisitedPlacesTab from './VisitedPlacesTab';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import Loader from '../../components/Loader/Loader';
import './MyTripsPage.css';

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
const PRIVACY_LABELS = { private: 'Private', countries_only: 'Countries only', full_map: 'Full map', selected_trips: 'Selected trips' };

const TripCard = ({ trip, onDelete, onRename }) => {
  const dest          = trip.customTitle || trip.destination?.name || 'Unknown Destination';
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [draft,       setDraft]       = useState(dest);
  const [savingRename, setSavingRename] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const submitRename = async () => {
    if (!draft.trim() || draft.trim() === dest) { setRenaming(false); return; }
    setSavingRename(true);
    try {
      await onRename(trip.trip_id, draft.trim());
    } finally {
      setSavingRename(false);
      setRenaming(false);
    }
  };

  return (
    <div className="mtp__card">
      <div className="mtp__card-img" style={{ backgroundImage: `url(${getDestinationImage(trip.destination?.name || dest)})` }}>
        <span className="mtp__card-badge">{trip.dates?.duration_days || 0} Days</span>
        {trip.trip_type && <span className="mtp__card-type-badge">{trip.trip_type}</span>}
        {trip.status === 'booked_externally' && <span className="mtp__card-status-badge mtp__card-status-badge--pending">Booking in progress</span>}
        {trip.status === 'confirmed' && <span className="mtp__card-status-badge mtp__card-status-badge--confirmed">✓ Booked</span>}


        <div className="mtp__card-menu" ref={menuRef}>
          <button className="mtp__card-menu-btn" onClick={() => setMenuOpen(v => !v)} aria-label="Trip options">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="mtp__card-menu-dropdown">
              <button onClick={() => { setMenuOpen(false); setDraft(dest); setRenaming(true); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Rename
              </button>
              <button className="mtp__card-menu-delete" onClick={() => { setMenuOpen(false); onDelete(trip.trip_id, dest); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mtp__card-body">
        {renaming ? (
          <div className="mtp__card-rename">
            <input
              className="mtp__card-rename-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false); }}
              autoFocus
            />
            <button className="mtp__card-rename-save" onClick={submitRename} disabled={savingRename}>
              {savingRename ? '…' : 'Save'}
            </button>
            <button className="mtp__card-rename-cancel" onClick={() => setRenaming(false)}>✕</button>
          </div>
        ) : (
          <h3 className="mtp__card-title">{dest}</h3>
        )}

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
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {BUDGET_LABELS[trip.budget] || trip.budget}
            </span>
          )}
        </div>

        <div className="mtp__card-actions">
          <Link to={`/planned-trip/${trip.trip_id}`} className="mtp__card-btn primary">View Itinerary</Link>
          <Link to={`/trips/${trip.trip_id}`} className="mtp__card-btn secondary">Options</Link>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ tripName, onConfirm, onCancel, deleting }) => (
  <div className="mtp__modal-overlay" onClick={onCancel}>
    <div className="mtp__modal" onClick={e => e.stopPropagation()}>
      <h3>Delete trip?</h3>
      <p>Remove <strong>{tripName}</strong> from your saved trips? This cannot be undone.</p>
      <div className="mtp__modal-actions">
        <button className="mtp__modal-btn mtp__modal-btn--cancel" onClick={onCancel} disabled={deleting}>Cancel</button>
        <button className="mtp__modal-btn mtp__modal-btn--delete" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const MyTripsGrid = ({ trips, onDelete, onRename }) => {
  if (trips.length === 0) {
    return (
      <div className="mtp__empty">
        <div className="mtp__empty-icon">
          <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
            <circle cx="40" cy="40" r="38" stroke="#e2e8f0" strokeWidth="2"/>
            <path d="M25 40 Q40 20 55 40 Q40 60 25 40z" stroke="#94a3b8" strokeWidth="2" fill="none"/>
            <circle cx="40" cy="40" r="4" fill="#94a3b8"/>
            <path d="M40 30v-8M30 40h-8M40 50v8M50 40h8" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="mtp__empty-title">No trips saved yet</h3>
        <p className="mtp__empty-text">Plan your first adventure and save it to see it here.</p>
        <Link to="/plan-my-day" className="mtp__cta-btn">Start Planning Free</Link>
      </div>
    );
  }

  return (
    <div className="mtp__grid">
      {trips.map((trip) => (
        <TripCard key={trip.trip_id} trip={trip} onDelete={onDelete} onRename={onRename} />
      ))}
    </div>
  );
};

const MyTripsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab]       = useState('dashboard');
  const [trips, setTrips]               = useState([]);
  const [mapTrips, setMapTrips]         = useState([]);
  const [visited, setVisited]           = useState([]);
  const [wishlist, setWishlist]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const [sharingMap, setSharingMap]     = useState(false);
  const [shareMapUrl, setShareMapUrl]   = useState('');
  const mapPrivacy = user?.mapPrivacy || 'private';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/my-trips' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAccessToken();

        const [tripsRes, mapRes, visitedRes, wishlistRes] = await Promise.allSettled([
          getMyTrips(token),
          getMapData(token),
          getVisitedLocations(token),
          getWishlist(),
        ]);

        const savedTrips = tripsRes.status === 'fulfilled' && tripsRes.value?.success
          ? (tripsRes.value.data?.trips || [])
          : [];
        setTrips(savedTrips);

        if (mapRes.status === 'fulfilled' && mapRes.value?.success && (mapRes.value.trips || []).length > 0) {
          setMapTrips(mapRes.value.trips);
        } else {
          setMapTrips(savedTrips);
        }
        if (visitedRes.status === 'fulfilled' && visitedRes.value?.success) {
          setVisited(visitedRes.value.data?.locations || []);
        }
        if (wishlistRes.status === 'fulfilled') {
          setWishlist(Array.isArray(wishlistRes.value) ? wishlistRes.value : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

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

  const handleDeleteRequest = (tripId, tripName) => setDeleteTarget({ tripId, tripName });
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = getAccessToken();
      await deleteTrip(deleteTarget.tripId, token);
      setTrips(prev => prev.filter(t => t.trip_id !== deleteTarget.tripId));
      toast.success('Trip deleted.');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete trip. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameTrip = async (tripId, customTitle) => {
    try {
      const token = getAccessToken();
      await renameTrip(tripId, customTitle, token);
      setTrips(prev => prev.map(t => t.trip_id === tripId ? { ...t, customTitle } : t));
      toast.success('Trip renamed.');
    } catch {
      toast.error('Failed to rename trip. Please try again.');
      throw new Error('rename_failed');
    }
  };

  const handleShareMap = async () => {
    setSharingMap(true);
    try {
      const res = await shareTravelMap();
      if (res?.success) setShareMapUrl(res.data.shareUrl);
      else toast.error('Failed to generate share link.');
    } catch {
      toast.error('Failed to generate share link.');
    } finally {
      setSharingMap(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareMapUrl);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const handleRemoveWishlist = async (id) => {
    try {
      await removeFromWishlist(id);
      setWishlist(prev => prev.filter(w => w._id !== id));
      toast.success('Removed from wishlist.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  const stats = useMemo(() => ({
    trips:       trips.length,
    destinations: new Set(trips.map((t) => t.destination?.name).filter(Boolean)).size,
    days:        trips.reduce((s, t) => s + (t.dates?.duration_days || 0), 0),
    visited:     visited.length,
  }), [trips, visited]);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard',     icon: '🏠' },
    { id: 'trips',    label: 'My Trips',       icon: '🗺️' },
    { id: 'map',      label: 'Travel Map',      icon: '🌍' },
    { id: 'visited',  label: 'Visited Places',  icon: '📍' },
    { id: 'wishlist', label: 'Wishlist',         icon: '❤️' },
  ];

  if (authLoading || loading) {
    return <Loader size="fullpage" text="Loading your travel dashboard..." />;
  }

  return (
    <div className="mtp">
      <PageMeta title="My Trips" description="View and manage all your planned trips, travel map, and visited destinations." path="/my-trips" noIndex />

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


      <main className="mtp__content">
        <div className="mtp__content-inner">
          {error && (
            <div className="mtp__error">
              <span>⚠️ {error}</span>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab trips={trips} wishlist={wishlist} onViewMap={() => setActiveTab('map')} />
          )}

          {activeTab === 'trips' && (
            <MyTripsGrid trips={trips} onDelete={handleDeleteRequest} onRename={handleRenameTrip} />
          )}
          {deleteTarget && (
            <DeleteModal
              tripName={deleteTarget.tripName}
              onConfirm={handleDeleteConfirm}
              onCancel={() => setDeleteTarget(null)}
              deleting={deleting}
            />
          )}

          {activeTab === 'map' && (
            <div className="mtp__map-section">
              <div className="mtp__map-toolbar">
                <p className="mtp__map-hint">
                  {mapTrips.length > 0
                    ? `Showing ${mapTrips.length} saved trip destination${mapTrips.length !== 1 ? 's' : ''}. Click a marker for details.`
                    : 'Save trips to see them pinned on your world map.'}
                </p>
                <button type="button" className="mtp__share-map-btn" onClick={handleShareMap} disabled={sharingMap}>
                  {sharingMap ? 'Generating link…' : '🔗 Share my travel map'}
                </button>
              </div>
              {shareMapUrl && (
                <div className="mtp__share-map-result">
                  <input type="text" readOnly value={shareMapUrl} onFocus={(e) => e.target.select()} />
                  <button type="button" onClick={handleCopyShareLink}>Copy link</button>
                  <span className="mtp__share-map-note">
                    Visibility: <strong>{PRIVACY_LABELS[mapPrivacy] || mapPrivacy}</strong> — change this in{' '}
                    <Link to="/profile">Profile → Settings</Link>.
                  </span>
                </div>
              )}
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

          {activeTab === 'wishlist' && (
            <div className="mtp__wishlist">
              {wishlist.length === 0 ? (
                <div className="mtp__empty">
                  <div className="mtp__empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="48" height="48">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </div>
                  <h3 className="mtp__empty-title">Your wishlist is empty</h3>
                  <p className="mtp__empty-text">Save destinations you want to visit using the heart icon on destination cards.</p>
                  <Link to="/" className="mtp__cta-btn">Explore Destinations</Link>
                </div>
              ) : (
                <div className="mtp__grid">
                  {wishlist.map(item => (
                    <div key={item._id} className="mtp__card mtp__card--wishlist">
                      <div
                        className="mtp__card-img"
                        style={{ backgroundImage: `url(${item.imageUrl || getDestinationImage(item.destinationName)})` }}
                      >
                        <button
                          className="mtp__wishlist-remove"
                          onClick={() => handleRemoveWishlist(item._id)}
                          title="Remove from wishlist"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="mtp__card-body">
                        <h3 className="mtp__card-title">{item.destinationName}</h3>
                        {item.country && <p className="mtp__card-country">{item.country}</p>}
                        {item.notes && <p className="mtp__card-notes">{item.notes}</p>}
                        <div className="mtp__card-actions">
                          <Link to={`/?destination=${encodeURIComponent(item.destinationName)}`} className="mtp__card-btn primary">
                            Plan this trip
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ViAssistant />
    </div>
  );
};

export default MyTripsPage;
