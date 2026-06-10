import React, { useEffect, useRef } from 'react';

/**
 * Mounts a Travelpayouts "content" widget (tpwdgt.com) by injecting its async
 * script into a container ref. These widgets render their markup at the exact
 * DOM position of the script tag, so we append the script inside our own div.
 *
 * @param {string} src   Full widget script URL (the value of the <script src>).
 * @param {string} title Optional heading shown above the widget.
 */
const TravelpayoutsWidget = ({ src, title }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Avoid double-injecting (e.g. React StrictMode double-mount in dev).
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
