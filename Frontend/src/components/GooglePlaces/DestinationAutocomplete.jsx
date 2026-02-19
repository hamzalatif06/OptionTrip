import React, { useState, useEffect } from 'react';
import { useAutocompleteContext } from './AutocompleteContext';
import { useDebounce } from '../../hooks/useDebounce';

const DestinationAutocomplete = ({
  value,
  onChange,
  error,
  placeholder = 'e.g. Paris, France'
}) => {
  const [inputValue, setInputValue] = useState(value?.text || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedInput = useDebounce(inputValue, 200);

  // Sync input value when external value changes (e.g., from TopDestinations)
  useEffect(() => {
    if (value?.text && value.text !== inputValue) {
      setInputValue(value.text);
    }
  }, [value?.text]);

  const {
    fetchPredictions,
    handleSuggestionClick,
    predictionResults,
    resetPredictionResults
  } = useAutocompleteContext();

  // Fetch predictions when debounced input changes
  useEffect(() => {
    if (debouncedInput.length >= 3) {
      setIsLoading(true);
      fetchPredictions(debouncedInput);
      setShowDropdown(true);
    } else {
      resetPredictionResults();
      setShowDropdown(false);
      setIsLoading(false);
    }
  }, [debouncedInput]); // Remove fetchPredictions and resetPredictionResults from dependencies

  // Update loading state when results arrive
  useEffect(() => {
    if (predictionResults.length > 0 || debouncedInput.length < 3) {
      setIsLoading(false);
    }
  }, [predictionResults, debouncedInput]);

  const handleSelect = (prediction) => {
    handleSuggestionClick(
      prediction.place_id,
      (placeDetails) => {
        onChange({
          text: prediction.description,
          place_id: placeDetails.place_id,
          name: placeDetails.name,
          geometry: placeDetails.geometry
        });
        setInputValue(prediction.description);
        setShowDropdown(false);
      },
      () => {} // setInputValue handled above
    );
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If user clears the input, clear the selected place data
    if (!newValue) {
      onChange({
        text: '',
        place_id: '',
        name: '',
        geometry: null
      });
    }
  };

  return (
    <div className="autocomplete-wrapper">
      <label htmlFor="destination">Destination</label>
      <div className="autocomplete-input-container">
        <input
          type="text"
          id="destination"
          className={`autocomplete-input ${error ? 'error' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => debouncedInput.length >= 3 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
        />

        {/* Loading spinner */}
        {isLoading && debouncedInput.length >= 3 && (
          <div className="autocomplete-spinner"></div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && !isLoading && (
        <>
          {predictionResults.length > 0 ? (
            <ul className="autocomplete-dropdown">
              {predictionResults.map((prediction) => (
                <li
                  key={prediction.place_id}
                  className="autocomplete-item"
                  onClick={() => handleSelect(prediction)}
                >
                  <div className="autocomplete-item-content">
                    <div className="autocomplete-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#0A539D"/>
                      </svg>
                    </div>
                    <span className="autocomplete-item-text">{prediction.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : debouncedInput.length >= 3 ? (
            <div className="autocomplete-dropdown">
              <div className="autocomplete-no-results">No locations found</div>
            </div>
          ) : null}
        </>
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default DestinationAutocomplete;
