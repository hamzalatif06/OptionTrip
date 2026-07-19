import React from 'react';
import EsimTab from './PlannedTripPage/sections/EsimTab';
import PageMeta from '../hooks/usePageMeta';
import './EsimSearch.css';

const EsimSearch = () => {
  return (
    <>
      <PageMeta
        title="Travel eSIM Data Plans"
        description="Stay connected anywhere with instant, affordable eSIM data plans — powered by Airalo. No roaming fees, no physical SIM swap."
        keywords="esim, travel esim, airalo, mobile data, international data plan"
        path="/esim"
      />
      <section className="ess-hero">
        <div className="container">
          <div className="text-center">
            <h4 className="mb-2 theme1">Stay Connected</h4>
            <h1 className="mb-3">Get Your Travel <span className="theme">eSIM</span></h1>
            <p className="ess-hero__sub">
              Instant data plans for your destination — delivered by QR code, no roaming fees.
            </p>
          </div>
        </div>
      </section>

      <section className="ess-content">
        <div className="container">
          <EsimTab source="landing_page" />
        </div>
      </section>
    </>
  );
};

export default EsimSearch;
