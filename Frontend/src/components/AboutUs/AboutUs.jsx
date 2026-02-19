import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const steps = [
    {
      icon: 'icon-flag',
      title: 'Tell Us What You want To Do',
      description: 'Describe your dream trip in natural language. Our AI understands your travel goals, interests, and style preferences.'
    },
    {
      icon: 'icon-location-pin',
      title: 'Share Your Travel Locations',
      description: 'Tell us your destination or let our AI suggest perfect places based on your interests, budget, and travel dates.'
    },
    {
      icon: 'icon-directions',
      title: 'Share Your Travel Preference',
      description: 'Set your budget, travel dates, accommodation style, and activity preferences. Our AI learns what matters most to you.'
    },
    {
      icon: 'icon-compass',
      title: 'Get Your Perfect Trip with us',
      description: 'Receive a fully personalized itinerary with day-by-day plans, recommendations, and booking options tailored just for you.'
    }
  ];

  return (
    <section className="about-us pb-6 pt-6" style={{backgroundImage: `url(/images/shape4.png)`, backgroundPosition: 'center'}}>
      <div className="container">
        <div className="section-title mb-6 w-50 mx-auto text-center">
          <h4 className="mb-1 theme1">3 Step of The Perfect Tour</h4>
          <h2 className="mb-1">Find <span className="theme">Travel Perfection</span></h2>
          <p>Planning your perfect trip is simple with our AI-powered platform. Just three easy steps to your personalized travel experience.</p>
        </div>

        <div className="why-us">
          <div className="why-us-box">
            <div className="row">
              {steps.map((step, index) => (
                <div key={index} className="col-lg-3 col-md-6 col-sm-6 mb-4">
                  <div className="why-us-item text-center p-4 py-5 border rounded bg-white">
                    <div className="why-us-content">
                      <div className="why-us-icon">
                        <i className={`${step.icon} theme`}></i>
                      </div>
                      <h4><Link to="/about">{step.title}</Link></h4>
                      <p className="mb-0">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="white-overlay"></div>
    </section>
  );
};

export default AboutUs;

