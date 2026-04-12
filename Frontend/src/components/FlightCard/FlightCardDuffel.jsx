import React, { useState } from 'react';
import './FlightCardDuffel.css';

/* ── Helpers ── */
const StopBadge = ({ stops }) =>
  stops === 0
    ? <span className="fcdf-badge fcdf-badge--direct">Non-stop</span>
    : <span className="fcdf-badge fcdf-badge--stops">{stops} stop{stops > 1 ? 's' : ''}</span>;

const ConditionPill = ({ allowed, label }) => {
  if (allowed === null || allowed === undefined) return null;
  return (
    <span className={`fcdf-condition${allowed ? ' fcdf-condition--yes' : ' fcdf-condition--no'}`}>
      {allowed ? '✓' : '✗'} {label}
    </span>
  );
};

const InfoChip = ({ icon, label, value, highlight }) => (
  <div className={`fcdf__chip${highlight ? ' fcdf__chip--highlight' : ''}`}>
    <span className="fcdf__chip-icon">{icon}</span>
    <div>
      <div className="fcdf__chip-label">{label}</div>
      <div className="fcdf__chip-value">{value}</div>
    </div>
  </div>
);

/* ── Main component ── */
const FlightCardDuffel = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    departureTime, arrivalTime, duration,
    origin, destination, originName, destName,
    stops, airline, airlineLogo, flightNumber, aircraft,
    cabinClass, price, currency,
    changeable, refundable, bags, layovers,
    bookingUrl,
  } = flight;

  const isDirect = stops === 0;
  const sym = currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : `${currency} `);
  const displayPrice = price != null ? (Number.isInteger(price) ? price : Number(price).toFixed(0)) : null;

  return (
    <div className={`fcdf${isDirect ? ' fcdf--direct' : ' fcdf--stops'}`}>

      {/* Duffel source ribbon */}
      <div className="fcdf__ribbon">Duffel</div>

      {/* Accent left strip */}
      <div className="fcdf__accent" />

      <div className="fcdf__body">

        {/* ── Airline column ── */}
        <div className="fcdf__airline">
          <div className="fcdf__logo-wrap">
            {airlineLogo
              ? <img src={airlineLogo} alt={airline} className="fcdf__logo"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              : null}
            <div className="fcdf__logo-fallback" style={{ display: airlineLogo ? 'none' : 'flex' }}>
              {(airline || '?').slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="fcdf__airline-info">
            <span className="fcdf__airline-name">{airline || 'Airline'}</span>
            {flightNumber && <span className="fcdf__flight-num">{flightNumber}</span>}
            {cabinClass   && <span className="fcdf__cabin">{cabinClass}</span>}
          </div>
        </div>

        {/* ── Route timeline ── */}
        <div className="fcdf__route">
          <div className="fcdf__endpoint">
            <div className="fcdf__time">{departureTime || '—'}</div>
            <div className="fcdf__iata">{origin}</div>
            {originName && <div className="fcdf__city">{originName}</div>}
          </div>

          <div className="fcdf__path">
            <div className="fcdf__path-duration">{duration}</div>
            <div className="fcdf__path-track">
              <div className="fcdf__path-dot" />
              <div className="fcdf__path-line" />
              <svg className="fcdf__path-plane" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="fcdf__path-line" />
              <div className="fcdf__path-dot" />
            </div>
            <StopBadge stops={stops} />
          </div>

          <div className="fcdf__endpoint fcdf__endpoint--right">
            <div className="fcdf__time">{arrivalTime || '—'}</div>
            <div className="fcdf__iata">{destination}</div>
            {destName && <div className="fcdf__city">{destName}</div>}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="fcdf__divider" />

        {/* ── Price + CTA ── */}
        <div className="fcdf__cta">
          <div className="fcdf__price-block">
            <span className="fcdf__price-from">from</span>
            <span className="fcdf__price-amount">
              {displayPrice !== null ? `${sym}${displayPrice}` : '—'}
            </span>
            <span className="fcdf__price-per">/ person</span>
          </div>

          {/* Changeable / Refundable pills */}
          <div className="fcdf__conditions">
            <ConditionPill allowed={changeable} label="Changeable" />
            <ConditionPill allowed={refundable} label="Refundable" />
          </div>

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcdf__book-btn">
            Book Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <button className="fcdf__toggle-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Hide details' : 'View details'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="fcdf__details">
          <div className="fcdf__details-chips">
            {aircraft && <InfoChip icon="✈" label="Aircraft" value={aircraft} />}
            {cabinClass && <InfoChip icon="💺" label="Cabin class" value={cabinClass} highlight />}
            <InfoChip
              icon="🎒"
              label="Carry-on"
              value={bags?.carry_on > 0 ? `${bags.carry_on} bag included` : 'Not included'}
              highlight={bags?.carry_on > 0}
            />
            <InfoChip
              icon="🧳"
              label="Checked bag"
              value={bags?.checked > 0 ? `${bags.checked} bag included` : 'Not included'}
              highlight={bags?.checked > 0}
            />
            <InfoChip
              icon={changeable ? '✅' : '❌'}
              label="Change fee"
              value={changeable === null ? 'Unknown' : changeable ? 'Changeable' : 'Non-changeable'}
              highlight={changeable === true}
            />
            <InfoChip
              icon={refundable ? '✅' : '❌'}
              label="Refund"
              value={refundable === null ? 'Unknown' : refundable ? 'Refundable' : 'Non-refundable'}
              highlight={refundable === true}
            />
          </div>

          {layovers?.length > 0 && (
            <div className="fcdf__layovers">
              <div className="fcdf__layovers-label">Layovers</div>
              {layovers.map((l, i) => (
                <div key={i} className="fcdf__layover">
                  <div className="fcdf__layover-dot" />
                  <div className="fcdf__layover-info">
                    <span className="fcdf__layover-airport">
                      {l.name} {l.id && <span className="fcdf__layover-code">({l.id})</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcdf__book-btn fcdf__book-btn--full">
            Book on Aviasales ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default FlightCardDuffel;
