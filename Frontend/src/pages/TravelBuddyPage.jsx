import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: 'fas fa-robot', title: 'AI-Powered Conversations', desc: 'VI understands your travel preferences through natural conversation, just like talking to an expert travel advisor who knows you personally.' },
  { icon: 'fas fa-route', title: 'Smart Itinerary Builder', desc: 'From flights to accommodations, VI builds a complete day-by-day itinerary tailored to your budget, pace, and interests.' },
  { icon: 'fas fa-map-marked-alt', title: 'Real-Time Recommendations', desc: 'Get live suggestions for restaurants, attractions, and hidden gems based on your current location and travel style.' },
  { icon: 'fas fa-language', title: 'Multilingual Support', desc: 'VI speaks 22+ languages, so you can plan your trip in your native language and communicate effortlessly worldwide.' },
  { icon: 'fas fa-sync-alt', title: 'Adaptive Planning', desc: 'Change your plans mid-trip? VI adapts instantly, re-routing and re-scheduling so you never miss an experience.' },
  { icon: 'fas fa-shield-alt', title: 'Safe Travel Insights', desc: 'VI monitors safety advisories, local regulations, and travel alerts to keep your journey smooth and secure.' },
];

const steps = [
  { num: '01', title: 'Tell VI Your Dream', desc: 'Describe your ideal trip — destination, dates, budget, and what excites you most.' },
  { num: '02', title: 'VI Plans Everything', desc: 'VI instantly generates a personalized itinerary with flights, stays, and activities.' },
  { num: '03', title: 'Refine Together', desc: 'Adjust any detail through conversation — VI updates your plan in real time.' },
  { num: '04', title: 'Travel with Confidence', desc: 'Head out with a fully curated plan and VI by your side for on-the-go support.' },
];

const TravelBuddyPage = () => {
  return (
    <>
      {/* Banner */}
      <div className="banner pt-10 pb-0 overflow-hidden" style={{ backgroundImage: `url(/images/bg/bg2.jpg)` }}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Meet VI</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Your Personal TravelBuddy</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>VI is Option Trip's intelligent AI travel companion — designed to plan, guide, and inspire your every journey.</p>
                  <Link to="/" className="btn-main">Start Planning with VI</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intro */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <img src="/images/illu1.png" alt="VI TravelBuddy" style={{ width: '100%', borderRadius: '16px' }} />
            </div>
            <div className="col-lg-6">
              <h4 style={{ color: '#029e9d', marginBottom: '8px' }}>Why VI?</h4>
              <h2 style={{ color: '#17233e', marginBottom: '20px' }}>Travel Planning Reimagined by AI</h2>
              <p style={{ color: '#777', lineHeight: '1.8', marginBottom: '20px' }}>
                VI — short for <strong>Virtual Intelligence</strong> — is not just a chatbot. It's a comprehensive travel companion that learns your preferences, anticipates your needs, and crafts journeys that feel truly yours.
              </p>
              <p style={{ color: '#777', lineHeight: '1.8' }}>
                Powered by advanced language models and real-time travel data, VI delivers personalized recommendations that traditional travel agencies simply cannot match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0', background: '#f8f9fa' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 style={{ color: '#029e9d', marginBottom: '8px' }}>Capabilities</h4>
            <h2 style={{ color: '#17233e' }}>What VI Can Do for You</h2>
            <p style={{ color: '#777', maxWidth: '600px', margin: '0 auto' }}>From first inspiration to final destination, VI is with you every step of the way.</p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-lg-4 col-md-6" key={i}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '36px 28px', height: '100%', boxShadow: '0 4px 24px rgba(2,158,157,0.08)' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #0A539D, #029e9d)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <i className={f.icon} style={{ color: '#fff', fontSize: '24px' }}></i>
                  </div>
                  <h5 style={{ color: '#17233e', marginBottom: '12px' }}>{f.title}</h5>
                  <p style={{ color: '#777', lineHeight: '1.7', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 style={{ color: '#029e9d', marginBottom: '8px' }}>Simple Process</h4>
            <h2 style={{ color: '#17233e' }}>How to Travel with VI</h2>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div className="col-lg-3 col-md-6" key={i}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '48px', fontWeight: '800', color: '#029e9d', opacity: 0.2, lineHeight: 1, marginBottom: '12px' }}>{s.num}</div>
                  <h5 style={{ color: '#17233e', marginBottom: '12px' }}>{s.title}</h5>
                  <p style={{ color: '#777', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Ready to Travel Smarter?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '32px', fontSize: '18px' }}>Let VI plan your next adventure — personalized, effortless, and unforgettable.</p>
          <Link to="/" className="btn-white">Start Your Journey</Link>
        </div>
      </section>
    </>
  );
};

export default TravelBuddyPage;
