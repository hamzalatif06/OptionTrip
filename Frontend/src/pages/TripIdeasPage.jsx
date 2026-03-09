import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ideas = [
  {
    category: 'Adventure',
    icon: 'fas fa-mountain',
    color: '#e8f4f8',
    accent: '#0A539D',
    trips: [
      { title: 'Himalayan Trek, Nepal', days: '14 days', img: '/images/destination/destination1.jpg', tags: ['Hiking', 'Camping', 'Culture'] },
      { title: 'Patagonia Expedition', days: '10 days', img: '/images/destination/destination2.jpg', tags: ['Trekking', 'Wildlife', 'Scenic'] },
      { title: 'Iceland Ring Road', days: '8 days', img: '/images/destination/destination3.jpg', tags: ['Road Trip', 'Northern Lights', 'Nature'] },
    ],
  },
  {
    category: 'Beach & Relaxation',
    icon: 'fas fa-umbrella-beach',
    color: '#e8f8f6',
    accent: '#029e9d',
    trips: [
      { title: 'Maldives Overwater Escape', days: '7 days', img: '/images/destination/destination4.jpg', tags: ['Luxury', 'Diving', 'Snorkeling'] },
      { title: 'Bali Retreat', days: '10 days', img: '/images/destination/destination5.jpg', tags: ['Wellness', 'Temples', 'Surf'] },
      { title: 'Amalfi Coast, Italy', days: '9 days', img: '/images/destination/destination6.jpg', tags: ['Scenic', 'Food', 'Romance'] },
    ],
  },
  {
    category: 'Culture & History',
    icon: 'fas fa-landmark',
    color: '#fef9e7',
    accent: '#f0a500',
    trips: [
      { title: 'Ancient Egypt Tour', days: '10 days', img: '/images/destination/destination7.jpg', tags: ['Pyramids', 'History', 'Nile'] },
      { title: 'Japan Cherry Blossom', days: '12 days', img: '/images/destination/destination8.jpg', tags: ['Culture', 'Food', 'Temples'] },
      { title: 'Rome & Athens Classic', days: '8 days', img: '/images/destination/destination9.jpg', tags: ['History', 'Art', 'Food'] },
    ],
  },
  {
    category: 'Family Fun',
    icon: 'fas fa-child',
    color: '#fdf0f0',
    accent: '#e05c5c',
    trips: [
      { title: 'Disney World, Florida', days: '5 days', img: '/images/destination/destination10.jpg', tags: ['Theme Parks', 'Kids', 'Fun'] },
      { title: 'Costa Rica Wildlife', days: '8 days', img: '/images/destination/destination11.jpg', tags: ['Nature', 'Zip-lining', 'Beaches'] },
      { title: 'European Christmas Markets', days: '7 days', img: '/images/destination/destination12.jpg', tags: ['Winter', 'Festive', 'Shopping'] },
    ],
  },
];

const TripIdeasPage = () => {
  const [active, setActive] = useState('All');
  const categories = ['All', ...ideas.map(i => i.category)];

  const displayed = active === 'All' ? ideas : ideas.filter(i => i.category === active);

  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/bg/bg1.jpg)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Get Inspired</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Trip Ideas for Every Traveler</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Explore curated travel ideas — from epic adventures to peaceful retreats. Let VI turn your favorite idea into a full itinerary instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <section style={{ padding: '48px 0 0', background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '50px',
                  border: '2px solid',
                  borderColor: active === cat ? '#029e9d' : '#e9ecef',
                  background: active === cat ? '#029e9d' : '#fff',
                  color: active === cat ? '#fff' : '#17233e',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trip Cards by Category */}
      {displayed.map((group, gi) => (
        <section key={gi} style={{ padding: '60px 0', background: gi % 2 === 0 ? '#fff' : '#f8f9fa' }}>
          <div className="container">
            <div className="d-flex align-items-center mb-4" style={{ gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: group.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className={group.icon} style={{ color: group.accent, fontSize: '20px' }}></i>
              </div>
              <h3 style={{ color: '#17233e', margin: 0 }}>{group.category}</h3>
            </div>
            <div className="row g-4">
              {group.trips.map((trip, ti) => (
                <div className="col-lg-4 col-md-6" key={ti}>
                  <div
                    style={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      background: '#fff',
                      transition: 'transform 0.3s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                      <img
                        src={trip.img}
                        alt={trip.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.src = '/images/destination/destination1.jpg'; }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          background: 'rgba(2,158,157,0.9)',
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        {trip.days}
                      </span>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h5 style={{ color: '#17233e', marginBottom: '10px' }}>{trip.title}</h5>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {trip.tags.map((tag, ti2) => (
                          <span
                            key={ti2}
                            style={{
                              background: '#f0fafa',
                              color: '#029e9d',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Link to="/" className="btn-main btn-sm-page">
                        Plan This Trip <i className="fas fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section
        style={{
          padding: '80px 0',
          background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Don't See Your Dream Trip?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '32px', fontSize: '18px' }}>
            Tell VI where you want to go and it will create a completely personalized itinerary just for you.
          </p>
          <Link to="/" className="btn-white">Create My Custom Trip</Link>
        </div>
      </section>
    </>
  );
};

export default TripIdeasPage;
