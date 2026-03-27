import React from 'react';
import './HotelTab.css';

/* ── COMING SOON ──────────────────────────────────────────────────────────── */
const HotelTab = () => {
  return (
    <div className="ht-root">
      <div className="ht-coming-soon">
        <div className="ht-coming-soon__icon">🏨</div>
        <h2 className="ht-coming-soon__title">Coming Soon</h2>
        <p className="ht-coming-soon__sub">
          Hotel search is under development. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default HotelTab;

/*
── ORIGINAL FORM CODE (commented out) ─────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { searchHotelLocations, searchHotels } from '../../../services/hotelService';
import HotelCard from '../../../components/HotelCard/HotelCard';
import './HotelTab.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const HotelSkeleton = () => (
  <div className="ht-skeleton">
    {[1, 2, 3].map((i) => (
      <div key={i} className="ht-skeleton__card">
        <div className="ht-skeleton__img pulse" />
        <div className="ht-skeleton__body">
          <div className="ht-skeleton__line ht-skeleton__line--title pulse" />
          <div className="ht-skeleton__line pulse" />
          <div className="ht-skeleton__line ht-skeleton__line--short pulse" />
        </div>
        <div className="ht-skeleton__cta pulse" />
      </div>
    ))}
  </div>
);

const HotelTab = ({ tripData }) => {
  ... full form, city autocomplete, hotel results ...
};

export default HotelTab;
*/
