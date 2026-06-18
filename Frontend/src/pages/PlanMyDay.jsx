import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  generateDayPlan,
  forwardGeocode,
  detectPreciseLocation,
  reverseGeocodeRobust,
  ipGeolocate,
  readCachedLocation,
  writeCachedLocation,
  clearCachedLocation
} from '../services/planMyDayService';
import './PlanMyDay.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const VIBES = [
  { key: 'foodie',    label: 'Foodie Hunt',     icon: 'fa-utensils',     accent: '#f59e0b' },
  { key: 'cultural',  label: 'Cultural',        icon: 'fa-landmark',     accent: '#8b5cf6' },
  { key: 'adventure', label: 'Adventure',       icon: 'fa-mountain',     accent: '#10b981' },
  { key: 'relaxed',   label: 'Relaxed',         icon: 'fa-leaf',         accent: '#06b6d4' },
  { key: 'romantic',  label: 'Romantic',        icon: 'fa-heart',        accent: '#ec4899' },
  { key: 'family',    label: 'Family Day',      icon: 'fa-children',     accent: '#3b82f6' },
  { key: 'local',     label: 'Like a Local',    icon: 'fa-map-marker-alt', accent: '#029e9d' },
  { key: 'nightlife', label: 'Nightlife',       icon: 'fa-moon',         accent: '#6366f1' },
  { key: 'workcafe',  label: 'Work + Café',     icon: 'fa-laptop',       accent: '#64748b' }
];

const BUDGETS = [
  { key: 'budget',   label: 'Budget',   symbol: '$'    },
  { key: 'moderate', label: 'Moderate', symbol: '$$'   },
  { key: 'premium',  label: 'Premium',  symbol: '$$$'  },
  { key: 'luxury',   label: 'Luxury',   symbol: '$$$$' }
];

const INTEREST_TAGS = [
  'Food', 'Coffee', 'Art', 'History', 'Architecture',
  'Nature', 'Photography', 'Shopping', 'Music', 'Markets',
  'Nightlife', 'Wellness', 'Hidden gems', 'Viewpoints'
];

const CATEGORY_META = {
  breakfast:   { icon: 'fa-mug-saucer',     color: '#f59e0b', label: 'Breakfast' },
  brunch:      { icon: 'fa-egg',            color: '#f59e0b', label: 'Brunch'    },
  cafe:        { icon: 'fa-mug-hot',        color: '#a16207', label: 'Café'      },
  coffee:      { icon: 'fa-mug-hot',        color: '#a16207', label: 'Coffee'    },
  lunch:       { icon: 'fa-utensils',       color: '#ea580c', label: 'Lunch'     },
  snack:       { icon: 'fa-cookie-bite',    color: '#f97316', label: 'Snack'     },
  dinner:      { icon: 'fa-bell-concierge', color: '#dc2626', label: 'Dinner'    },
  drinks:      { icon: 'fa-martini-glass',  color: '#9333ea', label: 'Drinks'    },
  sightseeing: { icon: 'fa-camera',         color: '#0ea5e9', label: 'Sightseeing' },
  museum:      { icon: 'fa-landmark',       color: '#7c3aed', label: 'Museum'    },
  park:        { icon: 'fa-tree',           color: '#16a34a', label: 'Park'      },
  viewpoint:   { icon: 'fa-mountain-sun',   color: '#0d9488', label: 'Viewpoint' },
  shopping:    { icon: 'fa-bag-shopping',   color: '#db2777', label: 'Shopping'  },
  activity:    { icon: 'fa-person-hiking',  color: '#16a34a', label: 'Activity'  },
  walk:        { icon: 'fa-person-walking', color: '#0d9488', label: 'Walk'      },
  nightlife:   { icon: 'fa-moon',           color: '#4f46e5', label: 'Nightlife' },
  wellness:    { icon: 'fa-spa',            color: '#10b981', label: 'Wellness'  },
  local:       { icon: 'fa-map-pin',        color: '#029e9d', label: 'Local'     }
};

const PACE_META = {
  relaxed:  { label: 'Relaxed pace',  icon: 'fa-leaf'      },
  moderate: { label: 'Moderate pace', icon: 'fa-walking'   },
  packed:   { label: 'Packed day',    icon: 'fa-bolt'      }
};

const LOADING_MESSAGES = [
  'Pinpointing where you are…',
  'Checking the weather…',
  'Scanning the city for hidden gems…',
  'Picking the best food spots…',
  'Optimising your route…',
  'Catching golden-hour timing…',
  'Sprinkling in pro tips…',
  'Polishing the final plan…'
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatTimeLabel = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const display = ((h + 11) % 12) + 1;
  return `${display}:${String(m || 0).padStart(2, '0')} ${period}`;
};

const formatDuration = (min) => {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const formatCost = (val, currency) => {
  if (val === 0) return 'Free';
  if (val == null) return '';
  const symbol = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$' }[currency] || '';
  return `${symbol}${Math.round(val)}${symbol ? '' : ` ${currency || ''}`}`.trim();
};

/**
 * Build the best Google Maps Directions URL we can.
 *
 * Priority (best → worst):
 *   1. coordinates + place_id  — pins the EXACT venue on Google's map. Both
 *      params combined are how Google's own apps build deep links.
 *   2. place_id alone          — Google resolves the venue from its ID.
 *   3. coordinates alone       — drops a pin but no place name shown.
 *   4. address string          — text search fallback.
 *
 * No `origin` parameter is passed → Google Maps uses the user's current
 * location automatically when they tap "Directions".
 */
const buildDirectionsUrl = (placeOrActivity, planLocation) => {
  const { coordinates, place_id, address, title, name, neighborhood } = placeOrActivity || {};
  const city    = planLocation?.city    || '';
  const country = planLocation?.country || '';

  const hasCoords = coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number';

  if (hasCoords && place_id) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}` +
           `&destination_place_id=${encodeURIComponent(place_id)}`;
  }
  if (place_id) {
    // Google still requires a destination string with place_id; use a sensible label.
    const label = title || name || address || 'Destination';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(label)}` +
           `&destination_place_id=${encodeURIComponent(place_id)}`;
  }
  if (hasCoords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
  }
  const query = address && address.length > 4
    ? address
    : [title || name, neighborhood, city, country].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
};

const openDirections = (placeOrActivity, planLocation) => {
  const url = buildDirectionsUrl(placeOrActivity, planLocation);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/** Pull "HH:MM" out of Open-Meteo's naive ISO string (already destination-local). */
const extractTime = (iso) => (iso || '').slice(11, 16);

/** Haversine great-circle distance in meters between two {lat,lng}. */
const haversineMeters = (a, b) => {
  if (!a || !b || typeof a.lat !== 'number' || typeof b.lat !== 'number') return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
};

/** Distance + (when walkable) walking-time label, e.g. "1.2 km · ~15 min walk". */
const describeDistance = (meters) => {
  if (meters == null) return null;
  // Straight-line is ~0.8× actual walking distance in dense cities. Compensate
  // by using a slower 70 m/min effective walking pace.
  const walkMin = Math.round(meters / 70);
  const distStr = meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
  if (meters < 100)  return `Nearby · ${distStr}`;
  if (meters < 4000) return `${distStr} · ~${walkMin} min walk`;
  return                     `${distStr} away`;
};

// ─── Component ──────────────────────────────────────────────────────────────

const PlanMyDay = () => {
  // Stage: 'setup' | 'loading' | 'results'
  const [stage, setStage] = useState('setup');

  // Scroll to top whenever the stage changes. Without this, clicking
  // "Build My Day" from the bottom of a tall setup page leaves the user
  // scrolled past the loader animation (or past the result hero).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }, [stage]);

  // Location
  const [location, setLocation]           = useState({ city: '', country: '', neighborhood: '', lat: null, lng: null });
  // 'idle' | 'detecting' | 'improving' | 'detected' | 'ip-fallback' | 'denied' | 'manual'
  const [locStatus, setLocStatus]         = useState('idle');
  const [accuracyM, setAccuracyM]         = useState(null);
  const [locSource, setLocSource]         = useState(null); // 'gps' | 'ip' | 'cache' | 'manual'
  const [manualCity, setManualCity]       = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError]     = useState('');
  const [editingLoc, setEditingLoc]       = useState(false);
  const [editCity, setEditCity]           = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');

  // Plan settings
  const [date, setDate]                 = useState(todayISO());
  const [startTime, setStartTime]       = useState('10:00');
  const [durationHours, setDurationHours] = useState(8);
  const [vibe, setVibe]                 = useState('local');
  const [budget, setBudget]             = useState('moderate');
  const [interests, setInterests]       = useState([]);
  const [partySize, setPartySize]       = useState(1);

  // Result
  const [plan, setPlan]   = useState(null);
  const [error, setError] = useState('');

  // Loading message rotation
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingTimerRef = useRef(null);

  // ── Robust multi-stage location detection ──────────────────────────────
  // 1. Try session cache (fresh, accurate-enough fix from this session)
  // 2. Progressive GPS (watchPosition, high accuracy, up to 12s)
  // 3. Dual reverse-geocoder (Nominatim + BigDataCloud merged)
  // 4. IP fallback if GPS denied/failed
  const runLocationDetection = async ({ cancelledRef }) => {
    // ── 1. Cache hit?
    const cached = readCachedLocation();
    if (cached && cached.location?.city) {
      setLocation(cached.location);
      setAccuracyM(cached.accuracy_m);
      setLocSource('cache');
      setLocStatus('detected');
      return;
    }

    if (!('geolocation' in navigator)) {
      // Skip straight to IP fallback if the API isn't there at all.
      const ip = await ipGeolocate();
      if (cancelledRef.current) return;
      if (ip) {
        setLocation({ city: ip.city, country: ip.country, neighborhood: ip.neighborhood, lat: ip.lat, lng: ip.lng });
        setAccuracyM(ip.accuracy_m);
        setLocSource('ip');
        setLocStatus('ip-fallback');
      } else {
        setLocStatus('denied');
      }
      return;
    }

    // ── 2. Progressive GPS
    setLocStatus('detecting');
    setAccuracyM(null);
    try {
      const fix = await detectPreciseLocation({
        targetAccuracyM: 40,
        hardTimeoutMs:   12000,
        onUpdate: (f) => {
          if (cancelledRef.current) return;
          setAccuracyM(Math.round(f.accuracy));
          setLocStatus(f.accuracy <= 80 ? 'detected' : 'improving');
        }
      });
      if (cancelledRef.current) return;

      // ── 3. Dual reverse-geocode
      const rev = await reverseGeocodeRobust(fix.lat, fix.lng);
      if (cancelledRef.current) return;

      if (!rev || !rev.city) {
        throw new Error('Reverse geocoding returned no city');
      }
      const next = {
        city:         rev.city,
        country:      rev.country,
        neighborhood: rev.neighborhood,
        lat:          fix.lat,
        lng:          fix.lng
      };
      setLocation(next);
      setAccuracyM(Math.round(fix.accuracy));
      setLocSource('gps');
      setLocStatus('detected');
      writeCachedLocation(next, Math.round(fix.accuracy), 'gps');
    } catch (err) {
      console.warn('Precise GPS failed:', err?.message || err);
      // ── 4. IP fallback
      const ip = await ipGeolocate();
      if (cancelledRef.current) return;
      if (ip) {
        const next = { city: ip.city, country: ip.country, neighborhood: ip.neighborhood, lat: ip.lat, lng: ip.lng };
        setLocation(next);
        setAccuracyM(ip.accuracy_m);
        setLocSource('ip');
        setLocStatus('ip-fallback');
      } else {
        setLocStatus('denied');
      }
    }
  };

  useEffect(() => {
    const cancelledRef = { current: false };
    runLocationDetection({ cancelledRef });
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetryLocation = () => {
    clearCachedLocation();
    setLocation({ city: '', country: '', neighborhood: '', lat: null, lng: null });
    setAccuracyM(null);
    setLocSource(null);
    const cancelledRef = { current: false };
    runLocationDetection({ cancelledRef });
  };

  // ── Loading message rotator ────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'loading') return;
    setLoadingMsgIdx(0);
    loadingTimerRef.current = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(loadingTimerRef.current);
  }, [stage]);

  // ── Manual location search ─────────────────────────────────────────────
  const handleManualLocation = async (e) => {
    e?.preventDefault?.();
    if (!manualCity.trim()) return;
    setManualLoading(true);
    setManualError('');
    try {
      const result = await forwardGeocode(manualCity.trim());
      if (!result) {
        setManualError('Could not find that place. Try a different spelling.');
      } else {
        setLocation(result);
        setLocStatus('manual');
        setLocSource('manual');
        setAccuracyM(null);
        setManualCity('');
        writeCachedLocation(result, null, 'manual');
      }
    } catch (err) {
      setManualError(err.message || 'Failed to find location.');
    } finally {
      setManualLoading(false);
    }
  };

  // ── Edit detected location (manual override) ───────────────────────────
  const startEditingLocation = () => {
    setEditCity(location.city || '');
    setEditNeighborhood(location.neighborhood || '');
    setEditingLoc(true);
  };
  const cancelEditingLocation = () => {
    setEditingLoc(false);
  };
  const saveEditedLocation = () => {
    const city = editCity.trim();
    const hood = editNeighborhood.trim();
    if (!city) return;
    const next = { ...location, city, neighborhood: hood };
    setLocation(next);
    setLocSource('manual');
    setAccuracyM(null);
    setEditingLoc(false);
    setLocStatus('manual');
    writeCachedLocation(next, null, 'manual');
  };

  const toggleInterest = (tag) => {
    setInterests(prev => prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : prev.length >= 6 ? prev : [...prev, tag]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!location.city && !(location.lat && location.lng)) {
      setError('Please share your location or enter a city to start.');
      return;
    }
    setError('');
    setStage('loading');
    try {
      const resp = await generateDayPlan({
        location, date, startTime, durationHours,
        vibe, budget, interests, partySize
      });
      if (resp.success && resp.data) {
        setPlan(resp.data);
        setStage('results');
      } else {
        throw new Error(resp.message || 'Empty response');
      }
    } catch (err) {
      console.error('PlanMyDay error:', err);
      setError(err.message || 'Failed to build your day plan. Please try again.');
      setStage('setup');
    }
  };

  const handleStartOver = () => {
    setPlan(null);
    setStage('setup');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerate = () => {
    setError('');
    handleSubmit();
  };

  const handleCopyPlan = async () => {
    if (!plan) return;
    const lines = [];
    lines.push(`🗓️ My Day in ${plan.location?.city || ''}${plan.location?.country ? `, ${plan.location.country}` : ''}`);
    lines.push(`${plan.vibe_label || ''} · ${plan.pace || ''} pace`);
    if (plan.weather) lines.push(`Weather: ${plan.weather.emoji} ${plan.weather.label}, ${plan.weather.temp_max_c ?? '?'}°/${plan.weather.temp_min_c ?? '?'}°C`);
    lines.push('');
    plan.activities?.forEach(a => {
      lines.push(`${formatTimeLabel(a.time)} · ${formatDuration(a.duration_minutes)} · ${a.title}`);
      if (a.description) lines.push(`  ${a.description}`);
      lines.push('');
    });
    if (plan.tips?.length) {
      lines.push('Tips:');
      plan.tips.forEach(t => lines.push(`• ${t}`));
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch { /* noop */ }
  };

  const handleShare = async () => {
    if (!plan) return;
    const title = `My day in ${plan.location?.city || ''}`;
    const text  = plan.summary || 'Check out my AI-planned day';
    try {
      if (navigator.share) await navigator.share({ title, text, url: window.location.href });
      else await handleCopyPlan();
    } catch { /* noop */ }
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const canSubmit = !!location.city || (location.lat && location.lng);

  // ── Render: SETUP ──────────────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="pmd-page">
        <div className="pmd-hero">
          <div className="pmd-hero__blob pmd-hero__blob--1" />
          <div className="pmd-hero__blob pmd-hero__blob--2" />
          <div className="container pmd-hero__inner">
            <span className="pmd-hero__eyebrow">AI Day Planner</span>
            <h1 className="pmd-hero__title">Plan My Day</h1>
            <p className="pmd-hero__sub">
              Tell us where you are and what you're in the mood for — we'll craft a real, walkable day with food, sights, and pro tips, tuned to today's weather.
            </p>
          </div>
        </div>

        <div className="container pmd-form-wrap">
          <PlanSetupForm
            location={location} locStatus={locStatus}
            accuracyM={accuracyM} locSource={locSource}
            onRetryLocation={handleRetryLocation}
            manualCity={manualCity} setManualCity={setManualCity}
            manualLoading={manualLoading} manualError={manualError}
            onManualSubmit={handleManualLocation}

            editingLoc={editingLoc}
            editCity={editCity} setEditCity={setEditCity}
            editNeighborhood={editNeighborhood} setEditNeighborhood={setEditNeighborhood}
            onStartEditLocation={startEditingLocation}
            onCancelEditLocation={cancelEditingLocation}
            onSaveEditLocation={saveEditedLocation}

            date={date} setDate={setDate}
            startTime={startTime} setStartTime={setStartTime}
            durationHours={durationHours} setDurationHours={setDurationHours}
            vibe={vibe} setVibe={setVibe}
            budget={budget} setBudget={setBudget}
            interests={interests} toggleInterest={toggleInterest}
            partySize={partySize} setPartySize={setPartySize}

            error={error} canSubmit={canSubmit}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  // ── Render: LOADING ────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="pmd-page pmd-loading">
        <div className="pmd-loading__inner">
          <div className="pmd-loading__planet">
            <i className="fas fa-globe-americas pmd-loading__globe-icon" />
            <i className="fas fa-plane pmd-loading__plane-icon" />
          </div>
          <h2 className="pmd-loading__title">Building your day in {location.city || 'your city'}…</h2>
          <p key={loadingMsgIdx} className="pmd-loading__msg">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          <div className="pmd-loading__bar"><span /></div>
        </div>
      </div>
    );
  }

  // ── Render: RESULTS ────────────────────────────────────────────────────
  return (
    <div className="pmd-page">
      <PlanResults
        plan={plan}
        onStartOver={handleStartOver}
        onRegenerate={handleRegenerate}
        onCopy={handleCopyPlan}
        onShare={handleShare}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Setup form
// ═══════════════════════════════════════════════════════════════════════════
// Returns { tier, label } based on accuracy radius in meters.
const accuracyTier = (m) => {
  if (m == null)        return { tier: 'unknown', label: '' };
  if (m <= 60)          return { tier: 'great',   label: `Pinpointed within ~${m} m` };
  if (m <= 250)         return { tier: 'good',    label: `Within ~${m} m` };
  if (m <= 1000)        return { tier: 'rough',   label: `Approximate (~${m} m)` };
  return                       { tier: 'coarse',  label: `Very approximate (~${(m / 1000).toFixed(1)} km)` };
};

const PlanSetupForm = ({
  location, locStatus,
  accuracyM, locSource, onRetryLocation,
  manualCity, setManualCity,
  manualLoading, manualError,
  onManualSubmit,
  editingLoc,
  editCity, setEditCity,
  editNeighborhood, setEditNeighborhood,
  onStartEditLocation, onCancelEditLocation, onSaveEditLocation,
  date, setDate,
  startTime, setStartTime,
  durationHours, setDurationHours,
  vibe, setVibe,
  budget, setBudget,
  interests, toggleInterest,
  partySize, setPartySize,
  error, canSubmit, onSubmit
}) => (
  <>
    {/* Location card */}
    <section className="pmd-card pmd-card--location">
      <div className="pmd-card__head">
        <div className="pmd-card__icon"><i className="fas fa-location-crosshairs" /></div>
        <div>
          <h3 className="pmd-card__title">Where are you?</h3>
          <p className="pmd-card__sub">We use this to find places nearby — never stored.</p>
        </div>
      </div>

      {(locStatus === 'detecting' || locStatus === 'improving') && (
        <div className="pmd-loc-state pmd-loc-state--pending">
          <span className="pmd-mini-spinner" />
          <span className="pmd-loc-state__text">
            {locStatus === 'improving' ? 'Improving accuracy…' : 'Detecting your location…'}
            {accuracyM != null && (
              <span className="pmd-loc-state__country"> (~{accuracyM} m so far)</span>
            )}
          </span>
        </div>
      )}

      {(locStatus === 'detected' || locStatus === 'manual' || locStatus === 'ip-fallback') && location.city && !editingLoc && (
        <div className={`pmd-loc-state pmd-loc-state--ok${locStatus === 'ip-fallback' ? ' pmd-loc-state--ip' : ''}`}>
          <i className={`fas ${locStatus === 'ip-fallback' ? 'fa-globe' : 'fa-circle-check'}`} />
          <span className="pmd-loc-state__text">
            <strong>{location.neighborhood ? `${location.neighborhood}, ` : ''}{location.city}</strong>
            {location.country ? <span className="pmd-loc-state__country">, {location.country}</span> : null}
            {(() => {
              if (locSource === 'manual') {
                return <span className={`pmd-acc-badge pmd-acc-badge--manual`}><i className="fas fa-pencil" /> Set manually</span>;
              }
              if (locSource === 'ip') {
                return <span className={`pmd-acc-badge pmd-acc-badge--rough`}><i className="fas fa-globe" /> Approx. from IP</span>;
              }
              const t = accuracyTier(accuracyM);
              if (!t.label) return null;
              return (
                <span className={`pmd-acc-badge pmd-acc-badge--${t.tier}`}>
                  <i className="fas fa-bullseye" /> {t.label}
                </span>
              );
            })()}
          </span>
          <div className="pmd-loc-state__btns">
            {locSource !== 'manual' && (
              <button
                type="button"
                className="pmd-loc-state__icon-btn"
                onClick={onRetryLocation}
                title="Re-detect location"
              >
                <i className="fas fa-arrows-rotate" />
              </button>
            )}
            <button
              type="button"
              className="pmd-loc-state__edit"
              onClick={onStartEditLocation}
              title="Fix or refine this"
            >
              <i className="fas fa-pen" /> Edit
            </button>
          </div>
        </div>
      )}

      {editingLoc && (
        <div className="pmd-loc-edit">
          <p className="pmd-loc-edit__hint">
            Auto-detection can be off in some cities. Fix what's wrong — these values are what we'll send to the planner.
          </p>
          <div className="pmd-loc-edit__row">
            <label className="pmd-field">
              <span className="pmd-field__label">City</span>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="e.g. Lahore"
              />
            </label>
            <label className="pmd-field">
              <span className="pmd-field__label">Neighborhood / area</span>
              <input
                type="text"
                value={editNeighborhood}
                onChange={(e) => setEditNeighborhood(e.target.value)}
                placeholder="e.g. Johar Town"
              />
            </label>
          </div>
          <div className="pmd-loc-edit__actions">
            <button type="button" className="pmd-loc-edit__cancel" onClick={onCancelEditLocation}>
              Cancel
            </button>
            <button type="button" className="pmd-loc-edit__save" onClick={onSaveEditLocation} disabled={!editCity.trim()}>
              <i className="fas fa-check" /> Save
            </button>
          </div>
        </div>
      )}

      {locStatus === 'denied' && !location.city && !editingLoc && (
        <div className="pmd-loc-state pmd-loc-state--denied">
          <i className="fas fa-triangle-exclamation" />
          Couldn't get your location. Enter a city below.
        </div>
      )}

      {!editingLoc && (
        <>
          <form className="pmd-loc-search" onSubmit={onManualSubmit}>
            <i className="fas fa-search pmd-loc-search__icon" />
            <input
              type="text"
              placeholder="Or type a city — e.g. Lisbon, Tokyo, Paris…"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
            />
            <button type="submit" disabled={!manualCity.trim() || manualLoading}>
              {manualLoading ? <span className="pmd-mini-spinner" /> : 'Set'}
            </button>
          </form>
          {manualError && <p className="pmd-loc-search__error">{manualError}</p>}
        </>
      )}
    </section>

    {/* Vibe + when */}
    <section className="pmd-card">
      <div className="pmd-card__head">
        <div className="pmd-card__icon pmd-card__icon--alt"><i className="fas fa-wand-magic-sparkles" /></div>
        <div>
          <h3 className="pmd-card__title">What's the vibe?</h3>
          <p className="pmd-card__sub">Pick one — it shapes everything we suggest.</p>
        </div>
      </div>
      <div className="pmd-vibe-grid">
        {VIBES.map(v => (
          <button
            key={v.key}
            type="button"
            className={`pmd-vibe-chip${vibe === v.key ? ' pmd-vibe-chip--active' : ''}`}
            style={vibe === v.key ? { '--vibe-accent': v.accent } : undefined}
            onClick={() => setVibe(v.key)}
          >
            <span className="pmd-vibe-chip__icon"><i className={`fas ${v.icon}`} /></span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>
    </section>

    {/* When & duration */}
    <section className="pmd-card">
      <div className="pmd-card__head">
        <div className="pmd-card__icon pmd-card__icon--alt"><i className="fas fa-clock" /></div>
        <div>
          <h3 className="pmd-card__title">When?</h3>
          <p className="pmd-card__sub">Today by default — adjust if you're planning ahead.</p>
        </div>
      </div>
      <div className="pmd-grid-3">
        <label className="pmd-field">
          <span className="pmd-field__label">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={todayISO()} />
        </label>
        <label className="pmd-field">
          <span className="pmd-field__label">Start time</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step="900" />
        </label>
        <label className="pmd-field">
          <span className="pmd-field__label">Duration</span>
          <div className="pmd-duration-control">
            <button type="button" onClick={() => setDurationHours(d => Math.max(3, d - 1))}><i className="fas fa-minus" /></button>
            <span>{durationHours}h</span>
            <button type="button" onClick={() => setDurationHours(d => Math.min(16, d + 1))}><i className="fas fa-plus" /></button>
          </div>
        </label>
      </div>
    </section>

    {/* Budget + party */}
    <section className="pmd-card">
      <div className="pmd-card__head">
        <div className="pmd-card__icon pmd-card__icon--alt"><i className="fas fa-coins" /></div>
        <div>
          <h3 className="pmd-card__title">Budget &amp; party</h3>
          <p className="pmd-card__sub">Roughly — we'll tune food and activities to match.</p>
        </div>
      </div>
      <div className="pmd-grid-2">
        <div>
          <span className="pmd-field__label">Budget</span>
          <div className="pmd-budget-row">
            {BUDGETS.map(b => (
              <button
                key={b.key}
                type="button"
                className={`pmd-budget-chip${budget === b.key ? ' pmd-budget-chip--active' : ''}`}
                onClick={() => setBudget(b.key)}
              >
                <span className="pmd-budget-chip__symbol">{b.symbol}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="pmd-field">
          <span className="pmd-field__label">Party size</span>
          <div className="pmd-duration-control">
            <button type="button" onClick={() => setPartySize(p => Math.max(1, p - 1))}><i className="fas fa-minus" /></button>
            <span>{partySize}</span>
            <button type="button" onClick={() => setPartySize(p => Math.min(12, p + 1))}><i className="fas fa-plus" /></button>
          </div>
        </label>
      </div>
    </section>

    {/* Interests */}
    <section className="pmd-card">
      <div className="pmd-card__head">
        <div className="pmd-card__icon pmd-card__icon--alt"><i className="fas fa-heart" /></div>
        <div>
          <h3 className="pmd-card__title">What do you love?</h3>
          <p className="pmd-card__sub">Pick up to 6 — totally optional.</p>
        </div>
      </div>
      <div className="pmd-tag-grid">
        {INTEREST_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            className={`pmd-tag${interests.includes(tag) ? ' pmd-tag--active' : ''}`}
            onClick={() => toggleInterest(tag)}
          >
            {interests.includes(tag) && <i className="fas fa-check" />}
            {tag}
          </button>
        ))}
      </div>
    </section>

    {/* Submit */}
    {error && <div className="pmd-form-error"><i className="fas fa-circle-exclamation" /> {error}</div>}
    <div className="pmd-submit-row">
      <button
        type="button"
        className="pmd-submit-btn"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        <i className="fas fa-wand-magic-sparkles" />
        Build My Day
        <i className="fas fa-arrow-right" />
      </button>
      {!canSubmit && <p className="pmd-submit-hint">Allow location or enter a city above to continue.</p>}
    </div>
  </>
);

// ═══════════════════════════════════════════════════════════════════════════
// Results
// ═══════════════════════════════════════════════════════════════════════════
const PlanResults = ({ plan, onStartOver, onRegenerate, onCopy, onShare }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const total = plan?.activities?.length || 0;
  const totalDurationMin = useMemo(
    () => (plan?.activities || []).reduce((acc, a) => acc + (a.duration_minutes || 0), 0),
    [plan]
  );
  const paceMeta = PACE_META[plan?.pace] || PACE_META.moderate;

  return (
    <>
      {/* Hero card */}
      <div className="pmd-result-hero">
        <div className="pmd-result-hero__bg" />
        <div className="container pmd-result-hero__inner">
          <div className="pmd-result-hero__top">
            <span className="pmd-result-hero__eyebrow">
              <i className="fas fa-map-pin" />
              {plan.location?.city}{plan.location?.country ? `, ${plan.location.country}` : ''}
            </span>
            <span className="pmd-result-hero__date">
              <i className="fas fa-calendar-day" />
              {new Date((plan.date || todayISO()) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h1 className="pmd-result-hero__title">
            {plan.vibe_label || 'Your Day'}
          </h1>
          <p className="pmd-result-hero__summary">{plan.summary}</p>

          <div className="pmd-result-hero__stats">
            <div className="pmd-stat">
              <span className="pmd-stat__num">{total}</span>
              <span className="pmd-stat__lbl">stops</span>
            </div>
            <div className="pmd-stat">
              <span className="pmd-stat__num">{Math.round(totalDurationMin / 60)}h</span>
              <span className="pmd-stat__lbl">total</span>
            </div>
            <div className="pmd-stat">
              <span className="pmd-stat__num">
                {formatCost(plan.estimated_total_cost, plan.currency) || '—'}
              </span>
              <span className="pmd-stat__lbl">est. /person</span>
            </div>
            <div className="pmd-stat pmd-stat--pace">
              <i className={`fas ${paceMeta.icon}`} />
              <span className="pmd-stat__lbl">{paceMeta.label}</span>
            </div>
            {plan.weather?.sunrise && plan.weather?.sunset && (
              <div className="pmd-stat pmd-stat--sun">
                <div className="pmd-stat__sun-row"><i className="fas fa-sun" /> {extractTime(plan.weather.sunrise)}</div>
                <div className="pmd-stat__sun-row"><i className="fas fa-moon" /> {extractTime(plan.weather.sunset)}</div>
              </div>
            )}
          </div>

          {/* Weather strip */}
          {plan.weather && (
            <div className="pmd-weather-strip">
              <div className="pmd-weather-strip__emoji">{plan.weather.emoji}</div>
              <div className="pmd-weather-strip__body">
                <span className="pmd-weather-strip__label">{plan.weather.label}</span>
                <span className="pmd-weather-strip__temp">
                  {plan.weather.temp_max_c != null && `${Math.round(plan.weather.temp_max_c)}° / ${Math.round(plan.weather.temp_min_c)}°C`}
                  {typeof plan.weather.precip_prob === 'number' && plan.weather.precip_prob > 20 && ` · 💧 ${plan.weather.precip_prob}%`}
                </span>
              </div>
              <div className="pmd-weather-strip__advice">{plan.weather_advice}</div>
            </div>
          )}

          {/* Action bar */}
          <div className="pmd-action-bar">
            <button className="pmd-action-btn" onClick={handleCopy}>
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /> {copied ? 'Copied!' : 'Copy plan'}
            </button>
            <button className="pmd-action-btn" onClick={onShare}>
              <i className="fas fa-share-nodes" /> Share
            </button>
            <button className="pmd-action-btn" onClick={onRegenerate}>
              <i className="fas fa-arrows-rotate" /> Regenerate
            </button>
            <button className="pmd-action-btn pmd-action-btn--primary" onClick={onStartOver}>
              <i className="fas fa-plus" /> New plan
            </button>
          </div>
        </div>
      </div>

      {/* Timeline — each card includes its own mini-map */}
      <div className="container pmd-timeline-wrap">
        <h2 className="pmd-section-heading"><i className="fas fa-route" /> Your day, hour by hour</h2>
        <div className="pmd-timeline">
          {(plan.activities || []).map((a, idx) => (
            <ActivityCard
              key={idx}
              index={idx}
              activity={a}
              currency={plan.currency}
              planLocation={plan.location}
            />
          ))}
        </div>

        {/* Food picks */}
        {plan.food_picks?.length > 0 && (
          <>
            <h2 className="pmd-section-heading"><i className="fas fa-utensils" /> Food picks</h2>
            <div className="pmd-food-grid">
              {plan.food_picks.map((f, i) => (
                <div key={i} className="pmd-food-card">
                  <div className="pmd-food-card__head">
                    <span className="pmd-food-card__meal">{f.meal}</span>
                    <span className="pmd-food-card__price">{f.price_tier}</span>
                  </div>
                  <div className="pmd-food-card__name">{f.name}</div>
                  {f.neighborhood && <div className="pmd-food-card__hood"><i className="fas fa-location-dot" /> {f.neighborhood}</div>}
                  <div className="pmd-food-card__why">{f.why}</div>
                  <button
                    type="button"
                    className="pmd-directions-btn pmd-directions-btn--compact"
                    onClick={() => openDirections(f, plan.location)}
                    title={f.address || `${f.name}${f.neighborhood ? `, ${f.neighborhood}` : ''}`}
                  >
                    <i className="fas fa-diamond-turn-right" />
                    Directions
                  </button>
                  {/* `f` already carries place_id + coordinates resolved server-side; openDirections picks them up. */}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Local phrases card */}
        {plan.local_phrases?.length > 0 && (
          <>
            <h2 className="pmd-section-heading"><i className="fas fa-comment-dots" /> Speak like a local</h2>
            <div className="pmd-phrase-grid">
              {plan.local_phrases.map((p, i) => (
                <div key={i} className="pmd-phrase">
                  <div className="pmd-phrase__when">{p.when}</div>
                  <div className="pmd-phrase__line">{p.phrase}</div>
                  {p.pronunciation && <div className="pmd-phrase__pron">/ {p.pronunciation} /</div>}
                  <div className="pmd-phrase__meaning">{p.meaning}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Insider tips card */}
        {plan.insider_tips?.length > 0 && (
          <>
            <h2 className="pmd-section-heading"><i className="fas fa-key" /> Insider intel</h2>
            <ul className="pmd-insider-list">
              {plan.insider_tips.map((t, i) => (
                <li key={i} className="pmd-insider-item">
                  <i className="fas fa-circle-check" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Tips & extras */}
        <div className="pmd-extras">
          {plan.tips?.length > 0 && (
            <div className="pmd-extra-card">
              <div className="pmd-extra-card__head">
                <i className="fas fa-lightbulb" />
                <h3>Pro tips</h3>
              </div>
              <ul className="pmd-extra-list">
                {plan.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {plan.transport_advice && (
            <div className="pmd-extra-card">
              <div className="pmd-extra-card__head">
                <i className="fas fa-route" />
                <h3>Getting around</h3>
              </div>
              <p>{plan.transport_advice}</p>
            </div>
          )}
          {plan.rainy_plan && (
            <div className="pmd-extra-card">
              <div className="pmd-extra-card__head">
                <i className="fas fa-cloud-rain" />
                <h3>Plan B for rain</h3>
              </div>
              <p>{plan.rainy_plan}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Activity card ──────────────────────────────────────────────────────────
const ActivityCard = ({ activity, index, currency, planLocation }) => {
  const cat = CATEGORY_META[activity.category] || CATEGORY_META.local;
  const hasCoords =
    activity.coordinates &&
    typeof activity.coordinates.lat === 'number' &&
    typeof activity.coordinates.lng === 'number';

  return (
    <div
      className="pmd-activity"
      data-activity-idx={index}
      style={{ '--cat-color': cat.color, animationDelay: `${index * 0.06}s` }}
    >
      <div className="pmd-activity__time">
        <div className="pmd-activity__time-main">{formatTimeLabel(activity.time)}</div>
        <div className="pmd-activity__time-dur">{formatDuration(activity.duration_minutes)}</div>
      </div>
      <div className="pmd-activity__rail">
        <div className="pmd-activity__dot"><i className={`fas ${cat.icon}`} /></div>
      </div>
      <div className="pmd-activity__card">
        <div className="pmd-activity__head">
          <span className="pmd-activity__badge">{cat.label}</span>
          {activity.cost_estimate != null && (
            <span className="pmd-activity__cost">{formatCost(activity.cost_estimate, currency)}</span>
          )}
        </div>
        <h4 className="pmd-activity__title">{activity.title}</h4>
        {activity.neighborhood && (
          <div className="pmd-activity__hood">
            <i className="fas fa-location-dot" /> {activity.neighborhood}
          </div>
        )}
        {activity.description && <p className="pmd-activity__desc">{activity.description}</p>}
        {activity.why && (
          <div className="pmd-activity__why">
            <i className="fas fa-quote-left" /> {activity.why}
          </div>
        )}
        {activity.tip && (
          <div className="pmd-activity__tip">
            <i className="fas fa-lightbulb" /> <span>{activity.tip}</span>
          </div>
        )}
        {activity.tags?.length > 0 && (
          <div className="pmd-activity__tags">
            {activity.tags.map((t, i) => <span key={i} className="pmd-activity__tag">{t}</span>)}
          </div>
        )}

        {hasCoords ? (
          <ActivityMap
            lat={activity.coordinates.lat}
            lng={activity.coordinates.lng}
            placeId={activity.place_id}
            title={activity.title}
            address={activity.address}
            neighborhood={activity.neighborhood}
            planLocation={planLocation}
            color={cat.color}
          />
        ) : (
          /* Fallback when the AI didn't give us coords — keep the address-based directions link */
          <button
            type="button"
            className="pmd-directions-btn"
            onClick={() => openDirections(activity, planLocation)}
            title={activity.address || `${activity.title}${activity.neighborhood ? `, ${activity.neighborhood}` : ''}`}
          >
            <i className="fas fa-diamond-turn-right" />
            Get directions
            <i className="fas fa-arrow-up-right-from-square pmd-directions-btn__ext" />
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ActivityMap — small Leaflet map for a single activity, with a directions
// overlay that opens Google Maps routing from the user's current location.
//
// Lazy-mounted via IntersectionObserver so we don't initialize 6+ Leaflet
// instances on first render (each one pulls down tiles, eats memory, and
// slows the page). The map mounts only when its card scrolls within ~250px
// of the viewport.
// ═══════════════════════════════════════════════════════════════════════════
const ActivityMap = ({ lat, lng, placeId, title, address, neighborhood, planLocation, color }) => {
  const wrapperRef = useRef(null);   // the container we observe for visibility
  const nodeRef    = useRef(null);   // the actual map div
  const mapInstRef = useRef(null);
  const [visible, setVisible]       = useState(false);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && !!window.L);

  // 1. Wait until this map is actually near the viewport.
  useEffect(() => {
    if (!wrapperRef.current || visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; } // graceful fallback
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setVisible(true); io.disconnect(); break; }
        }
      },
      { rootMargin: '250px 0px' }
    );
    io.observe(wrapperRef.current);
    return () => io.disconnect();
  }, [visible]);

  // 2. Wait for the Leaflet script (loaded with `defer` from index.html).
  useEffect(() => {
    if (leafletReady) return;
    const start = Date.now();
    const id = setInterval(() => {
      if (window.L) { setLeafletReady(true); clearInterval(id); }
      else if (Date.now() - start > 8000) { clearInterval(id); }
    }, 100);
    return () => clearInterval(id);
  }, [leafletReady]);

  // The user's plan location — used as the origin of the path line.
  const userLat = planLocation && typeof planLocation.lat === 'number' ? planLocation.lat : null;
  const userLng = planLocation && typeof planLocation.lng === 'number' ? planLocation.lng : null;
  const hasUserPoint = userLat != null && userLng != null;

  // 3. When both are ready, build the map.
  useEffect(() => {
    if (!visible || !leafletReady || !nodeRef.current) return;
    const L = window.L;
    if (mapInstRef.current) {
      mapInstRef.current.remove();
      mapInstRef.current = null;
    }

    const map = L.map(nodeRef.current, {
      scrollWheelZoom:    false,
      zoomControl:        true,
      attributionControl: true,
      dragging:           true,
      doubleClickZoom:    true
    });
    mapInstRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);

    // Always center tight on the destination so the activity location is
    // clearly visible — distance from the user is shown as an overlay chip
    // instead of forcing both points into the viewport (which over-zooms).
    map.setView([lat, lng], 15);

    const destPinHtml = `<div class="pmd-act-map__pin" style="background:${color || '#029e9d'}"><i class="fas fa-location-dot"></i></div>`;
    const destIcon = L.divIcon({ className: 'pmd-act-map__pin-wrap', html: destPinHtml, iconSize: [36, 36], iconAnchor: [18, 18] });
    const destMarker = L.marker([lat, lng], { icon: destIcon }).addTo(map);
    const destPopupHtml = `
      <div class="pmd-map-popup">
        <div class="pmd-map-popup__title">${(title || 'Location').replace(/</g, '&lt;')}</div>
        ${neighborhood ? `<div class="pmd-map-popup__hood">${neighborhood}</div>` : ''}
      </div>`;
    destMarker.bindPopup(destPopupHtml, { closeButton: false, offset: [0, -12] });

    // Open the destination popup once so the place name is visible immediately.
    setTimeout(() => destMarker.openPopup(), 0);

    return () => { map.remove(); mapInstRef.current = null; };
  }, [visible, leafletReady, lat, lng, title, neighborhood, color, userLat, userLng, hasUserPoint]);

  // Distance / walking-time label
  const distanceMeters = hasUserPoint
    ? haversineMeters({ lat: userLat, lng: userLng }, { lat, lng })
    : null;
  const distanceLabel = describeDistance(distanceMeters);

  const handleDirections = () => {
    openDirections(
      { coordinates: { lat, lng }, place_id: placeId, address, title, neighborhood },
      planLocation
    );
  };

  return (
    <div ref={wrapperRef} className="pmd-act-map" style={{ '--accent': color || '#029e9d' }}>
      <div ref={nodeRef} className="pmd-act-map__canvas">
        {(!visible || !leafletReady) && (
          <div className="pmd-act-map__placeholder">
            <span className="pmd-mini-spinner" />
          </div>
        )}
      </div>

      {distanceLabel && (
        <div className="pmd-act-map__distance" title="Straight-line distance from your location">
          <i className={`fas ${distanceMeters != null && distanceMeters < 4000 ? 'fa-person-walking' : 'fa-location-arrow'}`} />
          {distanceLabel}
        </div>
      )}

      <button
        type="button"
        className="pmd-act-map__directions"
        onClick={handleDirections}
        title="Open Google Maps with directions from your current location"
      >
        <i className="fas fa-diamond-turn-right" />
        Directions
        <i className="fas fa-arrow-up-right-from-square pmd-act-map__ext" />
      </button>
    </div>
  );
};

export default PlanMyDay;
