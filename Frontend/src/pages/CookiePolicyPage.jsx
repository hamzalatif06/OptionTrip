import React from 'react';

const cookieTypes = [
  {
    type: 'Strictly Necessary',
    icon: 'fas fa-lock',
    color: '#e8f0fe',
    accent: '#0A539D',
    canOptOut: false,
    desc: 'These cookies are essential for the website to function. They enable core features such as user authentication, session management, and security. You cannot opt out of these cookies.',
    examples: ['Session cookies (keep you logged in)', 'CSRF protection tokens', 'Load balancer cookies', 'Security cookies'],
  },
  {
    type: 'Functional',
    icon: 'fas fa-cog',
    color: '#e8f8f6',
    accent: '#029e9d',
    canOptOut: true,
    desc: 'Functional cookies enable enhanced features and personalization, such as language preferences, currency settings, and remembered travel searches.',
    examples: ['Language preference cookies', 'Currency and region settings', 'Search history for autocomplete', 'UI preference settings'],
  },
  {
    type: 'Analytics',
    icon: 'fas fa-chart-bar',
    color: '#fff3e0',
    accent: '#e65100',
    canOptOut: true,
    desc: 'Analytics cookies help us understand how visitors interact with our website. This information is aggregated and anonymous, used only to improve the platform.',
    examples: ['Page visit counts', 'Session duration tracking', 'Feature usage analytics', 'Error and performance monitoring'],
  },
  {
    type: 'Marketing',
    icon: 'fas fa-bullhorn',
    color: '#fce4ec',
    accent: '#c62828',
    canOptOut: true,
    desc: 'Marketing cookies may be used to deliver relevant travel content and promotions. We do not sell your cookie data to third-party advertisers.',
    examples: ['Destination interest tracking', 'Campaign attribution', 'Personalized travel suggestions', 'Email campaign measurement'],
  },
];

const CookiePolicyPage = () => {
  return (
    <>
      {/* Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: `url(/images/testimonial.png)` }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Legal</h4>
                  <h1>Cookie Policy</h1>
                  <p className="mb-4">
                    Learn about the cookies we use, why we use them, and how you can control your cookie preferences.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                    Last updated: March 1, 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              {/* Intro */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(10,83,157,0.05), rgba(2,158,157,0.08))',
                  borderRadius: '16px',
                  padding: '28px 32px',
                  marginBottom: '48px',
                  borderLeft: '4px solid #029e9d',
                }}
              >
                <p style={{ color: '#555', lineHeight: '1.8', margin: 0 }}>
                  This Cookie Policy explains how Option Trip uses cookies and similar tracking technologies when you visit our website at <strong>www.OptionTrip.com</strong>. By using our site, you consent to the use of cookies as described in this policy. You can manage your preferences at any time.
                </p>
              </div>

              {/* What Are Cookies */}
              <div style={{ marginBottom: '48px' }}>
                <h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
                  What Are Cookies?
                </h3>
                <p style={{ color: '#777', lineHeight: '1.8' }}>
                  Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site. Cookies are not programs and cannot carry viruses or install software on your device.
                </p>
                <p style={{ color: '#777', lineHeight: '1.8', margin: 0 }}>
                  We also use similar technologies like web beacons, pixel tags, and local storage that work similarly to cookies. This policy covers all such technologies collectively referred to as "cookies."
                </p>
              </div>

              {/* Cookie Types */}
              <div style={{ marginBottom: '48px' }}>
                <h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '28px' }}>
                  Types of Cookies We Use
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cookieTypes.map((ct, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              background: ct.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className={ct.icon} style={{ color: ct.accent, fontSize: '18px' }}></i>
                          </div>
                          <h5 style={{ color: '#17233e', margin: 0 }}>{ct.type}</h5>
                        </div>
                        <span
                          style={{
                            padding: '4px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: ct.canOptOut ? '#fff3e0' : '#e8f8f6',
                            color: ct.canOptOut ? '#e65100' : '#029e9d',
                          }}
                        >
                          {ct.canOptOut ? 'Optional' : 'Required'}
                        </span>
                      </div>
                      <p style={{ color: '#777', lineHeight: '1.7', marginBottom: '14px' }}>{ct.desc}</p>
                      <div>
                        <p style={{ color: '#17233e', fontWeight: '600', fontSize: '13px', marginBottom: '8px' }}>Examples:</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {ct.examples.map((ex, ei) => (
                            <li
                              key={ei}
                              style={{
                                background: ct.color,
                                color: ct.accent,
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                            >
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Managing Cookies */}
              <div style={{ marginBottom: '48px' }}>
                <h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
                  How to Manage Cookies
                </h3>
                <p style={{ color: '#777', lineHeight: '1.8', marginBottom: '16px' }}>
                  You can control and manage cookies in several ways:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: 'fas fa-globe', title: 'Browser Settings', desc: 'Most browsers allow you to view, delete, and block cookies. Visit your browser\'s help documentation for specific instructions.' },
                    { icon: 'fas fa-sliders-h', title: 'Our Cookie Settings', desc: 'You can manage your cookie preferences by clearing cookies in your browser and declining non-essential cookies on your next visit.' },
                    { icon: 'fas fa-ban', title: 'Opt-Out Tools', desc: 'For analytics, you can use browser opt-out mechanisms. Note that disabling some cookies may affect website functionality.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', background: '#f8f9fa', borderRadius: '12px', padding: '18px' }}>
                      <i className={item.icon} style={{ color: '#029e9d', fontSize: '20px', marginTop: '2px', flexShrink: 0 }}></i>
                      <div>
                        <h6 style={{ color: '#17233e', marginBottom: '6px' }}>{item.title}</h6>
                        <p style={{ color: '#777', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div style={{ marginBottom: '0' }}>
                <h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
                  Contact Us
                </h3>
                <p style={{ color: '#777', lineHeight: '1.8', margin: 0 }}>
                  If you have questions about our use of cookies, please email us at{' '}
                  <a href="mailto:optiontripcom@gmail.com" style={{ color: '#029e9d', textDecoration: 'none' }}>
                    optiontripcom@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CookiePolicyPage;
