import React from 'react';
import './Loader.css';

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
          <img src="/images/loader.gif" alt="Loading..." className="loader-gif loader-large" />
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className={`loader-overlay ${className}`}>
        <div className="loader-content">
          <img src="/images/loader.gif" alt="Loading..." className={`loader-gif loader-${size}`} />
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loader-inline ${className}`}>
      <img src="/images/loader.gif" alt="Loading..." className={`loader-gif loader-${size}`} />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
