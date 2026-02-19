import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Travel Enthusiast',
      image: '/images/testimonial/img1.jpg',
      text: 'OptionTrip\'s AI planner created the perfect 10-day itinerary for my European adventure. It understood my preferences for art, history, and local cuisine, and suggested hidden gems I never would have found on my own. The personalized recommendations saved me hours of research!'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Business Traveler',
      image: '/images/testimonial/img1.jpg',
      text: 'As someone who travels frequently for work, I love how OptionTrip adapts to my schedule and budget. The AI assistant suggested the most efficient routes and even found last-minute deals that fit my tight timeline. It\'s like having a personal travel agent available 24/7.'
    }
  ];

  return (
    <section className="testimonial pt-9" style={{backgroundImage: `url(/images/testimonial.png)`}}>
      <div className="container">
        <div className="section-title mb-6 text-center w-75 mx-auto">
          <h4 className="mb-1 theme1">Our Testimonails</h4>
          <h2 className="mb-1">Good Reviews By <span className="theme">Clients</span></h2>
          <p>Discover how our AI-powered trip planner has transformed travel experiences for thousands of satisfied customers worldwide.</p>
        </div>
        <div className="row align-items-center">
          <div className="col-lg-5 pe-4">
            <div className="testimonial-image">
              <img src="/images/travel2.png" alt="Testimonials" />
            </div>
          </div>
          <div className="col-lg-7 ps-4">
            <div className="row review-slider">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="col-sm-4 item">
                  <div className="testimonial-item1 rounded">
                    <div className="author-info d-flex align-items-center mb-4">
                      <img src={testimonial.image} alt={testimonial.name} />
                      <div className="author-title ms-3">
                        <h5 className="m-0 theme">{testimonial.name}</h5>
                        <span>{testimonial.role}</span>
                      </div>
                    </div>
                    <div className="details">
                      <p className="m-0">
                        <i className="fa fa-quote-left me-2 fs-1"></i>{testimonial.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

