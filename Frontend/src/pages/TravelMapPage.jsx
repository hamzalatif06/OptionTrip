import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const regions = [
  {
    name: 'Europe',
    icon: 'fas fa-church',
    color: '#e8f0fe',
    accent: '#0A539D',
    count: '44 countries',
    highlights: ['Paris, France', 'Rome, Italy', 'Barcelona, Spain', 'Amsterdam, Netherlands', 'Prague, Czech Republic'],
    desc: 'Ancient history, stunning architecture, and vibrant culture across 44 unique nations.',
  },
  {
    name: 'Asia',
    icon: 'fas fa-torii-gate',
    color: '#e8f8f6',
    accent: '#029e9d',
    count: '48 countries',
    highlights: ['Tokyo, Japan', 'Bali, Indonesia', 'Bangkok, Thailand', 'Dubai, UAE', 'Singapore'],
    desc: 'From ancient temples to futuristic skylines — Asia offers the world\'s most diverse travel experiences.',
  },
  {
    name: 'Americas',
    icon: 'fas fa-tree',
    color: '#e8f5e9',
    accent: '#2e7d32',
    count: '35 countries',
    highlights: ['New York, USA', 'Machu Picchu, Peru', 'Rio de Janeiro, Brazil', 'Cancún, Mexico', 'Patagonia, Argentina'],
    desc: 'Adventure jungles, iconic cities, and Andean wonders spread across two continents.',
  },
  {
    name: 'Africa',
    icon: 'fas fa-paw',
    color: '#fff3e0',
    accent: '#e65100',
    count: '54 countries',
    highlights: ['Safari, Kenya', 'Cape Town, South Africa', 'Marrakech, Morocco', 'Zanzibar, Tanzania', 'Victoria Falls, Zimbabwe'],
    desc: 'Wildlife safaris, ancient civilizations, and breathtaking landscapes unlike anywhere else on Earth.',
  },
  {
    name: 'Oceania',
    icon: 'fas fa-water',
    color: '#e0f7fa',
    accent: '#00838f',
    count: '14 countries',
    highlights: ['Sydney, Australia', 'Queenstown, New Zealand', 'Fiji Islands', 'Bora Bora, French Polynesia', 'Great Barrier Reef'],
    desc: 'Crystal waters, unique wildlife, and the world\'s most stunning island paradises.',
  },
  {
    name: 'Middle East',
    icon: 'fas fa-mosque',
    color: '#fce4ec',
    accent: '#c62828',
    count: '18 countries',
    highlights: ['Petra, Jordan', 'Istanbul, Turkey', 'Dubai, UAE', 'Jerusalem, Israel', 'Muscat, Oman'],
    desc: 'Where ancient history meets modern luxury — the Middle East will surprise and inspire you.',
  },
];

const TravelMapPage = () => {
  const [selected, setSelected] = useState(null);

  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/bg/bg4.jpg)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Explore the World</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Travel Map</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Discover destinations across every continent — explore regions, find hidden gems, and let VI plan your route.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Visual */}
      <section style={{ padding: '60px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <img
              src="/images/map.jpg"
              alt="World Travel Map"
              style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'cover' }}
            />
          </div>
          <div className="text-center mt-4">
            <p style={{ color: '#777', fontSize: '15px' }}>
              <i className="fas fa-info-circle" style={{ color: '#029e9d', marginRight: '8px' }}></i>
              Click a region below to explore destinations and let VI plan your perfect route.
            </p>
          </div>
        </div>
      </section>

      {/* Region Cards */}
      <section style={{ padding: '40px 0 80px', background: '#f8f9fa' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="theme mb-2" style={{ color: '#029e9d' }}>Browse by Region</h4>
            <h2 style={{ color: '#17233e' }}>Where Do You Want to Go?</h2>
          </div>
          <div className="row g-4">
            {regions.map((region, i) => (
              <div className="col-lg-4 col-md-6" key={i}>
                <div
                  onClick={() => setSelected(selected === i ? null : i)}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '28px',
                    cursor: 'pointer',
                    border: `2px solid ${selected === i ? region.accent : 'transparent'}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s',
                    transform: selected === i ? 'translateY(-4px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: region.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i className={region.icon} style={{ color: region.accent, fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h5 style={{ color: '#17233e', margin: 0 }}>{region.name}</h5>
                      <span style={{ color: '#999', fontSize: '13px' }}>{region.count}</span>
                    </div>
                  </div>
                  <p style={{ color: '#777', fontSize: '14px', lineHeight: '1.6', marginBottom: '14px' }}>
                    {region.desc}
                  </p>

                  {selected === i && (
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px', marginTop: '4px' }}>
                      <p style={{ color: '#17233e', fontWeight: '600', fontSize: '13px', marginBottom: '8px' }}>
                        Top Destinations:
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {region.highlights.map((h, hi) => (
                          <li key={hi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <i className="fas fa-map-pin" style={{ color: region.accent, fontSize: '12px' }}></i>
                            <span style={{ color: '#555', fontSize: '14px' }}>{h}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to="/" className="btn-main btn-sm-page" style={{ marginTop: '14px' }}>
                        Plan a Trip to {region.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ padding: '60px 0', background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)' }}>
        <div className="container">
          <div className="row g-4 text-center">
            {[
              { num: '150+', label: 'Countries Covered' },
              { num: '1,200+', label: 'Destinations' },
              { num: '50K+', label: 'Trips Planned' },
              { num: '4.9★', label: 'Average Rating' },
            ].map((stat, i) => (
              <div className="col-lg-3 col-6" key={i}>
                <h2 style={{ color: '#fff', marginBottom: '6px', fontSize: '42px' }}>{stat.num}</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '15px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', background: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#17233e', marginBottom: '16px' }}>Ready to Map Your Journey?</h2>
          <p style={{ color: '#777', marginBottom: '32px', fontSize: '18px', maxWidth: '560px', margin: '0 auto 32px' }}>
            Tell VI your dream destination and we'll handle the rest — flights, hotels, and every adventure in between.
          </p>
          <Link to="/" className="btn-main">
            Start Planning <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </Link>
        </div>
      </section>
    </>
  );
};

export default TravelMapPage;
