import React, { useState } from 'react';
import './HotelCard.css';

/** Render filled/empty stars */
const Stars = ({ count }) => {
  const n = Math.min(Math.max(Math.round(count || 0), 0), 5);
  return (
    <span className="hc-stars" aria-label={`${n} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`hc-star${i < n ? ' hc-star--filled' : ''}`}>★</span>
      ))}
    </span>
  );
};

const HotelCard = ({ hotel }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="hc-card">
      {/* Hotel image */}
      <div className="hc-card__img-wrap">
        {!imgError ? (
          <img
            className="hc-card__img"
            src={hotel.imageUrl}
            alt={hotel.name}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="hc-card__img-fallback">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22"
                stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Hotel details */}
      <div className="hc-card__body">
        <div className="hc-card__info">
          <h3 className="hc-name">{hotel.name}</h3>

          <div className="hc-meta-row">
            <Stars count={hotel.stars} />
            {hotel.rating !== null && (
              <span className="hc-rating-badge">
                {hotel.rating.toFixed(1)}
                <span className="hc-rating-max">/10</span>
              </span>
            )}
            {hotel.reviewCount > 0 && (
              <span className="hc-reviews">({hotel.reviewCount.toLocaleString()} reviews)</span>
            )}
          </div>

          <div className="hc-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3"
                stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {hotel.location.name}
            {hotel.location.country ? `, ${hotel.location.country}` : ''}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="hc-card__cta">
          <div className="hc-price">
            <span className="hc-price__from">From</span>
            <span className="hc-price__amount">
              {hotel.currency} {hotel.price.toLocaleString()}
            </span>
            <span className="hc-price__per">/ night</span>
          </div>
          <a
            href={hotel.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hc-book-btn"
          >
            Book Now
          </a>
          <p className="hc-affiliate-note">via Hotellook</p>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
