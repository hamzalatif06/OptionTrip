import React from 'react';
import { Link } from 'react-router-dom';
import './LastMinuteDeals.css';

const LastMinuteDeals = () => {
  const largeDeals = [
    { country: 'Norway', title: 'Norway Lake', days: 6, rating: 5, reviews: 16, price: 180, image: '/images/trending/trendingb-2.jpg' },
    { country: 'Egpyt', title: 'Pyramid Land', days: 6, rating: 5, reviews: 16, price: 180, image: '/images/trending/trending-large.jpg' },
    { country: 'Usa', title: 'New York City', days: 3, rating: 5, reviews: 12, price: 140, image: '/images/trending/trendingb-1.jpg' }
  ];

  const smallDeals = [
    { country: 'Spain', title: 'Barcelona city beach', days: 4, rating: 5, reviews: 21, price: 220, image: '/images/trending/trending1.jpg' },
    { country: 'Indonesia', title: 'Bali Province', days: 7, rating: 5, reviews: 11, price: 210, image: '/images/trending/trending2.jpg' },
    { country: 'Russia', title: 'Red City Land', days: 3, rating: 5, reviews: 25, price: 120, image: '/images/trending/trending3.jpg' },
    { country: 'Bangladesh', title: "Cox's bazar Beach", days: 5, rating: 5, reviews: 32, price: 100, image: '/images/trending/trending4.jpg' }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`fa fa-star ${i < rating ? 'checked' : ''}`}></span>
    ));
  };

  return (
    <section className="trending pb-0 pt-6" style={{backgroundImage: `url(/images/shape2.png)`}}>
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Top Deals</h4>
          <h2 className="mb-1">The Last <span className="theme">Minute Deals</span></h2>
          <p>Discover incredible last-minute deals on handpicked destinations. Our AI finds the best prices and creates personalized itineraries for spontaneous travelers.</p>
        </div>
        <div className="trend-box">
          <div className="row">
            <div className="col-lg-5 mb-4">
              {largeDeals.map((deal, index) => (
                <div key={index} className="trend-item1 rounded box-shadow mb-4">
                  <div className="trend-image position-relative">
                    <img src={deal.image} alt={deal.title} />
                    <div className="trend-content1 p-4">
                      <h5 className="theme1 mb-1"><i className="flaticon-location-pin"></i> {deal.country}</h5>
                      <h3 className="mb-1 white"><Link to="/tours" className="white">{deal.title}</Link></h3>
                      <div className="rating-main d-flex align-items-center pb-2">
                        <div className="rating">
                          {renderStars(deal.rating)}
                        </div>
                        <span className="ms-2 white">({deal.reviews})</span>
                      </div>
                      <div className="entry-meta d-flex align-items-center justify-content-between">
                        <div className="entry-author d-flex align-items-center">
                          <p className="mb-0 white"><span className="theme1 fw-bold fs-5"> ${deal.price}.00</span> | Per person</p>
                        </div>
                        <div className="entry-author">
                          <i className="icon-calendar white"></i>
                          <span className="fw-bold white"> {deal.days} Days Tours</span>
                        </div>
                      </div>
                    </div>
                    <div className="overlay"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-lg-7">
              <div className="row">
                {smallDeals.map((deal, index) => (
                  <div key={index} className="col-lg-6 col-md-6 mb-4">
                    <div className="trend-item rounded box-shadow">
                      <div className="trend-image position-relative">
                        <img src={deal.image} alt={deal.title} />
                        <div className="color-overlay"></div>
                      </div>
                      <div className="trend-content p-4 pt-5 position-relative bg-white">
                        <div className="trend-meta bg-theme white px-3 py-2 rounded">
                          <div className="entry-author">
                            <i className="icon-calendar"></i>
                            <span className="fw-bold"> {deal.days} Days Tours</span>
                          </div>
                        </div>
                        <h5 className="theme mb-1"><i className="flaticon-location-pin"></i> {deal.country}</h5>
                        <h3 className="mb-1"><Link to="/tours">{deal.title}</Link></h3>
                        <div className="rating-main d-flex align-items-center pb-2">
                          <div className="rating">
                            {renderStars(deal.rating)}
                          </div>
                          <span className="ms-2">({deal.reviews})</span>
                        </div>
                        <p className="border-b pb-2 mb-2">Experience breathtaking landscapes, rich cultural heritage, and unforgettable adventures in this stunning destination.</p>
                        <div className="entry-meta">
                          <div className="entry-author d-flex align-items-center">
                            <p className="mb-0"><span className="theme fw-bold fs-5"> ${deal.price}.00</span> | Per person</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LastMinuteDeals;

