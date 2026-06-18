import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

/**
 * Google Maps Places Autocomplete — migrated to the **new** Places API:
 *   • `AutocompleteSuggestion.fetchAutocompleteSuggestions` (replaces
 *     the legacy `AutocompleteService.getPlacePredictions`)
 *   • `Place.fetchFields`  (replaces the legacy `PlacesService.getDetails`)
 *
 * Why the migration: as of March 1 2025 Google deprecated `AutocompleteService`
 * for new customers and stopped fixing non-critical bugs against it.
 * https://developers.google.com/maps/documentation/javascript/places-migration-overview
 *
 * The public surface of this context (`fetchPredictions`, `handleSuggestionClick`,
 * `predictionResults`, `resetPredictionResults`) is preserved exactly — including
 * the shape of each prediction (`{ place_id, description }`) and the shape of
 * place details (`{ place_id, name, geometry: { location } }`) — so existing
 * consumers (DestinationAutocomplete, TripTypeSelector) continue to work
 * without any changes.
 */

const AutocompleteContext = createContext();

// eslint-disable-next-line no-unused-vars
export const AutocompleteContextProvider = ({ map_id = 'map', children, location, radius }) => {
  // `map_id` is accepted for backwards compatibility but is no longer required —
  // the new API doesn't need a Map instance for either step.
  const placesLib = useMapsLibrary('places');

  const [sessionToken, setSessionToken] = useState(null);
  const [predictionResults, setPredictionResults] = useState([]);

  useEffect(() => {
    if (!placesLib) return;
    setSessionToken(new placesLib.AutocompleteSessionToken());
    return () => setSessionToken(null);
  }, [placesLib]);

  // ── Fetch autocomplete predictions ──────────────────────────────────────
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

      // Normalize new shape → legacy shape so consumers don't change.
      // New: each suggestion has `placePrediction.{placeId, text, mainText, secondaryText}`.
      // Old: each prediction was `{ place_id, description, structured_formatting }`.
      const normalized = suggestions
        .filter(s => s.placePrediction)
        .map(s => {
          const p = s.placePrediction;
          // `text` is a FormattableText — prefer its `.text` field, fall back to toString.
          const description = p.text?.text ?? (typeof p.text === 'string' ? p.text : String(p.text || ''));
          return {
            place_id:    p.placeId,
            description,
            structured_formatting: {
              main_text:      p.mainText?.text ?? p.mainText ?? description,
              secondary_text: p.secondaryText?.text ?? p.secondaryText ?? ''
            },
            // Keep a ref to the underlying suggestion in case future callers
            // want to call `placePrediction.toPlace()` directly.
            _placePrediction: p
          };
        });
      setPredictionResults(normalized);
    } catch (error) {
      console.error('Autocomplete fetch error:', error);
      setPredictionResults([]);
    }
  }, [placesLib, sessionToken, location, radius]);

  // ── Fetch full details for a selected suggestion ────────────────────────
  const handleSuggestionClick = useCallback(async (placeId, onPlaceSelect, setInputValue) => {
    if (!placesLib || !placeId) return;
    try {
      const place = new placesLib.Place({ id: placeId, requestedLanguage: 'en' });
      // New API field names — `displayName` (was `name`), `location` (was `geometry.location`).
      await place.fetchFields({ fields: ['id', 'displayName', 'location', 'formattedAddress'] });

      // Re-pack into the legacy shape so consumers continue working unchanged.
      const placeDetails = {
        place_id: place.id,
        name:     place.displayName || '',
        geometry: place.location ? { location: place.location } : null,
        // Bonus field — useful for consumers that want a human address; old
        // code didn't surface this but it's now cheap to provide.
        formatted_address: place.formattedAddress || ''
      };

      onPlaceSelect?.(placeDetails);
      setInputValue?.(placeDetails.name ?? '');

      // Refresh the session token — each "search → select" cycle should use a new one
      // so Google bills them as a single session.
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
