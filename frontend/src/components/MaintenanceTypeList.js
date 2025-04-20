import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Reusing styles from VehicleList or define similar ones
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
    display: 'inline-flex', // Changed for single button
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
    display: 'inline-flex', // Changed for single button
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    marginLeft: '10px' // Add margin if needed next to primary
};

function MaintenanceTypeList() {
    const [types, setTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeDescription, setNewTypeDescription] = useState('');
    const [newTypeIntervalKm, setNewTypeIntervalKm] = useState('');
    const [newTypeIntervalDays, setNewTypeIntervalDays] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const fetchTypes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/maintenance-types/');
            setTypes(response.data || []);
        } catch (err) {
            console.error("Error fetching maintenance types:", err);
            setError("Failed to load maintenance types.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []); // Fetch on mount

    const handleAddType = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        const payload = {
            name: newTypeName,
            description: newTypeDescription || null,
            interval_km: newTypeIntervalKm ? parseInt(newTypeIntervalKm, 10) : null,
            interval_days: newTypeIntervalDays ? parseInt(newTypeIntervalDays, 10) : null,
        };

        try {
            await axios.post('/api/maintenance-types/', payload);
            // Reset form and hide
            setNewTypeName('');
            setNewTypeDescription('');
            setNewTypeIntervalKm('');
            setNewTypeIntervalDays('');
            setShowAddForm(false);
            // Refetch types to show the new one
            fetchTypes();
        } catch (err) {
            console.error("Error adding maintenance type:", err);
            let errorMsg = "Failed to add type.";
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data); // Show raw error data
            }
            setSubmitError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p>Loading maintenance types...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {/* Botón Add New Type estilizado */}
            {!showAddForm && (
                 <button 
                    onClick={() => { setShowAddForm(true); setSubmitError(null); }} 
                    style={primaryButtonStyle}
                    disabled={isSubmitting}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add New Type
                </button>
            )}
           
            {/* Formulario Add New Type estilizado */}
            {showAddForm && (
                <form 
                    onSubmit={handleAddType} 
                    style={{
                        marginTop: '20px',
                        padding: '20px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#fff' // Fondo blanco para el form
                    }}
                >
                    <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#2A5A8C' }}>
                        Add New Maintenance Type
                    </h4>
                    
                    {/* Grid Layout for Form */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <label htmlFor="newTypeName" style={baseLabelStyle}>Name*</label>
                            <input type="text" id="newTypeName" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} required disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., Oil Change"/>
                        </div>
                        <div>
                            <label htmlFor="newTypeKm" style={baseLabelStyle}>Interval (km)</label>
                            <input type="number" id="newTypeKm" value={newTypeIntervalKm} onChange={(e) => setNewTypeIntervalKm(e.target.value)} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., 10000" />
                        </div>
                         <div>
                            <label htmlFor="newTypeDays" style={baseLabelStyle}>Interval (days)</label>
                            <input type="number" id="newTypeDays" value={newTypeIntervalDays} onChange={(e) => setNewTypeIntervalDays(e.target.value)} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., 180"/>
                        </div>
                        {/* Description can span more columns if needed, or stay as one */}
                        <div style={{ gridColumn: 'span 1 / -1' /* Ocupa todo el ancho */ }}>
                            <label htmlFor="newTypeDesc" style={baseLabelStyle}>Description</label>
                            <textarea id="newTypeDesc" value={newTypeDescription} onChange={(e) => setNewTypeDescription(e.target.value)} disabled={isSubmitting} style={{...baseInputStyle, height: '80px' /* Altura ajustada */}} placeholder="Optional description of the maintenance type"/>
                        </div>
                    </div>
                    
                    {submitError && <p style={{ color: '#D32F2F', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>Error: {submitError}</p>}
                    
                    {/* Form Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => setShowAddForm(false)} 
                            style={{...secondaryButtonStyle, ...(isSubmitting && {opacity: 0.7, cursor: 'not-allowed'})}}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            style={{...primaryButtonStyle, ...(isSubmitting && {opacity: 0.7, cursor: 'not-allowed'})}}
                            disabled={isSubmitting}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {isSubmitting ? 'Saving...' : 'Save Type'}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de Tipos (estilos básicos) */}
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '20px' }}>
                {types.map(type => (
                    <li key={type.id} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                        <strong>{type.name}</strong>
                        {type.description && <p style={{ margin: '2px 0', fontSize: '0.9em' }}>{type.description}</p>}
                        <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>
                            Interval: {type.interval_km ? `${type.interval_km} km` : ''} {type.interval_km && type.interval_days ? ' / ' : ''} {type.interval_days ? `${type.interval_days} days` : ''}
                            {!type.interval_km && !type.interval_days ? 'Not specified' : ''}
                        </p>
                        {/* TODO: Add Edit/Delete buttons later */}
                    </li>
                ))}
            </ul>
            {types.length === 0 && <p>No maintenance types defined yet.</p>}
        </div>
    );
}

export default MaintenanceTypeList;