import React, { useState, useRef, useEffect } from 'react';
import './PassengerSelector.css';

/**
 * Props:
 *  passengers   Array of { key, label, subtitle, value, min?, max? }
 *  onChange     (key, value) => void — called on every +/- click
 *  onApply      () => void — called when Apply is clicked
 *  label        string | (passengers) => string  — trigger button text
 *  note         optional info paragraph shown inside the popup
 */
const PassengerSelector = ({ passengers = [], onChange, onApply, label, note }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleApply = () => { onApply?.(); setOpen(false); };

  const triggerText = typeof label === 'function'
    ? label(passengers)
    : (label || passengers.map(p => `${p.value} ${p.label}`).join(', '));

  const totalPax = passengers.reduce((s, p) => s + p.value, 0);

  return (
    <div className="ps-wrap" ref={wrapRef}>

      {/* Trigger */}
      <button
        type="button"
        className={`ps-trigger${open ? ' ps-trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg className="ps-trigger__icon" viewBox="0 0 24 24" fill="none" width="15" height="15">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="ps-trigger__text">{triggerText}</span>
        <svg className={`ps-trigger__caret${open ? ' ps-trigger__caret--up' : ''}`} viewBox="0 0 24 24" fill="none" width="13" height="13">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Popup */}
      {open && (
        <div className="ps-popup">

          {/* Rows */}
          {passengers.map(p => {
            const min = p.min ?? 0;
            const max = p.max ?? 9;
            return (
              <div key={p.key} className="ps-row">
                <div className="ps-row__info">
                  <span className="ps-row__label">{p.label}</span>
                  {p.subtitle && <span className="ps-row__sub">{p.subtitle}</span>}
                </div>
                <div className="ps-row__counter">
                  <button
                    type="button"
                    className="ps-counter-btn"
                    onClick={() => onChange(p.key, Math.max(min, p.value - 1))}
                    disabled={p.value <= min}
                  >−</button>
                  <span className="ps-counter-val">{p.value}</span>
                  <button
                    type="button"
                    className="ps-counter-btn"
                    onClick={() => onChange(p.key, Math.min(max, p.value + 1))}
                    disabled={p.value >= max}
                  >+</button>
                </div>
              </div>
            );
          })}

          {/* Note */}
          {note && <p className="ps-note">{note}</p>}

          {/* Apply */}
          <button type="button" className="ps-apply-btn" onClick={handleApply}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default PassengerSelector;
