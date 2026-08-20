import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeModal.css';

const STORAGE_KEY = 'ot_welcome_seen';

const TRIP_CATEGORIES = [
  { id: 'beach', label: '🏖️ Beach', text: 'A relaxing beach getaway with warm weather and great food' },
  { id: 'adventure', label: '🏔️ Adventure', text: 'An adventure trip with hiking, nature, and outdoor activities' },
  { id: 'culture', label: '🏛️ Culture', text: 'A culture-focused trip with history, museums, and local traditions' },
  { id: 'relaxation', label: '🧘 Relaxation', text: 'A slow, relaxing trip to unwind and recharge' },
];

const FEATURES = [
  {
    id: 'ai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
      </svg>
    ),
    label: 'Your Personal Travel Partner Vi',
    desc: 'Tell us where you want to go — we generate a full day-by-day itinerary in seconds.',
    cta: 'Plan a trip',
    path: '/',
    accent: 'var(--primary)',
    bg: 'var(--primary-light)',
  },
  {
    id: 'flights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
      </svg>
    ),
    label: 'Flights',
    desc: 'Search hundreds of airlines for the best fares on any route, any date.',
    cta: 'Search flights',
    path: '/flights',
    accent: '#2563eb',
    bg: '#eff6ff',
  },
  {
    id: 'hotels',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Stays',
    desc: 'Browse thousands of hotels, apartments, resorts, and boutique stays worldwide.',
    cta: 'Find stays',
    path: '/hotels',
    accent: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'cars',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
        <circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    label: 'Car Rental',
    desc: 'Pick up a car at your destination — flexible rates, no hidden fees.',
    cta: 'Rent a car',
    path: '/car-rental',
    accent: '#059669',
    bg: '#f0fdf4',
  },
];

const WelcomeModal = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setClosing(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => { setVisible(false); setClosing(false); }, 340);
  };

  const go = (path) => {
    dismiss();
    if (path !== '/') navigate(path);
  };

  const goWithCategory = (category) => {
    dismiss();
    navigate('/', { state: { starterDescription: category.text } });
  };

  if (!visible) return null;

  return (
    <div className={`wm-overlay${closing ? ' wm-overlay--out' : ''}`} onClick={e => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className={`wm${closing ? ' wm--out' : ''}`} role="dialog" aria-modal="true" aria-label="Welcome to OptionTrip">


        <button className="wm__close" onClick={dismiss} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>


        <div className="wm__hero">
          <div className="wm__hero-glow" aria-hidden="true" />
          <div className="wm__hero-badge">✨ All-in-one travel platform</div>
          <h2 className="wm__hero-heading">
            Your Personal Travel Partner Vi<br />
            <span className="wm__hero-accent">Plan Your Entire Trip in Minutes</span>
          </h2>
          <p className="wm__hero-sub">
            Powered by Travel Partner Vi · Flights · Stays · Car Rentals — everything in one place.
          </p>
        </div>


        <div className="wm__quickstart">
          <span className="wm__quickstart-label">What kind of trip do you want?</span>
          <div className="wm__quickstart-chips">
            {TRIP_CATEGORIES.map((cat) => (
              <button key={cat.id} className="wm__quickstart-chip" onClick={() => goWithCategory(cat)}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>


        <div className="wm__grid">
          {FEATURES.map(f => (
            <button
              key={f.id}
              className="wm__card"
              style={{ '--card-accent': f.accent, '--card-bg': f.bg }}
              onClick={() => go(f.path)}
            >
              <div className="wm__card-icon" style={{ color: f.accent, background: f.bg }}>
                {f.icon}
              </div>
              <div className="wm__card-body">
                <span className="wm__card-label">{f.label}</span>
                <span className="wm__card-desc">{f.desc}</span>
              </div>
              <span className="wm__card-cta" style={{ color: f.accent }}>
                {f.cta} →
              </span>
            </button>
          ))}
        </div>


        <div className="wm__footer">
          <button className="wm__skip" onClick={dismiss}>
            Maybe later
          </button>
          <button className="wm__primary-cta" onClick={() => go('/')}>
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ marginRight: 6 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Start Planning with Travel Partner Vi
          </button>
        </div>

      </div>
    </div>
  );
};

export default WelcomeModal;
