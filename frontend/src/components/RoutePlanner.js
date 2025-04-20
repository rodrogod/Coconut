import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Reusing styles or define similar ones
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
    display: 'inline-flex',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    marginLeft: '10px'
};

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
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
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
    
    // Función para enviar el formulario de nueva tarea (adaptada para modal)
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
            setPendingTasks(prevTasks => [...prevTasks, response.data]);
            setSelectedTaskIds(prevIds => new Set(prevIds).add(response.data.id));
            
            // Resetear el formulario y cerrar el modal
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
            setShowAddTaskModal(false); // Cerrar el modal
            
        } catch (err) {
            console.error("Error creating task:", err);
            let errorMsg = "Error al crear la tarea";
            if (err.response && err.response.data) {
                 // Intentar extraer un mensaje de error más específico si está disponible
                 const data = err.response.data;
                 if (typeof data === 'string') {
                     errorMsg = data;
                 } else if (data.non_field_errors) {
                     errorMsg = data.non_field_errors.join(', ');
                 } else {
                     // Combinar errores de campos específicos
                     const fieldErrors = Object.entries(data)
                         .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                         .join('; ');
                     if (fieldErrors) errorMsg = fieldErrors;
                 }
            }
            setError(errorMsg); // Mostrar error en el modal o general
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
            date: planDate,
        };

        try {
            console.log("Sending planning request:", payload);
            const response = await axios.post('/api/routes/plan/', payload);
            console.log("Planning response:", response.data);
            setPlanResult(response.data);
            // Limpiar selecciones después de planificar exitosamente
            setSelectedTaskIds(new Set());
        } catch (err) {
            console.error("Error planning routes:", err);
            let errorMsg = "Failed to plan routes.";
            if (err.response && err.response.data) {
                errorMsg += ` Server responded with: ${JSON.stringify(err.response.data)}`;
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="route-planner">
            {/* Mensajes de error y carga */}
            {error && (
                <div className="alert alert-danger" role="alert" style={{marginBottom: '20px', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', color: '#721c24'}}>
                    {error}
                </div>
            )}
            
            {isLoading && (
                <div className="loading-indicator" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'}}>
                    <div className="spinner" style={{border: '4px solid rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #2A5A8C', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite'}}></div>
                    <span style={{marginLeft: '10px'}}>Cargando...</span>
                </div>
            )}

            {/* Layout de 3 columnas */}
            <div className="planner-layout" style={{display: 'flex', flexWrap: 'wrap', margin: '-10px', justifyContent: 'space-between'}}>
                
                {/* Columna 1: Configuración de Planificación */}
                <div className="planner-column config-column" style={{flex: '1', minWidth: '300px', padding: '10px'}}>
                    <div className="card" style={{backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px', height: '100%'}}>
                        <h3 style={{marginBottom: '20px', color: '#2A5A8C', borderBottom: '2px solid #E0E0E0', paddingBottom: '10px'}}>Configuración de Planificación</h3>
                        
                        {/* Selector de Fecha */}
                        <div className="form-group" style={{marginBottom: '20px'}}>
                            <label htmlFor="planDate" style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Fecha de Planificación:</label>
                    <input
                        type="date"
                        id="planDate"
                                className="form-control"
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        disabled={isLoading}
                                style={{width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da'}}
                    />
                </div>

                        {/* Selector de Depósito */}
                        <div className="form-group" style={{marginBottom: '20px'}}>
                            <label htmlFor="depot" style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Seleccionar Depósito:</label>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                    <select
                        id="depot"
                                    className="form-control"
                        value={selectedDepot}
                        onChange={(e) => setSelectedDepot(e.target.value)}
                        disabled={isLoading || depots.length === 0}
                                    style={{flex: '1', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da'}}
                    >
                                    <option value="">Seleccione un depósito</option>
                        {depots.map(depot => (
                                        <option key={depot.id} value={depot.id}>
                                            {depot.name}
                                        </option>
                        ))}
                    </select>
                            </div>
                    
                            {/* Botones para manejo de favoritos */}
                            <div style={{display: 'flex', flexDirection: 'column', marginTop: '10px', gap: '8px'}}>
                    <button 
                        onClick={handleSetFavoriteDepot} 
                                    disabled={!selectedDepot || isLoading}
                                    className="btn btn-accent"
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        color: '#2A5A8C',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '4px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    Fijar como Favorito
                    </button>
                        <button 
                            onClick={handleUseFavoriteDepot} 
                                    disabled={!favoriteDepot || isLoading}
                                    className="btn btn-secondary"
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        color: '#2A5A8C',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '4px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    Usar Favorito
                        </button>
                </div>
                
                            {/* Mostrar el depot favorito actual */}
                {favoriteDepot && (
                                <div style={{marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>
                        Depot favorito actual: <strong>{favoriteDepot.name}</strong>
                    </div>
                )}
            </div>

                        {/* Sección para mostrar resultados de planificación */}
                        {planResult && (
                            <div className="plan-result" style={{
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#f0fff4',
                                borderRadius: '4px',
                                border: '1px solid #c3e6cb'
                            }}>
                                <h4 style={{color: '#155724', marginBottom: '10px'}}>Rutas Planificadas con Éxito</h4>
                                <p>Se han creado {planResult.created_route_ids?.length || 0} rutas.</p>
                                <p>Tareas asignadas: {planResult.assigned_task_ids?.length || 0}</p>
                                {/* Agregar aquí detalles adicionales si se necesitan */}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Columna 2: Vehículos y Tareas */}
                <div className="planner-column resources-column" style={{flex: '2', minWidth: '400px', padding: '10px'}}>
                    <div className="card" style={{backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px', height: '100%'}}>
                        {/* Sección de Vehículos */}
                        <div className="vehicles-section" style={{marginBottom: '30px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #E0E0E0', paddingBottom: '10px'}}>
                                <h3 style={{margin: 0, color: '#2A5A8C'}}>Vehículos Disponibles</h3>
                                <span style={{color: '#666', fontSize: '0.9rem'}}>Seleccionados: {selectedVehicleIds.size}</span>
                            </div>
                            
                            {availableVehicles.length === 0 ? (
                                <p style={{color: '#666', fontStyle: 'italic'}}>No hay vehículos disponibles.</p>
                            ) : (
                                <div className="vehicle-cards" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '250px', overflowY: 'auto', padding: '5px'}}>
                                    {availableVehicles.map(vehicle => (
                                        <div 
                                            key={vehicle.id} 
                                            className={`vehicle-card ${selectedVehicleIds.has(vehicle.id) ? 'selected' : ''}`}
                                            style={{
                                                width: 'calc(50% - 10px)',
                                                minWidth: '200px',
                                                border: selectedVehicleIds.has(vehicle.id) ? '2px solid #4CAF50' : '1px solid #E0E0E0',
                                                borderRadius: '6px',
                                                padding: '10px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedVehicleIds.has(vehicle.id) ? '#f0fff4' : 'white',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleVehicleSelection(vehicle.id)}
                                        >
                                            <div style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                                    <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-1h18v1a2 2 0 0 1-2 2M5 17l-2 4M19 17l2 4M6 7h12l2 5H4z" />
                                                    <circle cx="7.5" cy="14.5" r="1.5" />
                                                    <circle cx="16.5" cy="14.5" r="1.5" />
                                                </svg>
                                                <strong>{vehicle.license_plate}</strong>
                                            </div>
                                            <div style={{fontSize: '0.9rem', color: '#666'}}>
                                                <span>{vehicle.type_name}</span>
                                            </div>
                                            <div style={{fontSize: '0.9rem', color: '#666', marginTop: '5px'}}>
                                                Capacidad: {vehicle.type ? `${vehicle.type.max_weight_kg} kg / ${vehicle.type.max_volume_m3} m³` : 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
            </div>

                        {/* Sección de Tareas */}
                        <div className="tasks-section">
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #E0E0E0', paddingBottom: '10px'}}>
                                <h3 style={{margin: 0, color: '#2A5A8C'}}>Tareas Pendientes</h3>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <span style={{color: '#666', fontSize: '0.9rem'}}>Seleccionadas: {selectedTaskIds.size}</span>
                    <button 
                        onClick={() => setShowAddTaskModal(true)} 
                                        className="btn btn-primary"
                                        style={{
                                            backgroundColor: '#2A5A8C',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Añadir Tarea
                    </button>
                                </div>
                </div>
                
                            {/* Modal para Añadir Tarea */}
                {showAddTaskModal && (
                                <div style={modalOverlayStyle}>
                                    <form 
                                        onSubmit={handleSubmitNewTask} 
                                        style={modalContentStyle}
                                    >
                                        <h3 style={modalTitleStyle}>Añadir Nueva Tarea</h3>

                                        {/* Grid Layout for Task Form */}
                                        <div style={modalGridStyle}>
                                            <div>
                                                <label htmlFor="task-description" style={baseLabelStyle}>Descripción</label>
                                                <input type="text" id="task-description" name="description" value={newTask.description} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} placeholder="Ej: Entrega Cliente X"/>
                                            </div>
                                             <div>
                                                <label htmlFor="task-type" style={baseLabelStyle}>Tipo*</label>
                                                <select id="task-type" name="type" value={newTask.type} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle}>
                                                    <option value="DELIVERY">Entrega</option>
                                                    <option value="PICKUP">Recogida</option>
                                                    <option value="SERVICE">Servicio</option>
                                                </select>
                                            </div>
                                             <div>
                                                <label htmlFor="task-origin" style={baseLabelStyle}>Origen*</label>
                                                <select id="task-origin" name="origin" value={newTask.origin} onChange={handleNewTaskChange} required disabled={isCreatingTask} style={baseInputStyle}>
                                                    <option value="">Seleccione origen</option>
                                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="task-destination" style={baseLabelStyle}>Destino*</label>
                                                <select id="task-destination" name="destination" value={newTask.destination} onChange={handleNewTaskChange} required disabled={isCreatingTask} style={baseInputStyle}>
                                                    <option value="">Seleccione destino</option>
                                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                                </select>
                                            </div>
                                           <div>
                                                <label htmlFor="task-weight" style={baseLabelStyle}>Peso (kg)</label>
                                                <input type="number" step="0.1" id="task-weight" name="weight_kg" value={newTask.weight_kg} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} />
                                            </div>
                                             <div>
                                                <label htmlFor="task-volume" style={baseLabelStyle}>Volumen (m³)</label>
                                                <input type="number" step="0.01" id="task-volume" name="volume_m3" value={newTask.volume_m3} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} />
                                            </div>
                                           <div>
                                                <label htmlFor="task-required-date" style={baseLabelStyle}>Fecha Requerida</label>
                                                <input type="date" id="task-required-date" name="required_date" value={newTask.required_date} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} />
                                            </div>
                                            <div>
                                                <label htmlFor="task-window-start" style={baseLabelStyle}>Ventana Inicio</label>
                                                <input type="time" id="task-window-start" name="window_start" value={newTask.window_start} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} />
                                            </div>
                                           <div>
                                                <label htmlFor="task-window-end" style={baseLabelStyle}>Ventana Fin</label>
                                                <input type="time" id="task-window-end" name="window_end" value={newTask.window_end} onChange={handleNewTaskChange} disabled={isCreatingTask} style={baseInputStyle} />
                                            </div>
                                        </div>
                                        
                                        {/* Error específico del modal */}
                                        {error && <p style={modalErrorStyle}>Error: {error}</p>}

                                        {/* Acciones del Modal */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => {setShowAddTaskModal(false); setError(null);}} // Cerrar modal y limpiar error
                                                style={{...secondaryButtonStyle, ...(isCreatingTask && {opacity: 0.7, cursor: 'not-allowed'})}}
                                                disabled={isCreatingTask}
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                style={{...primaryButtonStyle, ...(isCreatingTask && {opacity: 0.7, cursor: 'not-allowed'})}}
                                                disabled={isCreatingTask}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                    <polyline points="7 3 7 8 15 8"></polyline>
                                                </svg>
                                                {isCreatingTask ? 'Guardando...' : 'Guardar Tarea'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                
                            {pendingTasks.length === 0 ? (
                                <p style={{color: '#666', fontStyle: 'italic'}}>No hay tareas pendientes. Cree una nueva tarea usando el botón de arriba.</p>
                            ) : (
                                <div className="task-cards" style={{display: 'flex', flexWrap: 'wrap', gap: '15px', maxHeight: '400px', overflowY: 'auto', padding: '5px'}}>
                                    {pendingTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            className={`task-card ${selectedTaskIds.has(task.id) ? 'selected' : ''}`}
                                            style={{
                                                width: 'calc(50% - 15px)',
                                                minWidth: '250px',
                                                border: selectedTaskIds.has(task.id) ? '2px solid #4CAF50' : '1px solid #E0E0E0',
                                                borderRadius: '6px',
                                                padding: '15px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedTaskIds.has(task.id) ? '#f0fff4' : 'white',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleTaskSelection(task.id)}
                                        >
                                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                                <h4 style={{margin: 0, fontSize: '1rem', color: '#2A5A8C'}}>{task.description || `Tarea ${task.id}`}</h4>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    padding: '2px 8px',
                                                    backgroundColor: task.type === 'DELIVERY' ? '#cce5ff' : '#fff3cd',
                                                    color: task.type === 'DELIVERY' ? '#004085' : '#856404',
                                                    borderRadius: '10px'
                                                }}>
                                                    {task.type === 'DELIVERY' ? 'Entrega' : 'Recogida'}
                                                </span>
                                            </div>
                                            
                                            <div style={{fontSize: '0.9rem', marginBottom: '5px'}}>
                                                <div><strong>Origen:</strong> {task.origin_name}</div>
                                                <div><strong>Destino:</strong> {task.destination_name}</div>
                                            </div>
                                            
                                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px', color: '#666'}}>
                                                <div>Carga: {task.weight_kg} kg / {task.volume_m3} m³</div>
                                                <div>Fecha: {new Date(task.required_date).toLocaleDateString()}</div>
                                            </div>
                                            
                                            <div style={{fontSize: '0.8rem', color: '#666'}}>
                                                Ventana: {task.window_start || '00:00'} - {task.window_end || '23:59'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Columna 3: Acciones */}
                <div className="planner-column actions-column" style={{flex: '1', minWidth: '250px', padding: '10px', display: 'flex', flexDirection: 'column'}}>
                    <div className="card" style={{backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px', height: '100%'}}>
                        <h3 style={{marginBottom: '20px', color: '#2A5A8C', borderBottom: '2px solid #E0E0E0', paddingBottom: '10px'}}>Acciones</h3>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            <div style={{marginBottom: '10px'}}>
                                <h4 style={{fontSize: '1rem', marginBottom: '10px'}}>Resumen de Selección:</h4>
                                <ul style={{listStyleType: 'none', paddingLeft: '0', fontSize: '0.9rem'}}>
                                    <li style={{marginBottom: '8px'}}>
                                        <strong>Depósito:</strong> {selectedDepot ? depots.find(d => d.id === parseInt(selectedDepot))?.name || 'Ninguno' : 'Ninguno'}
                                    </li>
                                    <li style={{marginBottom: '8px'}}>
                                        <strong>Vehículos:</strong> {selectedVehicleIds.size} seleccionados
                                    </li>
                                    <li style={{marginBottom: '8px'}}>
                                        <strong>Tareas:</strong> {selectedTaskIds.size} seleccionadas
                                    </li>
                                    <li style={{marginBottom: '8px'}}>
                                        <strong>Fecha:</strong> {new Date(planDate).toLocaleDateString()}
                        </li>
                </ul>
            </div>

                <button 
                    onClick={handlePlanRoutes} 
                    disabled={isLoading || !selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0}
                                className="btn btn-success"
                                style={{
                                    backgroundColor: '#2A5A8C',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '12px 20px',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    marginTop: 'auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '10px',
                                    opacity: (isLoading || !selectedDepot || selectedVehicleIds.size === 0 || selectedTaskIds.size === 0) ? 0.6 : 1
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner-small" style={{
                                            width: '16px', 
                                            height: '16px', 
                                            border: '2px solid rgba(255, 255, 255, 0.3)', 
                                            borderRadius: '50%', 
                                            borderTop: '2px solid white',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Planificando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <path d="M8 14l2 2 4-4" />
                                        </svg>
                                        Planificar Rutas
                                    </>
                                )}
                </button>
            </div>
                    </div>
                </div>
            </div>
            
            {/* Estilos CSS para animaciones */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// --- Estilos para RoutePlanner (Mover a CSS si crece mucho) ---
const sectionStyle = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '20px'
};

const sectionTitleStyle = {
    marginTop: '0',
    marginBottom: '15px',
    color: '#2A5A8C',
    fontSize: '18px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
};

const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
};

const formGroupStyle = {
    marginBottom: '0' // No necesita margen inferior si usa gap del grid
};

const checkboxGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
};

const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease'
};

const taskListStyle = {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '10px'
};

const taskItemStyle = (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '5px',
    borderRadius: '4px',
    border: isSelected ? '1px solid #2A5A8C' : '1px solid transparent',
    backgroundColor: isSelected ? '#e3f2fd' : '#f9f9f9',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s'
});

const resultBoxStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '4px',
    padding: '15px',
    whiteSpace: 'pre-wrap', // Para envolver JSON largo
    wordBreak: 'break-all', // Para romper palabras largas
    maxHeight: '400px',
    overflowY: 'auto'
};

// Estilo específico para botones pequeños (ej: favoritos)
const smallSecondaryButtonStyle = {
    ...secondaryButtonStyle,
    padding: '5px 10px',
    fontSize: '12px',
    marginLeft: '0', // Resetear margen
    display: 'flex',
    width: 'fit-content' // Ajustar al contenido
};

// Estilos para el Modal
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200, // Asegurar que esté sobre otros elementos
    padding: '20px'
};

const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '700px', // Ancho del modal para tareas
    maxHeight: '90vh',
    overflowY: 'auto'
};

const modalTitleStyle = {
    marginTop: 0,
    marginBottom: '25px',
    color: '#2A5A8C',
    fontSize: '20px',
    fontWeight: '600'
};

const modalGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Ajustar columnas
    gap: '20px',
};

const modalErrorStyle = {
    color: '#D32F2F',
    backgroundColor: '#ffebee',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '15px',
    fontSize: '14px'
};

export default RoutePlanner;