import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import './TripTypeSelector.css';

// Static trip type suggestions (like TripTap's popular types)
const TRIP_TYPE_SUGGESTIONS = [
  'Family Vacation',
  'Couples Retreat',
  'Bachelorette Party',
  'Bachelor Party',
  'Girls Shopping Weekend',
  'Cultural Exploration',
  'Adventure Trip',
  'Beach Getaway',
  'Mountain Retreat',
  'City Break',
  'Food Tour',
  'Wine Tasting',
  'Spa Weekend',
  'Photography Tour',
  'Historical Tour',
  'Wildlife Safari',
  'Cruise Vacation',
  'Road Trip',
  'Backpacking',
  'Luxury Vacation',
  'Budget Travel',
  'Solo Travel',
  'Group Tour',
  'Honeymoon',
  'Anniversary Trip',
  'Business Trip',
  'Conference Travel',
  'Festival Trip',
  'Concert Tour',
  'Sports Event',
  'Wedding Destination',
];

const TripTypeSelector = ({ value = '', onChange, error }) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce input to reduce filtering frequency (200ms like TripTap)
  const debouncedInput = useDebounce(inputValue, 200);

  // Filter suggestions based on input (TripTap uses API, we use static filtering)
  const filteredSuggestions = useMemo(() => {
    if (!debouncedInput || debouncedInput.length < 3) {
      return [];
    }

    const lowerInput = debouncedInput.toLowerCase();
    return TRIP_TYPE_SUGGESTIONS.filter(suggestion =>
      suggestion.toLowerCase().includes(lowerInput)
    );
  }, [debouncedInput]);

  // Show suggestions when there's input and filtered results
  useEffect(() => {
    if (filteredSuggestions.length > 0 && document.activeElement === inputRef.current) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [filteredSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setFocusedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[focusedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;

      default:
        break;
    }
  };

  const handleFocus = () => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }, 200);
  };

  return (
    <div className="trip-type-selector-wrapper">
      <label htmlFor="tripType">
        Trip type <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.85em' }}>(optional)</span>
        <span className="field-tooltip-wrapper">
          <span className="field-tooltip-icon">?</span>
          <span className="field-tooltip-text">Trip type describes the style of travel.<br/>Examples: vacation, honeymoon, cruise, hiking trip, adventure travel, beach holiday, family trip, city break.</span>
        </span>
      </label>
      <div className="trip-type-input-container">
        <input
          ref={inputRef}
          type="text"
          id="tripType"
          className={`trip-type-input ${error ? 'error' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="e.g. Family Vacation"
        />
        {error && <span className="error-message">{error}</span>}

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="trip-type-suggestions" ref={suggestionsRef}>
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`trip-type-suggestion-item ${
                  index === focusedIndex ? 'focused' : ''
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TripTypeSelector;
