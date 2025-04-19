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
    // Estado para depot favorito
    const [favoriteDepot, setFavoriteDepot] = useState(() => {
        const saved = localStorage.getItem('favoriteDepot');
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [planResult, setPlanResult] = useState(null);
    
    // Estados para formulario de nueva tarea
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [locations, setLocations] = useState([]);
    const [newTask, setNewTask] = useState({
        description: '',
        origin: '',
        destination: '',
        weight_kg: 0,
        volume_m3: 0,
        type: 'DELIVERY',
        required_date: new Date().toISOString().split('T')[0],
        window_start: '08:00',
        window_end: '18:00'
    });
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [taskCreated, setTaskCreated] = useState(false);
    
    // Función para obtener todas las ubicaciones
    const fetchLocations = async () => {
        try {
            const response = await axios.get('/api/locations/');
            setLocations(response.data || []);
        } catch (err) {
            console.error("Error fetching locations:", err);
        }
    };

    // --- Fetch Initial Data (Depots, Vehicles, Tasks) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch Depots (Locations marked as CEDIS)
                const depotRes = await axios.get('/api/locations/?type=CEDIS');
                setDepots(depotRes.data || []);
                
                // Si hay un depot favorito guardado, seleccionarlo
                if (favoriteDepot && depotRes.data && depotRes.data.some(d => d.id === favoriteDepot.id)) {
                    setSelectedDepot(favoriteDepot.id);
                } else if (depotRes.data && depotRes.data.length > 0) {
                    setSelectedDepot(depotRes.data[0].id); // Default to first depot
                }

                // Fetch Available Vehicles
                const vehicleRes = await axios.get('/api/vehicles/?is_available=true');
                setAvailableVehicles(vehicleRes.data || []);

                // Fetch Pending Tasks
                // TODO: Maybe filter tasks by date initially? Or load all pending?
                const taskRes = await axios.get('/api/tasks/?status=PENDING');
                setPendingTasks(taskRes.data || []);
                
                // Fetch all locations for the task form
                await fetchLocations();
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

    // Función para establecer el depot actual como favorito
    const handleSetFavoriteDepot = () => {
        if (!selectedDepot) return;
        
        const depot = depots.find(d => d.id === parseInt(selectedDepot));
        if (!depot) return;
        
        setFavoriteDepot(depot);
        localStorage.setItem('favoriteDepot', JSON.stringify(depot));
        alert(`${depot.name} ha sido establecido como depot favorito`);
    };

    // Función para usar el depot favorito guardado
    const handleUseFavoriteDepot = () => {
        if (favoriteDepot) {
            setSelectedDepot(favoriteDepot.id);
        }
    };
    
    // Función para manejar cambios en el formulario de nueva tarea
    const handleNewTaskChange = (e) => {
        const { name, value } = e.target;
        
        // Para campos numéricos, convertir a número
        if (name === 'weight_kg' || name === 'volume_m3') {
            setNewTask({
                ...newTask,
                [name]: parseFloat(value) || 0
            });
        } else {
            setNewTask({
                ...newTask,
                [name]: value
            });
        }
    };
    
    // Función para enviar el formulario de nueva tarea
    const handleSubmitNewTask = async (e) => {
        e.preventDefault();
        
        if (!newTask.origin || !newTask.destination) {
            alert("Por favor seleccione origen y destino");
            return;
        }
        
        setIsCreatingTask(true);
        setTaskCreated(false);
        setError(null);
        
        try {
            const response = await axios.post('/api/tasks/', newTask);
            console.log("Task created:", response.data);
            
            // Añadir la nueva tarea a la lista y seleccionarla
            setPendingTasks([...pendingTasks, response.data]);
            setSelectedTaskIds(prev => {
                const newSet = new Set(prev);
                newSet.add(response.data.id);
                return newSet;
            });
            
            // Resetear el formulario
            setNewTask({
                description: '',
                origin: '',
                destination: '',
                weight_kg: 0,
                volume_m3: 0,
                type: 'DELIVERY',
                required_date: new Date().toISOString().split('T')[0],
                window_start: '08:00',
                window_end: '18:00'
            });
            
            // Mostrar mensaje de éxito
            setTaskCreated(true);
            
            // Ocultar formulario después de 2 segundos
            setTimeout(() => {
                setShowNewTaskForm(false);
                setTaskCreated(false);
            }, 2000);
            
        } catch (err) {
            console.error("Error creating task:", err);
            if (err.response && err.response.data) {
                setError(`Error al crear tarea: ${JSON.stringify(err.response.data)}`);
            } else {
                setError("Error al crear la tarea. Por favor intente de nuevo.");
            }
        } finally {
            setIsCreatingTask(false);
        }
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

    // Estilos para los componentes
    const styles = {
        sectionContainer: {
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        },
        formGroup: {
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center'
        },
        label: {
            fontWeight: '500',
            marginRight: '10px',
            minWidth: '100px'
        },
        select: {
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            flexGrow: 1,
            maxWidth: '300px'
        },
        dateInput: {
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #ced4da'
        },
        button: {
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '0 5px'
        },
        favoriteButton: {
            padding: '8px 12px',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px'
        },
        useFavoriteButton: {
            padding: '8px 12px',
            backgroundColor: '#16a085',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '5px'
        },
        disabledButton: {
            opacity: 0.6,
            cursor: 'not-allowed'
        },
        planButton: {
            padding: '10px 20px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
        },
        resultContainer: {
            marginTop: '20px',
            border: '1px solid #27ae60',
            borderRadius: '4px',
            padding: '15px',
            backgroundColor: '#f0fff4'
        },
        addTaskButton: {
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginLeft: 'auto'
        },
        addTaskForm: {
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            border: '1px solid #ddd'
        },
        inputGroup: {
            marginBottom: '10px'
        },
        input: {
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            width: '100%',
            boxSizing: 'border-box'
        },
        submitButton: {
            backgroundColor: '#9b59b6',
            color: 'white',
            padding: '8px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        successMessage: {
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px'
        }
    };

    // --- Render Logic ---
    return (
        <div>
            <h2 style={{borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#2c3e50'}}>Plan Routes</h2>

            {error && <p style={{ color: 'red', padding: '10px', backgroundColor: '#ffecec', borderRadius: '4px' }}>Error: {error}</p>}
            {isLoading && <p style={{color: '#3498db'}}>Loading...</p>}

            <div style={styles.sectionContainer}>
                <div style={styles.formGroup}>
                    <label htmlFor="planDate" style={styles.label}>Plan Date: </label>
                    <input
                        type="date"
                        id="planDate"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        disabled={isLoading}
                        style={styles.dateInput}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="depot" style={styles.label}>Select Depot: </label>
                    <select
                        id="depot"
                        value={selectedDepot}
                        onChange={(e) => setSelectedDepot(e.target.value)}
                        disabled={isLoading || depots.length === 0}
                        style={styles.select}
                    >
                        {depots.map(depot => (
                            <option key={depot.id} value={depot.id}>{depot.name}</option>
                        ))}
                    </select>
                    
                    {/* Botón para establecer depot favorito */}
                    <button 
                        onClick={handleSetFavoriteDepot} 
                        disabled={isLoading || !selectedDepot}
                        style={isLoading || !selectedDepot ? {...styles.favoriteButton, ...styles.disabledButton} : styles.favoriteButton}
                        title="Guardar este depot como favorito"
                    >
                        ⭐ Fijar Depot
                    </button>
                    
                    {/* Botón para usar depot favorito */}
                    {favoriteDepot && (
                        <button 
                            onClick={handleUseFavoriteDepot} 
                            disabled={isLoading}
                            style={isLoading ? {...styles.useFavoriteButton, ...styles.disabledButton} : styles.useFavoriteButton}
                            title={`Usar depot favorito: ${favoriteDepot.name}`}
                        >
                            📍 Usar Favorito
                        </button>
                    )}
                </div>
                
                {favoriteDepot && (
                    <div style={{marginTop: '5px', fontSize: '13px', color: '#666'}}>
                        Depot favorito actual: <strong>{favoriteDepot.name}</strong>
                    </div>
                )}
            </div>

            <hr />

            <div style={styles.sectionContainer}>
                <h3 style={{color: '#2c3e50', marginTop: '0'}}>Available Vehicles</h3>
                {availableVehicles.length === 0 && !isLoading ? <p>No available vehicles found.</p> : null}
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {availableVehicles.map(v => (
                        <li key={v.id} style={{padding: '8px 0', borderBottom: '1px solid #eee'}}>
                            <input
                                type="checkbox"
                                id={`vehicle-${v.id}`}
                                checked={selectedVehicleIds.has(v.id)}
                                onChange={() => handleVehicleSelection(v.id)}
                                disabled={isLoading}
                                style={{marginRight: '10px'}}
                            />
                            <label htmlFor={`vehicle-${v.id}`}>
                                {v.license_plate} ({v.type_name}) - Cap: {v.type.max_weight_kg}kg / {v.type.max_volume_m3}m³
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            <div style={styles.sectionContainer}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                    <h3 style={{color: '#2c3e50', marginTop: '0', marginBottom: '0'}}>Pending Tasks</h3>
                    
                    {/* Botón para añadir nueva tarea */}
                    <button 
                        onClick={() => setShowNewTaskForm(!showNewTaskForm)} 
                        style={styles.addTaskButton}
                        disabled={isLoading}
                    >
                        {showNewTaskForm ? '❌ Cancelar' : '➕ Añadir Tarea'}
                    </button>
                </div>
                
                {/* Formulario para crear nueva tarea */}
                {showNewTaskForm && (
                    <div style={styles.addTaskForm}>
                        <h4 style={{margin: '0 0 15px 0', color: '#9b59b6'}}>Crear Nueva Tarea</h4>
                        <form onSubmit={handleSubmitNewTask}>
                            <div style={styles.inputGroup}>
                                <label style={{display: 'block', marginBottom: '5px'}}>Descripción:</label>
                                <input 
                                    type="text" 
                                    name="description"
                                    value={newTask.description}
                                    onChange={handleNewTaskChange}
                                    style={styles.input}
                                    placeholder="Descripción de la tarea"
                                />
                            </div>
                            
                            <div style={{display: 'flex', gap: '10px'}}>
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Origen:</label>
                                    <select
                                        name="origin"
                                        value={newTask.origin}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Seleccionar origen</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name} ({loc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Destino:</label>
                                    <select
                                        name="destination"
                                        value={newTask.destination}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                        required
                                    >
                                        <option value="">Seleccionar destino</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name} ({loc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '10px'}}>
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Peso (kg):</label>
                                    <input 
                                        type="number" 
                                        name="weight_kg"
                                        value={newTask.weight_kg}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Volumen (m³):</label>
                                    <input 
                                        type="number" 
                                        name="volume_m3"
                                        value={newTask.volume_m3}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '10px'}}>
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Tipo:</label>
                                    <select
                                        name="type"
                                        value={newTask.type}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                    >
                                        <option value="DELIVERY">Entrega</option>
                                        <option value="PICKUP">Recogida</option>
                                    </select>
                                </div>
                                
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Fecha:</label>
                                    <input 
                                        type="date" 
                                        name="required_date"
                                        value={newTask.required_date}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '10px'}}>
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Ventana Inicio:</label>
                                    <input 
                                        type="time" 
                                        name="window_start"
                                        value={newTask.window_start}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                    />
                                </div>
                                
                                <div style={{...styles.inputGroup, flex: 1}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Ventana Fin:</label>
                                    <input 
                                        type="time" 
                                        name="window_end"
                                        value={newTask.window_end}
                                        onChange={handleNewTaskChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isCreatingTask}
                                style={isCreatingTask ? {...styles.submitButton, ...styles.disabledButton} : styles.submitButton}
                            >
                                {isCreatingTask ? 'Creando...' : 'Crear Tarea'}
                            </button>
                            
                            {taskCreated && (
                                <div style={styles.successMessage}>
                                    ✅ Tarea creada correctamente
                                </div>
                            )}
                        </form>
                    </div>
                )}
                
                {pendingTasks.length === 0 && !isLoading ? <p>No pending tasks found.</p> : null}
                {/* TODO: Add filtering/sorting for tasks? */}
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {pendingTasks.map(t => (
                        <li key={t.id} style={{padding: '8px 0', borderBottom: '1px solid #eee'}}>
                            <input
                                type="checkbox"
                                id={`task-${t.id}`}
                                checked={selectedTaskIds.has(t.id)}
                                onChange={() => handleTaskSelection(t.id)}
                                disabled={isLoading}
                                style={{marginRight: '10px'}}
                            />
                            <label htmlFor={`task-${t.id}`}>
                                Task {t.id}: {t.type_display} from {t.origin_name} to {t.destination_name} ({t.weight_kg}kg / {t.volume_m3}m³) - Date: {t.required_date}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            <hr />

            <div style={{textAlign: 'center', margin: '20px 0'}}>
                <button 
                    onClick={handlePlanRoutes} 
                    disabled={isLoading || !selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0}
                    style={isLoading || !selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0 ? 
                          {...styles.planButton, ...styles.disabledButton} : styles.planButton}
                >
                    {isLoading ? 'Planning...' : 'Plan Selected Routes'}
                </button>
            </div>

            {planResult && (
                <div style={styles.resultContainer}>
                    <h4 style={{color: '#27ae60', marginTop: '0'}}>Planning Result:</h4>
                    <pre style={{overflowX: 'auto', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
                        {JSON.stringify(planResult, null, 2)}
                    </pre>
                    {/* TODO: Display results more nicely */}
                </div>
            )}
        </div>
    );
}

export default RoutePlanner;