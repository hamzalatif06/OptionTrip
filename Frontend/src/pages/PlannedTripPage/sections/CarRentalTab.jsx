import React from 'react';
import TravelpayoutsWidget from './TravelpayoutsWidget';
import './CarRentalTab.css';

// Travelpayouts car-rental affiliate widget (tpwdgt content widget).
// Colors mirror the OptionTrip theme: primary teal button (#029e9d) on a
// white card (#ffffff) — see Frontend/src/styles/themes.css.
const CAR_RENTAL_WIDGET_SRC =
  'https://tpwdgt.com/content?trs=176202&shmarker=370056&locale=en&country=153&city=68511&powered_by=true&campaign_id=87&promo_id=2466&plain=true&border_radius=10&color_background=%23ffffff&color_button=%23029e9d';

const CarRentalTab = () => (
  <div className="cr-root">
    <div className="cr-card__header cr-card__header--standalone">
      <div className="cr-card__header-icon">
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="16" cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="7"  cy="17" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 5H7v5h5V5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h3 className="cr-card__title">Find Rental Cars</h3>
        <p className="cr-card__sub">Compare cars from top rental companies</p>
      </div>
    </div>

    {/* Travelpayouts car-rental affiliate widget */}
    <TravelpayoutsWidget src={CAR_RENTAL_WIDGET_SRC} />
  </div>
);

export default CarRentalTab;
