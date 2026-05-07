import React from 'react';
import './WhyChooseUs.css';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 17c1.5.5 3 1.5 3 2.5 0 1.38-4.48 2.5-10 2.5S2 20.88 2 19.5c0-1 1.5-2 3-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Personalized Planning',
    title: 'Trips Tailored to You',
    desc: 'Our AI learns your travel style — budget, pace, interests — and builds a day-by-day itinerary that feels handcrafted, not generic.',
    accent: '#029e9d',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M8 14h4M8 18h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Integrated Management',
    title: 'Everything in One Place',
    desc: 'Flights, hotels, activities, and budgets — all tracked in a single dashboard. No more juggling between tabs or losing booking confirmations.',
    accent: '#2563eb',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'AI Travel Companion',
    title: 'Vi — Your Smart Assistant',
    desc: 'Ask Vi anything about your trip — visa requirements, local customs, weather, or hidden gems. Get instant, context-aware answers 24/7.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Real-Time Prices',
    title: 'Live Flights & Hotels',
    desc: 'Search across Duffel, Google Flights, Hotelbeds, and more simultaneously. Always see the best available price — not cached or outdated data.',
    accent: '#ea580c',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Multi-Language',
    title: 'Travel Without Barriers',
    desc: 'OptionTrip speaks your language. Available in 20+ languages with real-time translation so every traveler feels at home on our platform.',
    accent: '#16a34a',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Smart Budgeting',
    title: 'Spend Wisely, Travel More',
    desc: 'Set your budget and let OptionTrip optimize every choice — from flights to hotels to activities — so you get the most out of every trip.',
    accent: '#e11d48',
  },
];

const WhyChooseUs = () => (
  <section className="wcu-section">
    <div className="container">

      {/* Header */}
      <div className="wcu-header">
        <span className="wcu-eyebrow">Why OptionTrip</span>
        <h2 className="wcu-title">
          The Smarter Way <span className="theme">to Travel</span>
        </h2>
        <p className="wcu-sub">
          We combine artificial intelligence with real travel expertise to give you
          a planning experience that's faster, smarter, and more personal.
        </p>
      </div>

      {/* Feature grid */}
      <div className="wcu-grid">
        {features.map((f, i) => (
          <div className="wcu-card" key={i}>
            <div className="wcu-card__icon-wrap" style={{ '--card-accent': f.accent }}>
              {f.icon}
            </div>
            <span className="wcu-card__label">{f.label}</span>
            <h3 className="wcu-card__title">{f.title}</h3>
            <p className="wcu-card__desc">{f.desc}</p>
            <div className="wcu-card__bar" style={{ background: f.accent }} />
          </div>
        ))}
      </div>

      {/* Bottom CTA strip */}
      <div className="wcu-cta">
        <div className="wcu-cta__text">
          <strong>Ready to plan your next adventure?</strong>
          <span>Join thousands of travellers who trust OptionTrip.</span>
        </div>
        <a href="/trip-planner" className="wcu-cta__btn">
          Start Planning Free
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

    </div>
  </section>
);

export default WhyChooseUs;
