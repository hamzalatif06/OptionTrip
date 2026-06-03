import React from 'react';
import CarRentalTab from './PlannedTripPage/sections/CarRentalTab';
import './CarRentalSearch.css';

const CarRentalSearch = () => (
  <>
    <section className="crs-hero">
      <div className="container">
        <div className="text-center">
          <h4 className="mb-2 theme1">Search & Compare</h4>
          <h1 className="mb-3">Find Your <span className="theme">Rental Car</span></h1>
          <p className="crs-hero__sub">
            Compare cars from top rental companies worldwide and book at the best price.
          </p>
        </div>
      </div>
    </section>

    <section className="crs-content">
      <div className="container">
        <CarRentalTab tripData={null} />
      </div>
    </section>
  </>
);

export default CarRentalSearch;
