import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorksSection.css';

const steps = [
  {
    icon: 'fas fa-comment-dots',
    title: 'Describe the Trip You Want',
    desc: 'Tell Vi what kind of trip you\'re after — a warm beach in May, a food tour in Spain, a quiet mountain escape. No destination required yet.',
  },
  {
    icon: 'fas fa-map-marker-alt',
    title: 'Discover Matching Destinations',
    desc: 'Vi suggests destinations, routes, and ideas that fit what you described, so you can pick what actually excites you.',
  },
  {
    icon: 'fas fa-route',
    title: 'Build Your Trip',
    desc: 'Set your dates, group size, and budget, then let Vi turn your pick into a day-by-day itinerary with flights and stays.',
  },
  {
    icon: 'fas fa-compass',
    title: 'Travel With Guidance',
    desc: 'Vi stays with you before, during, and after the trip — answering questions, adjusting plans, and offering real-time help.',
  },
];

const HowItWorksSection = () => (
  <section className="hiw-section">
    <div className="container">
      <div className="hiw-header">
        <span className="hiw-eyebrow">How It Works</span>
        <h2 className="hiw-title">
          From Idea <span className="theme">to Itinerary</span>
        </h2>
        <p className="hiw-sub">Four simple steps take you from "I want to travel" to a fully planned trip.</p>
      </div>

      <div className="hiw-grid">
        {steps.map((step, i) => (
          <div className="hiw-card" key={step.title}>
            <span className="hiw-card__num">{String(i + 1).padStart(2, '0')}</span>
            <div className="hiw-card__icon">
              <i className={step.icon}></i>
            </div>
            <h3 className="hiw-card__title">{step.title}</h3>
            <p className="hiw-card__desc">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="hiw-footer">
        <Link to="/how-it-works" className="hiw-link">
          See the full walkthrough
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
