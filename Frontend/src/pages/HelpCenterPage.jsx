import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    category: 'Getting Started',
    icon: 'fas fa-rocket',
    color: '#e8f0fe',
    accent: '#0A539D',
    questions: [
      {
        q: 'How do I create an account on Option Trip?',
        a: 'Click the "Sign Up" button in the top navigation. You can register with your email address or quickly sign in using Google, Facebook, or Twitter. Registration is free and takes less than a minute.',
      },
      {
        q: 'Is Option Trip free to use?',
        a: 'Yes! Planning trips with VI TravelBuddy is completely free. You can create itineraries, explore destinations, and get travel recommendations at no cost. Premium features may be introduced in the future.',
      },
      {
        q: 'What is VI TravelBuddy?',
        a: 'VI is our AI-powered travel assistant. It creates personalized travel itineraries, suggests destinations, answers travel questions, and adapts plans based on your preferences — all through a simple conversation.',
      },
      {
        q: 'Which languages does Option Trip support?',
        a: 'Option Trip supports 22 languages including English, French, German, Spanish, Italian, Arabic, Hindi, Chinese, Japanese, and many more. Use the language switcher in the header to change your language.',
      },
    ],
  },
  {
    category: 'Trip Planning',
    icon: 'fas fa-map-marked-alt',
    color: '#e8f8f6',
    accent: '#029e9d',
    questions: [
      {
        q: 'How do I plan a trip with VI?',
        a: 'Simply go to the home page and tell VI where you want to go, your travel dates, budget, and preferences. VI will generate a complete itinerary. You can refine it by chatting with VI directly.',
      },
      {
        q: 'Can I save and edit my trip plans?',
        a: 'Yes! All your trip plans are saved to your account under "My Trips." You can view, edit, and revisit them anytime. Create a free account to save unlimited trips.',
      },
      {
        q: 'How accurate are VI\'s itinerary suggestions?',
        a: 'VI draws on extensive travel data to generate high-quality itineraries. However, we always recommend verifying visa requirements, operating hours, and booking availability independently before traveling.',
      },
      {
        q: 'Can VI plan trips for groups and families?',
        a: 'Absolutely. Tell VI your group size, ages (especially for families with children), and any special requirements. VI will tailor the itinerary to suit everyone in your group.',
      },
    ],
  },
  {
    category: 'Account & Settings',
    icon: 'fas fa-user-cog',
    color: '#fff3e0',
    accent: '#e65100',
    questions: [
      {
        q: 'How do I change my language or currency?',
        a: 'Use the Language, Currency, and Country selectors in the website header or footer. Your preferences will be saved for your next visit if you are logged in.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Login" then "Forgot Password." Enter your email address and we\'ll send you a password reset link. If you signed up with Google or another OAuth provider, use that service to log in.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To delete your account and all associated data, please contact us at optiontripcom@gmail.com with the subject "Account Deletion Request." We will process your request within 30 days.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    icon: 'fas fa-lock',
    color: '#e8f5e9',
    accent: '#2e7d32',
    questions: [
      {
        q: 'Is my personal data safe with Option Trip?',
        a: 'Yes. We use industry-standard encryption (TLS) for all data in transit and encrypt sensitive stored data. We never sell your personal data to third parties. Read our Privacy Policy for full details.',
      },
      {
        q: 'Does Option Trip share my data with airlines or hotels?',
        a: 'No. We do not share your personal data with travel providers. Option Trip helps you plan trips, but booking is done directly with providers. We are not a booking platform.',
      },
      {
        q: 'How do I access or delete my data?',
        a: 'You have full rights over your data. To access, correct, or delete your personal data, contact us at optiontripcom@gmail.com. We will respond within 30 days. See our Data Protection page for details.',
      },
    ],
  },
];

const HelpCenterPage = () => {
  const [openCat, setOpenCat] = useState(0);
  const [openQ, setOpenQ] = useState(null);

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
                  <h4 className="theme mb-0" style={{ color: '#fdc703', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Support</h4>
                  <h1 style={{ color: 'rgb(255 255 255 / 85%)', textShadow: '0 3px 12px rgba(0,0,0,0.5)' }}>Help Center</h1>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                    Find answers to common questions, learn how to use Option Trip, and get support when you need it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact Cards */}
      <section style={{ padding: '60px 0', background: '#fff' }}>
        <div className="container">
          <div className="row g-4">
            {[
              { icon: 'fas fa-envelope', title: 'Email Support', desc: 'Get a response within 24 hours.', action: 'optiontripcom@gmail.com', href: 'mailto:optiontripcom@gmail.com', color: '#e8f0fe', accent: '#0A539D' },
              { icon: 'fas fa-robot', title: 'Ask VI', desc: 'Our AI assistant is available 24/7 on the home page.', action: 'Chat with VI', href: '/', color: '#e8f8f6', accent: '#029e9d' },
              { icon: 'fab fa-twitter', title: 'Twitter Support', desc: 'Reach us @OptionTripCom for quick help.', action: '@OptionTripCom', href: 'https://www.x.com/OptionTripCom', color: '#e0f7fa', accent: '#00838f' },
            ].map((c, i) => (
              <div className="col-lg-4" key={i}>
                <div
                  style={{
                    background: c.color,
                    borderRadius: '16px',
                    padding: '28px',
                    textAlign: 'center',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i className={c.icon} style={{ color: c.accent, fontSize: '22px' }}></i>
                  </div>
                  <h5 style={{ color: '#17233e', marginBottom: '8px' }}>{c.title}</h5>
                  <p style={{ color: '#777', fontSize: '14px', marginBottom: '16px' }}>{c.desc}</p>
                  <a
                    href={c.href}
                    className="btn-main btn-sm-page"
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {c.action}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '40px 0 80px', background: '#f8f9fa' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h4 className="theme mb-2" style={{ color: '#029e9d' }}>FAQ</h4>
            <h2 style={{ color: '#17233e' }}>Frequently Asked Questions</h2>
            <p style={{ color: '#777' }}>Browse by category or scroll through to find what you need.</p>
          </div>

          <div className="row g-5">
            {/* Category Sidebar */}
            <div className="col-lg-3">
              <div style={{ position: 'sticky', top: '100px' }}>
                {faqs.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => { setOpenCat(i); setOpenQ(null); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: openCat === i ? 'linear-gradient(135deg, #0A539D, #029e9d)' : '#fff',
                      color: openCat === i ? '#fff' : '#555',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      textAlign: 'left',
                      transition: 'all 0.3s',
                    }}
                  >
                    <i className={cat.icon} style={{ width: '16px', textAlign: 'center' }}></i>
                    {cat.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div className="col-lg-9">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: faqs[openCat].color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className={faqs[openCat].icon} style={{ color: faqs[openCat].accent, fontSize: '20px' }}></i>
                </div>
                <h4 style={{ color: '#17233e', margin: 0 }}>{faqs[openCat].category}</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {faqs[openCat].questions.map((item, qi) => (
                  <div
                    key={qi}
                    style={{
                      background: '#fff',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: `2px solid ${openQ === qi ? '#029e9d' : 'transparent'}`,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s',
                    }}
                  >
                    <button
                      onClick={() => setOpenQ(openQ === qi ? null : qi)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '18px 22px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '12px',
                      }}
                    >
                      <span style={{ color: '#17233e', fontWeight: '600', fontSize: '15px', lineHeight: '1.4' }}>
                        {item.q}
                      </span>
                      <i
                        className={`fas fa-chevron-${openQ === qi ? 'up' : 'down'}`}
                        style={{ color: '#029e9d', fontSize: '14px', flexShrink: 0 }}
                      ></i>
                    </button>
                    {openQ === qi && (
                      <div style={{ padding: '0 22px 18px' }}>
                        <p style={{ color: '#777', lineHeight: '1.7', margin: 0, fontSize: '15px' }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section
        style={{
          padding: '70px 0',
          background: 'linear-gradient(135deg, #0A539D 0%, #029e9d 100%)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: '14px' }}>Still Need Help?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '28px', fontSize: '17px' }}>
            Our team is happy to assist. Reach out and we'll get back to you as soon as possible.
          </p>
          <a href="mailto:optiontripcom@gmail.com" className="btn-white">Contact Support</a>
        </div>
      </section>
    </>
  );
};

export default HelpCenterPage;
