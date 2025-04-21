import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    DndContext,
    closestCenter, // Or closestCorners, etc.
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy, // Use this for items within a column
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define the columns based on RouteStatus choices in the backend model
const columns = {
    PENDING: { id: 'PENDING', title: 'Pending Assignment', routes: [] },
    ASSIGNED: { id: 'ASSIGNED', title: 'Assigned', routes: [] },
    IN_TRANSIT: { id: 'IN_TRANSIT', title: 'In Transit', routes: [] },
    COMPLETED: { id: 'COMPLETED', title: 'Completed', routes: [] },
    DELAYED: { id: 'DELAYED', title: 'Delayed', routes: [] },
    CANCELLED: { id: 'CANCELLED', title: 'Cancelled', routes: [] },
};

// Basic styling (can be moved to CSS file later)
const boardStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '15px',
    padding: '15px',
    overflowX: 'auto', // Allow horizontal scrolling if needed
    border: '1px solid #ccc',
    marginTop: '20px',
};

const columnStyle = {
    minWidth: '250px',
    backgroundColor: '#f4f4f4',
    padding: '10px',
    borderRadius: '5px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
};

const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    padding: '10px',
    borderRadius: '3px',
    fontSize: '0.9em',
    cursor: 'grab', // Indicate draggable
    touchAction: 'none', // Recommended for pointer sensor
};

// --- Sortable Item Component ---
function SortableItem({ id, children, isSelected, onSelect }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging // Can use this to style the item while dragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Add styles for dragging state if desired
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto', // Ensure dragging item is on top
        ...cardStyle, // Apply base card style
        // Highlight selected items
        border: isSelected ? '2px solid #2196F3' : '1px solid #ddd',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
    };

    const handleClick = (e) => {
        // Prevent click from triggering drag
        if (!isDragging) {
            // Toggle selection
            onSelect(id);
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div onClick={handleClick} style={{ width: '100%', position: 'relative' }}>
                {isSelected && (
                    <div style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        right: '-8px', 
                        backgroundColor: '#2196F3', 
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                    }}>
                        ✓
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

function KanbanBoard({ routes, isLoading, error, onSelectRoutes }) {
    const [boardData, setBoardData] = useState(columns);
    const [selectedRoutes, setSelectedRoutes] = useState(new Set());

    // Efecto para procesar las rutas recibidas en las props
    useEffect(() => {
        // Solo procesar si no está cargando y no hay error general
        if (!isLoading && !error && routes) {
            console.log("Processing routes from props:", routes);
            const newBoardData = JSON.parse(JSON.stringify(columns)); // Copia profunda para resetear

            routes.forEach(route => {
                // Usar un mapeo o normalización si los status del backend no coinciden exactamente
                const statusKey = route.status?.toUpperCase(); // Normalizar
                if (newBoardData[statusKey]) {
                    newBoardData[statusKey].routes.push(route);
                } else {
                    console.warn(`Route ${route.id} has unknown or unmapped status: ${route.status}`);
                    // Podrías tener una columna 'Otros' o ignorarla
                }
            });
            setBoardData(newBoardData);
        } else if (!isLoading && !error && !routes) {
            // Si no está cargando, no hay error, pero no hay rutas, resetear tablero
            setBoardData(columns);
        }
        // Dependencia: las rutas recibidas como props
    }, [routes, isLoading, error]);

    // Efecto para notificar sobre cambios en las rutas seleccionadas
    useEffect(() => {
        if (onSelectRoutes) {
            onSelectRoutes(Array.from(selectedRoutes));
        }
    }, [selectedRoutes, onSelectRoutes]);

    const handleRouteSelection = (routeId) => {
        setSelectedRoutes(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(routeId)) {
                newSelection.delete(routeId);
            } else {
                newSelection.add(routeId);
            }
            return newSelection;
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // TODO: Revisar si active.data.current.sortable.containerId sigue siendo válido
    function handleDragEnd(event) {
        const { active, over } = event;
        console.log("Drag End Event:", event);

        if (!over) return; // Dropped outside a droppable area

        const activeId = active.id;
        // Determinar si 'over' es una columna (droppable container) o un item (sortable item)
        const overIsColumn = over.data.current?.type === 'column';
        const overColumnId = overIsColumn ? over.id : over.data.current?.sortable.containerId;

        const sourceColumnId = active.data.current?.sortable.containerId;

        if (activeId && overColumnId && sourceColumnId && sourceColumnId !== overColumnId) {
            console.log(`Moving item ${activeId} from ${sourceColumnId} to column ${overColumnId}`);
            
            let movedRoute = null;
            // Encontrar la ruta en el estado actual
            if (boardData[sourceColumnId]) {
                movedRoute = boardData[sourceColumnId].routes.find(r => r.id === activeId);
            }

            if (movedRoute) {
                // Optimistic UI Update
                setBoardData(prev => {
                    const newBoard = { ...prev };
                    // Remove from old column
                    if (newBoard[sourceColumnId]) {
                        newBoard[sourceColumnId] = {
                            ...newBoard[sourceColumnId],
                            routes: newBoard[sourceColumnId].routes.filter(r => r.id !== activeId)
                        };
                    }
                    // Add to new column
                    if (newBoard[overColumnId]) {
                        // Asegurarse de que no se duplique si la lógica falla
                        if (!newBoard[overColumnId].routes.some(r => r.id === activeId)) {
                            newBoard[overColumnId] = {
                                ...newBoard[overColumnId],
                                // Añadir al principio o final?
                                routes: [...newBoard[overColumnId].routes, { ...movedRoute, status: overColumnId }] 
                            };
                        }
                    }
                    return newBoard;
                });

                // Call backend API to update route status
                updateRouteStatus(activeId, overColumnId);
            } else {
                console.warn("Could not find the moved route in the state for optimistic update.");
            }
        } else if (activeId && sourceColumnId && overColumnId === sourceColumnId) {
            // Lógica para reordenar dentro de la misma columna (si es necesario)
            console.log(`Reordering item ${activeId} within column ${sourceColumnId}`);
            // Aquí se podría usar arrayMove si se implementa el drop sobre items
        } else {
            console.log("Drag ended, invalid drop target or no movement between columns.");
        }
    }

    // Function to call the backend API to update status
    const updateRouteStatus = async (routeId, newStatus) => {
        try {
            const url = `/api/routes/${routeId}/update_status/`;
            const payload = { status: newStatus };
            await axios.patch(url, payload);
            console.log(`Successfully updated route ${routeId} status to ${newStatus} on backend.`);
            // Considerar añadir un prop callback (e.g., onStatusUpdateError) para notificar a App.js del fallo
            // y permitir revertir o refetchear desde App.js
            // Por ahora, solo logueamos el error
            alert(`Failed to update route ${routeId} status. The board might be out of sync.`);
        } catch (err) {
            console.error(`Error updating route ${routeId} status on backend:`, err);
            // setError(`Failed to update route ${routeId} status. Please refresh.`); // Ya no manejamos error local
            // Podríamos llamar a un callback onStatusUpdateError(err) aquí
            // Por ahora, solo logueamos el error
            alert(`Failed to update route ${routeId} status. The board might be out of sync.`);
        }
    };

    if (isLoading) {
        return <p>Loading Kanban board...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error loading Kanban board: {error}</p>;
    }

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div style={boardStyle}>
                    {Object.values(boardData).map(column => (
                        <div key={column.id} style={columnStyle}>
                            <h4>{column.title} ({column.routes.length})</h4>
                            {/* Use SortableContext for the items within this column */}
                            <SortableContext
                                items={column.routes.map(r => r.id)}
                                strategy={verticalListSortingStrategy}
                                id={column.id} // ID for the droppable column
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '50px' }}>
                                    {column.routes.map(route => (
                                        <SortableItem 
                                            key={route.id} 
                                            id={route.id}
                                            isSelected={selectedRoutes.has(route.id)}
                                            onSelect={handleRouteSelection}
                                        >
                                            {/* Card Content */}
                                            <strong>Route {route.id} ({route.planned_date})</strong><br />
                                            Vehicle: {route.vehicle?.license_plate || 'N/A'}<br />
                                            Stops: {route.stops?.length || 0}<br />
                                            Dist: {route.total_distance_km?.toFixed(1) || 'N/A'} km<br />
                                            Dur: {route.total_duration_mins || 'N/A'} min
                                        </SortableItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    ))}
                </div>
            </DndContext>
        </div>
    );
}

export default KanbanBoard;