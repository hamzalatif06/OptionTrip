import React from 'react';
import './InfoCardsCarousel.css';

const InfoCardsCarousel = ({ children }) => {
  return (
    <div className="info-cards-carousel">
      <div className="info-cards-carousel__scroll">
        {children}
      </div>
    </div>
  );
};

export default InfoCardsCarousel;
