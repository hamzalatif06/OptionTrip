import React from 'react';
import './HotelSearch.css';

/* ── COMING SOON ──────────────────────────────────────────────────────────── */
const HotelSearch = () => {
  return (
    <>
      <section className="hotel-search-hero">
        <div className="container">
          <div className="text-center">
            <h4 className="mb-2 theme1">Hotels</h4>
            <h1 className="mb-3">Find Your <span className="theme">Perfect Hotel</span></h1>
          </div>
        </div>
      </section>

      <section className="hs-coming-soon-section">
        <div className="container">
          <div className="hs-coming-soon">
            <div className="hs-coming-soon__icon">🏨</div>
            <h2 className="hs-coming-soon__title">Coming Soon</h2>
            <p className="hs-coming-soon__sub">
              Hotel search is under development. Check back soon!
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default HotelSearch;

/*
── ORIGINAL FORM CODE (commented out) ─────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { searchHotelLocations, searchHotels } from '../services/hotelService';
import HotelCard from '../components/HotelCard/HotelCard';
import './HotelSearch.css';

function useDebounce(value, delay) { ... }

const HotelSearch = () => {
  const [cityQuery, setCityQuery] = useState('');
  const [cityCode, setCityCode] = useState('');
  ... city autocomplete, dates, adults, search form, results ...
};

export default HotelSearch;
*/
