/**
 * InfoCardsCarousel Component
 *
 * Adapted from TripTap's CardsHoverCarousel
 * Horizontal scrollable container for InfoCard components
 *
 * Features:
 * - Horizontal scroll with smooth scrollbar
 * - Auto-layout cards with consistent spacing
 * - Responsive grid on mobile
 */

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
