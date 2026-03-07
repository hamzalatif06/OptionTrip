import React, { useState, useEffect, useRef } from 'react';
import { DateRangePicker } from 'react-date-range';
import { format, addMonths, addDays, differenceInDays } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './DateRangePicker.css';

const DateRangePickerComponent = ({
  selectedDates = [],
  onDateRangeChange,
  error
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    key: 'selection'
  });
  const pickerRef = useRef(null);

  // Initialize dates
  useEffect(() => {
    if (selectedDates[0] && selectedDates[1]) {
      setDateRange({
        startDate: new Date(selectedDates[0]),
        endDate: new Date(selectedDates[1]),
        key: 'selection'
      });
    } else {
      // Default: 3 months from now + 4 days (like TripTap)
      const defaultStart = addMonths(new Date(), 3);
      const defaultEnd = addDays(defaultStart, 4);
      setDateRange({
        startDate: defaultStart,
        endDate: defaultEnd,
        key: 'selection'
      });
    }
  }, []);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleSelect = (ranges) => {
    const { selection } = ranges;
    const daysCount = differenceInDays(selection.endDate, selection.startDate);

    // Maximum duration validation (10 days like TripTap)
    if (daysCount > 9) {
      alert('You can only select a maximum of 10 days.');
      return;
    }

    setDateRange(selection);

    // Only call callback if valid range
    if (daysCount >= 1) {
      const startDate = format(selection.startDate, 'yyyy-MM-dd');
      const endDate = format(selection.endDate, 'yyyy-MM-dd');
      const durationDays = daysCount + 1; // Include both start and end day
      const monthYear = format(selection.startDate, 'MMMM yyyy');

      onDateRangeChange({
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        month_year: monthYear
      });

      // Close picker after selection
      setShowPicker(false);
    }
  };

  const handleClose = () => {
    const daysCount = differenceInDays(dateRange.endDate, dateRange.startDate);

    // Minimum duration validation (2 days like TripTap)
    if (daysCount < 1) {
      alert('You must select a minimum of 2 days.');
      // Keep picker open or reset to previous valid dates
    } else {
      setShowPicker(false);
    }
  };

  const formatDisplayDate = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const start = format(dateRange.startDate, 'EEE, MMM d');
      const end = format(dateRange.endDate, 'EEE, MMM d');
      return `${start} – ${end}`;
    }
    return 'Select dates';
  };

  return (
    <div className="date-range-picker-wrapper">
      <label htmlFor="dates">
        Dates
        <span className="field-tooltip-wrapper">
          <span className="field-tooltip-icon">?</span>
          <span className="field-tooltip-text">You can choose exact travel dates or select a general period such as a specific month.</span>
        </span>
      </label>
      <div className="date-range-input-container">
        <input
          type="text"
          className={`date-range-display-input ${error ? 'error' : ''}`}
          value={formatDisplayDate()}
          onClick={() => setShowPicker(!showPicker)}
          readOnly
          placeholder="Select dates"
        />
        {error && <span className="error-message">{error}</span>}

        {showPicker && (
          <div className="date-range-picker-dropdown" ref={pickerRef}>
            <DateRangePicker
              ranges={[dateRange]}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              months={window.innerWidth < 768 ? 1 : 2}
              direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
              minDate={new Date()}
              showDateDisplay={false}
              rangeColors={['#0A539D']}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePickerComponent;
