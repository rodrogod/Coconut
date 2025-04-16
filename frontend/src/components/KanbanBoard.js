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
function SortableItem({ id, children }) {
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
        ...cardStyle // Apply base card style
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}
// Removed stray semicolon here

function KanbanBoard() {
    const [boardData, setBoardData] = useState(columns);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch route data from backend
    useEffect(() => {
        const fetchRoutes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch actual routes from the new API endpoint
                // TODO: Add filtering? e.g., only show routes for today/this week?
                const response = await axios.get('/api/routes/');
                const routes = response.data || [];
                console.log("Fetched routes for Kanban:", routes); // Log fetched data


                // Group routes by status
                const newBoardData = JSON.parse(JSON.stringify(columns)); // Deep copy to reset routes array
                routes.forEach(route => {
                    if (newBoardData[route.status]) {
                        newBoardData[route.status].routes.push(route);
                    } else {
                        console.warn(`Route ${route.id} has unknown status: ${route.status}`);
                        // Optionally create an 'UNKNOWN' column or add to a default one
                    }
                });
                setBoardData(newBoardData);

            } catch (err) {
                console.error("Error fetching routes for Kanban:", err);
                setError("Failed to load route data for the board.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoutes();
        // TODO: Implement polling or WebSocket updates later for real-time status changes
    }, []); // Fetch once on mount

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // TODO: Implement handleDragEnd handler
    function handleDragEnd(event) {
        const { active, over } = event;
        console.log("Drag End Event:", event);

        if (!over) return; // Dropped outside a droppable area

        // Find the item being dragged (active) and the container it was dropped over (over)
        const activeId = active.id; // ID of the route being dragged
        const overId = over.id; // ID of the column it was dropped onto

        // Check if dropping onto a column (not another item)
        const overColumnId = Object.keys(boardData).find(key => key === overId);

        if (activeId && overColumnId && active.data.current?.sortable.containerId !== overColumnId) {
            console.log(`Moving item ${activeId} to column ${overColumnId}`);
            // Find the route data
            let movedRoute = null;
            let sourceColumnId = null;
            for (const colId in boardData) {
                movedRoute = boardData[colId].routes.find(r => r.id === activeId);
                if (movedRoute) {
                    sourceColumnId = colId;
                    break;
                }
            }

            if (movedRoute && sourceColumnId) {
                // Optimistic UI Update
                setBoardData(prev => {
                    const newBoard = { ...prev };
                    // Remove from old column
                    newBoard[sourceColumnId] = {
                        ...newBoard[sourceColumnId],
                        routes: newBoard[sourceColumnId].routes.filter(r => r.id !== activeId)
                    };
                    // Add to new column
                    newBoard[overColumnId] = {
                        ...newBoard[overColumnId],
                        routes: [...newBoard[overColumnId].routes, { ...movedRoute, status: overColumnId }] // Update status locally
                    };
                    return newBoard;
                });

                // Call backend API to update route status
                updateRouteStatus(activeId, overColumnId);
            }
        } else {
             console.log("Drag ended, but not moved to a different valid column.");
             // Handle reordering within the same column if needed (using arrayMove)
             // This requires identifying if 'over' is an item or a column
        }
    }

    // Function to call the backend API to update status
    const updateRouteStatus = async (routeId, newStatus) => {
        try {
            const url = `/api/routes/${routeId}/update_status/`;
            const payload = { status: newStatus };
            await axios.patch(url, payload);
            console.log(`Successfully updated route ${routeId} status to ${newStatus} on backend.`);
            // Optionally show a success message or handle potential backend errors
            // that might require reverting the optimistic update.
        } catch (err) {
            console.error(`Error updating route ${routeId} status on backend:`, err);
            setError(`Failed to update route ${routeId} status. Please refresh.`); // Set board-level error
            // TODO: Implement logic to revert the optimistic UI update if the backend call fails.
            // This might involve refetching data or manually moving the card back.
            // Example: Revert state or refetch all data
            // fetchRoutes(); // Simplest way to revert is often to refetch
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
            <h3>Route Status Kanban</h3>
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
                                        <SortableItem key={route.id} id={route.id}>
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