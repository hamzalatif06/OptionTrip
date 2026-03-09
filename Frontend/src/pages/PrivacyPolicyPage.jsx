import React from 'react';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        subtitle: '1.1 Information You Provide',
        text: 'When you create an account, plan a trip, or contact us, we collect information such as your name, email address, password, travel preferences, and any content you submit through our platform.',
      },
      {
        subtitle: '1.2 Information Collected Automatically',
        text: 'We automatically collect certain information when you use Option Trip, including your IP address, browser type, operating system, referring URLs, pages visited, and the dates and times of your visits.',
      },
      {
        subtitle: '1.3 Location Information',
        text: 'With your permission, we may collect precise location data to provide location-based features such as nearby destination recommendations. You can control this through your device settings.',
      },
      {
        subtitle: '1.4 Third-Party Services',
        text: 'If you choose to connect via Google, Facebook, or other OAuth providers, we receive basic profile information such as your name, email, and profile picture as permitted by your privacy settings on those platforms.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: '',
        text: 'We use the information we collect to: provide, operate, and improve our services; personalize your travel recommendations and itineraries; process your requests and transactions; send you service notifications and updates; respond to your inquiries and support requests; analyze usage patterns to improve user experience; comply with legal obligations; and protect the security and integrity of our platform.',
      },
    ],
  },
  {
    title: '3. AI and Automated Processing',
    content: [
      {
        subtitle: '',
        text: 'Option Trip uses artificial intelligence (including our VI TravelBuddy) to process your travel preferences and generate personalized itineraries. This involves automated decision-making to suggest destinations, activities, and routes. You may request human review of any AI-generated recommendation. The AI processes your data only to improve your travel experience and does not make decisions with legal or similarly significant effects.',
      },
    ],
  },
  {
    title: '4. Information Sharing',
    content: [
      {
        subtitle: '4.1 We Do Not Sell Your Data',
        text: 'We do not sell, rent, or trade your personal information to third parties for their marketing purposes.',
      },
      {
        subtitle: '4.2 Service Providers',
        text: 'We may share your information with trusted service providers who assist us in operating our platform, such as cloud hosting, email delivery, payment processing, and analytics. These providers are contractually obligated to protect your data.',
      },
      {
        subtitle: '4.3 Legal Requirements',
        text: 'We may disclose your information when required by law, court order, or government authority, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.',
      },
    ],
  },
  {
    title: '5. Data Retention',
    content: [
      {
        subtitle: '',
        text: 'We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at optiontripcom@gmail.com. We will delete or anonymize your data within 30 days, except where retention is required by law.',
      },
    ],
  },
  {
    title: '6. Your Rights',
    content: [
      {
        subtitle: '',
        text: 'Depending on your location, you may have the right to: access the personal data we hold about you; correct inaccurate or incomplete data; request deletion of your data; object to or restrict certain processing; data portability; and withdraw consent at any time. To exercise these rights, contact us at optiontripcom@gmail.com.',
      },
    ],
  },
  {
    title: '7. Security',
    content: [
      {
        subtitle: '',
        text: 'We implement industry-standard security measures including encryption in transit (TLS), encrypted storage, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
      },
    ],
  },
  {
    title: '8. Cookies',
    content: [
      {
        subtitle: '',
        text: 'We use cookies and similar tracking technologies to enhance your experience. Please see our Cookie Policy for full details on what cookies we use and how to manage them.',
      },
    ],
  },
  {
    title: '9. Children\'s Privacy',
    content: [
      {
        subtitle: '',
        text: 'Option Trip is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.',
      },
    ],
  },
  {
    title: '10. Changes to This Policy',
    content: [
      {
        subtitle: '',
        text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on our platform. Your continued use of Option Trip after such changes constitutes your acceptance of the updated policy.',
      },
    ],
  },
  {
    title: '11. Contact Us',
    content: [
      {
        subtitle: '',
        text: 'If you have questions, concerns, or requests regarding this Privacy Policy, please contact us at: optiontripcom@gmail.com or write to us at www.OptionTrip.com.',
      },
    ],
  },
];

const PrivacyPolicyPage = () => {
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
                  <h1>Privacy Policy</h1>
                  <p className="mb-4">
                    We take your privacy seriously. Learn how we collect, use, and protect your personal information.
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
                  This Privacy Policy explains how Option Trip ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our website at <strong>www.OptionTrip.com</strong> and related services. By using Option Trip, you agree to the collection and use of information in accordance with this policy.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, i) => (
                <div key={i} style={{ marginBottom: '40px' }}>
                  <h3
                    style={{
                      color: '#17233e',
                      borderBottom: '2px solid #f0f0f0',
                      paddingBottom: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    {section.title}
                  </h3>
                  {section.content.map((item, j) => (
                    <div key={j} style={{ marginBottom: '16px' }}>
                      {item.subtitle && (
                        <h6 style={{ color: '#029e9d', fontWeight: '700', marginBottom: '8px' }}>
                          {item.subtitle}
                        </h6>
                      )}
                      <p style={{ color: '#777', lineHeight: '1.8', margin: 0 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicyPage;
