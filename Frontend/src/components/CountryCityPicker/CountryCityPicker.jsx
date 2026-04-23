import React, { useEffect, useState } from 'react';
import { getPlaceImagesForMultiplePlaces } from '../../utils/destinationImages';
import './CountryCityPicker.css';

const TP_MARKER = '370056';

const buildAviasalesUrl = ({ originCode, destCode, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  const returnPart = returnDate ? fmt(returnDate) : '';
  return `https://www.aviasales.com/search/${originCode}${fmt(departureDate)}${destCode}${returnPart}${adults}?marker=${TP_MARKER}`;
};

const CityCard = ({ city, onSelect, originCode, departureDate, returnDate, adults, imageMap }) => {
  const imageUrl = imageMap[`${city.cityName}, ${city.countryName}`] || imageMap[city.cityName];
  const aviasalesUrl = originCode
    ? buildAviasalesUrl({ originCode, destCode: city.iataCode, departureDate, returnDate, adults })
    : null;

  return (
    <div className="ccp-card" onClick={() => onSelect(city)}>
      <div className="ccp-card__img-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={city.cityName} className="ccp-card__img" loading="lazy" />
        ) : (
          <div className="ccp-card__img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <div className="ccp-card__overlay" />
        <div className="ccp-card__name">{city.cityName}</div>
      </div>

      <div className="ccp-card__body">
        <div className="ccp-card__meta">
          <span className="ccp-card__country">{city.countryName}</span>
          <span className="ccp-card__code">{city.iataCode}</span>
        </div>
        <div className="ccp-card__actions">
          <button className="ccp-card__select-btn">
            Select →
          </button>
          {aviasalesUrl && (
            <a
              href={aviasalesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ccp-card__explore-link"
              onClick={e => e.stopPropagation()}
            >
              Explore flights ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Multi-step country → city picker.
 *
 * Props:
 *  step          'dest' | 'origin'
 *  cities        array of { iataCode, cityName, countryName }
 *  countryName   display name for the country (e.g. "India")
 *  originCode    used for Aviasales affiliate links (null when selecting dest)
 *  departureDate YYYY-MM-DD
 *  returnDate    YYYY-MM-DD | null
 *  adults        number
 *  onSelect      (city) => void
 *  onBack        () => void
 */
const CountryCityPicker = ({
  step,
  cities = [],
  countryName,
  originCode,
  departureDate,
  returnDate,
  adults,
  onSelect,
  onBack,
}) => {
  const [imageMap, setImageMap] = useState({});

  useEffect(() => {
    if (!cities.length) return;
    const queries = cities.map(c => `${c.cityName}, ${c.countryName}`);
    getPlaceImagesForMultiplePlaces(queries).then(result => {
      const map = {};
      for (const [key, val] of Object.entries(result)) {
        if (val?.imageUrl) map[key] = val.imageUrl;
      }
      setImageMap(map);
    });
  }, [cities]);

  const title = step === 'dest'
    ? `Choose a destination in ${countryName}`
    : `Choose your departure city`;

  const subtitle = step === 'dest'
    ? 'Click a city to see departure options, or "Explore flights" to open Aviasales'
    : 'Which city will you fly from?';

  return (
    <div className="ccp-wrap">
      <div className="ccp-header">
        {onBack && (
          <button className="ccp-back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div>
          <h2 className="ccp-title">{title}</h2>
          <p className="ccp-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="ccp-grid">
        {cities.map(city => (
          <CityCard
            key={city.iataCode}
            city={city}
            onSelect={onSelect}
            originCode={originCode}
            departureDate={departureDate}
            returnDate={returnDate}
            adults={adults}
            imageMap={imageMap}
          />
        ))}
      </div>
    </div>
  );
};

export default CountryCityPicker;
