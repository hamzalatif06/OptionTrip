import React from 'react';
import './Loader.css';

/**
 * Flying-aeroplane loader.
 * A plane glides along an arched dashed flight-path while bobbing gently.
 * Same markup for every size variant — sizing comes from the CSS.
 */
const PlaneAnimation = ({ size }) => (
  <div className={`plane-loader plane-loader--${size}`} aria-hidden="true">
    {/* Dashed arched flight path */}
    <svg className="plane-loader__path" viewBox="0 0 120 60" preserveAspectRatio="none">
      <path
        d="M5 50 Q 60 -10 115 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
    </svg>
    {/* The plane itself */}
    <span className="plane-loader__plane">
      <i className="fas fa-plane"></i>
    </span>
  </div>
);

const Loader = ({
  size = 'medium', // 'small', 'medium', 'large', 'fullpage'
  text = '',
  overlay = false,
  className = ''
}) => {
  if (size === 'fullpage') {
    return (
      <div className={`loader-fullpage ${className}`}>
        <div className="loader-content">
          <PlaneAnimation size="fullpage" />
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className={`loader-overlay ${className}`}>
        <div className="loader-content">
          <PlaneAnimation size={size} />
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loader-inline ${className}`}>
      <PlaneAnimation size={size} />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
