import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    title: 'Before You Go',
    icon: 'fas fa-clipboard-check',
    color: '#e8f0fe',
    accent: '#0A539D',
    tips: [
      {
        title: 'Book Flights 6–8 Weeks in Advance',
        desc: 'Studies show booking 6–8 weeks ahead for domestic and 3–6 months for international flights gets you the best prices. Use VI to track fare trends.',
      },
      {
        title: 'Get Travel Insurance',
        desc: 'Never skip travel insurance. It covers medical emergencies, cancellations, and lost luggage — peace of mind for a fraction of the trip cost.',
      },
      {
        title: 'Check Visa Requirements Early',
        desc: 'Visa processing can take weeks. Check requirements at least 2 months before your travel date, especially for multi-country trips.',
      },
      {
        title: 'Make Copies of Important Documents',
        desc: 'Store digital copies of your passport, travel insurance, and bookings in the cloud and email them to yourself.',
      },
    ],
  },
  {
    title: 'Packing Smart',
    icon: 'fas fa-suitcase-rolling',
    color: '#e8f8f6',
    accent: '#029e9d',
    tips: [
      {
        title: 'Pack Light — Use the Roll Method',
        desc: 'Rolling clothes instead of folding saves up to 30% more space and reduces wrinkles. Aim to fit everything in a carry-on if possible.',
      },
      {
        title: 'Bring a Universal Power Adapter',
        desc: 'Outlets vary by country. A universal adapter ensures your devices stay charged wherever you are.',
      },
      {
        title: 'Layer Your Clothing',
        desc: 'Pack layers instead of heavy items. A lightweight jacket, thermal base layer, and versatile shirts cover most climates.',
      },
      {
        title: 'Carry Essentials in Your Personal Bag',
        desc: 'Keep medications, phone charger, change of clothes, and valuables in your carry-on in case checked luggage is delayed.',
      },
    ],
  },
  {
    title: 'Saving Money',
    icon: 'fas fa-piggy-bank',
    color: '#fff3e0',
    accent: '#e65100',
    tips: [
      {
        title: 'Eat Where Locals Eat',
        desc: 'Avoid tourist-trap restaurants near landmarks. Walk two blocks away and you\'ll find authentic food at half the price.',
      },
      {
        title: 'Use Local Transport',
        desc: 'Buses, metro, and trams are far cheaper than taxis. Many cities offer day passes that pay for themselves quickly.',
      },
      {
        title: 'Book Free Walking Tours',
        desc: 'Many cities offer pay-what-you-wish walking tours led by passionate locals — they\'re some of the best travel experiences.',
      },
      {
        title: 'Travel During Shoulder Season',
        desc: 'Visiting just before or after peak season means fewer crowds, lower prices, and still-great weather at most destinations.',
      },
    ],
  },
  {
    title: 'Staying Safe',
    icon: 'fas fa-shield-alt',
    color: '#fce4ec',
    accent: '#c62828',
    tips: [
      {
        title: 'Register with Your Embassy',
        desc: 'Many governments offer traveler registration services. This lets officials locate you in case of emergencies or natural disasters.',
      },
      {
        title: 'Use Secure Wi-Fi',
        desc: 'Avoid banking on public Wi-Fi. Use a VPN when connecting to unfamiliar networks to protect your personal data.',
      },
      {
        title: 'Keep Emergency Numbers Handy',
        desc: 'Save local emergency numbers (police, ambulance, your country\'s embassy) in your phone before arriving.',
      },
      {
        title: 'Trust Your Instincts',
        desc: 'If something feels off — a neighborhood, a person, a situation — trust your gut and move on. Your safety always comes first.',
      },
    ],
  },
  {
    title: 'Cultural Etiquette',
    icon: 'fas fa-handshake',
    color: '#e8f5e9',
    accent: '#2e7d32',
    tips: [
      {
        title: 'Research Local Customs',
        desc: 'What\'s polite in one country can be rude in another. Quick research on tipping, greetings, and dress codes goes a long way.',
      },
      {
        title: 'Learn Basic Phrases',
        desc: 'Locals genuinely appreciate visitors who try to speak their language — even just "hello," "please," and "thank you" make a difference.',
      },
      {
        title: 'Dress Appropriately for Religious Sites',
        desc: 'Many temples, mosques, and churches require covered shoulders and knees. Carry a light scarf for flexibility.',
      },
      {
        title: 'Ask Before Photographing People',
        desc: 'In many cultures, photographing strangers — especially in markets or religious contexts — requires permission.',
      },
    ],
  },
  {
    title: 'Health & Wellness',
    icon: 'fas fa-heartbeat',
    color: '#e0f7fa',
    accent: '#00838f',
    tips: [
      {
        title: 'Stay Hydrated',
        desc: 'Flying dehydrates you quickly. Drink plenty of water during flights and at your destination, especially in hot climates.',
      },
      {
        title: 'Check Required Vaccinations',
        desc: 'Some destinations require or strongly recommend vaccinations. Consult a travel clinic at least 6 weeks before departure.',
      },
      {
        title: 'Bring a Basic First Aid Kit',
        desc: 'Include pain relievers, antihistamines, diarrhea medication, bandages, and any prescription drugs with extra supply.',
      },
      {
        title: 'Adjust to Time Zones Gradually',
        desc: 'Shift your sleep schedule a few days before long-haul travel to minimize jet lag. Avoid heavy meals on long flights.',
      },
    ],
  },
];

const TravelTipsPage = () => {
  const [openCategory, setOpenCategory] = useState(0);
  const [openTip, setOpenTip] = useState(null);

  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/bg/bg7.jpg)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Expert Advice</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Travel Tips & Guides</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Everything you need to know before, during, and after your trip — from saving money to staying safe abroad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <section style={{ padding: '50px 0', background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)' }}>
        <div className="container">
          <div className="row g-3 text-center">
            {[
              { num: '6', label: 'Tip Categories' },
              { num: '24', label: 'Expert Tips' },
              { num: '50K+', label: 'Travelers Helped' },
              { num: 'Free', label: 'Always' },
            ].map((s, i) => (
              <div className="col-6 col-lg-3" key={i}>
                <h3 style={{ color: '#fff', marginBottom: '4px' }}>{s.num}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Content */}
      <section style={{ padding: '80px 0', background: '#f8f9fa' }}>
        <div className="container">
          <div className="row g-5">
            {/* Sidebar Navigation */}
            <div className="col-lg-3">
              <div style={{ position: 'sticky', top: '100px' }}>
                <h5 style={{ color: '#17233e', marginBottom: '20px' }}>Categories</h5>
                {categories.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setOpenCategory(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: openCategory === i ? 'linear-gradient(135deg, #0A539D, #029e9d)' : '#fff',
                      color: openCategory === i ? '#fff' : '#555',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      textAlign: 'left',
                      transition: 'all 0.3s',
                    }}
                  >
                    <i className={cat.icon} style={{ width: '18px', textAlign: 'center' }}></i>
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Content */}
            <div className="col-lg-9">
              {categories[openCategory] && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: categories[openCategory].color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i
                        className={categories[openCategory].icon}
                        style={{ color: categories[openCategory].accent, fontSize: '22px' }}
                      ></i>
                    </div>
                    <div>
                      <h3 style={{ color: '#17233e', margin: 0 }}>{categories[openCategory].title}</h3>
                      <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>
                        {categories[openCategory].tips.length} essential tips
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categories[openCategory].tips.map((tip, ti) => (
                      <div
                        key={ti}
                        style={{
                          background: '#fff',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                          border: openTip === ti ? `2px solid ${categories[openCategory].accent}` : '2px solid transparent',
                          transition: 'all 0.3s',
                        }}
                      >
                        <button
                          onClick={() => setOpenTip(openTip === ti ? null : ti)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '20px 24px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, #0A539D, #029e9d)`,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '700',
                                flexShrink: 0,
                              }}
                            >
                              {ti + 1}
                            </span>
                            <h6 style={{ color: '#17233e', margin: 0, fontSize: '16px', fontWeight: '600' }}>
                              {tip.title}
                            </h6>
                          </div>
                          <i
                            className={`fas fa-chevron-${openTip === ti ? 'up' : 'down'}`}
                            style={{ color: '#029e9d', fontSize: '14px', flexShrink: 0 }}
                          ></i>
                        </button>

                        {openTip === ti && (
                          <div style={{ padding: '0 24px 20px 66px' }}>
                            <p style={{ color: '#777', lineHeight: '1.7', margin: 0 }}>{tip.desc}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* VI Tip Block */}
      <section style={{ padding: '60px 0', background: '#fff' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(10,83,157,0.06), rgba(2,158,157,0.08))',
              borderRadius: '24px',
              padding: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '64px' }}>🤖</div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3 style={{ color: '#17233e', marginBottom: '12px' }}>Ask VI for Personalized Tips</h3>
              <p style={{ color: '#777', lineHeight: '1.7', marginBottom: '20px' }}>
                General tips are great, but VI knows your destination, dates, and travel style — so it can give you hyper-specific advice that actually applies to your trip.
              </p>
              <Link to="/" className="btn-main btn-sm-page">Chat with VI</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TravelTipsPage;
