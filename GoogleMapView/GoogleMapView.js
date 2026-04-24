import React, { useState, useCallback, useRef, useEffect } from 'react';
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

// Create a singleton to track script loading across all instances
let scriptLoadState = {
  isLoaded: false,
  loadingPromise: null,
  error: null
};

const GoogleMapView = ({ latitude, longitude, locationName, floodRiskLevel }) => {
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [map, setMap] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(scriptLoadState.isLoaded);
  const [scriptError, setScriptError] = useState(scriptLoadState.error);
  const mapRef = useRef(null);
  const retryCount = useRef(0);

  // Handle script loading with singleton pattern
  useEffect(() => {
    // If script already loaded, set state
    if (scriptLoadState.isLoaded) {
      setScriptLoaded(true);
      return;
    }

    // If script already loading, wait for it
    if (scriptLoadState.loadingPromise) {
      scriptLoadState.loadingPromise
        .then(() => {
          setScriptLoaded(true);
        })
        .catch((err) => {
          setScriptError(err);
        });
      return;
    }

    // Start loading script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = new Error('Google Maps API key is missing');
      setScriptError(error);
      scriptLoadState.error = error;
      return;
    }

    scriptLoadState.loadingPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        // Wait for existing script to load
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkLoaded);
            scriptLoadState.isLoaded = true;
            setScriptLoaded(true);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkLoaded);
          const error = new Error('Script load timeout');
          reject(error);
        }, 10000);
        return;
      }

      // Create new script tag
      const script = document.createElement('script');
      script.src = https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        scriptLoadState.isLoaded = true;
        setScriptLoaded(true);
        resolve();
      };
      
      script.onerror = (err) => {
        scriptLoadState.error = err;
        setScriptError(err);
        reject(err);
      };
      
      document.head.appendChild(script);
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err);
    });
  }, []);

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
    ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } 
    : defaultCenter;

  // Calculate zoom level
  const zoom = latitude ? 14 : 6;

  // Handle map load
  const onLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  // Handle map unload
  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  // Pan to new location when coordinates change
  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      const newCenter = new window.google.maps.LatLng(
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(14);
    }
  }, [latitude, longitude]);

  // Render error state with retry
  const renderError = () => {
    console.error('Google Maps load error:', scriptError);
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
          flexDirection: 'column',
          gap: '10px'
        }
      },
      React.createElement('p', { style: { color: '#dc2626', marginBottom: '10px' } }, '⚠️ Error loading Google Maps'),
      React.createElement('p', { style: { fontSize: '14px', color: '#666' } }, 'Please check your API key in .env file'),
      React.createElement('p', { style: { fontSize: '12px', color: '#999', marginTop: '10px' } }, 'Make sure Maps JavaScript API is enabled'),
      React.createElement(
        'button',
        {
          onClick: () => window.location.reload(),
          style: {
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }
        },
        'Retry'
      )
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
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '10px'
        }
      },
      React.createElement('div', { 
        style: { 
          width: '40px', 
          height: '40px', 
          border: '3px solid #3b82f6',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        } 
      }),
      React.createElement('p', null, 'Loading Google Maps... 🗺️')
    );
  };

  // Add spinning animation
  if (!document.querySelector('#map-loading-style')) {
    const style = document.createElement('style');
    style.id = 'map-loading-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Show error if loading fails
  if (scriptError) {
    return renderError();
  }

  // Show loading state
  if (!scriptLoaded || !window.google) {
    return renderLoading();
  }

  // Create marker icon
  const createMarkerIcon = () => {
    const color = getMarkerColor(floodRiskLevel);
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12,
      labelOrigin: new window.google.maps.Point(0, -5)
    };
  };

  // Render marker and info window
  const renderMarkerAndInfoWindow = () => {
    if (!latitude || !longitude) return null;
    
    const elements = [];
    
    // Add marker
    elements.push(
      React.createElement(Marker, {
        key: 'marker',
        position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        onClick: () => setInfoWindowOpen(true),
        icon: createMarkerIcon()
      })
    );
    
    // Add info window if open
    if (infoWindowOpen) {
      elements.push(
        React.createElement(
          InfoWindow,
          {
            key: 'infoWindow',
            position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
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
              📍 ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}
            )
          )
        )
      );
    }
    
    return elements;
  };

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
