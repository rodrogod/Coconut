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

function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch vehicles and types
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [vehiclesRes, typesRes] = await Promise.all([
                axios.get('/api/vehicles/'),
                axios.get('/api/vehicle-types/')
            ]);
            setVehicles(vehiclesRes.data || []);
            setVehicleTypes(typesRes.data || []);
            // Set default type for form if types exist
            if (typesRes.data && typesRes.data.length > 0 && !isEditing) {
                 setFormData(prev => ({ ...prev, type: typesRes.data[0].id }));
            }
        } catch (err) {
            console.error("Error fetching vehicle data:", err);
            setError("Failed to load vehicle data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Fetch on mount

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
        const method = isEditing ? 'put' : 'post'; // Use PUT for full update

        try {
            await axios[method](url, payload);
            handleCancelEdit(); // Close form, reset state
            fetchData(); // Refresh list
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

    // TODO: Implement delete functionality later
    // const handleDelete = async (vehicleId) => { ... }

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
                                <input type="text" name="make" value={formData.make} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., Ford" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Model</label>
                                <input type="text" name="model" value={formData.model} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., Transit" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>VIN</label>
                                <input type="text" name="vin" value={formData.vin} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} placeholder="Vehicle Identification Number" />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Odometer (km)</label>
                                <input type="number" step="0.1" name="current_odometer_km" value={formData.current_odometer_km} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                            <div>
                                <label style={baseLabelStyle}>Insurance Expiry</label>
                                <input type="date" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 1' /* Ocupa una columna */, marginTop: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    id="is_available" 
                                    name="is_available" 
                                    checked={formData.is_available} 
                                    onChange={handleInputChange} 
                                    disabled={isSubmitting} 
                                    style={{ marginRight: '10px', width: 'auto' /* Reset width */, marginBottom: '0' /* Reset margin */ }} 
                                />
                                <label htmlFor="is_available" style={{ ...baseLabelStyle, marginBottom: '0' /* Reset margin */ }}>
                                    Available for routes
                                </label>
                            </div>
                        </div>

                        {submitError && <p style={{ color: '#D32F2F', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>Error: {submitError}</p>}
                        
                        {/* Form Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={handleCancelEdit} 
                                style={{...secondaryButtonStyle, ...(isSubmitting && {opacity: 0.7, cursor: 'not-allowed'})}}
                                disabled={isSubmitting}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                style={{...primaryButtonStyle, ...(isSubmitting && {opacity: 0.7, cursor: 'not-allowed'})}}
                                disabled={isSubmitting}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vehicle List */}
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={tableHeaderStyle}>Plate</th>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Make/Model</th>
                        <th style={tableHeaderStyle}>Odometer</th>
                        <th style={tableHeaderStyle}>Available</th>
                        <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map(v => (
                        <tr key={v.id}>
                            <td style={tableCellStyle}>{v.license_plate}</td>
                            <td style={tableCellStyle}>{v.type_name}</td>
                            <td style={tableCellStyle}>{v.make || ''} / {v.model || ''}</td>
                            <td style={tableCellStyle}>{v.current_odometer_km?.toFixed(1)} km</td>
                            <td style={tableCellStyle}>{v.is_available ? 'Yes' : 'No'}</td>
                            <td style={tableCellStyle}>
                                <button 
                                    onClick={() => handleEditClick(v)} 
                                    style={{...secondaryButtonStyle, padding: '5px 10px', fontSize: '12px'}} 
                                    disabled={showForm && isEditing && editingId === v.id}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {vehicles.length === 0 && !isLoading && <p>No vehicles found.</p>}
        </div>
    );
}

// Basic styles for table
const tableHeaderStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' };
const tableCellStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };


export default VehicleList;