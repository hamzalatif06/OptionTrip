import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const routes = [
  {
    id: 1,
    from: 'London',
    to: 'Paris',
    via: ['Eurostar', 'Seine River Cruise'],
    days: '5 days',
    travelers: '12.4K',
    type: 'Cultural',
    typeColor: '#0A539D',
    desc: 'The ultimate European city break — art, cuisine, fashion, and the Eiffel Tower. Perfect for couples and culture lovers.',
    stops: ['London Eye, UK', 'Eurostar Train', 'Eiffel Tower, FR', 'Louvre Museum, FR', 'Montmartre, FR'],
    img: '/images/destination/destination1.jpg',
  },
  {
    id: 2,
    from: 'Bangkok',
    to: 'Bali',
    via: ['Chiang Mai', 'Singapore'],
    days: '14 days',
    travelers: '9.8K',
    type: 'Adventure',
    typeColor: '#029e9d',
    desc: 'Southeast Asia\'s greatest hits — temples, street food, jungles, and paradise beaches on one epic route.',
    stops: ['Bangkok Temples, TH', 'Chiang Mai Night Market', 'Singapore Gardens', 'Ubud Rice Terraces, ID', 'Seminyak Beach, ID'],
    img: '/images/destination/destination4.jpg',
  },
  {
    id: 3,
    from: 'New York',
    to: 'Los Angeles',
    via: ['Chicago', 'Las Vegas'],
    days: '12 days',
    travelers: '7.2K',
    type: 'Road Trip',
    typeColor: '#e65100',
    desc: 'America\'s most iconic road trip — cross the continent with stops at legendary cities and landscapes.',
    stops: ['Times Square, NY', 'Chicago Riverwalk, IL', 'Grand Canyon, AZ', 'Las Vegas Strip, NV', 'Santa Monica Pier, CA'],
    img: '/images/destination/destination5.jpg',
  },
  {
    id: 4,
    from: 'Rome',
    to: 'Athens',
    via: ['Santorini', 'Mykonos'],
    days: '10 days',
    travelers: '6.5K',
    type: 'Cultural',
    typeColor: '#0A539D',
    desc: 'Ancient wonders from the Colosseum to the Acropolis, connected by glittering Aegean islands.',
    stops: ['Colosseum, Rome', 'Amalfi Coast, IT', 'Santorini Caldera', 'Mykonos Windmills', 'Acropolis, Athens'],
    img: '/images/destination/destination7.jpg',
  },
  {
    id: 5,
    from: 'Cape Town',
    to: 'Nairobi',
    via: ['Zanzibar', 'Serengeti'],
    days: '16 days',
    travelers: '4.1K',
    type: 'Wildlife',
    typeColor: '#2e7d32',
    desc: 'Africa\'s ultimate safari and scenic route — from Table Mountain to the Great Migration.',
    stops: ['Table Mountain, SA', 'Zanzibar Beaches, TZ', 'Serengeti Safari, TZ', 'Ngorongoro Crater, TZ', 'Maasai Mara, KE'],
    img: '/images/destination/destination9.jpg',
  },
  {
    id: 6,
    from: 'Tokyo',
    to: 'Kyoto',
    via: ['Mount Fuji', 'Osaka'],
    days: '9 days',
    travelers: '11.3K',
    type: 'Cultural',
    typeColor: '#0A539D',
    desc: 'Japan\'s most beloved route blending futuristic technology with timeless tradition.',
    stops: ['Shibuya Crossing, Tokyo', 'Mt. Fuji View', 'Fushimi Inari, Kyoto', 'Dotonbori, Osaka', 'Arashiyama Bamboo, Kyoto'],
    img: '/images/destination/destination11.jpg',
  },
];

const PopularRoutesPage = () => {
  const [expanded, setExpanded] = useState(null);
  const types = ['All', 'Cultural', 'Adventure', 'Road Trip', 'Wildlife'];
  const [filter, setFilter] = useState('All');

  const displayed = filter === 'All' ? routes : routes.filter(r => r.type === filter);

  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/bg/bg6.jpg)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Top Picks</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Popular Travel Routes</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Discover the world's most loved travel routes — curated by thousands of real travelers and powered by VI's AI insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <section style={{ padding: '48px 0 0', background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '50px',
                  border: '2px solid',
                  borderColor: filter === type ? '#029e9d' : '#e9ecef',
                  background: filter === type ? '#029e9d' : '#fff',
                  color: filter === type ? '#fff' : '#17233e',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Routes */}
      <section style={{ padding: '48px 0 80px', background: '#fff' }}>
        <div className="container">
          <div className="row g-4">
            {displayed.map((route, i) => (
              <div className="col-lg-6" key={route.id}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    border: expanded === i ? '2px solid #029e9d' : '2px solid transparent',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <img
                      src={route.img}
                      alt={`${route.from} to ${route.to}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = '/images/destination/destination1.jpg'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        background: route.typeColor,
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {route.type}
                    </span>
                    <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{route.from}</span>
                        <i className="fas fa-long-arrow-alt-right" style={{ color: '#029e9d', fontSize: '18px' }}></i>
                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>{route.to}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                      <span style={{ color: '#777', fontSize: '13px' }}>
                        <i className="fas fa-clock" style={{ color: '#029e9d', marginRight: '5px' }}></i>
                        {route.days}
                      </span>
                      <span style={{ color: '#777', fontSize: '13px' }}>
                        <i className="fas fa-users" style={{ color: '#029e9d', marginRight: '5px' }}></i>
                        {route.travelers} travelers
                      </span>
                    </div>

                    <p style={{ color: '#777', fontSize: '14px', lineHeight: '1.6', marginBottom: '14px' }}>
                      {route.desc}
                    </p>

                    {expanded === i && (
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px', marginBottom: '14px' }}>
                        <p style={{ color: '#17233e', fontWeight: '600', fontSize: '13px', marginBottom: '10px' }}>
                          <i className="fas fa-map-signs" style={{ color: '#029e9d', marginRight: '6px' }}></i>
                          Route Stops:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {route.stops.map((stop, si) => (
                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #0A539D, #029e9d)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  flexShrink: 0,
                                }}
                              >
                                {si + 1}
                              </div>
                              <span style={{ color: '#555', fontSize: '14px' }}>{stop}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="btn-outline btn-sm-page"
                        style={{ border: '2px solid #029e9d', color: 'rgb(2, 158, 157)' }}
                      >
                        {expanded === i ? 'Hide Stops' : 'View Stops'}
                      </button>
                      <Link to="/" className="btn-main btn-sm-page">Plan This Route</Link>
                    </div>
                  </div>
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
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Want a Custom Route?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '32px', fontSize: '18px' }}>
            Tell VI your starting point and dream destination — it'll map out the perfect route for you.
          </p>
          <Link to="/" className="btn-white">Build My Route</Link>
        </div>
      </section>
    </>
  );
};

export default PopularRoutesPage;
