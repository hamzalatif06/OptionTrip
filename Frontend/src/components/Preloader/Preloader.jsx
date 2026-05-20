import React, { useState, useEffect } from 'react';
import './Preloader.css';

const Preloader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide preloader after a short delay
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div id="preloader">
      <div className="preloader-plane" aria-hidden="true">
        <svg className="preloader-plane__path" viewBox="0 0 220 80" preserveAspectRatio="none">
          <path
            d="M10 65 Q 110 -10 210 65"
            fill="none"
            stroke="#029e9d"
            strokeWidth="2"
            strokeDasharray="7 7"
            strokeLinecap="round"
          />
        </svg>
        <span className="preloader-plane__plane">
          <i className="fas fa-plane"></i>
        </span>
      </div>
    </div>
  );
};

export default Preloader;
