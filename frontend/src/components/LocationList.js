import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LocationList({ onMapViewClick }) {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [editLocation, setEditLocation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLocation, setNewLocation] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        type: 'SUCURSAL',
        opening_time: '',
        closing_time: '',
        average_service_time_mins: 0
    });

    // Fetch locations from API
    const fetchLocations = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/locations/');
            setLocations(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching locations:", err);
            setError("Error al cargar ubicaciones. Por favor, intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    // Load locations on component mount
    useEffect(() => {
        fetchLocations();
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle type filter change
    const handleTypeFilterChange = (e) => {
        setTypeFilter(e.target.value);
    };

    // Filter locations based on search term and type filter
    const filteredLocations = locations.filter(location => {
        const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter === '' || location.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Handle edit button click
    const handleEditClick = (location) => {
        setEditLocation(location);
        setShowEditModal(true);
    };

    // Handle delete location
    const handleDeleteLocation = async (locationId) => {
        if (window.confirm('¿Está seguro que desea eliminar esta ubicación?')) {
            try {
                await axios.delete(`/api/locations/${locationId}/`);
                setLocations(locations.filter(loc => loc.id !== locationId));
            } catch (err) {
                console.error("Error deleting location:", err);
                alert("Error al eliminar la ubicación.");
            }
        }
    };

    // Handle location form input change
    const handleLocationInputChange = (e, isNewLocation = false) => {
        const { name, value } = e.target;
        if (isNewLocation) {
            setNewLocation(prev => ({ ...prev, [name]: value }));
        } else {
            setEditLocation(prev => ({ ...prev, [name]: value }));
        }
    };

    // Submit edited location
    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/api/locations/${editLocation.id}/`, editLocation);
            const updatedLocations = locations.map(loc => 
                loc.id === editLocation.id ? response.data : loc
            );
            setLocations(updatedLocations);
            setShowEditModal(false);
        } catch (err) {
            console.error("Error updating location:", err);
            alert("Error al actualizar la ubicación.");
        }
    };

    // Submit new location
    const handleCreateLocation = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/locations/', newLocation);
            setLocations([...locations, response.data]);
            setShowCreateModal(false);
            setNewLocation({
                name: '',
                address: '',
                latitude: '',
                longitude: '',
                type: 'SUCURSAL',
                opening_time: '',
                closing_time: '',
                average_service_time_mins: 0
            });
        } catch (err) {
            console.error("Error creating location:", err);
            alert("Error al crear la ubicación.");
        }
    };

    // Render edit location modal
    const renderEditModal = () => {
        if (!showEditModal || !editLocation) return null;
        
        return (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div className="modal-content" style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    width: '80%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <h3>Editar Ubicación</h3>
                    <form onSubmit={handleUpdateLocation}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={editLocation.name} 
                                onChange={(e) => handleLocationInputChange(e)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Dirección:</label>
                            <textarea 
                                name="address" 
                                value={editLocation.address || ''} 
                                onChange={(e) => handleLocationInputChange(e)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Latitud:</label>
                                <input 
                                    type="number" 
                                    name="latitude" 
                                    value={editLocation.latitude} 
                                    onChange={(e) => handleLocationInputChange(e)}
                                    step="0.000001"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Longitud:</label>
                                <input 
                                    type="number" 
                                    name="longitude" 
                                    value={editLocation.longitude} 
                                    onChange={(e) => handleLocationInputChange(e)}
                                    step="0.000001"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tipo:</label>
                            <select 
                                name="type" 
                                value={editLocation.type} 
                                onChange={(e) => handleLocationInputChange(e)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="CEDIS">Centro de Distribución (CEDIS)</option>
                                <option value="SUCURSAL">Sucursal/Cliente</option>
                                <option value="PROVEEDOR">Proveedor</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Hora apertura:</label>
                                <input 
                                    type="time" 
                                    name="opening_time" 
                                    value={editLocation.opening_time || ''} 
                                    onChange={(e) => handleLocationInputChange(e)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Hora cierre:</label>
                                <input 
                                    type="time" 
                                    name="closing_time" 
                                    value={editLocation.closing_time || ''} 
                                    onChange={(e) => handleLocationInputChange(e)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tiempo de servicio (min):</label>
                            <input 
                                type="number" 
                                name="average_service_time_mins" 
                                value={editLocation.average_service_time_mins || 0} 
                                onChange={(e) => handleLocationInputChange(e)}
                                min="0"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowEditModal(false)}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2A5A8C', color: 'white', cursor: 'pointer' }}
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Render create location modal
    const renderCreateModal = () => {
        if (!showCreateModal) return null;
        
        return (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div className="modal-content" style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    width: '80%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <h3>Nueva Ubicación</h3>
                    <form onSubmit={handleCreateLocation}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={newLocation.name} 
                                onChange={(e) => handleLocationInputChange(e, true)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Dirección:</label>
                            <textarea 
                                name="address" 
                                value={newLocation.address} 
                                onChange={(e) => handleLocationInputChange(e, true)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Latitud:</label>
                                <input 
                                    type="number" 
                                    name="latitude" 
                                    value={newLocation.latitude} 
                                    onChange={(e) => handleLocationInputChange(e, true)}
                                    step="0.000001"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Longitud:</label>
                                <input 
                                    type="number" 
                                    name="longitude" 
                                    value={newLocation.longitude} 
                                    onChange={(e) => handleLocationInputChange(e, true)}
                                    step="0.000001"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tipo:</label>
                            <select 
                                name="type" 
                                value={newLocation.type} 
                                onChange={(e) => handleLocationInputChange(e, true)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="CEDIS">Centro de Distribución (CEDIS)</option>
                                <option value="SUCURSAL">Sucursal/Cliente</option>
                                <option value="PROVEEDOR">Proveedor</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Hora apertura:</label>
                                <input 
                                    type="time" 
                                    name="opening_time" 
                                    value={newLocation.opening_time} 
                                    onChange={(e) => handleLocationInputChange(e, true)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Hora cierre:</label>
                                <input 
                                    type="time" 
                                    name="closing_time" 
                                    value={newLocation.closing_time} 
                                    onChange={(e) => handleLocationInputChange(e, true)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tiempo de servicio (min):</label>
                            <input 
                                type="number" 
                                name="average_service_time_mins" 
                                value={newLocation.average_service_time_mins} 
                                onChange={(e) => handleLocationInputChange(e, true)}
                                min="0"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowCreateModal(false)}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2A5A8C', color: 'white', cursor: 'pointer' }}
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const getTypeLabel = (type) => {
        switch(type) {
            case 'CEDIS': return 'Centro de Distribución';
            case 'SUCURSAL': return 'Sucursal/Cliente';
            case 'PROVEEDOR': return 'Proveedor';
            default: return type;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Buscar ubicación..." 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #e0e0e0', width: '250px' }}
                    />
                    <select 
                        value={typeFilter} 
                        onChange={handleTypeFilterChange}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                    >
                        <option value="">Todos los tipos</option>
                        <option value="CEDIS">Centro de Distribución</option>
                        <option value="SUCURSAL">Sucursal/Cliente</option>
                        <option value="PROVEEDOR">Proveedor</option>
                    </select>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        backgroundColor: '#2A5A8C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <span>+ Nueva Ubicación</span>
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Cargando ubicaciones...</div>
            ) : error ? (
                <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f4f6f8', borderBottom: '1px solid #e0e0e0' }}>
                                    <th style={{ padding: '12px 15px', textAlign: 'left' }}>Nombre</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'left' }}>Tipo</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'left' }}>Dirección</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'left' }}>Horario</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'left' }}>Tiempo de servicio</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLocations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                            No se encontraron ubicaciones
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLocations.map(location => (
                                        <tr key={location.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '12px 15px' }}>{location.name}</td>
                                            <td style={{ padding: '12px 15px' }}>{getTypeLabel(location.type)}</td>
                                            <td style={{ padding: '12px 15px' }}>{location.address || '-'}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                {location.opening_time && location.closing_time 
                                                    ? `${location.opening_time} - ${location.closing_time}`
                                                    : '-'
                                                }
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>
                                                {location.average_service_time_mins > 0 
                                                    ? `${location.average_service_time_mins} min`
                                                    : '-'
                                                }
                                            </td>
                                            <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleEditClick(location)}
                                                        style={{ 
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#2A5A8C'
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLocation(location.id)}
                                                        style={{ 
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#dc3545'
                                                        }}
                                                    >
                                                        Eliminar
                                                    </button>
                                                    <button
                                                        onClick={() => onMapViewClick(location)}
                                                        style={{ 
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#198754'
                                                        }}
                                                    >
                                                        Ver en mapa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '15px', color: '#666' }}>
                        Mostrando {filteredLocations.length} de {locations.length} ubicaciones
                    </div>
                </>
            )}

            {renderEditModal()}
            {renderCreateModal()}
        </div>
    );
}

export default LocationList; 