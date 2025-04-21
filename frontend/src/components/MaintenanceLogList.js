import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Reusing styles from VehicleList/MaintenanceTypeList
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
    display: 'inline-flex', // Use inline-flex for buttons
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
    display: 'inline-flex', // Use inline-flex for buttons
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    marginLeft: '10px'
};

function MaintenanceLogList({ searchTerm, vehicleFilter, statusFilter }) {
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]); // For dropdown
    const [maintenanceTypes, setMaintenanceTypes] = useState([]); // For dropdown
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(''); // '' means all
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [editingLog, setEditingLog] = useState(null);

    // Form state for adding new log
    const [newLogVehicle, setNewLogVehicle] = useState('');
    const [newLogType, setNewLogType] = useState('');
    const [newLogStatus, setNewLogStatus] = useState('SCHEDULED'); // Default status
    const [newLogScheduledDate, setNewLogScheduledDate] = useState('');
    const [newLogCompletionDate, setNewLogCompletionDate] = useState('');
    const [newLogOdometer, setNewLogOdometer] = useState('');
    const [newLogCost, setNewLogCost] = useState('');
    const [newLogNotes, setNewLogNotes] = useState('');
    const [newLogUnavailableStart, setNewLogUnavailableStart] = useState('');
    const [newLogUnavailableEnd, setNewLogUnavailableEnd] = useState('');


    // Fetch initial data (vehicles, types, and logs)
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch vehicles for the filter dropdown
            const vehicleRes = await axios.get('/api/vehicles/');
            setVehicles(vehicleRes.data || []);

            // Fetch maintenance types for the add form dropdown
            const typeRes = await axios.get('/api/maintenance-types/');
            setMaintenanceTypes(typeRes.data || []);

            // Fetch logs, potentially filtered
            let logUrl = '/api/maintenance-logs/';
            
            const params = new URLSearchParams();
            
            // Usar filtro de vehículo del componente padre, o del estado local si no existe
            if (vehicleFilter) {
                params.append('vehicle', vehicleFilter);
            } else if (selectedVehicleFilter) {
                params.append('vehicle', selectedVehicleFilter);
            }
            
            // Aplicar filtro de estado si existe
            if (statusFilter) {
                params.append('status', statusFilter);
            }
            
            // Aplicar término de búsqueda si existe
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            if (params.toString()) {
                logUrl += `?${params.toString()}`;
            }
            
            const logRes = await axios.get(logUrl);
            setLogs(logRes.data || []);

        } catch (err) {
            console.error("Error fetching maintenance data:", err);
            setError("Failed to load maintenance data.");
        } finally {
            setIsLoading(false);
        }
    };

    // Utilizar los filtros externos cuando cambian
    useEffect(() => {
        fetchData();
    }, [searchTerm, vehicleFilter, statusFilter]);

    // También seguir usando el filtro local (para la experiencia de usuario en componente)
    useEffect(() => {
        if (!vehicleFilter) { // Solo si no hay un filtro externo
            fetchData();
        }
    }, [selectedVehicleFilter]);

    const resetForm = () => {
        setNewLogVehicle('');
        setNewLogType('');
        setNewLogStatus('SCHEDULED');
        setNewLogScheduledDate('');
        setNewLogCompletionDate('');
        setNewLogOdometer('');
        setNewLogCost('');
        setNewLogNotes('');
        setNewLogUnavailableStart('');
        setNewLogUnavailableEnd('');
        setSubmitError(null);
    };

    const handleAddLog = async (event) => {
        event.preventDefault();
        if (!newLogVehicle || !newLogType) {
            setSubmitError("Vehicle and Maintenance Type are required.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);

        const payload = {
            vehicle: newLogVehicle,
            maintenance_type: newLogType,
            status: newLogStatus,
            scheduled_date: newLogScheduledDate || null,
            completion_date: newLogCompletionDate || null,
            odometer_at_maintenance: newLogOdometer ? parseFloat(newLogOdometer) : null,
            cost: newLogCost ? parseFloat(newLogCost) : null,
            notes: newLogNotes || null,
            unavailable_start_date: newLogUnavailableStart || null,
            unavailable_end_date: newLogUnavailableEnd || null,
        };

        // Basic date validation example
        if (payload.completion_date && payload.scheduled_date && payload.completion_date < payload.scheduled_date) {
             setSubmitError("Completion date cannot be before scheduled date.");
             setIsSubmitting(false);
             return;
        }
         if (payload.unavailable_end_date && payload.unavailable_start_date && payload.unavailable_end_date < payload.unavailable_start_date) {
             setSubmitError("Unavailable end date cannot be before start date.");
             setIsSubmitting(false);
             return;
        }


        try {
            if (editingLog) {
                await axios.put(`/api/maintenance-logs/${editingLog.id}/`, payload);
                setEditingLog(null);
            } else {
                await axios.post('/api/maintenance-logs/', payload);
            }
            resetForm();
            setShowAddForm(false);
            fetchData(); // Refetch logs
        } catch (err) {
            console.error("Error saving maintenance log:", err);
            let errorMsg = "Failed to save log.";
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data);
            }
            setSubmitError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (log) => {
        setEditingLog(log);
        setNewLogVehicle(log.vehicle);
        setNewLogType(log.maintenance_type);
        setNewLogStatus(log.status);
        setNewLogScheduledDate(log.scheduled_date || '');
        setNewLogCompletionDate(log.completion_date || '');
        setNewLogOdometer(log.odometer_at_maintenance || '');
        setNewLogCost(log.cost || '');
        setNewLogNotes(log.notes || '');
        setNewLogUnavailableStart(log.unavailable_start_date || '');
        setNewLogUnavailableEnd(log.unavailable_end_date || '');
        setShowAddForm(true);
        setSubmitError(null);
    };

    const handleStatusChange = async (logId, newStatus) => {
        try {
            await axios.patch(`/api/maintenance-logs/${logId}/`, {
                status: newStatus
            });
            fetchData(); // Refetch logs to update the status
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status. Please try again.");
        }
    };

    if (error && !isLoading) return <p style={{ color: 'red' }}>{error}</p>; // Show error only if not loading

    return (
        <div>
            {/* Filter Section - Improved Styling */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="vehicleFilter" style={{...baseLabelStyle, marginBottom: '0' /* No margin bottom here */ }}>
                    Filter by Vehicle:
                </label>
                <select
                    id="vehicleFilter"
                    value={selectedVehicleFilter}
                    onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                    disabled={isLoading}
                    style={{ ...baseInputStyle, marginBottom: '0', width: 'auto', minWidth: '150px' /* Ajustar ancho */ }}
                >
                    <option value="">All Vehicles</option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.license_plate}</option>
                    ))}
                </select>
            </div>

            {/* Botón "Add New Log Entry" */}
             {!showAddForm && (
                <button 
                    onClick={() => { setShowAddForm(true); setEditingLog(null); resetForm(); }} 
                    style={primaryButtonStyle}
                    disabled={isSubmitting}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add New Log Entry
                </button>
             )}

            {/* Add Form Modal */}
            {showAddForm && (
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
                    <form 
                        onSubmit={handleAddLog} 
                        style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            width: '100%',
                            maxWidth: '600px', // Aumentar ancho para más campos
                            maxHeight: '90vh', // Permitir scroll si es necesario
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#2A5A8C', fontSize: '20px', fontWeight: '600' }}>
                                {editingLog ? 'Edit Maintenance Log' : 'Add New Maintenance Log'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => { setShowAddForm(false); setEditingLog(null); }} 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    lineHeight: '24px',
                                    cursor: 'pointer',
                                    color: '#777'
                                }}
                                disabled={isSubmitting}
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Grid Layout for Form Fields */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', // Ajustar minmax
                            gap: '20px',
                            marginBottom: '25px'
                        }}>
                            <div>
                                <label htmlFor="newLogVehicle" style={baseLabelStyle}>Vehicle*</label>
                                <select id="newLogVehicle" value={newLogVehicle} onChange={(e) => setNewLogVehicle(e.target.value)} required disabled={isSubmitting} style={baseInputStyle}>
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newLogType" style={baseLabelStyle}>Type*</label>
                                <select id="newLogType" value={newLogType} onChange={(e) => setNewLogType(e.target.value)} required disabled={isSubmitting} style={baseInputStyle}>
                                    <option value="">Select Type</option>
                                    {maintenanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newLogStatus" style={baseLabelStyle}>Status*</label>
                                <select id="newLogStatus" value={newLogStatus} onChange={(e) => setNewLogStatus(e.target.value)} required disabled={isSubmitting} style={baseInputStyle}>
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newLogScheduledDate" style={baseLabelStyle}>Scheduled Date*</label>
                                <input id="newLogScheduledDate" type="date" value={newLogScheduledDate} onChange={e => setNewLogScheduledDate(e.target.value)} required disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                            <div>
                                <label htmlFor="newLogCompletionDate" style={baseLabelStyle}>Completion Date</label>
                                <input id="newLogCompletionDate" type="date" value={newLogCompletionDate} onChange={e => setNewLogCompletionDate(e.target.value)} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                            <div>
                                <label htmlFor="newLogOdometer" style={baseLabelStyle}>Odometer (km)</label>
                                <input id="newLogOdometer" type="number" value={newLogOdometer} onChange={e => setNewLogOdometer(e.target.value)} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., 12500" />
                            </div>
                            <div>
                                <label htmlFor="newLogCost" style={baseLabelStyle}>Cost ($)</label>
                                <input id="newLogCost" type="number" step="0.01" value={newLogCost} onChange={e => setNewLogCost(e.target.value)} disabled={isSubmitting} style={baseInputStyle} placeholder="e.g., 150.75" />
                            </div>
                             <div>
                                <label htmlFor="newLogUnavailableStart" style={baseLabelStyle}>Unavailable Start</label>
                                <input id="newLogUnavailableStart" type="date" value={newLogUnavailableStart} onChange={e => setNewLogUnavailableStart(e.target.value)} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                             <div>
                                <label htmlFor="newLogUnavailableEnd" style={baseLabelStyle}>Unavailable End</label>
                                <input id="newLogUnavailableEnd" type="date" value={newLogUnavailableEnd} onChange={e => setNewLogUnavailableEnd(e.target.value)} disabled={isSubmitting} style={baseInputStyle} />
                            </div>
                             <div style={{ gridColumn: 'span 1 / -1' /* Ocupa todo el ancho */ }}>
                                <label htmlFor="newLogNotes" style={baseLabelStyle}>Notes</label>
                                <textarea id="newLogNotes" value={newLogNotes} onChange={e => setNewLogNotes(e.target.value)} disabled={isSubmitting} style={{...baseInputStyle, height: '80px'}} placeholder="Optional notes about the maintenance" />
                            </div>
                        </div>

                        {submitError && <p style={{ color: '#D32F2F', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>Error: {submitError}</p>}
                        
                        {/* Form Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={() => { setShowAddForm(false); setEditingLog(null); }} 
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
                                {isSubmitting ? 'Saving...' : (editingLog ? 'Update Log' : 'Save Log')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && <p>Loading maintenance logs...</p>}

            {/* Lista de registros de mantenimiento mejorada */}
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                {logs.map(log => (
                    <li 
                        key={log.id} 
                        style={{
                            marginBottom: '15px',
                            padding: '15px',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #eee'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontWeight: '600', color: '#2A5A8C', fontSize: '16px' }}>
                                {log.maintenance_type_name} - {log.vehicle_plate}
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: log.status === 'COMPLETED' ? '#e8f5e9' : (log.status === 'IN_PROGRESS' ? '#e3f2fd' : '#fff3e0'),
                                color: log.status === 'COMPLETED' ? '#388e3c' : (log.status === 'IN_PROGRESS' ? '#1976d2' : '#ef6c00'),
                                border: `1px solid ${log.status === 'COMPLETED' ? '#c8e6c9' : (log.status === 'IN_PROGRESS' ? '#bbdefb' : '#ffe0b2')}`
                            }}>
                                {log.status_display}
                            </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                            {log.scheduled_date && <div>Scheduled: {log.scheduled_date}</div>}
                            {log.completion_date && <div>Completed: {log.completion_date}</div>}
                            {log.odometer_at_maintenance && <div>Odometer: {log.odometer_at_maintenance} km</div>}
                            {log.cost && <div>Cost: ${log.cost}</div>}
                            {log.unavailable_start_date && <div>Unavailable: {log.unavailable_start_date} to {log.unavailable_end_date || '?'}</div>}
                            {log.notes && <div style={{ marginTop: '5px', fontStyle: 'italic' }}>{log.notes}</div>}
                        </div>
                        
                        {/* Acciones para cada registro */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '10px' }}>
                            {/* Botones de estado */}
                            <div style={{ marginRight: 'auto', display: 'flex', gap: '5px' }}>
                                {log.status !== 'SCHEDULED' && (
                                    <button 
                                        onClick={() => handleStatusChange(log.id, 'SCHEDULED')}
                                        style={{
                                            border: '1px solid #ff9800',
                                            color: '#ff9800',
                                            background: 'white',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Set Scheduled
                                    </button>
                                )}
                                {log.status !== 'IN_PROGRESS' && (
                                    <button 
                                        onClick={() => handleStatusChange(log.id, 'IN_PROGRESS')}
                                        style={{
                                            border: '1px solid #2196f3',
                                            color: '#2196f3',
                                            background: 'white',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Set In Progress
                                    </button>
                                )}
                                {log.status !== 'COMPLETED' && (
                                    <button 
                                        onClick={() => handleStatusChange(log.id, 'COMPLETED')}
                                        style={{
                                            border: '1px solid #4caf50',
                                            color: '#4caf50',
                                            background: 'white',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Set Completed
                                    </button>
                                )}
                            </div>
                            
                            {/* Botón de edición */}
                            <button 
                                onClick={() => handleEditClick(log)}
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    color: '#2A5A8C',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                                disabled={isSubmitting || showAddForm}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Edit
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {!isLoading && logs.length === 0 && <p>No maintenance logs found.</p>}
        </div>
    );
}

export default MaintenanceLogList;