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
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>Vehicles</h3>
            <button onClick={() => { setShowForm(!showForm); if (showForm) handleCancelEdit(); }} disabled={isSubmitting}>
                {showForm && !isEditing ? 'Cancel' : 'Add New Vehicle'}
            </button>

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginTop: '10px', border: '1px dashed #ccc', padding: '10px' }}>
                    <h4>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h4>
                    <div>
                        <label>Type*: </label>
                        <select name="type" value={formData.type} onChange={handleInputChange} required disabled={isSubmitting}>
                            <option value="">Select Type</option>
                            {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name} ({vt.max_weight_kg}kg/{vt.max_volume_m3}m³)</option>)}
                        </select>
                    </div>
                    <div><label>License Plate*: <input type="text" name="license_plate" value={formData.license_plate} onChange={handleInputChange} required disabled={isSubmitting} /></label></div>
                    <div><label>Make: <input type="text" name="make" value={formData.make} onChange={handleInputChange} disabled={isSubmitting} /></label></div>
                    <div><label>Model: <input type="text" name="model" value={formData.model} onChange={handleInputChange} disabled={isSubmitting} /></label></div>
                    <div><label>VIN: <input type="text" name="vin" value={formData.vin} onChange={handleInputChange} disabled={isSubmitting} /></label></div>
                    <div><label>Odometer (km): <input type="number" step="0.1" name="current_odometer_km" value={formData.current_odometer_km} onChange={handleInputChange} disabled={isSubmitting} /></label></div>
                    <div><label>Insurance Expiry: <input type="date" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} disabled={isSubmitting} /></label></div>
                    <div><label>Available: <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleInputChange} disabled={isSubmitting} /></label></div>

                    {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
                    </button>
                    {isEditing && <button type="button" onClick={handleCancelEdit} style={{marginLeft: '10px'}} disabled={isSubmitting}>Cancel Edit</button>}
                </form>
            )}

            {/* Vehicle List */}
            <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
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
                                <button onClick={() => handleEditClick(v)} disabled={showForm && isEditing && editingId === v.id}>Edit</button>
                                {/* <button onClick={() => handleDelete(v.id)} style={{marginLeft: '5px'}}>Delete</button> */}
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