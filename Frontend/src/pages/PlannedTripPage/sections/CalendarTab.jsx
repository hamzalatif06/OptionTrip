import React, { useMemo, useState } from 'react';
import useCurrency from '../../../hooks/useCurrency';
import './CalendarTab.css';

/**
 * Month-grid calendar for the trip's itinerary. Read-only — for editing
 * activities, that already lives in the "Your Trip" day-by-day tab; this
 * view is about seeing the trip laid out against real calendar dates
 * (which day of the week things fall on, how days cluster in a month).
 */

const CATEGORY_COLORS = {
  sightseeing:   '#2563eb',
  dining:        '#ea580c',
  adventure:     '#16a34a',
  relaxation:    '#0ea5e9',
  culture:       '#7c3aed',
  shopping:      '#db2777',
  transport:     '#64748b',
  nature:        '#15803d',
  entertainment: '#f59e0b',
  nightlife:     '#9333ea',
  beach:         '#06b6d4',
  museum:        '#7c3aed',
  historical:    '#92400e',
  outdoor:       '#16a34a',
  wellness:      '#0ea5e9',
  sports:        '#dc2626',
  photography:   '#475569',
  other:         '#64748b'
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Parse 'YYYY-MM-DD' (or a full ISO string) into a *local* midnight Date —
// avoids the off-by-one day shift `new Date(dateString)` causes in
// negative-UTC-offset timezones, which would misplace cells in the grid.
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [datePart] = String(dateStr).split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
};

const CalendarTab = ({ tripData, daysData }) => {
  const { formatPrice } = useCurrency();

  const dayByDate = useMemo(() => {
    const map = new Map();
    (daysData || []).forEach(day => {
      const d = parseLocalDate(day.date);
      if (d) map.set(dateKey(d), day);
    });
    return map;
  }, [daysData]);

  const sortedTripDates = useMemo(
    () => Array.from(dayByDate.keys()).map(parseLocalDate).sort((a, b) => a - b),
    [dayByDate]
  );

  const firstTripDate = sortedTripDates[0] || parseLocalDate(tripData?.dates?.start_date) || new Date();

  const [viewMonth, setViewMonth] = useState(
    () => new Date(firstTripDate.getFullYear(), firstTripDate.getMonth(), 1)
  );
  const [selectedKey, setSelectedKey] = useState(() => dateKey(firstTripDate));

  const gridCells = useMemo(() => {
    const startWeekday = viewMonth.getDay();
    const gridStart = new Date(viewMonth);
    gridStart.setDate(gridStart.getDate() - startWeekday);

    return Array.from({ length: 42 }, (_, i) => {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);
      const key = dateKey(cellDate);
      const dayData = dayByDate.get(key) || null;
      const categories = dayData
        ? [...new Set((dayData.activities || []).map(a => (a.category || 'other').toLowerCase()))].slice(0, 4)
        : [];
      return {
        key,
        date: cellDate,
        inMonth: cellDate.getMonth() === viewMonth.getMonth(),
        isToday: dateKey(cellDate) === dateKey(new Date()),
        dayData,
        categories
      };
    });
  }, [viewMonth, dayByDate]);

  const selectedDay = dayByDate.get(selectedKey) || null;
  const selectedDate = parseLocalDate(selectedKey);

  const goToMonth = (delta) => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const jumpToTrip = () => {
    setViewMonth(new Date(firstTripDate.getFullYear(), firstTripDate.getMonth(), 1));
    setSelectedKey(dateKey(firstTripDate));
  };

  const isViewingTripMonth = sortedTripDates.some(
    d => d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()
  );

  if (!daysData || daysData.length === 0) {
    return (
      <div className="cal-empty">
        <div className="cal-empty__icon">📅</div>
        <h3>No itinerary yet</h3>
        <p>Generate your day-by-day plan from the "Your Trip" tab and it'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="cal-root">
      <div className="cal-grid-panel">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={() => goToMonth(-1)} aria-label="Previous month">‹</button>
          <div className="cal-header__title">
            {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          <button className="cal-nav-btn" onClick={() => goToMonth(1)} aria-label="Next month">›</button>
          {!isViewingTripMonth && (
            <button className="cal-jump-btn" onClick={jumpToTrip}>Jump to trip</button>
          )}
        </div>

        <div className="cal-weekdays">
          {WEEKDAY_LABELS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
        </div>

        <div className="cal-grid">
          {gridCells.map(cell => (
            <button
              key={cell.key}
              className={[
                'cal-cell',
                cell.inMonth ? '' : 'cal-cell--outside',
                cell.dayData ? 'cal-cell--trip' : '',
                cell.isToday ? 'cal-cell--today' : '',
                cell.key === selectedKey ? 'cal-cell--selected' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => cell.dayData && setSelectedKey(cell.key)}
              disabled={!cell.dayData}
            >
              <span className="cal-cell__num">{cell.date.getDate()}</span>
              {cell.dayData && (
                <>
                  <span className="cal-cell__day-badge">Day {cell.dayData.day_number}</span>
                  <span className="cal-cell__dots">
                    {cell.categories.map(cat => (
                      <span key={cat} className="cal-cell__dot" style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }} />
                    ))}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="cal-agenda">
        {selectedDay ? (
          <>
            <div className="cal-agenda__header">
              <h3>Day {selectedDay.day_number}{selectedDay.title ? ` — ${selectedDay.title.replace(/^Day\s+\d+\s*:\s*/i, '')}` : ''}</h3>
              <span className="cal-agenda__date">
                {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {selectedDay.activities?.length > 0 ? (
              <ul className="cal-agenda__list">
                {selectedDay.activities.map((activity, i) => {
                  const cat = (activity.category || 'other').toLowerCase();
                  return (
                    <li key={i} className="cal-agenda__item">
                      <span className="cal-agenda__item-dot" style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }} />
                      <div className="cal-agenda__item-body">
                        <div className="cal-agenda__item-top">
                          <span className="cal-agenda__item-time">{formatTime(activity.time)}</span>
                          <span className="cal-agenda__item-title">{activity.title}</span>
                        </div>
                        {activity.place_name && (
                          <span className="cal-agenda__item-place">{activity.place_name}</span>
                        )}
                      </div>
                      {activity.cost > 0 && (
                        <span className="cal-agenda__item-cost">{formatPrice(activity.cost)}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="cal-agenda__empty">No activities planned for this day.</p>
            )}

            {selectedDay.total_cost > 0 && (
              <div className="cal-agenda__footer">
                <span>Total for the day</span>
                <strong>{formatPrice(selectedDay.total_cost)}</strong>
              </div>
            )}
          </>
        ) : (
          <div className="cal-agenda__placeholder">
            <p>Select a highlighted day to see the plan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarTab;
