import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';

// --- Configuration ---
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const mapContainerStyle = {
  height: '600px', // Increased height slightly
  width: '100%'
};
// Default map center (e.g., Mexico City) - Adjust as needed
const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332
};
const defaultZoom = 10;
const libraries = ["places"]; // Add other libraries if needed

// Helper to generate colors for different routes (simple example)
const routeColors = ['#FF0000', '#0000FF', '#00FF00', '#FF00FF', '#FFA500', '#000000', '#808080'];
const getRouteColor = (index) => routeColors[index % routeColors.length];

// --- Helper Component for Rendering Directions ---
// This component handles fetching and rendering directions for a single route
function RouteDirections({ route, locations, index }) {
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);

  // Memoize the callback to avoid unnecessary recalculations
  const directionsCallback = useCallback((response, status) => {
    if (status === 'OK' && response) {
      console.log(`Directions received for route ${route.id}:`, response);
      setDirections(response);
      setError(null); // Clear previous errors
    } else {
      console.error(`Directions request failed for route ${route.id} due to ${status}`);
      setError(`Failed to get directions: ${status}`);
      setDirections(null); // Clear previous directions on error
    }
  }, [route.id]); // Dependency ensures callback updates if route ID changes

  // Prepare request options only when route or locations change
  const directionsRequestOptions = React.useMemo(() => {
    if (!route?.stops || route.stops.length < 2) {
      return null; // Not enough stops for directions
    }

    const stopLocations = route.stops
      .map(stop => locations.find(l => l.id === stop.location))
      .filter(loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number');

    if (stopLocations.length < 2) {
      console.warn(`Not enough valid locations found for route ${route.id} stops.`);
      return null;
    }

    const origin = { lat: stopLocations[0].latitude, lng: stopLocations[0].longitude };
    const destination = { lat: stopLocations[stopLocations.length - 1].latitude, lng: stopLocations[stopLocations.length - 1].longitude };
    const waypoints = stopLocations.slice(1, -1).map(loc => ({
      location: { lat: loc.latitude, lng: loc.longitude },
      stopover: true // Treat intermediate stops as waypoints
    }));

    return {
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      optimizeWaypoints: true, // Let Google optimize the waypoint order slightly if needed
      travelMode: 'DRIVING'
    };
  }, [route, locations]); // Recalculate if route or locations change

  // Effect to trigger DirectionsService request when options are ready
  useEffect(() => {
    // Reset directions when options change (e.g., new route selected)
    setDirections(null);
    setError(null);
  }, [directionsRequestOptions]);

  if (!directionsRequestOptions) {
    return null; // Don't render if no valid request can be made
  }

  return (
    <>
      {/* Only render DirectionsService if we don't have directions yet */}
      {!directions && !error && (
        <DirectionsService
          options={directionsRequestOptions}
          callback={directionsCallback}
        />
      )}
      {/* Render DirectionsRenderer if we have directions */}
      {directions && (
        <DirectionsRenderer
          options={{
            directions: directions,
            suppressMarkers: true, // We'll use our own markers
            polylineOptions: {
              strokeColor: getRouteColor(index),
              strokeOpacity: 0.8,
              strokeWeight: 5
            }
          }}
        />
      )}
       {/* Optionally display an error message on the map */}
       {error && (
         <InfoWindow position={directionsRequestOptions.origin}>
            <div>Error fetching directions for Route {route.id}: {error}</div>
         </InfoWindow>
       )}
    </>
  );
}


// --- Main Map Component ---
function MapDisplay() {
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // For InfoWindow

  // Ref for the map instance
  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Optional: Adjust bounds after loading if needed
    // const bounds = new window.google.maps.LatLngBounds();
    // locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }));
    // map.fitBounds(bounds);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setMapError(null);
      setSelectedLocation(null); // Reset selected location
      try {
        const [locationsRes, routesRes] = await Promise.all([
          axios.get('/api/locations/'),
          axios.get('/api/routes/')
        ]);

        const validLocations = (locationsRes.data || []).filter(
          loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
        );
        setLocations(validLocations);

        // Ensure routes have stops before setting
        const validRoutes = (routesRes.data || []).filter(route => route.stops && route.stops.length > 0);
        setRoutes(validRoutes);

        console.log("Fetched valid locations:", validLocations);
        console.log("Fetched valid routes for map:", validRoutes);

      } catch (err) {
        console.error("Error fetching map data:", err);
        setMapError("Failed to load locations or routes for the map.");
        setLocations([]); // Clear data on error
        setRoutes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const handleInfoWindowClose = () => {
    setSelectedLocation(null);
  };

  if (!API_KEY) {
    return <div style={{ color: 'red', padding: '20px' }}>
      Error: Google Maps API Key is missing. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file.
      </div>;
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
      <h3>Locations and Routes Map</h3>
      {isLoading && <p>Loading map data...</p>}
      {mapError && <p style={{ color: 'red' }}>Error loading map data: {mapError}</p>}

      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={defaultZoom}
          onLoad={onMapLoad}
          options={{
            // Optional: Add map controls customization here
            // streetViewControl: false,
            // mapTypeControl: false,
          }}
        >
          {/* Render Markers for all locations */}
          {!isLoading && locations.map(loc => (
            <Marker
              key={`loc-${loc.id}`}
              position={{ lat: loc.latitude, lng: loc.longitude }}
              title={`${loc.name} (${loc.type})`}
              onClick={() => handleMarkerClick(loc)}
              // Optional: Add custom icons based on loc.type
              // icon={{
              //   url: getIconUrl(loc.type), // Implement getIconUrl function
              //   scaledSize: new window.google.maps.Size(30, 30)
              // }}
            />
          ))}

          {/* Render InfoWindow for selected marker */}
          {selectedLocation && (
            <InfoWindow
              position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
              onCloseClick={handleInfoWindowClose}
            >
              <div>
                <h4>{selectedLocation.name} ({selectedLocation.type})</h4>
                <p>Address: {selectedLocation.address || 'N/A'}</p>
                <p>Coords: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</p>
                <p>Window: {selectedLocation.opening_time || '--:--'} - {selectedLocation.closing_time || '--:--'}</p>
                <p>Service Time: {selectedLocation.average_service_time_mins || 'N/A'} min</p>
              </div>
            </InfoWindow>
          )}

          {/* Render Directions for each route */}
          {!isLoading && routes.map((route, index) => (
             <RouteDirections
                key={`route-dir-${route.id}`}
                route={route}
                locations={locations} // Pass all locations for lookup
                index={index}
             />
          ))}

        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default MapDisplay;