import React, { useEffect, useRef } from 'react';

const TravelpayoutsWidget = ({ src, title }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.charset = 'utf-8';
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [src]);

  return (
    <div className="cr-tp-widget">
      {title && <h3 className="cr-tp-widget__title">{title}</h3>}
      <div ref={containerRef} className="cr-tp-widget__slot" />
    </div>
  );
};

export default TravelpayoutsWidget;
