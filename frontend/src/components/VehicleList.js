import React, { useState, useEffect } from 'react';
import axios from 'axios';

const initialFormData = {
    type: '',
    license_plate: '',
    make: '',
    model: '',
    vin: '',
    current_odometer_km: 0,
    insurance_expiry: '',
    is_available: true,
};

// Estilos reutilizables
const baseInputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    boxSizing: 'border-box',
    marginBottom: '15px',
    transition: 'border-color 0.2s ease'
};

const baseLabelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    fontSize: '14px',
    color: '#333'
};

const primaryButtonStyle = {
    backgroundColor: '#2A5A8C',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
};

const secondaryButtonStyle = {
    backgroundColor: '#f8f9fa',
    color: '#2A5A8C',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
};

const deleteButtonStyle = {
    backgroundColor: '#fff',
    color: '#dc3545',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
};

function VehicleList({ vehicles, isLoading, error, onDataChange }) {
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch solo los tipos de vehículo, ya que la lista viene por props
    const fetchVehicleTypes = async () => {
        // No necesitamos setIsLoading/setError aquí ya que es secundario
        try {
            const typesRes = await axios.get('/api/vehicle-types/');
            setVehicleTypes(typesRes.data || []);
            // Set default type for form if types exist and not editing
            if (typesRes.data && typesRes.data.length > 0 && !isEditing) {
                 setFormData(prev => ({ ...prev, type: typesRes.data[0].id }));
            }
        } catch (err) {
            console.error("Error fetching vehicle types:", err);
            // Podríamos mostrar un error específico para los tipos si fallan
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch types on mount

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditClick = (vehicle) => {
        setIsEditing(true);
        setEditingId(vehicle.id);
        setFormData({
            type: vehicle.type, // Store type ID
            license_plate: vehicle.license_plate || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            vin: vehicle.vin || '',
            current_odometer_km: vehicle.current_odometer_km || 0,
            insurance_expiry: vehicle.insurance_expiry || '',
            is_available: vehicle.is_available,
        });
        setShowForm(true);
        setSubmitError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData(initialFormData);
        // Reset type dropdown to first available type if exists
        if (vehicleTypes.length > 0) {
             setFormData(prev => ({ ...prev, type: vehicleTypes[0].id }));
        }
        setShowForm(false);
        setSubmitError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        // Basic validation
        if (!formData.type || !formData.license_plate) {
            setSubmitError("Vehicle Type and License Plate are required.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            ...formData,
            // Ensure numeric fields are numbers, handle empty strings for optional fields
            current_odometer_km: parseFloat(formData.current_odometer_km) || 0,
            insurance_expiry: formData.insurance_expiry || null,
            make: formData.make || null,
            model: formData.model || null,
            vin: formData.vin || null,
        };

        const url = isEditing ? `/api/vehicles/${editingId}/` : '/api/vehicles/';
        const method = isEditing ? 'put' : 'post';

        try {
            await axios[method](url, payload);
            handleCancelEdit(); // Close form, reset state
            // Llamar a la función pasada por props para refrescar la lista en App.js
            if (onDataChange) {
                onDataChange();
            }
        } catch (err) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} vehicle:`, err);
            let errorMsg = `Failed to ${isEditing ? 'update' : 'add'} vehicle.`;
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data); // Show raw error
            }
            setSubmitError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Implementación de la eliminación de vehículos
    const handleDeleteConfirm = (vehicle) => {
        setVehicleToDelete(vehicle);
        setShowDeleteConfirm(true);
    };

    const handleDeleteCancel = () => {
        setVehicleToDelete(null);
        setShowDeleteConfirm(false);
    };

    const handleDelete = async () => {
        if (!vehicleToDelete) return;
        
        setIsDeleting(true);
        try {
            await axios.delete(`/api/vehicles/${vehicleToDelete.id}/`);
            // Refresh the list after deletion
            if (onDataChange) {
                onDataChange();
            }
            setShowDeleteConfirm(false);
            setVehicleToDelete(null);
        } catch (err) {
            console.error("Error deleting vehicle:", err);
            alert(`Error deleting vehicle: ${err.response?.data?.error || err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) return <p>Loading vehicles...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {!showForm && (
                <button 
                    onClick={() => { setShowForm(true); setIsEditing(false); setFormData(initialFormData); setSubmitError(null); }} 
                    style={primaryButtonStyle} 
                    disabled={isSubmitting}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add New Vehicle
                </button>
            )}

            {showForm && (
                <div style={{
                    position: 'fixed', // O usar un modal real
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100, // Asegurar que esté por encima de otros elementos
                    padding: '20px'
                }}>
                    <form 
                        onSubmit={handleSubmit} 
                        style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            width: '100%',
                            maxWidth: '500px'
                        }}
                    >
                        <h3 style={{ 
                            marginTop: 0, 
                            marginBottom: '25px', 
                            color: '#2A5A8C', 
                            fontSize: '20px', 
                            fontWeight: '600' 
                        }}>
                            {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
                        </h3>

                        {/* Grid Layout for Form Fields */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Responsive grid
                            gap: '20px',
                            marginBottom: '25px'
                        }}>
                            <div>
                                <label style={baseLabelStyle}>Type*</label>
                                <select name="type" value={formData.type} onChange={handleInputChange} required disabled={isSubmitting} style={baseInputStyle}>
                                    <option value="">Select Type</option>
                                    {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name} ({vt.max_weight_kg}kg/{vt.max_volume_m3}m³)</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={baseLabelStyle}>License Plate*</label>
                                <input type="text" name="license_plate" value={formData.license_plate} onChange={handleInputChange} required disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., ABC-123" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Make</label>
                                <input type="text" name="make" value={formData.make} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., Toyota" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Model</label>
                                <input type="text" name="model" value={formData.model} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., Hiace" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>VIN</label>
                                <input type="text" name="vin" value={formData.vin} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="Vehicle Identification Number" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Odometer (km)</label>
                                <input type="number" name="current_odometer_km" value={formData.current_odometer_km} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} min="0" step="0.1" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Insurance Expiry</label>
                                <input type="date" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '15px',
                                marginTop: '20px' // Alinear con otros campos
                            }}>
                                <input 
                                    type="checkbox" 
                                    id="is_available" 
                                    name="is_available" 
                                    checked={formData.is_available} 
                                    onChange={handleInputChange} 
                                    disabled={isSubmitting}
                                    style={{
                                        marginRight: '8px',
                                        width: '16px',
                                        height: '16px'
                                    }}
                                />
                                <label htmlFor="is_available" style={{
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    color: '#333',
                                    cursor: 'pointer'
                                }}>
                                    Vehicle is available for routing
                                </label>
                            </div>
                        </div>

                        {submitError && (
                            <div style={{ 
                                padding: '10px', 
                                marginBottom: '15px', 
                                backgroundColor: '#f8d7da', 
                                color: '#721c24',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                {submitError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                onClick={handleCancelEdit} 
                                disabled={isSubmitting}
                                style={secondaryButtonStyle}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={primaryButtonStyle}
                            >
                                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de vehículos */}
            {vehicles.length === 0 ? (
                <div style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    color: '#666',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px dashed #ddd'
                }}>
                    <p>No vehicles found. Add your first vehicle using the button above.</p>
                </div>
            ) : (
                <div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px',
                        marginTop: '20px'
                    }}>
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} style={{
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                ':hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '15px',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: vehicle.is_available ? '#f8f9fa' : '#fee'
                                }}>
                                    <h3 style={{
                                        margin: '0',
                                        fontSize: '18px',
                                        fontWeight: '500',
                                        color: '#2A5A8C'
                                    }}>
                                        {vehicle.license_plate}
                                    </h3>
                                    <div style={statusBadgeStyle(vehicle.is_available)}>
                                        {vehicle.is_available ? 'Available' : 'Not Available'}
                                    </div>
                                </div>
                                <div style={{ padding: '15px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px 15px',
                                        fontSize: '14px',
                                        marginBottom: '15px'
                                    }}>
                                        <div style={{ color: '#666' }}>Type:</div>
                                        <div style={{ fontWeight: '500' }}>{vehicle.type_name}</div>
                                        
                                        {vehicle.make && (
                                            <>
                                                <div style={{ color: '#666' }}>Make:</div>
                                                <div style={{ fontWeight: '500' }}>{vehicle.make}</div>
                                            </>
                                        )}
                                        
                                        {vehicle.model && (
                                            <>
                                                <div style={{ color: '#666' }}>Model:</div>
                                                <div style={{ fontWeight: '500' }}>{vehicle.model}</div>
                                            </>
                                        )}
                                        
                                        <div style={{ color: '#666' }}>Odometer:</div>
                                        <div style={{ fontWeight: '500' }}>{vehicle.current_odometer_km.toLocaleString()} km</div>
                                        
                                        {vehicle.insurance_expiry && (
                                            <>
                                                <div style={{ color: '#666' }}>Insurance:</div>
                                                <div style={{ fontWeight: '500' }}>{new Date(vehicle.insurance_expiry).toLocaleDateString()}</div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '10px',
                                        marginTop: '10px'
                                    }}>
                                        <button 
                                            onClick={() => handleDeleteConfirm(vehicle)}
                                            style={{
                                                ...secondaryButtonStyle,
                                                color: '#dc3545',
                                                padding: '8px 12px',
                                                fontSize: '13px'
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                            Delete
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(vehicle)}
                                            style={{
                                                ...secondaryButtonStyle,
                                                padding: '8px 12px',
                                                fontSize: '13px'
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirmation Delete Dialog */}
            {showDeleteConfirm && vehicleToDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                        width: '100%',
                        maxWidth: '400px'
                    }}>
                        <h3 style={{
                            marginTop: 0,
                            color: '#dc3545',
                            fontSize: '18px',
                            fontWeight: '600'
                        }}>
                            Confirm Deletion
                        </h3>
                        <p style={{marginBottom: '20px'}}>
                            Are you sure you want to delete vehicle with license plate <strong>{vehicleToDelete.license_plate}</strong>?<br/>
                            This action cannot be undone.
                        </p>
                        <div style={{display: 'flex', gap: '15px', justifyContent: 'flex-end'}}>
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                style={secondaryButtonStyle}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={deleteButtonStyle}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Estilo para el badge de estado
const statusBadgeStyle = (isAvailable) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: isAvailable ? '#d4edda' : '#f8d7da',
    color: isAvailable ? '#155724' : '#721c24'
});

export default VehicleList;