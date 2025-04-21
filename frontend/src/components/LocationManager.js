import React, { useState } from 'react';
import LocationList from './LocationList';
import MapDisplay from './MapDisplay';
import LocationImport from './LocationImport';

function LocationManager() {
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'map', 'import'
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Manejar cambio de pestaña
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Manejar clic en "Ver en mapa" en la lista
    const handleMapViewClick = (location) => {
        setSelectedLocation(location);
        setActiveTab('map');
    };

    // Estilos para las pestañas
    const tabButtonStyle = (isActive) => ({
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: isActive ? '2px solid #2A5A8C' : '2px solid transparent',
        color: isActive ? '#2A5A8C' : '#666',
        fontWeight: isActive ? '500' : 'normal',
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: '14px'
    });

    return (
        <div>
            <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                margin: '0 0 20px 0'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <div>
                        <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Gestión de Ubicaciones</h2>
                        <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Administra las ubicaciones para planificación de rutas</p>
                    </div>
                    {activeTab === 'list' && (
                        <button 
                            onClick={() => {
                                // Esta acción es manejada internamente en el componente LocationList
                                // cuando se hace clic en el botón "+ Nueva Ubicación"
                            }}
                            style={{
                                backgroundColor: '#2A5A8C',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                visibility: 'hidden' // Ocultarlo, ya que la funcionalidad está en LocationList
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Nueva Ubicación
                        </button>
                    )}
                </div>
                
                {/* Pestañas de navegación */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e0e0e0',
                    marginBottom: '20px'
                }}>
                    <button 
                        style={tabButtonStyle(activeTab === 'list')}
                        onClick={() => handleTabChange('list')}
                    >
                        Lista
                    </button>
                    <button 
                        style={tabButtonStyle(activeTab === 'map')}
                        onClick={() => handleTabChange('map')}
                    >
                        Mapa
                    </button>
                    <button 
                        style={tabButtonStyle(activeTab === 'import')}
                        onClick={() => handleTabChange('import')}
                    >
                        Importar
                    </button>
                </div>
                
                {/* Contenido según la pestaña activa */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    padding: '20px',
                    border: '1px solid #e9ecef'
                }}>
                    {activeTab === 'list' && (
                        <LocationList onMapViewClick={handleMapViewClick} />
                    )}
                    
                    {activeTab === 'map' && (
                        <MapDisplay selectedLocation={selectedLocation} />
                    )}
                    
                    {activeTab === 'import' && (
                        <LocationImport />
                    )}
                </div>
            </div>
        </div>
    );
}

export default LocationManager; 