import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DateRange, Calendar } from 'react-date-range';
import {
  format, addDays, addMonths,
  startOfMonth, endOfMonth,
  isSameMonth, isAfter, isBefore, isSameDay,
  getDay, getDaysInMonth,
} from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { fetchMonthlyPrices } from '../../services/flightService';
import './TripDatePicker.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const toDate = (str) => (str ? new Date(str + 'T00:00:00') : null);
const toStr  = (d)   => (d   ? format(d, 'yyyy-MM-dd')    : '');
const todayD = ()    => { const d = new Date(); d.setHours(0,0,0,0); return d; };

const displayDate = (str) => {
  if (!str) return null;
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const buildMonths = (count = 12) => {
  const base = startOfMonth(new Date());
  return Array.from({ length: count }, (_, i) => addMonths(base, i));
};
const MONTHS = buildMonths(12);

// ── Price Calendar ────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PriceCalendar = ({ month, prices, loading, minDate, mode, onSelect, onBack }) => {
  const [displayMonth, setDisplayMonth] = useState(month);
  const [phase,        setPhase]        = useState(0);   // 0=pick start, 1=pick end
  const [rangeStart,   setRangeStart]   = useState(null);

  // Price colour bands
  const priceVals = Object.values(prices).filter(Boolean);
  const minPrice  = priceVals.length ? Math.min(...priceVals) : 0;
  const maxPrice  = priceVals.length ? Math.max(...priceVals) : 0;
  const band      = (maxPrice - minPrice) / 3 || 1;
  const priceClass = (p) => {
    if (!p) return '';
    if (p <= minPrice + band)     return 'pc-day--cheap';
    if (p <= minPrice + band * 2) return 'pc-day--mid';
    return 'pc-day--pricey';
  };

  // Build grid: pad with empty cells so week starts on Monday
  const firstOfMonth = startOfMonth(displayMonth);
  const startDow     = (getDay(firstOfMonth) + 6) % 7; // 0=Mon
  const daysInMonth  = getDaysInMonth(displayMonth);
  const cells        = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(displayMonth.getFullYear(), displayMonth.getMonth(), i + 1)
    ),
  ];

  const handleDayClick = (day) => {
    if (!day) return;
    const isPast = isBefore(day, minDate || todayD()) && !isSameDay(day, minDate || todayD());
    if (isPast) return;

    if (mode === 'single') {
      onSelect(day, day);
      return;
    }
    // range: two clicks
    if (phase === 0 || rangeStart === null) {
      setRangeStart(day);
      setPhase(1);
    } else {
      const start = isBefore(day, rangeStart) ? day : rangeStart;
      const end   = isBefore(day, rangeStart) ? rangeStart : day;
      onSelect(start, end);
      setRangeStart(null);
      setPhase(0);
    }
  };

  const isSelected = (day) => rangeStart && isSameDay(day, rangeStart);
  const isPast     = (day) => isBefore(day, minDate || todayD()) && !isSameDay(day, minDate || todayD());

  return (
    <div className="pc-wrap">
      {/* Header */}
      <div className="pc-header">
        <button className="pc-nav-btn" type="button" onClick={onBack}>← Months</button>
        <div className="pc-nav-month">
          <button className="pc-nav-arrow" type="button"
            onClick={() => setDisplayMonth(m => addMonths(m, -1))}>‹</button>
          <span className="pc-month-label">{format(displayMonth, 'MMMM yyyy')}</span>
          <button className="pc-nav-arrow" type="button"
            onClick={() => setDisplayMonth(m => addMonths(m, 1))}>›</button>
        </div>
        {mode === 'range' && (
          <span className="pc-phase-hint">
            {phase === 0 ? 'Select departure' : 'Select return'}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="pc-loading">
          <div className="pc-loading__spinner" />
          <span>Loading prices…</span>
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="pc-weekdays">
            {WEEKDAYS.map(d => <div key={d} className="pc-weekday">{d}</div>)}
          </div>

          {/* Day grid */}
          <div className="pc-grid">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="pc-day pc-day--empty" />;
              const dateStr = toStr(day);
              const price   = prices[dateStr];
              const past    = isPast(day);
              const sel     = isSelected(day);
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={[
                    'pc-day',
                    past  ? 'pc-day--past'  : '',
                    sel   ? 'pc-day--selected' : '',
                    !past && price ? priceClass(price) : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(day)}
                  disabled={past}
                >
                  <span className="pc-day__num">{day.getDate()}</span>
                  {price && !past && (
                    <span className="pc-day__price">${price.toLocaleString()}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Month Grid ────────────────────────────────────────────────────────────────

const MonthGrid = ({ mode, onMonthClick }) => {
  const [flexStart, setFlexStart] = useState(null);

  const handleClick = (month) => {
    if (mode === 'single') {
      onMonthClick(month);
      return;
    }
    // For range, always trigger calendar view on first click
    if (!flexStart) {
      setFlexStart(month);
      onMonthClick(month);
    } else {
      setFlexStart(null);
      onMonthClick(month);
    }
  };

  const isStart   = (m) => flexStart && isSameMonth(m, flexStart);

  return (
    <div className="tdp-flex-wrap">
      {mode === 'range' && (
        <p className="tdp-flex-hint">
          {flexStart ? 'Now select a return month' : 'Select a departure month'}
        </p>
      )}
      <div className="tdp-month-grid">
        {MONTHS.map((month) => (
          <button
            key={month.toISOString()}
            className={`tdp-month-card${isStart(month) ? ' tdp-month-card--selected' : ''}`}
            onClick={() => handleClick(month)}
            type="button"
          >
            <span className="tdp-month-card__year">{format(month, 'yyyy')}</span>
            <span className="tdp-month-card__name">{format(month, 'MMMM')}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

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
  origin,       // optional — 3-letter IATA, enables price fetching in flexible mode
  destination,  // optional — 3-letter IATA
}) => {
  const minD = minDate instanceof Date
    ? minDate
    : (minDate ? toDate(minDate) : todayD());

  const buildRange = useCallback(() => {
    const s = toDate(startDate) || todayD();
    const e = toDate(endDate)   || (mode === 'range' ? addDays(s, 1) : s);
    return [{ startDate: s, endDate: e, key: 'selection' }];
  }, [startDate, endDate, mode]);

  const [open,          setOpen]          = useState(false);
  const [dateMode,      setDateMode]      = useState('specific'); // 'specific'|'flexible'
  const [range,         setRange]         = useState(buildRange);
  const [flexView,      setFlexView]      = useState('months');   // 'months'|'calendar'
  const [flexMonth,     setFlexMonth]     = useState(null);
  const [monthPrices,   setMonthPrices]   = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setRange(buildRange()); }, [startDate, endDate]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const apply = (s, e) => {
    onApply({ startDate: toStr(s), endDate: mode === 'range' ? toStr(e) : toStr(s) });
    setOpen(false);
  };

  // Specific-dates handlers
  const handleRangeChange = (item) => {
    const sel = item.selection;
    setRange([sel]);
    if (sel.startDate && sel.endDate && toStr(sel.startDate) !== toStr(sel.endDate)) {
      apply(sel.startDate, sel.endDate);
    }
  };

  const handleSingleChange = (d) => {
    setRange([{ startDate: d, endDate: d, key: 'selection' }]);
    apply(d, d);
  };

  // Flexible-dates: month card clicked → load price calendar
  const handleMonthClick = async (month) => {
    setFlexMonth(month);
    setFlexView('calendar');
    setMonthPrices({});

    const hasRoute = origin && destination &&
      /^[A-Z]{3}$/i.test(origin) && /^[A-Z]{3}$/i.test(destination);

    if (hasRoute) {
      setPricesLoading(true);
      const prices = await fetchMonthlyPrices({
        origin:      origin.toUpperCase(),
        destination: destination.toUpperCase(),
        month:       format(month, 'yyyy-MM'),
      });
      setMonthPrices(prices);
      setPricesLoading(false);
    }
  };

  const nights = mode === 'range' && range[0].startDate && range[0].endDate
    ? Math.max(0, Math.round((range[0].endDate - range[0].startDate) / 86400000))
    : 0;

  const handleOpen = () => {
    setOpen(true);
    setDateMode('specific');
    setFlexView('months');
    setFlexMonth(null);
    setMonthPrices({});
  };

  return (
    <div className="tdp-wrap" ref={wrapRef}>

      {/* ── Trigger fields ── */}
      <div className="tdp-trigger">
        <div
          className={`tdp-field${open ? ' tdp-field--active' : ''}${startError ? ' tdp-field--error' : ''}`}
          onClick={handleOpen}
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
              onClick={handleOpen}
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

      {/* ── Popup ── */}
      {open && (
        <div className="tdp-popup">

          {/* Tabs */}
          <div className="tdp-tabs">
            <button type="button"
              className={`tdp-tab${dateMode === 'specific' ? ' tdp-tab--active' : ''}`}
              onClick={() => { setDateMode('specific'); }}>
              Specific dates
            </button>
            <button type="button"
              className={`tdp-tab${dateMode === 'flexible' ? ' tdp-tab--active' : ''}`}
              onClick={() => { setDateMode('flexible'); setFlexView('months'); }}>
              Flexible dates
            </button>
          </div>

          {/* ── Specific dates ── */}
          {dateMode === 'specific' && (
            <>
              {mode === 'range' ? (
                <DateRange
                  ranges={range}
                  onChange={handleRangeChange}
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
                  onChange={handleSingleChange}
                  months={2}
                  direction="horizontal"
                  minDate={minD}
                  color="#029e9d"
                  weekdayDisplayFormat="EEEEEE"
                  monthDisplayFormat="MMMM yyyy"
                />
              )}
              <div className="tdp-footer">
                {nights > 0 ? (
                  <span className="tdp-footer__nights">
                    {nights} night{nights !== 1 ? 's' : ''} — pick return date
                  </span>
                ) : mode === 'range' ? (
                  <span className="tdp-footer__nights">Select departure date</span>
                ) : null}
                <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── Flexible dates ── */}
          {dateMode === 'flexible' && (
            <>
              {flexView === 'months' ? (
                <MonthGrid mode={mode} onMonthClick={handleMonthClick} />
              ) : (
                <PriceCalendar
                  month={flexMonth}
                  prices={monthPrices}
                  loading={pricesLoading}
                  minDate={minD}
                  mode={mode}
                  onSelect={(s, e) => apply(s, e)}
                  onBack={() => { setFlexView('months'); setFlexMonth(null); setMonthPrices({}); }}
                />
              )}
              <div className="tdp-footer">
                {flexView === 'calendar' && !pricesLoading && Object.keys(monthPrices).length > 0 && (
                  <span className="tdp-footer__nights">
                    <span className="tdp-legend tdp-legend--cheap" /> Cheapest &nbsp;
                    <span className="tdp-legend tdp-legend--pricey" /> More expensive
                  </span>
                )}
                <button className="tdp-btn tdp-btn--cancel" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TripDatePicker;
