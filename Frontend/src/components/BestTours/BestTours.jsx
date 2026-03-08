import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTripOptions } from '../../services/tripsService';
import { toast } from 'react-toastify';
import useCurrency from '../../hooks/useCurrency';
import './BestTours.css';

const BestTours = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [guestCounts, setGuestCounts] = useState({});
  const [loadingTour, setLoadingTour] = useState(null);

  const tours = [
    {
      id: 1,
      location: 'France',
      city: 'Paris',
      title: 'Paris City of Lights',
      days: 5,
      rating: 5,
      reviews: 156,
      price: 299,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
      description: 'Experience the magic of Paris with visits to the Eiffel Tower, Louvre, and charming Montmartre.'
    },
    {
      id: 2,
      location: 'Japan',
      city: 'Tokyo',
      title: 'Tokyo Adventure',
      days: 7,
      rating: 5,
      reviews: 142,
      price: 450,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
      description: 'Discover ancient temples, futuristic tech, and incredible cuisine in vibrant Tokyo.'
    },
    {
      id: 3,
      location: 'Italy',
      city: 'Rome',
      title: 'Roman Holiday',
      days: 6,
      rating: 5,
      reviews: 198,
      price: 350,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop',
      description: 'Walk through history with the Colosseum, Vatican, and authentic Italian experiences.'
    },
    {
      id: 4,
      location: 'Greece',
      city: 'Santorini',
      title: 'Santorini Dreams',
      days: 5,
      rating: 5,
      reviews: 224,
      price: 380,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
      description: 'Relax in iconic white-washed villages with stunning Aegean Sea views.'
    },
    {
      id: 5,
      location: 'Indonesia',
      city: 'Bali',
      title: 'Bali Paradise',
      days: 8,
      rating: 5,
      reviews: 312,
      price: 420,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
      description: 'Find peace in lush rice terraces, ancient temples, and beautiful beaches.'
    },
    {
      id: 6,
      location: 'UAE',
      city: 'Dubai',
      title: 'Dubai Luxury',
      days: 4,
      rating: 5,
      reviews: 178,
      price: 520,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop',
      description: 'Experience world-class luxury, iconic architecture, and desert adventures.'
    }
  ];

  // Get guest count for a tour (default 2)
  const getGuestCount = (tourId) => guestCounts[tourId] || 2;

  // Update guest count for a tour
  const handleGuestChange = (e, tourId) => {
    e.stopPropagation();
    setGuestCounts(prev => ({
      ...prev,
      [tourId]: parseInt(e.target.value)
    }));
  };

  // Generate trip automatically with tour data
  const handleGenerateTrip = async (e, tour) => {
    e.stopPropagation();

    const guests = getGuestCount(tour.id);

    // Calculate dates (start 1 month from now)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tour.days - 1);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const monthYear = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const formData = {
      destination: {
        text: `${tour.city}, ${tour.location}`,
        place_id: '',
        name: tour.city,
        geometry: null
      },
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      duration_days: tour.days,
      month_year: monthYear,
      tripType: 'sightseeing',
      guests: {
        total: guests,
        adults: guests,
        children: 0,
        infants: 0,
        label: `${guests} Adults`
      },
      budget: 'moderate',
      description: tour.description
    };

    try {
      setLoadingTour(tour.id);
      const response = await generateTripOptions(formData);

      if (response.success && response.data?.trip_id) {
        toast.success(`Generating your ${tour.city} trip!`);
        navigate(`/trips/${response.data.trip_id}`);
      } else {
        toast.error('Failed to generate trip. Please try again.');
      }
    } catch (error) {
      console.error('Error generating trip:', error);
      toast.error(error.message || 'Failed to generate trip. Please try again.');
    } finally {
      setLoadingTour(null);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`fa fa-star ${i < rating ? 'checked' : ''}`}></span>
    ));
  };

  return (
    <section className="trending pb-0">
      <div className="container">
        <div className="row justify-content-center mb-6">
          <div className="col-lg-8">
            <div className="section-title text-center">
              <h4 className="mb-1 theme1">Top Pick</h4>
              <h2 className="mb-1">Best <span className="theme">Tour Packages</span></h2>
              <p>Explore our curated collection of handpicked tour packages, each carefully designed by our AI to match different travel styles and preferences.</p>
            </div>
          </div>
        </div>
        <div className="trend-box">
          <div className="row item-slider">
            {tours.map((tour) => (
              <div key={tour.id} className="col-lg-4 col-md-6 col-sm-6 mb-4">
                <div className="trend-item rounded box-shadow">
                  <div className="trend-image position-relative">
                    <img src={tour.image} alt={tour.title} loading="lazy" />
                    <div className="color-overlay"></div>
                  </div>
                  <div className="trend-content p-4 pt-5 position-relative">
                    <div className="trend-meta bg-theme white px-3 py-2 rounded">
                      <div className="entry-author">
                        <i className="icon-calendar"></i>
                        <span className="fw-bold"> {tour.days}-Day Tour</span>
                      </div>
                    </div>
                    <h5 className="theme mb-1"><i className="flaticon-location-pin"></i> {tour.location}</h5>
                    <h3 className="mb-1"><span className="tour-title-link">{tour.title}</span></h3>
                    <div className="rating-main d-flex align-items-center pb-2">
                      <div className="rating">{renderStars(tour.rating)}</div>
                    </div>
                    <p className="border-b pb-2 mb-2 tour-desc">{tour.description}</p>
                    <div className="entry-meta mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <p className="mb-0"><span className="theme fw-bold fs-5">{formatPrice(tour.price)}</span><span className="text-muted ms-1" style={{fontSize:'12px'}}>/person</span></p>
                        <span className="text-muted" style={{fontSize:'12px'}}>({tour.reviews} reviews)</span>
                      </div>
                    </div>

                    {/* Guest Selector and Generate Button */}
                    <div className="tour-quick-book">
                      <div className="guest-selector-inline">
                        <label htmlFor={`guests-${tour.id}`}>
                          <i className="fa fa-users"></i>
                        </label>
                        <select
                          id={`guests-${tour.id}`}
                          value={getGuestCount(tour.id)}
                          onChange={(e) => handleGuestChange(e, tour.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        className={`generate-trip-btn ${loadingTour === tour.id ? 'loading' : ''}`}
                        onClick={(e) => handleGenerateTrip(e, tour)}
                        disabled={loadingTour === tour.id}
                      >
                        {loadingTour === tour.id ? (
                          <>
                            <span className="btn-spinner"></span>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-plane-departure" style={{transform: 'rotate(-20deg)'}}></i>
                            <span>Explore</span>
                          </>
                        )}
                      </button>
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

export default BestTours;

