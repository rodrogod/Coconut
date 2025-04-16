import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>Maintenance Types</h3>
            <button onClick={() => setShowAddForm(!showAddForm)} disabled={isSubmitting}>
                {showAddForm ? 'Cancel' : 'Add New Type'}
            </button>

            {showAddForm && (
                <form onSubmit={handleAddType} style={{ marginTop: '10px', border: '1px dashed #ccc', padding: '10px' }}>
                    <h4>Add New Maintenance Type</h4>
                    <div>
                        <label htmlFor="newTypeName">Name: </label>
                        <input type="text" id="newTypeName" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="newTypeDesc">Description: </label>
                        <textarea id="newTypeDesc" value={newTypeDescription} onChange={(e) => setNewTypeDescription(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="newTypeKm">Interval (km): </label>
                        <input type="number" id="newTypeKm" value={newTypeIntervalKm} onChange={(e) => setNewTypeIntervalKm(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="newTypeDays">Interval (days): </label>
                        <input type="number" id="newTypeDays" value={newTypeIntervalDays} onChange={(e) => setNewTypeIntervalDays(e.target.value)} disabled={isSubmitting} />
                    </div>
                    {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Type'}
                    </button>
                </form>
            )}

            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '10px' }}>
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