import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

const AutocompleteContext = createContext();

// eslint-disable-next-line no-unused-vars
export const AutocompleteContextProvider = ({ map_id = 'map', children, location, radius }) => {
  const placesLib = useMapsLibrary('places');

  const [sessionToken, setSessionToken] = useState(null);
  const [predictionResults, setPredictionResults] = useState([]);

  useEffect(() => {
    if (!placesLib) return;
    setSessionToken(new placesLib.AutocompleteSessionToken());
    return () => setSessionToken(null);
  }, [placesLib]);

  const fetchPredictions = useCallback(async (inputValue) => {
    if (!placesLib || !inputValue) {
      setPredictionResults([]);
      return;
    }

    const request = { input: inputValue, sessionToken };

    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      const center = { lat: location.lat, lng: location.lng };
      request.locationBias = radius ? { center, radius } : center;
    }

    try {
      const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        setPredictionResults([]);
        return;
      }

      const normalized = suggestions
        .filter(s => s.placePrediction)
        .map(s => {
          const p = s.placePrediction;
          const description = p.text?.text ?? (typeof p.text === 'string' ? p.text : String(p.text || ''));
          return {
            place_id:    p.placeId,
            description,
            structured_formatting: {
              main_text:      p.mainText?.text ?? p.mainText ?? description,
              secondary_text: p.secondaryText?.text ?? p.secondaryText ?? ''
            },
            _placePrediction: p
          };
        });
      setPredictionResults(normalized);
    } catch (error) {
      console.error('Autocomplete fetch error:', error);
      setPredictionResults([]);
    }
  }, [placesLib, sessionToken, location, radius]);

  const handleSuggestionClick = useCallback(async (placeId, onPlaceSelect, setInputValue) => {
    if (!placesLib || !placeId) return;
    try {
      const place = new placesLib.Place({ id: placeId, requestedLanguage: 'en' });
      await place.fetchFields({ fields: ['id', 'displayName', 'location', 'formattedAddress'] });

      const placeDetails = {
        place_id: place.id,
        name:     place.displayName || '',
        geometry: place.location ? { location: place.location } : null,
        formatted_address: place.formattedAddress || ''
      };

      onPlaceSelect?.(placeDetails);
      setInputValue?.(placeDetails.name ?? '');

      setSessionToken(new placesLib.AutocompleteSessionToken());
      setPredictionResults([]);
    } catch (error) {
      console.error('Place details fetch error:', error);
    }
  }, [placesLib]);

  const resetPredictionResults = () => setPredictionResults([]);

  return (
    <AutocompleteContext.Provider
      value={{
        fetchPredictions,
        handleSuggestionClick,
        predictionResults,
        resetPredictionResults
      }}
    >
      {children}
    </AutocompleteContext.Provider>
  );
};

export const useAutocompleteContext = () => {
  const context = useContext(AutocompleteContext);
  if (!context) {
    throw new Error(
      'useAutocompleteContext must be used within a AutocompleteContextProvider'
    );
  }
  return context;
};
