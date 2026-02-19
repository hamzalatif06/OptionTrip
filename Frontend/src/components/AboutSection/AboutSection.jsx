import React from 'react';
import './AboutSection.css';

const AboutSection = () => {
  const stats = [
    { value: 20, label: 'Years Experiences' },
    { value: 530, label: 'Tour Packages' },
    { value: 850, label: 'Happy Customers' },
    { value: 320, label: 'Award Winning' }
  ];

  return (
    <section className="about-us pt-0" style={{backgroundImage: `url(/images/bg/bg-trans.png)`}}>
      <div className="container">
        <div className="about-image-box">
          <div className="row d-flex align-items-center justify-content-between">
            <div className="col-lg-6 mb-4 pe-4">
              <div className="about-image overflow-hidden">
                <img src="/images/travel1.png" alt="About Us" />
              </div>
            </div>
            <div className="col-lg-6 mb-4 ps-4">
              <div className="about-content text-center text-lg-start mb-4">
                <h4 className="theme d-inline-block mb-0">Get To Know Us</h4>
                <h2 className="border-b mb-2 pb-1">Explore All Tour of the world with us.</h2>
                <p className="border-b mb-2 pb-2">
                  OptionTrip revolutionizes travel planning with cutting-edge AI technology that understands your unique preferences and creates personalized itineraries in minutes. Our intelligent system analyzes millions of travel data points, reviews, and real-time information to craft the perfect journey for every traveler.<br /><br />Whether you're seeking adventure, relaxation, culture, or business travel, our AI adapts to your needs, budget, and schedule. Experience seamless trip planning with recommendations that get smarter with every interaction.
                </p>
                <div className="about-listing">
                  <ul className="d-flex justify-content-between">
                    <li><i className="icon-location-pin theme"></i> Tour Guide</li>
                    <li><i className="icon-briefcase theme"></i> Friendly Price</li>
                    <li><i className="icon-folder theme"></i> Reliable Tour Package</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* <div className="col-lg-12">
              <div className="counter-main w-75 float-end">
                <div className="counter p-4 pb-0 box-shadow bg-white rounded">
                  <div className="row">
                    {stats.map((stat, index) => (
                      <div key={index} className="col-lg-3 col-md-6 col-sm-6 mb-4">
                        <div className={`counter-item ${index < stats.length - 1 ? 'border-end pe-4' : ''}`}>
                          <div className="counter-content">
                            <h2 className="value mb-0 theme">{stat.value}</h2>
                            <span className="m-0">{stat.label}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
      <div className="white-overlay"></div>
    </section>
  );
};

export default AboutSection;

