import React, { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

// Map container style - must have height
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px'
};

// Default center: Philippines
const defaultCenter = {
  lat: 12.8797,
  lng: 121.774
};

// Map options for better user experience
const mapOptions = {
  zoomControl: true,
  zoomControlOptions: {
    position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM
  },
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  disableDefaultUI: false,
  clickableIcons: true,
  scrollwheel: true,
  draggable: true,
  disableDoubleClickZoom: false,
  keyboardShortcuts: true
};

const GoogleMapView = ({ latitude, longitude, locationName, floodRiskLevel }) => {
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [map, setMap] = useState(null);
  
  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const getMarkerColor = (riskLevel) => {
    const colors = {
      low: '#22c55e',
      moderate: '#eab308',
      high: '#f97316',
      severe: '#ef4444'
    };
    return colors[riskLevel] || '#3b82f6';
  };

  // Calculate center based on props or default
  const center = (latitude && longitude) 
    ? { lat: latitude, lng: longitude } 
    : defaultCenter;

  // Calculate zoom level
  const zoom = latitude ? 14 : 6;

  // Handle map load
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Handle map unload
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Render error state
  const renderError = () => {
    console.error('Google Maps load error:', loadError);
    return React.createElement(
      'div',
      {
        style: {
          padding: '20px',
          textAlign: 'center',
          background: '#fee2e2',
          borderRadius: '8px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }
      },
      React.createElement('p', { style: { color: '#dc2626', marginBottom: '10px' } }, '⚠️ Error loading Google Maps'),
      React.createElement('p', { style: { fontSize: '14px', color: '#666' } }, 'Please check your API key in .env file'),
      React.createElement('p', { style: { fontSize: '12px', color: '#999', marginTop: '10px' } }, 'Make sure Maps JavaScript API is enabled in Google Cloud Console')
    );
  };

  // Render loading state
  const renderLoading = () => {
    return React.createElement(
      'div',
      {
        style: {
          padding: '20px',
          textAlign: 'center',
          background: '#f0f0f0',
          borderRadius: '8px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      },
      React.createElement('p', null, 'Loading Google Maps... 🗺️')
    );
  };

  // Render marker and info window
  const renderMarkerAndInfoWindow = () => {
    if (!latitude || !longitude) return null;
    
    const elements = [];
    
    // Add marker
    elements.push(
      React.createElement(Marker, {
        key: 'marker',
        position: { lat: latitude, lng: longitude },
        onClick: () => setInfoWindowOpen(true),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: getMarkerColor(floodRiskLevel),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 12,
          labelOrigin: new google.maps.Point(0, -5)
        }
      })
    );
    
    // Add info window if open
    if (infoWindowOpen) {
      elements.push(
        React.createElement(
          InfoWindow,
          {
            key: 'infoWindow',
            position: { lat: latitude, lng: longitude },
            onCloseClick: () => setInfoWindowOpen(false)
          },
          React.createElement(
            'div',
            {
              style: {
                padding: '8px',
                minWidth: '150px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }
            },
            React.createElement(
              'h4',
              {
                style: {
                  margin: '0 0 8px 0',
                  color: '#1f5b9f',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }
              },
              locationName || 'Selected Location'
            ),
            React.createElement(
              'p',
              { style: { margin: '4px 0', fontSize: '13px' } },
              React.createElement('strong', null, 'Flood Risk: '),
              React.createElement(
                'span',
                {
                  style: {
                    color: getMarkerColor(floodRiskLevel),
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }
                },
                floodRiskLevel || 'Unknown'
              )
            ),
            React.createElement(
              'p',
              { style: { margin: '4px 0', fontSize: '11px', color: '#666' } },
              `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            )
          )
        )
      );
    }
    
    return elements;
  };

  // Show error if loading fails
  if (loadError) {
    return renderError();
  }

  // Show loading state
  if (!isLoaded) {
    return renderLoading();
  }

  // Render the map
  return React.createElement(
    GoogleMap,
    {
      mapContainerStyle: mapContainerStyle,
      center: center,
      zoom: zoom,
      onLoad: onLoad,
      onUnmount: onUnmount,
      options: mapOptions
    },
    renderMarkerAndInfoWindow()
  );
};

export default GoogleMapView;
