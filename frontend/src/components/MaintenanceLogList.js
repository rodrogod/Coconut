import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MaintenanceLogList() {
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]); // For dropdown
    const [maintenanceTypes, setMaintenanceTypes] = useState([]); // For dropdown
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(''); // '' means all
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

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
            if (selectedVehicleFilter) {
                logUrl += `?vehicle=${selectedVehicleFilter}`;
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

    useEffect(() => {
        fetchData();
    }, [selectedVehicleFilter]); // Refetch logs when filter changes

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
            await axios.post('/api/maintenance-logs/', payload);
            resetForm();
            setShowAddForm(false);
            fetchData(); // Refetch logs
        } catch (err) {
            console.error("Error adding maintenance log:", err);
            let errorMsg = "Failed to add log.";
            if (err.response && err.response.data) {
                errorMsg = JSON.stringify(err.response.data);
            }
            setSubmitError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (error && !isLoading) return <p style={{ color: 'red' }}>{error}</p>; // Show error only if not loading

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>Maintenance Log</h3>

            {/* Filter Section */}
            <div>
                <label htmlFor="vehicleFilter">Filter by Vehicle: </label>
                <select
                    id="vehicleFilter"
                    value={selectedVehicleFilter}
                    onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">All Vehicles</option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.license_plate}</option>
                    ))}
                </select>
            </div>

            <button onClick={() => setShowAddForm(!showAddForm)} disabled={isSubmitting} style={{marginTop: '10px'}}>
                {showAddForm ? 'Cancel' : 'Add New Log Entry'}
            </button>

            {/* Add Form */}
            {showAddForm && (
                <form onSubmit={handleAddLog} style={{ marginTop: '10px', border: '1px dashed #ccc', padding: '10px' }}>
                    <h4>Add New Log Entry</h4>
                    {/* Vehicle Dropdown */}
                    <div>
                        <label htmlFor="newLogVehicle">Vehicle*: </label>
                        <select id="newLogVehicle" value={newLogVehicle} onChange={(e) => setNewLogVehicle(e.target.value)} required disabled={isSubmitting}>
                            <option value="">Select Vehicle</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                        </select>
                    </div>
                    {/* Maintenance Type Dropdown */}
                    <div>
                        <label htmlFor="newLogType">Type*: </label>
                        <select id="newLogType" value={newLogType} onChange={(e) => setNewLogType(e.target.value)} required disabled={isSubmitting}>
                            <option value="">Select Type</option>
                            {maintenanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                     {/* Status Dropdown */}
                    <div>
                        <label htmlFor="newLogStatus">Status*: </label>
                        <select id="newLogStatus" value={newLogStatus} onChange={(e) => setNewLogStatus(e.target.value)} required disabled={isSubmitting}>
                            {/* Dynamically generate options from model choices if possible, or hardcode */}
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    {/* Date Fields */}
                    <div><label>Scheduled Date: <input type="date" value={newLogScheduledDate} onChange={e => setNewLogScheduledDate(e.target.value)} disabled={isSubmitting} /></label></div>
                    <div><label>Completion Date: <input type="date" value={newLogCompletionDate} onChange={e => setNewLogCompletionDate(e.target.value)} disabled={isSubmitting} /></label></div>
                    {/* Other Fields */}
                    <div><label>Odometer: <input type="number" step="0.1" value={newLogOdometer} onChange={e => setNewLogOdometer(e.target.value)} disabled={isSubmitting} /></label></div>
                    <div><label>Cost: <input type="number" step="0.01" value={newLogCost} onChange={e => setNewLogCost(e.target.value)} disabled={isSubmitting} /></label></div>
                    <div><label>Unavailable Start: <input type="date" value={newLogUnavailableStart} onChange={e => setNewLogUnavailableStart(e.target.value)} disabled={isSubmitting} /></label></div>
                    <div><label>Unavailable End: <input type="date" value={newLogUnavailableEnd} onChange={e => setNewLogUnavailableEnd(e.target.value)} disabled={isSubmitting} /></label></div>
                    <div><label>Notes: <textarea value={newLogNotes} onChange={e => setNewLogNotes(e.target.value)} disabled={isSubmitting} /></label></div>

                    {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Log Entry'}
                    </button>
                </form>
            )}

            {/* Log List */}
            {isLoading ? <p>Loading logs...</p> : (
                <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '10px' }}>
                    {logs.length === 0 && <p>No maintenance logs found{selectedVehicleFilter ? ' for this vehicle' : ''}.</p>}
                    {logs.map(log => (
                        <li key={log.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: '0.9em' }}>
                            <strong>{log.maintenance_type_name}</strong> for <strong>{log.vehicle_plate}</strong><br />
                            Status: {log.status_display}<br />
                            {log.scheduled_date && `Scheduled: ${log.scheduled_date} `}
                            {log.completion_date && `Completed: ${log.completion_date}`}<br />
                            {log.odometer_at_maintenance && `Odometer: ${log.odometer_at_maintenance} km `}
                            {log.cost && `Cost: $${log.cost}`}<br/>
                            {log.unavailable_start_date && `Unavailable: ${log.unavailable_start_date} to ${log.unavailable_end_date || '?'}`}<br/>
                            {log.notes && <p style={{ margin: '2px 0', fontSize: '0.9em', color: '#333' }}>Notes: {log.notes}</p>}
                            {/* TODO: Add Edit/Delete buttons later */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default MaintenanceLogList;