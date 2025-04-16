import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RoutePlanner() {
    const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [depots, setDepots] = useState([]);
    const [selectedDepot, setSelectedDepot] = useState('');
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [selectedVehicleIds, setSelectedVehicleIds] = useState(new Set());
    const [pendingTasks, setPendingTasks] = useState([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    // Removed location state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [planResult, setPlanResult] = useState(null);

    // --- Fetch Initial Data (Depots, Vehicles, Tasks) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch Depots (Locations marked as CEDIS)
                const depotRes = await axios.get('/api/locations/?type=CEDIS');
                setDepots(depotRes.data || []);
                if (depotRes.data && depotRes.data.length > 0) {
                    setSelectedDepot(depotRes.data[0].id); // Default to first depot
                }

                // Fetch Available Vehicles
                const vehicleRes = await axios.get('/api/vehicles/?is_available=true');
                setAvailableVehicles(vehicleRes.data || []);

                // Fetch Pending Tasks
                // TODO: Maybe filter tasks by date initially? Or load all pending?
                const taskRes = await axios.get('/api/tasks/?status=PENDING');
                setPendingTasks(taskRes.data || []);
            } catch (err) {
                console.error("Error fetching initial data:", err);
                setError("Failed to load initial data. Please check API connection.");
                if (err.response) {
                    console.error("Response data:", err.response.data);
                    console.error("Response status:", err.response.status);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []); // Run once on component mount

    // --- Handlers ---
    const handleVehicleSelection = (vehicleId) => {
        setSelectedVehicleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(vehicleId)) {
                newSet.delete(vehicleId);
            } else {
                newSet.add(vehicleId);
            }
            return newSet;
        });
    };

    // Removed handleLocationSelection handler

    const handleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handlePlanRoutes = async () => {
        if (!selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0) {
            setError("Please select a depot, at least one vehicle, and at least one task.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setPlanResult(null);

        const payload = {
            depot_id: selectedDepot,
            vehicle_ids: Array.from(selectedVehicleIds),
            task_ids: Array.from(selectedTaskIds),
            // Removed location_ids from payload
            date: planDate,
        };

        try {
            console.log("Sending planning request:", payload);
            const response = await axios.post('/api/routes/plan/', payload);
            console.log("Planning response:", response.data);
            setPlanResult(response.data);
            // TODO: Optionally refresh task/location lists or update UI based on result
            // Clear selections after successful planning?
            setSelectedTaskIds(new Set());
            // Removed clearing of selectedLocationIds

        } catch (err) {
            console.error("Error planning routes:", err);
            let errorMsg = "Failed to plan routes.";
            if (err.response && err.response.data) {
                // Try to get specific error from backend response
                errorMsg += ` Server responded with: ${JSON.stringify(err.response.data)}`;
            }
            setError(errorMsg);
            if (err.response) {
                console.error("Response data:", err.response.data);
                console.error("Response status:", err.response.status);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---
    return (
        <div>
            <h2>Plan Routes</h2>

            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {isLoading && <p>Loading...</p>}

            <div>
                <label htmlFor="planDate">Plan Date: </label>
                <input
                    type="date"
                    id="planDate"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            <div>
                <label htmlFor="depot">Select Depot: </label>
                <select
                    id="depot"
                    value={selectedDepot}
                    onChange={(e) => setSelectedDepot(e.target.value)}
                    disabled={isLoading || depots.length === 0}
                >
                    {depots.map(depot => (
                        <option key={depot.id} value={depot.id}>{depot.name}</option>
                    ))}
                </select>
            </div>

            <hr />

            <div>
                <h3>Available Vehicles</h3>
                {availableVehicles.length === 0 && !isLoading ? <p>No available vehicles found.</p> : null}
                <ul>
                    {availableVehicles.map(v => (
                        <li key={v.id}>
                            <input
                                type="checkbox"
                                id={`vehicle-${v.id}`}
                                checked={selectedVehicleIds.has(v.id)}
                                onChange={() => handleVehicleSelection(v.id)}
                                disabled={isLoading}
                            />
                            <label htmlFor={`vehicle-${v.id}`}>
                                {v.license_plate} ({v.type_name}) - Cap: {v.type.max_weight_kg}kg / {v.type.max_volume_m3}m³
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Removed Location Selection Section */}

            <div>
                <h3>Pending Tasks</h3>
                {pendingTasks.length === 0 && !isLoading ? <p>No pending tasks found.</p> : null}
                {/* TODO: Add filtering/sorting for tasks? */}
                <ul>
                    {pendingTasks.map(t => (
                        <li key={t.id}>
                            <input
                                type="checkbox"
                                id={`task-${t.id}`}
                                checked={selectedTaskIds.has(t.id)}
                                onChange={() => handleTaskSelection(t.id)}
                                disabled={isLoading}
                            />
                            <label htmlFor={`task-${t.id}`}>
                                Task {t.id}: {t.type_display} from {t.origin_name} to {t.destination_name} ({t.weight_kg}kg / {t.volume_m3}m³) - Date: {t.required_date}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            <hr />

            {/* Reverted disabled condition */}
            <button onClick={handlePlanRoutes} disabled={isLoading || !selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0}>
                {isLoading ? 'Planning...' : 'Plan Selected Routes'}
            </button>

            {planResult && (
                <div style={{ marginTop: '20px', border: '1px solid green', padding: '10px' }}>
                    <h4>Planning Result:</h4>
                    <pre>{JSON.stringify(planResult, null, 2)}</pre>
                    {/* TODO: Display results more nicely */}
                </div>
            )}
        </div>
    );
}

export default RoutePlanner;