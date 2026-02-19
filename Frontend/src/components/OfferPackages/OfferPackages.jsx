import React from 'react';
import { Link } from 'react-router-dom';
import './OfferPackages.css';

const OfferPackages = () => {
  const offers = [
    { location: 'Croatia', title: 'Piazza Castello', days: 9, rating: 5, reviews: 12, price: 170, discount: '20% OFF', image: '/images/trending/trending3.jpg' },
    { location: 'Greece', title: 'Santorini, Oia', days: 9, rating: 5, reviews: 38, price: 180, discount: '30% OFF', image: '/images/trending/trending1.jpg' },
    { location: 'Maldives', title: 'Hurawalhi Island', days: 9, rating: 5, reviews: 18, price: 260, discount: '15% OFF', image: '/images/trending/trending2.jpg' }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`fa fa-star ${i < rating ? 'checked' : ''}`}></span>
    ));
  };

  return (
    <section className="trending pb-0 pt-4">
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Top Offers</h4>
          <h2 className="mb-1">Special <span className="theme">Offers & Discount </span> Packages</h2>
          <p>Take advantage of our exclusive offers and discounts on premium travel packages. Limited-time deals on unforgettable experiences.</p>
        </div>
        <div className="trend-box">
          <div className="row">
            {offers.map((offer, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-sm-6 mb-4">
                <div className="trend-item rounded box-shadow bg-white">
                  <div className="trend-image position-relative">
                    <img src={offer.image} alt={offer.title} />
                    <div className="ribbon ribbon-top-left"><span className="fw-bold">{offer.discount}</span></div>
                    <div className="color-overlay"></div>
                  </div>
                  <div className="trend-content p-4 pt-5 position-relative">
                    <div className="trend-meta bg-theme white px-3 py-2 rounded">
                      <div className="entry-author">
                        <i className="icon-calendar"></i>
                        <span className="fw-bold"> {offer.days} Days Tours</span>
                      </div>
                    </div>
                    <h5 className="theme mb-1"><i className="flaticon-location-pin"></i> {offer.location}</h5>
                    <h3 className="mb-1"><Link to="/tours">{offer.title}</Link></h3>
                    <div className="rating-main d-flex align-items-center pb-2">
                      <div className="rating">
                        {renderStars(offer.rating)}
                      </div>
                      <span className="ms-2">({offer.reviews})</span>
                    </div>
                    <p className="border-b pb-2 mb-2">Enjoy premium accommodations, expert guides, and carefully curated experiences in this exclusive destination.</p>
                    <div className="entry-meta">
                      <div className="entry-author d-flex align-items-center">
                        <p className="mb-0"><span className="theme fw-bold fs-5"> ${offer.price}.00</span> | Per person</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferPackages;

