import React from 'react';
import { trackBookingClick } from '../../services/analyticsService';
import { logActivity } from '../../services/activityService';
import './ChatHotelResults.css';

const SOURCE_LABELS = {
  hotelbeds: 'Hotelbeds',
  booking: 'Booking.com'
};

const STAR_LABEL = (stars) => (stars > 0 ? '★'.repeat(Math.round(stars)) : '');

const ChatHotelResults = ({ results, providerStatus, destination }) => {
  if (!results?.length) return null;

  const failedProviders = Object.entries(providerStatus || {}).filter(([, status]) => status !== 'ok');
  const totalProviders = Object.keys(providerStatus || {}).length;

  const handleBook = (hotel) => {
    trackBookingClick(hotel.source, 'hotel', destination || hotel.location?.name, hotel.price);
    logActivity({
      type: 'hotel',
      action: 'clicked',
      title: `Book Now — stay in ${destination || hotel.location?.name || ''}`,
      metadata: { provider: hotel.source, destination: destination || hotel.location?.name, price: hotel.price, via: 'chat' }
    });
  };

  return (
    <div className="chr-root">
      {results.map((hotel) => (
        <a
          key={hotel.hotelId}
          className="chr-row"
          href={hotel.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBook(hotel)}
        >
          {hotel.imageUrl && (
            <div className="chr-row__img" style={{ backgroundImage: `url(${hotel.imageUrl})` }} />
          )}
          <div className="chr-row__body">
            <div className="chr-row__top">
              <span className="chr-row__name">{hotel.name || 'Hotel'}</span>
              <span className="chr-row__source">{SOURCE_LABELS[hotel.source] || hotel.source}</span>
            </div>
            <div className="chr-row__mid">
              {hotel.stars > 0 && <span className="chr-row__stars">{STAR_LABEL(hotel.stars)}</span>}
              {hotel.rating != null && (
                <span className="chr-row__rating">{hotel.rating}{hotel.ratingWord ? ` · ${hotel.ratingWord}` : ''}</span>
              )}
            </div>
            <div className="chr-row__bottom">
              <span className="chr-row__price-wrap">
                <span className="chr-row__price">{hotel.currency === 'USD' ? '$' : `${hotel.currency} `}{hotel.price}<span className="chr-row__night">/night</span></span>
                <span className="chr-row__book">Book →</span>
              </span>
            </div>
          </div>
        </a>
      ))}

      {failedProviders.length > 0 && (
        <p className="chr-footnote">
          Showing results from {totalProviders - failedProviders.length} of {totalProviders} sources
        </p>
      )}
    </div>
  );
};

export default ChatHotelResults;
