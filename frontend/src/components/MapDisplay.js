import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';

// Configuración básica del mapa
const mapContainerStyle = {
  height: '600px',
  width: '100%'
};

// Centro por defecto (México)
const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332
};

// Opciones por defecto del mapa
const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

// Bibliotecas necesarias
const libraries = ["places"];

// Helper para obtener el ícono según el tipo de ubicación
const getMarkerIcon = (locationType) => {
  switch (locationType) {
    case 'CEDIS':
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    case 'SUCURSAL':
      return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'PROVEEDOR':
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    default:
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
};

// Helper para obtener la etiqueta del tipo de ubicación
const getTypeLabel = (type) => {
  switch(type) {
    case 'CEDIS': return 'Centro de Distribución';
    case 'SUCURSAL': return 'Sucursal/Cliente';
    case 'PROVEEDOR': return 'Proveedor';
    default: return type;
  }
};

// Componente principal del mapa
function MapDisplay({ selectedLocation = null }) {
  // API key de Google Maps
  const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  
  // Cargar el script de Google Maps una sola vez
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries,
  });
  
  // Estados
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(5);

  // Referencia para el mapa
  const mapRef = useRef(null);
  
  // Callback al cargar el mapa
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Obtener ubicaciones
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setMapError(null);
    try {
      const response = await axios.get('/api/locations/');
      const validLocations = (response.data || []).filter(
        loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
      );
      setLocations(validLocations);
      
      // Centrar mapa según las ubicaciones
      if (validLocations.length > 0) {
        if (selectedLocation) {
          setCenter({
            lat: parseFloat(selectedLocation.latitude),
            lng: parseFloat(selectedLocation.longitude)
          });
          setZoom(14);
        } else {
          const avgLat = validLocations.reduce((sum, loc) => sum + parseFloat(loc.latitude), 0) / validLocations.length;
          const avgLng = validLocations.reduce((sum, loc) => sum + parseFloat(loc.longitude), 0) / validLocations.length;
          setCenter({ lat: avgLat, lng: avgLng });
          setZoom(6);
        }
      }
    } catch (err) {
      console.error("Error al cargar las ubicaciones:", err);
      setMapError("Error al cargar las ubicaciones. Por favor, intente nuevamente.");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation]);

  // Cargar ubicaciones al montar el componente
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Actualizar cuando cambia la ubicación seleccionada
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      const newCenter = {
        lat: parseFloat(selectedLocation.latitude),
        lng: parseFloat(selectedLocation.longitude)
      };
      setCenter(newCenter);
      setZoom(14);
      mapRef.current.panTo(newCenter);
      setActiveInfoWindow(selectedLocation);
    }
  }, [selectedLocation]);

  // Manejador para el clic en un marcador
  const handleMarkerClick = (location) => {
    setActiveInfoWindow(location);
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude)
      });
    }
  };

  // Cerrar ventana de información
  const handleInfoWindowClose = () => {
    setActiveInfoWindow(null);
  };
  
  // Si no hay API key, mostrar error
  if (!API_KEY) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8d7da', 
        color: '#721c24', 
        borderRadius: '5px',
        margin: '20px 0' 
      }}>
        <h3>Error de configuración</h3>
        <p>Falta la clave de API de Google Maps. Configure REACT_APP_GOOGLE_MAPS_API_KEY en el archivo .env</p>
      </div>
    );
  }
  
  // Si hay error al cargar el script
  if (loadError) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8d7da', 
        color: '#721c24', 
        borderRadius: '5px',
        margin: '20px 0' 
      }}>
        <h3>Error al cargar Google Maps</h3>
        <p>No se pudo cargar el script de Google Maps: {loadError.message}</p>
      </div>
    );
  }
  
  // Si el script está cargando
  if (!isLoaded) {
    return (
      <div style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '15px' }}>
        Cargando Google Maps...
      </div>
    );
  }

  return (
    <div style={{ padding: '15px' }}>
      {/* Leyenda de tipos de ubicaciones */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '15px', 
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#4285F4', borderRadius: '50%' }}></div>
          <span>Centro de Distribución</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#34A853', borderRadius: '50%' }}></div>
          <span>Sucursal/Cliente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#FBBC05', borderRadius: '50%' }}></div>
          <span>Proveedor</span>
        </div>
      </div>
      
      {/* Indicadores de carga y error */}
      {isLoading && (
        <div style={{ padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '15px' }}>
          Cargando ubicaciones...
        </div>
      )}
      
      {mapError && (
        <div style={{ padding: '10px 15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' }}>
          {mapError}
        </div>
      )}

      {/* El mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={defaultOptions}
      >
        {/* Marcadores para las ubicaciones */}
        {!isLoading && locations.map(loc => (
          <Marker
            key={`loc-${loc.id}`}
            position={{ lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) }}
            title={`${loc.name} (${loc.type})`}
            onClick={() => handleMarkerClick(loc)}
            icon={getMarkerIcon(loc.type)}
          />
        ))}

        {/* Ventana de información para el marcador seleccionado */}
        {activeInfoWindow && (
          <InfoWindow
            position={{ lat: parseFloat(activeInfoWindow.latitude), lng: parseFloat(activeInfoWindow.longitude) }}
            onCloseClick={handleInfoWindowClose}
          >
            <div style={{ padding: '5px', maxWidth: '250px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{activeInfoWindow.name}</h3>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Tipo:</strong> {getTypeLabel(activeInfoWindow.type)}
              </p>
              {activeInfoWindow.address && (
                <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                  <strong>Dirección:</strong> {activeInfoWindow.address}
                </p>
              )}
              {activeInfoWindow.opening_time && activeInfoWindow.closing_time && (
                <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                  <strong>Horario:</strong> {activeInfoWindow.opening_time} - {activeInfoWindow.closing_time}
                </p>
              )}
              {activeInfoWindow.average_service_time_mins > 0 && (
                <p style={{ margin: '0', fontSize: '14px' }}>
                  <strong>Tiempo de servicio:</strong> {activeInfoWindow.average_service_time_mins} min
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default MapDisplay;