import React, { useState } from 'react';
import './FlightCardGF.css';

/* ── Helpers ── */
const StopBadge = ({ stops }) =>
  stops === 0
    ? <span className="fcgf-badge fcgf-badge--direct">Non-stop</span>
    : <span className="fcgf-badge fcgf-badge--stops">{stops} stop{stops > 1 ? 's' : ''}</span>;

const AirlineLogo = ({ logo, name }) => {
  if (logo) return <img src={logo} alt={name} className="fcgf__logo" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />;
  return null;
};

const AirlineInitials = ({ name, hidden }) => (
  <div className="fcgf__logo-fallback" style={{ display: hidden ? 'none' : 'flex' }}>
    {(name || '?').slice(0, 2).toUpperCase()}
  </div>
);

const InfoChip = ({ icon, label, value, highlight }) => (
  <div className={`fcgf__chip${highlight ? ' fcgf__chip--highlight' : ''}`}>
    <span className="fcgf__chip-icon">{icon}</span>
    <div>
      <div className="fcgf__chip-label">{label}</div>
      <div className="fcgf__chip-value">{value}</div>
    </div>
  </div>
);

/* ── Main component ── */
const FlightCardGF = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    departureTime, arrivalTime, duration,
    origin, destination, originName, destName,
    stops, airline, airlineLogo, flightNumber, aircraft,
    price, currency, bags, legroom, seatType, amenities, co2,
    bookingUrl, layovers,
  } = flight;

  const isDirect = stops === 0;
  const sym = currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : currency + ' ');
  const displayPrice = price !== null && price !== undefined
    ? (Number.isInteger(price) ? price : price.toFixed(0))
    : null;

  return (
    <div className={`fcgf${isDirect ? ' fcgf--direct' : ' fcgf--stops'}`}>

      {/* ── Top accent bar ── */}
      <div className="fcgf__accent" />

      <div className="fcgf__body">

        {/* ── Airline column ── */}
        <div className="fcgf__airline">
          <div className="fcgf__logo-wrap">
            <AirlineLogo logo={airlineLogo} name={airline} />
            <AirlineInitials name={airline} hidden={!!airlineLogo} />
          </div>
          <div className="fcgf__airline-info">
            <span className="fcgf__airline-name">{airline || 'Airline'}</span>
            {flightNumber && <span className="fcgf__flight-num">{flightNumber}</span>}
          </div>
        </div>

        {/* ── Route timeline ── */}
        <div className="fcgf__route">
          {/* Departure */}
          <div className="fcgf__endpoint">
            <div className="fcgf__time">{departureTime || '—'}</div>
            <div className="fcgf__iata">{origin}</div>
            {originName && <div className="fcgf__city">{originName}</div>}
          </div>

          {/* Flight path */}
          <div className="fcgf__path">
            <div className="fcgf__path-duration">{duration}</div>
            <div className="fcgf__path-track">
              <div className="fcgf__path-dot" />
              <div className="fcgf__path-line" />
              <svg className="fcgf__path-plane" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="fcgf__path-line" />
              <div className="fcgf__path-dot" />
            </div>
            <StopBadge stops={stops} />
          </div>

          {/* Arrival */}
          <div className="fcgf__endpoint fcgf__endpoint--right">
            <div className="fcgf__time">{arrivalTime || '—'}</div>
            <div className="fcgf__iata">{destination}</div>
            {destName && <div className="fcgf__city">{destName}</div>}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fcgf__divider" />

        {/* ── Price + CTA ── */}
        <div className="fcgf__cta">
          <div className="fcgf__price-block">
            <span className="fcgf__price-from">from</span>
            <span className="fcgf__price-amount">
              {displayPrice !== null ? `${sym}${displayPrice}` : '—'}
            </span>
            <span className="fcgf__price-per">/ person</span>
          </div>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcgf__book-btn">
            Book Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <button className="fcgf__toggle-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Hide details' : 'View details'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="fcgf__details">
          <div className="fcgf__details-chips">
            {aircraft && <InfoChip icon="✈" label="Aircraft" value={aircraft} />}
            {(seatType || legroom) && (
              <InfoChip
                icon="💺"
                label="Seat"
                value={seatType ? `${seatType}${legroom ? ` · ${legroom}` : ''}` : legroom}
                highlight={seatType?.toLowerCase().includes('above')}
              />
            )}
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
          </div>

          {/* Amenities + CO₂ */}
          {amenities && (amenities.wifi || amenities.power || amenities.usb || amenities.video) && (
            <div className="fcgf__amenities">
              {amenities.wifi  && <span className="fcgf__amenity">📶 Wi-Fi</span>}
              {amenities.power && <span className="fcgf__amenity">🔌 Power outlet</span>}
              {amenities.usb   && <span className="fcgf__amenity">🔋 USB</span>}
              {amenities.video && <span className="fcgf__amenity">🎬 On-demand video</span>}
              {co2 !== null && (
                <span className={`fcgf__amenity${co2 < 0 ? ' fcgf__co2--good' : co2 > 20 ? ' fcgf__co2--bad' : ''}`}>
                  🌿 {co2 < 0 ? `${Math.abs(co2)}% less CO₂` : `${co2}% more CO₂`} vs avg
                </span>
              )}
            </div>
          )}

          {layovers?.length > 0 && (
            <div className="fcgf__layovers">
              <div className="fcgf__layovers-label">Layovers</div>
              {layovers.map((l, i) => (
                <div key={i} className="fcgf__layover">
                  <div className="fcgf__layover-dot" />
                  <div className="fcgf__layover-info">
                    <span className="fcgf__layover-airport">{l.name} <span className="fcgf__layover-code">({l.id})</span></span>
                    <span className="fcgf__layover-dur">{l.duration}</span>
                  </div>
                  {l.overnight && <span className="fcgf__overnight-badge">Overnight</span>}
                </div>
              ))}
            </div>
          )}

          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="fcgf__book-btn fcgf__book-btn--full">
            Book on Aviasales ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default FlightCardGF;
