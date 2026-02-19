import React from 'react';
import AboutUs from '../components/AboutUs/AboutUs';
import AboutSection from '../components/AboutSection/AboutSection';
import OurTeam from '../components/OurTeam/OurTeam';
import Testimonials from '../components/Testimonials/Testimonials';

const About = () => {
  return (
    <>
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">About Us</h4>
                  <h1>Get To Know Us Better</h1>
                  <p className="mb-4">Learn more about</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AboutUs />
      <AboutSection />
  
      <Testimonials />
    </>
  );
};

export default About;


