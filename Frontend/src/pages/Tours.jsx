import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import BestTours from '../components/BestTours/BestTours';
import LastMinuteDeals from '../components/LastMinuteDeals/LastMinuteDeals';
// import OfferPackages from '../components/OfferPackages/OfferPackages';

const Tours = () => {
  return (
    <>
      <PageMeta
        title="Tours & Packages"
        description="Browse curated tour packages and last-minute deals — inspiration for your next city break, beach escape, or adventure trip."
        keywords="travel packages, tour deals, holiday packages, last minute travel, curated tours"
        path="/tours"
      />
      <div className="banner pt-10 pb-0 overflow-hidden" style={{backgroundImage: `url(/images/testimonial.png)`}}>
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Our Tours</h4>
                  <h1>Explore Amazing Tour Packages</h1>
                  <p className="mb-4">Discover the best travel experiences around the world</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BestTours />
      <LastMinuteDeals />
      {/* <OfferPackages /> */}
    </>
  );
};

export default Tours;


