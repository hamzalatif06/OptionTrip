import React, { useState } from 'react';
import { getHotelRooms, getHotelDetails } from '../../services/hotelService';
import './HotelCard.css';

const Stars = ({ count }) => {
  const n = Math.min(Math.max(Math.round(count || 0), 0), 5);
  return (
    <span className="hc-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`hc-star${i < n ? ' hc-star--filled' : ''}`}>★</span>
      ))}
    </span>
  );
};

const HotelCard = ({ hotel }) => {
  const [photoIdx,    setPhotoIdx]    = useState(0);
  const [expanded,    setExpanded]    = useState(false);
  const [rooms,       setRooms]       = useState(null);
  const [details,     setDetails]     = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imgError,    setImgError]    = useState(false);

  const photos = hotel.photos?.length ? hotel.photos : hotel.imageUrl ? [hotel.imageUrl] : [];
  const currentPhoto = photos[photoIdx] || '';

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (rooms !== null) return; // already loaded

    // Hotelbeds hotels ship with pre-loaded room data from the availability API
    if (hotel.preloadedRooms) {
      setRooms(hotel.preloadedRooms);
      return;
    }

    setLoadingMore(true);
    try {
      const [roomData, detailData] = await Promise.all([
        getHotelRooms({ hotelId: hotel.hotelId, checkIn: hotel.checkIn, checkOut: hotel.checkOut, adults: hotel.adults }),
        getHotelDetails(hotel.hotelId),
      ]);
      setRooms(roomData || []);
      setDetails(detailData);
    } catch {
      setRooms([]);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="hc-card">

      {/* ── Photo section ──────────────────────────────── */}
      <div className="hc-img-wrap">
        {photos.length > 1 && (
          <>
            <button className="hc-photo-nav hc-photo-nav--prev" onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
            <button className="hc-photo-nav hc-photo-nav--next" onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}>›</button>
            <span className="hc-photo-count">{photoIdx + 1}/{photos.length}</span>
          </>
        )}
        {currentPhoto && !imgError ? (
          <img className="hc-img" src={currentPhoto} alt={hotel.name} onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="hc-img-fallback">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {photos.length > 1 && (
          <div className="hc-photo-dots">
            {photos.slice(0, 5).map((_, i) => (
              <span key={i} className={`hc-photo-dot${i === photoIdx ? ' active' : ''}`} onClick={() => setPhotoIdx(i)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Main body ──────────────────────────────────── */}
      <div className="hc-body">
        <div className="hc-info">
          <h3 className="hc-name">{hotel.name}</h3>

          <div className="hc-meta-row">
            <Stars count={hotel.stars} />
            {hotel.rating && (
              <span className="hc-rating-badge">
                {hotel.rating.toFixed(1)}
                {hotel.ratingWord && <span className="hc-rating-word"> {hotel.ratingWord}</span>}
              </span>
            )}
            {hotel.reviewCount > 0 && (
              <span className="hc-reviews">({hotel.reviewCount.toLocaleString()} reviews)</span>
            )}
          </div>

          {hotel.location?.name && (
            <div className="hc-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="10" r="3" stroke="#94a3b8" strokeWidth="2"/>
              </svg>
              {hotel.location.name}{hotel.location.country ? `, ${hotel.location.country.toUpperCase()}` : ''}
            </div>
          )}

          {(hotel.checkin || hotel.checkout) && (
            <div className="hc-times">
              {hotel.checkin  && <span>Check-in from {hotel.checkin}</span>}
              {hotel.checkout && <span>Check-out until {hotel.checkout}</span>}
            </div>
          )}

          {/* Facilities from details (if loaded) */}
          {details?.facilities?.length > 0 && (
            <div className="hc-facilities">
              {details.facilities.map((f, i) => (
                <span key={i} className="hc-facility-chip">{f}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── CTA panel ────────────────────────────────── */}
        <div className="hc-cta">
          {hotel.price && (
            <div className="hc-price">
              <span className="hc-price__from">From</span>
              <span className="hc-price__amount">{hotel.currency} {Math.round(hotel.price).toLocaleString()}</span>
              <span className="hc-price__per">/ night</span>
            </div>
          )}
          <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer" className="hc-book-btn">
            Book Now
          </a>
          <button className="hc-rooms-btn" onClick={handleExpand}>
            {expanded ? 'Hide Rooms ▲' : 'View Rooms ▼'}
          </button>
          <p className="hc-affiliate-note">
            {hotel.source === 'hotelbeds' ? 'via Hotellook' : 'via Booking.com'}
          </p>
        </div>
      </div>

      {/* ── Expanded rooms section ──────────────────────── */}
      {expanded && (
        <div className="hc-rooms-section">
          {loadingMore ? (
            <div className="hc-rooms-loading">
              <span className="hc-rooms-spinner" /> Loading available rooms…
            </div>
          ) : rooms?.length === 0 ? (
            <p className="hc-rooms-empty">No rooms available for selected dates. Try adjusting your dates.</p>
          ) : (
            <>
              <h4 className="hc-rooms-title">Available Rooms</h4>
              <div className="hc-rooms-list">
                {rooms?.map(room => (
                  <div key={room.blockId} className="hc-room">
                    {room.photo && (
                      <img className="hc-room__img" src={room.photo} alt={room.name} loading="lazy" />
                    )}
                    <div className="hc-room__info">
                      <p className="hc-room__name">{room.name}</p>
                      {room.bed && <p className="hc-room__bed">🛏 {room.bed}</p>}
                      <div className="hc-room__tags">
                        {room.breakfast  && <span className="hc-room__tag hc-room__tag--green">Breakfast included</span>}
                        {room.refundable && <span className="hc-room__tag hc-room__tag--blue">Free cancellation</span>}
                        {room.facilities.map((f, i) => <span key={i} className="hc-room__tag">{f}</span>)}
                      </div>
                    </div>
                    <div className="hc-room__cta">
                      {room.price && (
                        <p className="hc-room__price">
                          <span className="hc-room__price-amount">{room.currency} {Math.round(room.price)}</span>
                          <span className="hc-room__price-per">/night</span>
                        </p>
                      )}
                      <a href={room.bookingUrl} target="_blank" rel="noopener noreferrer" className="hc-room__book-btn">
                        Book
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HotelCard;
