import React, { useRef, useState, useEffect } from 'react';
import TripIterationCard from '../TripIterationCard/TripIterationCard';
import './TripIterationsCarousel.css';

const TripIterationsCarousel = ({ options, selectedOptionId, onSelectOption, destination, loading = false }) => {
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    updateScrollButtons();
  }, [options, currentIndex]);

  const updateScrollButtons = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollToIndex = (index) => {
    if (trackRef.current && options[index]) {
      const slideWidth = trackRef.current.children[0]?.offsetWidth || 0;
      const gap = 24;
      const scrollPosition = index * (slideWidth + gap);

      trackRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < options.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handleScroll = () => {
    updateScrollButtons();
  };

  if (loading) {
    return (
      <div className="trip-iterations-carousel">
        <div className="trip-iterations-carousel__loading">
          <span>Loading trip options...</span>
        </div>
      </div>
    );
  }

  if (!options || options.length === 0) {
    return (
      <div className="trip-iterations-carousel">
        <div className="trip-iterations-carousel__empty">
          <div className="trip-iterations-carousel__empty-icon">🗺️</div>
          <h3 className="trip-iterations-carousel__empty-title">No Trip Options Available</h3>
          <p className="trip-iterations-carousel__empty-text">
            We couldn't generate trip options. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-iterations-carousel">
      <div className="trip-iterations-carousel__header">
        <h2 className="trip-iterations-carousel__title">Choose Your Perfect Trip</h2>
        <p className="trip-iterations-carousel__subtitle">
          Select from {options.length} customized options based on your preferences
        </p>
      </div>

      <div className="trip-iterations-carousel__container">
        <div
          className="trip-iterations-carousel__track"
          ref={trackRef}
          onScroll={handleScroll}
        >
          {options.map((option) => (
            <div key={option.option_id} className="trip-iterations-carousel__slide">
              <TripIterationCard
                option={option}
                isSelected={option.option_id === selectedOptionId}
                onSelect={onSelectOption}
                destination={destination}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="trip-iterations-carousel__nav">
        <button
          className="trip-iterations-carousel__nav-button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Previous option"
        >
          ←
        </button>

        <div className="trip-iterations-carousel__dots">
          {options.map((_, index) => (
            <button
              key={index}
              className={`trip-iterations-carousel__dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to option ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="trip-iterations-carousel__nav-button"
          onClick={handleNext}
          disabled={currentIndex === options.length - 1}
          aria-label="Next option"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default TripIterationsCarousel;
