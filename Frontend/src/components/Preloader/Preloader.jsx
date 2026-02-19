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
      <div id="status"></div>
    </div>
  );
};

export default Preloader;
