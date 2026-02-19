import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TopDestinations.css';

const TopDestinations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const destinations = [
    {
      id: 1,
      country: 'France',
      city: 'Paris',
      tours: 156,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
      category: 'europe',
      description: 'City of Love & Lights',
      popular: true
    },
    {
      id: 2,
      country: 'Japan',
      city: 'Tokyo',
      tours: 142,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
      category: 'asia',
      description: 'Where Tradition Meets Future',
      popular: true
    },
    {
      id: 3,
      country: 'Italy',
      city: 'Rome',
      tours: 128,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
      category: 'europe',
      description: 'Eternal City of History',
      popular: true
    },
    {
      id: 4,
      country: 'USA',
      city: 'New York',
      tours: 189,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
      category: 'americas',
      description: 'The City That Never Sleeps',
      popular: true
    },
    {
      id: 5,
      country: 'UAE',
      city: 'Dubai',
      tours: 98,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
      category: 'middleeast',
      description: 'City of Superlatives',
      popular: false
    },
    {
      id: 6,
      country: 'Thailand',
      city: 'Bangkok',
      tours: 112,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
      category: 'asia',
      description: 'Land of Smiles',
      popular: false
    },
    {
      id: 7,
      country: 'Spain',
      city: 'Barcelona',
      tours: 134,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
      category: 'europe',
      description: 'Gaudi\'s Masterpiece',
      popular: false
    },
    {
      id: 8,
      country: 'Australia',
      city: 'Sydney',
      tours: 87,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
      category: 'oceania',
      description: 'Harbor City Paradise',
      popular: false
    },
    {
      id: 9,
      country: 'Indonesia',
      city: 'Bali',
      tours: 145,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      category: 'asia',
      description: 'Island of Gods',
      popular: true
    },
    {
      id: 10,
      country: 'Greece',
      city: 'Santorini',
      tours: 92,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
      category: 'europe',
      description: 'Aegean Dream',
      popular: false
    }
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'europe', label: 'Europe' },
    { id: 'asia', label: 'Asia' },
    { id: 'americas', label: 'Americas' },
    { id: 'middleeast', label: 'Middle East' },
    { id: 'oceania', label: 'Oceania' }
  ];

  const filteredDestinations = activeFilter === 'all'
    ? destinations
    : destinations.filter(d => d.category === activeFilter);

  const handleDestinationClick = (destination) => {
    // Store selected destination in sessionStorage for the trip planner
    sessionStorage.setItem('selectedDestination', JSON.stringify({
      text: `${destination.city}, ${destination.country}`,
      name: destination.city,
      country: destination.country
    }));

    // Navigate to home page
    navigate('/', { state: { scrollToPlanner: true, destination: destination } });

    // Scroll to trip planner section after navigation
    setTimeout(() => {
      const plannerSection = document.querySelector('.book-form');
      if (plannerSection) {
        plannerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Get featured (first) destination and grid destinations
  const featuredDestination = filteredDestinations[0];
  const gridDestinations = filteredDestinations.slice(1, 5);

  return (
    <section className="top-destinations-section">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Top Destinations</span>
          <h2 className="section-title">
            <span>Explore </span><span className="highlight">Top Destinations</span>
          </h2>
          <p className="section-description">
            Discover the world's most captivating destinations. Click any destination to start planning your dream trip.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="destination-filters">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="destinations-grid">
          {/* Featured Large Card */}
          {featuredDestination && (
            <div
              className="destination-card featured"
              onClick={() => handleDestinationClick(featuredDestination)}
            >
              <div className="card-image">
                <img src={featuredDestination.image} alt={featuredDestination.city} loading="lazy" />
                <div className="card-overlay"></div>
                {featuredDestination.popular && (
                  <span className="popular-badge">
                    <i className="fas fa-fire"></i>
                    <span>Popular</span>
                  </span>
                )}
              </div>
              <div className="card-content">
                <div className="card-location">
                  <span className="country">{featuredDestination.country}</span>
                  <h3 className="city">{featuredDestination.city}</h3>
                  <p className="description">{featuredDestination.description}</p>
                </div>
                <div className="card-meta">
                  <div className="rating">
                    <i className="fas fa-star"></i>
                    <span>{featuredDestination.rating}</span>
                  </div>
                  <div className="tours-count">
                    <i className="fas fa-route"></i>
                    <span>{featuredDestination.tours}+ Tours</span>
                  </div>
                </div>
                <button className="plan-trip-btn">
                  <span>Plan Your Trip</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Grid Cards */}
          <div className="grid-cards">
            {gridDestinations.map((destination) => (
              <div
                key={destination.id}
                className="destination-card"
                onClick={() => handleDestinationClick(destination)}
              >
                <div className="card-image">
                  <img src={destination.image} alt={destination.city} loading="lazy" />
                  <div className="card-overlay"></div>
                  {destination.popular && (
                    <span className="popular-badge">
                      <i className="fas fa-fire"></i>
                    </span>
                  )}
                </div>
                <div className="card-content">
                  <div className="card-location">
                    <span className="country">{destination.country}</span>
                    <h3 className="city">{destination.city}</h3>
                  </div>
                  <div className="card-meta">
                    <div className="rating">
                      <i className="fas fa-star"></i>
                      <span>{destination.rating}</span>
                    </div>
                    <div className="tours-count">
                      <span>{destination.tours}+</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="view-all-wrapper">
          <Link to="/destinations" className="view-all-btn">
            <span>View All Destinations</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
