import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorksPage = () => {
  const steps = [
    {
      num: '01',
      icon: 'fas fa-search-location',
      title: 'Tell Us Where You Want to Go',
      desc: 'Enter your destination, travel dates, and group size in the trip planner. Not sure where to go? Let our AI suggest trending destinations based on your interests and budget.',
    },
    {
      num: '02',
      icon: 'fas fa-sliders-h',
      title: 'Customize Your Preferences',
      desc: 'Choose your travel style — adventure, relaxation, culture, family, or luxury. Set your budget and select the activities that excite you most.',
    },
    {
      num: '03',
      icon: 'fas fa-magic',
      title: 'AI Builds Your Itinerary',
      desc: 'Our VI TravelBuddy AI analyzes thousands of data points — reviews, local insights, seasonality, and pricing — to craft your perfect day-by-day itinerary.',
    },
    {
      num: '04',
      icon: 'fas fa-edit',
      title: 'Review & Refine',
      desc: 'Browse your personalized plan, swap activities, explore alternative routes, and fine-tune every detail until it feels just right.',
    },
    {
      num: '05',
      icon: 'fas fa-plane-departure',
      title: 'Book & Go',
      desc: 'Confirm your trip, save your itinerary to the app, and travel with confidence. VI stays available throughout your journey for real-time support.',
    },
  ];

  const whyChoose = [
    { icon: 'fas fa-bolt', title: 'Instant Planning', desc: 'Get a full itinerary in seconds, not hours of research.' },
    { icon: 'fas fa-user-circle', title: 'Truly Personalized', desc: 'Every plan is unique to you — your budget, style, and dreams.' },
    { icon: 'fas fa-globe', title: 'Global Coverage', desc: 'Plan trips to 150+ countries with local expertise built in.' },
    { icon: 'fas fa-lock', title: 'Secure & Private', desc: 'Your data is encrypted and never shared with third parties.' },
  ];

  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/bg/bg3.jpg)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Simple Steps</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>How Option Trip Works</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    From dream to destination in minutes — here's how we make travel planning effortless.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="theme mb-2" style={{ color: '#029e9d' }}>The Process</h4>
            <h2 style={{ color: '#17233e' }}>Plan Your Trip in 5 Easy Steps</h2>
            <p style={{ color: '#777', maxWidth: '600px', margin: '0 auto' }}>
              We've simplified travel planning so you can focus on what matters — the experience.
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="row align-items-center g-4"
                style={{ marginBottom: '60px' }}
              >
                <div
                  className={`col-lg-5 ${i % 2 === 1 ? 'order-lg-2' : ''}`}
                  style={{ textAlign: i % 2 === 1 ? 'right' : 'left' }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0A539D, #029e9d)',
                      marginBottom: '20px',
                    }}
                  >
                    <i className={step.icon} style={{ color: '#fff', fontSize: '28px' }}></i>
                  </div>
                  <div
                    style={{
                      fontSize: '72px',
                      fontWeight: '800',
                      color: '#029e9d',
                      opacity: 0.08,
                      lineHeight: 1,
                      marginBottom: '-20px',
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 style={{ color: '#17233e', marginBottom: '14px' }}>{step.title}</h3>
                  <p style={{ color: '#777', lineHeight: '1.8', maxWidth: '420px' }}>{step.desc}</p>
                </div>
                <div className="col-lg-2 text-center d-none d-lg-block">
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#029e9d',
                      margin: '0 auto',
                      boxShadow: '0 0 0 6px rgba(2,158,157,0.15)',
                    }}
                  />
                </div>
                <div className={`col-lg-5 ${i % 2 === 1 ? 'order-lg-1' : ''}`}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(10,83,157,0.05), rgba(2,158,157,0.08))',
                      borderRadius: '20px',
                      padding: '40px',
                      textAlign: 'center',
                      fontSize: '64px',
                      color: '#029e9d',
                    }}
                  >
                    <i className={step.icon}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '80px 0', background: '#f8f9fa' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="theme mb-2" style={{ color: '#029e9d' }}>Our Advantage</h4>
            <h2 style={{ color: '#17233e' }}>Why Travelers Choose Option Trip</h2>
          </div>
          <div className="row g-4">
            {whyChoose.map((item, i) => (
              <div className="col-lg-3 col-md-6" key={i}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '36px 24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    height: '100%',
                    transition: 'transform 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      color: '#029e9d',
                      marginBottom: '16px',
                    }}
                  >
                    <i className={item.icon}></i>
                  </div>
                  <h5 style={{ color: '#17233e', marginBottom: '10px' }}>{item.title}</h5>
                  <p style={{ color: '#777', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '80px 0',
          background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Ready to Plan Your Next Trip?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '32px', fontSize: '18px' }}>
            Join thousands of happy travelers who plan smarter with Option Trip.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-white">Start Planning</Link>
            <Link to="/travel-buddy" className="btn-outline">Meet VI</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorksPage;
