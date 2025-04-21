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

const iconButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#555',
    padding: '5px',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '8px',
    transition: 'color 0.2s ease'
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
    const [editingType, setEditingType] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
            if (editingType) {
                await axios.put(`/api/maintenance-types/${editingType.id}/`, payload);
                setEditingType(null);
            } else {
                await axios.post('/api/maintenance-types/', payload);
            }
            // Reset form and hide
            setNewTypeName('');
            setNewTypeDescription('');
            setNewTypeIntervalKm('');
            setNewTypeIntervalDays('');
            setShowAddForm(false);
            // Refetch types to show the new one
            fetchTypes();
        } catch (err) {
            console.error("Error saving maintenance type:", err);
            let errorMsg = "Failed to save type.";
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data); // Show raw error data
            }
            setSubmitError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (type) => {
        setEditingType(type);
        setNewTypeName(type.name);
        setNewTypeDescription(type.description || '');
        setNewTypeIntervalKm(type.interval_km || '');
        setNewTypeIntervalDays(type.interval_days || '');
        setShowAddForm(true);
        setSubmitError(null);
    };

    const handleDeleteClick = (typeId) => {
        setShowDeleteConfirm(typeId);
    };

    const handleDeleteConfirm = async (typeId) => {
        setIsSubmitting(true);
        try {
            await axios.delete(`/api/maintenance-types/${typeId}/`);
            fetchTypes();
        } catch (err) {
            console.error("Error deleting maintenance type:", err);
            let errorMsg = "Failed to delete type.";
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data);
            }
            alert(`Error: ${errorMsg}`);
        } finally {
            setShowDeleteConfirm(null);
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
                    onClick={() => { setShowAddForm(true); setEditingType(null); setSubmitError(null); }} 
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
                        {editingType ? 'Edit Maintenance Type' : 'Add New Maintenance Type'}
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
                            onClick={() => { setShowAddForm(false); setEditingType(null); }} 
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
                            {isSubmitting ? 'Saving...' : (editingType ? 'Update Type' : 'Save Type')}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de Tipos mejorada con botones de edición y eliminación */}
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '20px' }}>
                {types.map(type => (
                    <li key={type.id} style={{ 
                        borderBottom: '1px solid #eee', 
                        padding: '15px 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <div>
                            <strong>{type.name}</strong>
                            {type.description && <p style={{ margin: '2px 0', fontSize: '0.9em', color: '#555' }}>{type.description}</p>}
                            <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>
                                Interval: {type.interval_km ? `${type.interval_km} km` : ''} {type.interval_km && type.interval_days ? ' / ' : ''} {type.interval_days ? `${type.interval_days} days` : ''}
                                {!type.interval_km && !type.interval_days ? 'Not specified' : ''}
                            </p>
                        </div>
                        <div>
                            <button 
                                onClick={() => handleEditClick(type)} 
                                style={iconButtonStyle}
                                title="Edit"
                                disabled={isSubmitting || showAddForm}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button 
                                onClick={() => handleDeleteClick(type.id)} 
                                style={{...iconButtonStyle, color: '#e53935'}}
                                title="Delete"
                                disabled={isSubmitting || showAddForm}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>

                            {/* Confirmación de eliminación */}
                            {showDeleteConfirm === type.id && (
                                <div style={{
                                    position: 'absolute',
                                    zIndex: 100,
                                    background: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    padding: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    marginTop: '5px'
                                }}>
                                    <p style={{margin: '0 0 10px', fontSize: '14px'}}>¿Está seguro de eliminar este tipo?</p>
                                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '5px'}}>
                                        <button 
                                            onClick={() => setShowDeleteConfirm(null)} 
                                            style={{...secondaryButtonStyle, fontSize: '12px', padding: '5px 10px'}}
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteConfirm(type.id)} 
                                            style={{
                                                background: '#e53935',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '5px 10px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {types.length === 0 && <p>No maintenance types defined yet.</p>}
        </div>
    );
}

export default MaintenanceTypeList;