import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DateRange, Calendar } from 'react-date-range';
import { format, addDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './TripDatePicker.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const toDate = (str) => (str ? new Date(str + 'T00:00:00') : null);
const toStr  = (d)   => (d   ? format(d, 'yyyy-MM-dd')    : '');

const displayDate = (str) => {
  if (!str) return null;
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Props:
 *  mode             'single' | 'range'
 *  startDate        YYYY-MM-DD string
 *  endDate          YYYY-MM-DD string  (range mode)
 *  minDate          YYYY-MM-DD string | Date (default: today)
 *  onApply          ({ startDate, endDate }) => void
 *  startLabel       e.g. "Departure"
 *  endLabel         e.g. "Return"
 *  startPlaceholder
 *  endPlaceholder
 *  startError
 *  endError
 */
const TripDatePicker = ({
  mode             = 'range',
  startDate,
  endDate,
  minDate,
  onApply,
  startLabel       = 'Departure',
  endLabel         = 'Return',
  startPlaceholder = 'Select date',
  endPlaceholder   = 'Select date',
  startError,
  endError,
}) => {
  const minD = minDate instanceof Date
    ? minDate
    : (minDate ? toDate(minDate) : today());

  const buildRange = useCallback(() => {
    const s = toDate(startDate) || today();
    const e = toDate(endDate)   || (mode === 'range' ? addDays(s, 1) : s);
    return [{ startDate: s, endDate: e, key: 'selection' }];
  }, [startDate, endDate, mode]);

  const [open,  setOpen]  = useState(false);
  const [range, setRange] = useState(buildRange);
  const wrapRef = useRef(null);

  useEffect(() => { setRange(buildRange()); }, [startDate, endDate]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleApply = () => {
    const { startDate: s, endDate: e } = range[0];
    onApply({ startDate: toStr(s), endDate: mode === 'range' ? toStr(e) : toStr(s) });
    setOpen(false);
  };

  const nights = mode === 'range' && range[0].startDate && range[0].endDate
    ? Math.max(0, Math.round((range[0].endDate - range[0].startDate) / 86400000))
    : 0;

  return (
    <div className="tdp-wrap" ref={wrapRef}>

      {/* ── Trigger fields ── */}
      <div className="tdp-trigger">

        <div
          className={`tdp-field${open ? ' tdp-field--active' : ''}${startError ? ' tdp-field--error' : ''}`}
          onClick={() => setOpen(true)}
        >
          <span className="tdp-field__label">{startLabel}</span>
          <div className="tdp-field__value">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="tdp-field__icon">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className={startDate ? 'tdp-field__date' : 'tdp-field__ph'}>
              {startDate ? displayDate(startDate) : startPlaceholder}
            </span>
          </div>
          {startError && <p className="tdp-field__err">{startError}</p>}
        </div>

        {mode === 'range' && (
          <>
            <span className="tdp-sep">→</span>
            <div
              className={`tdp-field${open ? ' tdp-field--active' : ''}${endError ? ' tdp-field--error' : ''}`}
              onClick={() => setOpen(true)}
            >
              <span className="tdp-field__label">{endLabel}</span>
              <div className="tdp-field__value">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="tdp-field__icon">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className={endDate ? 'tdp-field__date' : 'tdp-field__ph'}>
                  {endDate ? displayDate(endDate) : endPlaceholder}
                </span>
              </div>
              {endError && <p className="tdp-field__err">{endError}</p>}
            </div>
          </>
        )}
      </div>

      {/* ── Calendar popup ── */}
      {open && (
        <div className="tdp-popup">
          {mode === 'range' ? (
            <DateRange
              ranges={range}
              onChange={item => setRange([item.selection])}
              months={2}
              direction="horizontal"
              minDate={minD}
              rangeColors={['#029e9d']}
              showMonthAndYearPickers={true}
              showDateDisplay={false}
              moveRangeOnFirstSelection={false}
              weekdayDisplayFormat="EEEEEE"
              monthDisplayFormat="MMMM yyyy"
            />
          ) : (
            <Calendar
              date={range[0].startDate}
              onChange={d => setRange([{ startDate: d, endDate: d, key: 'selection' }])}
              months={2}
              direction="horizontal"
              minDate={minD}
              color="#029e9d"
              weekdayDisplayFormat="EEEEEE"
              monthDisplayFormat="MMMM yyyy"
            />
          )}

          <div className="tdp-footer">
            {nights > 0 && (
              <span className="tdp-footer__nights">
                {nights} night{nights !== 1 ? 's' : ''}
              </span>
            )}
            <div className="tdp-footer__btns">
              <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="tdp-btn tdp-btn--apply" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDatePicker;
