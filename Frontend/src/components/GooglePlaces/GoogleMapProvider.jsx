import React from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries = ['places'];

const GoogleMapProvider = ({ children }) => {
  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={libraries}
      onLoad={() => console.log('Google Maps API loaded successfully')}
      onError={(error) => console.error('Google Maps API error:', error)}
    >
      {/* Hidden map required for PlacesService */}
      <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        <Map
          id="map"
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={1}
          gestureHandling="none"
          disableDefaultUI={true}
        />
      </div>
      {children}
    </APIProvider>
  );
};

export default GoogleMapProvider;
