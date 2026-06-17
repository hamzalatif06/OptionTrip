import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateDayPlan, reverseGeocode, forwardGeocode } from '../services/planMyDayService';
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
 * Build the best Google Maps Directions URL we can from whatever fields are
 * present. Falls back gracefully: prefer coordinates → address → name+area.
 * No origin = Google uses the user's current location.
 */
const buildDirectionsUrl = (placeOrActivity, planLocation) => {
  const { coordinates, address, title, name, neighborhood } = placeOrActivity || {};
  const city    = planLocation?.city    || '';
  const country = planLocation?.country || '';

  if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
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

// ─── Component ──────────────────────────────────────────────────────────────

const PlanMyDay = () => {
  // Stage: 'setup' | 'loading' | 'results'
  const [stage, setStage] = useState('setup');

  // Location
  const [location, setLocation]           = useState({ city: '', country: '', neighborhood: '', lat: null, lng: null });
  const [locStatus, setLocStatus]         = useState('idle'); // 'idle' | 'detecting' | 'detected' | 'denied' | 'manual'
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

  // ── Auto-detect location on mount ──────────────────────────────────────
  useEffect(() => {
    if (!('geolocation' in navigator)) { setLocStatus('denied'); return; }
    setLocStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const rev = await reverseGeocode(latitude, longitude);
        if (rev) {
          setLocation({
            city:         rev.city,
            country:      rev.country,
            neighborhood: rev.neighborhood,
            lat:          latitude,
            lng:          longitude
          });
          setLocStatus('detected');
        } else {
          setLocStatus('denied');
        }
      },
      () => setLocStatus('denied'),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

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
        setManualCity('');
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
    setLocation(prev => ({ ...prev, city, neighborhood: hood }));
    setEditingLoc(false);
    setLocStatus('manual');
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
const PlanSetupForm = ({
  location, locStatus,
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

      {locStatus === 'detecting' && (
        <div className="pmd-loc-state pmd-loc-state--pending">
          <span className="pmd-mini-spinner" />
          Detecting your location…
        </div>
      )}

      {(locStatus === 'detected' || locStatus === 'manual') && location.city && !editingLoc && (
        <div className="pmd-loc-state pmd-loc-state--ok">
          <i className="fas fa-circle-check" />
          <span className="pmd-loc-state__text">
            <strong>{location.neighborhood ? `${location.neighborhood}, ` : ''}{location.city}</strong>
            {location.country ? <span className="pmd-loc-state__country">, {location.country}</span> : null}
          </span>
          <button
            type="button"
            className="pmd-loc-state__edit"
            onClick={onStartEditLocation}
            title="Fix or refine this"
          >
            <i className="fas fa-pen" /> Edit
          </button>
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

      {/* Timeline */}
      <div className="container pmd-timeline-wrap">
        <h2 className="pmd-section-heading"><i className="fas fa-route" /> Your day, hour by hour</h2>
        <div className="pmd-timeline">
          {(plan.activities || []).map((a, idx) => (
            <ActivityCard key={idx} index={idx} activity={a} currency={plan.currency} planLocation={plan.location} />
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
                </div>
              ))}
            </div>
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
  return (
    <div className="pmd-activity" style={{ '--cat-color': cat.color, animationDelay: `${index * 0.06}s` }}>
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
      </div>
    </div>
  );
};

export default PlanMyDay;
