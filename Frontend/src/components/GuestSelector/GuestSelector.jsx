import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import './GuestSelector.css';

const GuestSelector = ({
  initialGuests = { adults: 0, children: 0, infants: 0 },
  onGuestsChange,
  error
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [guests, setGuests] = useState(initialGuests);
  const menuRef = useRef(null);

  const GUEST_LIMIT = 10;

  // Calculate total and label
  const guestInfo = useMemo(() => {
    const { adults, children, infants } = guests;
    const total = adults + children + infants;

    const parts = [];
    if (adults) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    if (infants) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);

    return {
      label: parts.join(', ') || 'e.g. adults, children',
      total,
      adults,
      children,
      infants
    };
  }, [guests]);

  // Debounce the guest info before calling callback
  const debouncedGuestInfo = useDebounce(guestInfo, 300);

  useEffect(() => {
    if (onGuestsChange) {
      onGuestsChange(debouncedGuestInfo);
    }
  }, [debouncedGuestInfo]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleIncrement = (field) => {
    const currentTotal = guests.adults + guests.children + guests.infants;

    if (currentTotal < GUEST_LIMIT) {
      setGuests(prev => ({
        ...prev,
        [field]: prev[field] + 1
      }));
    } else {
      alert(`Maximum ${GUEST_LIMIT} guests allowed.`);
    }
  };

  const handleDecrement = (field) => {
    setGuests(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1)
    }));
  };

  const guestsExceeded = guestInfo.total > GUEST_LIMIT;

  return (
    <div className="guest-selector-wrapper">
      <label htmlFor="guests">Guests</label>
      <div className="guest-selector-container">
        <input
          type="text"
          className={`guest-selector-display-input ${error ? 'error' : ''}`}
          value={guestInfo.label}
          onClick={() => setShowMenu(!showMenu)}
          readOnly
          placeholder="e.g. adults, children"
        />
        {error && <span className="error-message">{error}</span>}

        {showMenu && (
          <div className="guest-selector-dropdown" ref={menuRef}>
            {guestsExceeded && (
              <div className="guest-selector-error">
                Maximum {GUEST_LIMIT} guests allowed.
              </div>
            )}

            {/* Adults Counter */}
            <div className="guest-selector-item">
              <div className="guest-selector-item-info">
                <span className="guest-selector-item-label">Adults</span>
                <span className="guest-selector-item-description">Ages 13+</span>
              </div>
              <div className="guest-selector-counter">
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleDecrement('adults')}
                  disabled={guests.adults === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="guest-selector-count">{guests.adults}</span>
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleIncrement('adults')}
                  disabled={guestInfo.total >= GUEST_LIMIT}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div className="guest-selector-item">
              <div className="guest-selector-item-info">
                <span className="guest-selector-item-label">Children</span>
                <span className="guest-selector-item-description">Ages 2-12</span>
              </div>
              <div className="guest-selector-counter">
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleDecrement('children')}
                  disabled={guests.children === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="guest-selector-count">{guests.children}</span>
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleIncrement('children')}
                  disabled={guestInfo.total >= GUEST_LIMIT}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Infants Counter */}
            <div className="guest-selector-item">
              <div className="guest-selector-item-info">
                <span className="guest-selector-item-label">Infants</span>
                <span className="guest-selector-item-description">Under 2</span>
              </div>
              <div className="guest-selector-counter">
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleDecrement('infants')}
                  disabled={guests.infants === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="guest-selector-count">{guests.infants}</span>
                <button
                  type="button"
                  className="guest-selector-button"
                  onClick={() => handleIncrement('infants')}
                  disabled={guestInfo.total >= GUEST_LIMIT}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestSelector;
