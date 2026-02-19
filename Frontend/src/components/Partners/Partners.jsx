import React from 'react';
import './Partners.css';

const Partners = () => {
  const partners = [
    '/images/cl-5.png',
    '/images/cl-2.png',
    '/images/cl-3.png',
    '/images/cl-4.png',
    '/images/cl-5.png',
    '/images/cl-3.png',
    '/images/cl-2.png',
    '/images/cl-1.png'
  ];

  return (
    <div className="our-partner p-0">
      <div className="container">
        <div className="partners_inner">
          <ul>
            {partners.map((partner, index) => (
              <li key={index}>
                <img src={partner} alt={`Partner ${index + 1}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Partners;


