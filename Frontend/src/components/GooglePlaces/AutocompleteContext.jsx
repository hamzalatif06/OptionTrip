import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const AutocompleteContext = createContext();

export const AutocompleteContextProvider = ({ map_id = "map", children, location, radius }) => {
  const placesLib = useMapsLibrary('places');
  const mapsLib = useMapsLibrary('maps');
  const coreLib = useMapsLibrary('core');
  const mapInst = useMap(map_id);

  // map services
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  // session token
  const [sessionToken, setSessionToken] = useState(null);
  // prediction results
  const [predictionResults, setPredictionResults] = useState([]);

  useEffect(() => {
    if (placesLib && mapsLib && mapInst) {
      setAutocompleteService(new placesLib.AutocompleteService());
      setPlacesService(new placesLib.PlacesService(mapInst));
      setSessionToken(new placesLib.AutocompleteSessionToken());
      // Cleanup on unmount
      return () => {
        setAutocompleteService(null);
        setPlacesService(null);
        setSessionToken(null);
      };
    }
  }, [mapInst, placesLib, mapsLib, map_id]);

  const fetchPredictions = useCallback(async (inputValue) => {
    if (!autocompleteService || !inputValue) {
      setPredictionResults([]);
      return;
    }
    const request = { input: inputValue, sessionToken };

    // If a location is provided, use location biasing
    if (location) {
      if (!coreLib || !mapsLib) return;
      const center = new coreLib.LatLng(location.lat, location.lng);

      if (radius) {
        request.locationBias = {
          center: center,
          radius: radius
        };
      } else {
        request.locationBias = center;
      }
    }

    try {
      const response = await autocompleteService.getPlacePredictions(request);

      if (!response || !response.predictions) {
        setPredictionResults([]);
        return;
      }

      setPredictionResults(response.predictions || []);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictionResults([]);
    }
  }, [autocompleteService, sessionToken, coreLib, mapsLib, location, radius]);

  const handleSuggestionClick = useCallback((placeId, onPlaceSelect, setInputValue) => {
    if (!placesLib || !placesService) return;

    const detailRequestOptions = {
      placeId,
      fields: [
        'geometry',
        'name',
        'place_id'
      ],
      sessionToken,
    };

    placesService.getDetails(detailRequestOptions, (placeDetails, status) => {
      if (status === 'OK' && placeDetails) {
        const modifiedResults = {
          place_id: placeDetails.place_id,
          name: placeDetails.name,
          geometry: placeDetails.geometry,
        };
        onPlaceSelect?.(modifiedResults);
        setInputValue?.(modifiedResults.name ?? '');
        setSessionToken(new placesLib.AutocompleteSessionToken());
        setPredictionResults([]);
      }
    });
  }, [placesLib, placesService, sessionToken, location, radius]);

  const resetPredictionResults = () => {
    setPredictionResults([]);
  };

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
