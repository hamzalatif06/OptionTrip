import React from 'react';
import TopDestinations from '../components/TopDestinations/TopDestinations';

const Destinations = () => {
  return (
    <>
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Destinations</h4>
                  <h1>Explore Top Destinations</h1>
                  <p className="mb-4">Discover amazing places around the world</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TopDestinations />
    </>
  );
};

export default Destinations;


