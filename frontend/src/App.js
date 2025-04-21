import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// Componentes
import RoutePlanner from './components/RoutePlanner';
import LocationImport from './components/LocationImport';
import MapDisplay from './components/MapDisplay';
import KanbanBoard from './components/KanbanBoard';
import Login from './components/Login';
import MaintenanceTypeList from './components/MaintenanceTypeList';
import MaintenanceLogList from './components/MaintenanceLogList';
import VehicleList from './components/VehicleList';
import LocationManager from './components/LocationManager';

// Iconos SVG simples en blanco
const ICONS = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  routes: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M5 17H3v-4M2 6h4v4h12v4M17 17h5v-4M15 6h5v4" />
    </svg>
  ),
  map: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  kanban: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7v7M12 7v4M16 7v10" />
    </svg>
  ),
  vehicles: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-1h18v1a2 2 0 0 1-2 2M5 17l-2 4M19 17l2 4M6 7h12l2 5H4z" />
      <circle cx="7.5" cy="14.5" r="1.5" />
      <circle cx="16.5" cy="14.5" r="1.5" />
    </svg>
  ),
  maintenance: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  locations: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  add: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  favorite: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  use: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  notification: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M5.3 20.2A10 10 0 0 0 12 22a10 10 0 0 0 6.7-1.8" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
};

function App() {
  // Estados principales
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [maintenanceTab, setMaintenanceTab] = useState('logs');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ email: '', username: '', role: '' });

  // Estados específicos del Dashboard
  const [dashboardData, setDashboardData] = useState({
    activeRoutes: null,
    availableVehicles: null,
    pendingTasks: null,
    completedToday: null, // O simplemente completed total
    recentActivity: []
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Estados específicos de Planificación de Rutas
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [isRoutePlanningLoading, setIsRoutePlanningLoading] = useState(false);
  const [routePlanningError, setRoutePlanningError] = useState(null);

  // Estados específicos de Estado de Rutas (Kanban)
  const [kanbanRoutes, setKanbanRoutes] = useState([]);
  const [isKanbanLoading, setIsKanbanLoading] = useState(false);
  const [kanbanError, setKanbanError] = useState(null);
  const [kanbanFilter, setKanbanFilter] = useState('ALL'); // Opciones: 'ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'
  const [selectedKanbanRoutes, setSelectedKanbanRoutes] = useState([]);
  const [showArchivedRoutes, setShowArchivedRoutes] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Estados para estadísticas del Kanban
  const [kanbanStats, setKanbanStats] = useState({
      completed: { value: null, change: null },
      avgTime: { value: null, change: null }, // En horas?
      satisfaction: { value: null, change: null } // O puntualidad
  });
  const [isKanbanStatsLoading, setIsKanbanStatsLoading] = useState(false);
  const [kanbanStatsError, setKanbanStatsError] = useState(null);

  // Estados específicos de Gestión de Vehículos
  const [vehicles, setVehicles] = useState([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState(null);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(''); // Ej: ID del tipo o vacío para todos
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState(''); // Ej: 'AVAILABLE', 'MAINTENANCE', 'INACTIVE' o vacío
  // Estado para debounce del search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Estado para tipos de vehículo (para el filtro)
  const [vehicleTypesList, setVehicleTypesList] = useState([]);
  // Estado para la carga de la exportación
  const [isExporting, setIsExporting] = useState(false);

  // Estados para mantenimiento
  const [maintenanceSearchTerm, setMaintenanceSearchTerm] = useState('');
  const [maintenanceVehicleFilter, setMaintenanceVehicleFilter] = useState('');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState('');
  const [debouncedMaintenanceSearchTerm, setDebouncedMaintenanceSearchTerm] = useState('');

  // Add state for maintenance stats
  const [maintenanceStats, setMaintenanceStats] = useState({
    period: '30d',
    total_logs: { count: 0, change_percentage: 0 },
    status_breakdown: {
      completed: { count: 0, percentage: 0 },
      in_progress: { count: 0, percentage: 0 },
      scheduled: { count: 0, percentage: 0 }
    },
    average_cost: { value: 0, change_percentage: 0 },
    average_time: { hours: 0, change_percentage: 0 },
    type_distribution: []
  });
  const [loadingMaintenanceStats, setLoadingMaintenanceStats] = useState(false);

  // --- Efectos ---
  // Efecto para verificar token en carga y configurar Axios
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token && isMounted) {
        console.log("Found token in localStorage, setting defaults.");
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        setIsLoggedIn(true);
        setAuthToken(token);
        
        try {
          // Obtener datos básicos del usuario
          console.log("Fetching user data...");
          const response = await axios.get('/api/auth/user/');
          console.log("User data fetched:", response.data);
          
          if (response.data && response.data.pk && isMounted) {
            // Obtener el perfil del usuario con su rol
            console.log(`Fetching user profile for user ID: ${response.data.pk}`);
            const profileResponse = await axios.get(`/api/user-profiles/${response.data.pk}/`);
            console.log("User profile fetched:", profileResponse.data);
            
            if (isMounted) {
              // Actualizar el estado con los datos del usuario y perfil
              setCurrentUser({
                email: response.data.email || '',
                username: response.data.username || '',
                role: profileResponse.data?.role || ''
              });
            }
          }
        } catch (error) {
          console.error("Error initializing user data:", error);
        }
      } else if (isMounted) {
        delete axios.defaults.headers.common['Authorization'];
        setIsLoggedIn(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Función para buscar datos del Dashboard
  const fetchDashboardData = async () => {
    if (!isLoggedIn) return; // No buscar si no está logueado
    setIsDashboardLoading(true);
    setDashboardError(null);
    try {
      // Eliminamos activityRes y modificamos routesRes
      const [routesRes, vehiclesRes, tasksRes] = await Promise.all([
        // Intentamos obtener todas las rutas sin filtro por ahora
        axios.get('/api/routes/'), 
        axios.get('/api/vehicles/?is_available=true'),
        axios.get('/api/tasks/?status=PENDING'),
        // Eliminamos la llamada a /api/activity-log/ que daba 404
        // axios.get('/api/activity-log/?limit=5') 
      ]);

      // Ajustar según la estructura real de tu API.
      setDashboardData({
        // Mostramos el total de rutas por ahora, necesita ajuste para "activas"
        activeRoutes: routesRes.data?.count ?? routesRes.data?.length ?? 0, 
        availableVehicles: vehiclesRes.data?.count ?? vehiclesRes.data?.length ?? 0,
        pendingTasks: tasksRes.data?.count ?? tasksRes.data?.length ?? 0,
        completedToday: 0, // Placeholder
        recentActivity: [] // Eliminamos la data de actividad
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Simplificamos el mensaje de error
      let errorMsg = "Failed to load dashboard data.";
      if (err.response) {
        // Si hay respuesta del servidor, incluir status
        errorMsg += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        // Si la solicitud se hizo pero no hubo respuesta
        errorMsg += " (No response from server)";
      } else {
        // Otro error
        errorMsg += ` (${err.message})`;
      }
      setDashboardError(errorMsg);
      
      setDashboardData({
        activeRoutes: null, availableVehicles: null, pendingTasks: null,
        completedToday: null, recentActivity: []
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Efecto para buscar datos del dashboard cuando la sección está activa
  useEffect(() => {
    if (activeSection === 'dashboard' && isLoggedIn) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isLoggedIn]); // Dependencias: sección activa y estado de login

  // Función para buscar datos de Planificación de Rutas (Rutas Recientes)
  const fetchRoutePlanningData = async () => {
    if (!isLoggedIn) return;
    setIsRoutePlanningLoading(true);
    setRoutePlanningError(null);
    try {
      // Obtener las últimas 5 rutas, ordenadas por creación descendente
      const routesRes = await axios.get('/api/routes/?limit=5&ordering=-created_at');
      setRecentRoutes(routesRes.data?.results || routesRes.data || []); // Ajustar según API
    } catch (err) {
      console.error("Error fetching recent routes:", err);
      let errorMsg = "Failed to load recent routes.";
      if (err.response) {
        errorMsg += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        errorMsg += " (No response from server)";
      } else {
        errorMsg += ` (${err.message})`;
      }
      setRoutePlanningError(errorMsg);
      setRecentRoutes([]); // Limpiar en caso de error
    } finally {
      setIsRoutePlanningLoading(false);
    }
  };

  // Efecto para buscar datos de Planificación de Rutas cuando la sección está activa
  useEffect(() => {
    if (activeSection === 'routes' && isLoggedIn) {
      fetchRoutePlanningData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isLoggedIn]);

  // Función para buscar datos de Kanban
  const fetchKanbanData = async (filter = 'ALL') => {
    if (!isLoggedIn) return;
    setIsKanbanLoading(true);
    setKanbanError(null);
    let url = '/api/routes/';
    const params = new URLSearchParams();
    if (filter !== 'ALL') {
      // Ajusta el nombre del parámetro y los valores si es necesario
      params.append('status', filter); 
    }
    
    // Añadir filtro para mostrar rutas archivadas o no archivadas
    params.append('is_archived', showArchivedRoutes ? 'true' : 'false');
    
    // Podríamos añadir ordenamiento si es relevante, ej: params.append('ordering', '-updated_at');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      const routesRes = await axios.get(url);
      setKanbanRoutes(routesRes.data?.results || routesRes.data || []);
    } catch (err) {
      console.error(`Error fetching kanban routes (filter: ${filter}):`, err);
      let errorMsg = "Failed to load routes for Kanban board.";
      if (err.response) {
        errorMsg += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        errorMsg += " (No response from server)";
      } else {
        errorMsg += ` (${err.message})`;
      }
      setKanbanError(errorMsg);
      setKanbanRoutes([]); // Limpiar en caso de error
    } finally {
      setIsKanbanLoading(false);
    }
  };

  // Función para buscar estadísticas del Kanban
  const fetchKanbanStats = async (period = '7d') => {
    if (!isLoggedIn) return;
    setIsKanbanStatsLoading(true);
    setKanbanStatsError(null);
    try {
      // Asumiendo un endpoint único de resumen. Ajustar si son individuales.
      const statsRes = await axios.get(`/api/stats/routes/summary/?period=${period}`);
      const data = statsRes.data;
      
      // Mapear la respuesta a la estructura del estado
      // Ajustar los nombres de campo según la respuesta real de la API
      setKanbanStats({
          completed: { 
              value: data?.completed_count?.value ?? null,
              change: data?.completed_count?.change_percent ?? null 
          },
          avgTime: { 
              value: data?.average_duration_hours?.value ?? null, // Asumiendo horas
              change: data?.average_duration_hours?.change_percent ?? null 
          },
          satisfaction: { // Usando on_time como ejemplo
              value: data?.on_time_percentage?.value ?? null,
              change: data?.on_time_percentage?.change_percent ?? null
          }
      });

    } catch (err) {
      console.error(`Error fetching kanban stats (period: ${period}):`, err);
      let errorMsg = "Failed to load Kanban statistics.";
      if (err.response) {
        errorMsg += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        errorMsg += " (No response from server)";
      } else {
        errorMsg += ` (${err.message})`;
      }
      setKanbanStatsError(errorMsg);
      // Resetear stats en caso de error
      setKanbanStats({
          completed: { value: null, change: null },
          avgTime: { value: null, change: null },
          satisfaction: { value: null, change: null }
      });
    } finally {
      setIsKanbanStatsLoading(false);
    }
  };

  // Efecto para buscar datos de Kanban (rutas y stats) cuando la sección o filtro cambian
  useEffect(() => {
    if (activeSection === 'kanban' && isLoggedIn) {
      fetchKanbanData(kanbanFilter);
      fetchKanbanStats('7d'); // Cargar stats para 7 días por defecto
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isLoggedIn, kanbanFilter, showArchivedRoutes]);

  // Función para buscar vehículos con filtros y búsqueda
  const fetchVehicles = async (search = '', type = '', status = '') => {
    if (!isLoggedIn) return;
    setIsVehiclesLoading(true);
    setVehiclesError(null);
    let url = '/api/vehicles/';
    const params = new URLSearchParams();
    
    // Aplicar búsqueda si existe
    if (search) {
      params.append('search', search);
    }
    
    // Aplicar filtro por tipo de vehículo si existe
    if (type) {
      params.append('type', type);
    }
    
    // Aplicar filtro por estado (disponibilidad)
    if (status) {
      if (status === 'AVAILABLE') {
        params.append('is_available', 'true');
      } else if (status === 'INACTIVE') {
        params.append('is_available', 'false');
      }
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('Fetching vehicles with URL:', url);

    try {
      const vehiclesRes = await axios.get(url);
      console.log('Received vehicles data from API:', vehiclesRes.data);
      setVehicles(vehiclesRes.data?.results || vehiclesRes.data || []);
    } catch (err) {
      console.error(`Error fetching vehicles:`, err);
      let errorMsg = "Failed to load vehicles.";
      if (err.response) {
        errorMsg += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        errorMsg += " (No response from server)";
      } else {
        errorMsg += ` (${err.message})`;
      }
      setVehiclesError(errorMsg);
      setVehicles([]); // Limpiar en caso de error
    } finally {
      setIsVehiclesLoading(false);
    }
  };
  
  // Efecto para debounce de la búsqueda de vehículos
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(vehicleSearchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [vehicleSearchTerm]);

  // Efecto para buscar vehículos y tipos
  useEffect(() => {
    if (activeSection === 'vehicles' && isLoggedIn) {
      console.log('useEffect triggered for vehicles fetch:', { 
        debouncedSearchTerm, 
        vehicleTypeFilter, 
        vehicleStatusFilter 
      });
      fetchVehicles(debouncedSearchTerm, vehicleTypeFilter, vehicleStatusFilter);
      // Cargar tipos de vehículo si la lista está vacía
      if (vehicleTypesList.length === 0) {
        fetchVehicleTypesList();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isLoggedIn, debouncedSearchTerm, vehicleTypeFilter, vehicleStatusFilter]);

  // Función para buscar tipos de vehículos
  const fetchVehicleTypesList = async () => {
    try {
      const typesRes = await axios.get('/api/vehicle-types/');
      console.log('Vehicle types received:', typesRes.data);
      setVehicleTypesList(typesRes.data?.results || typesRes.data || []);
    } catch (err) {
      console.error("Error fetching vehicle types for filter:", err);
      setVehicleTypesList([]); // Asegurar que sea un array vacío en caso de error
    }
  };

  // Función para obtener los datos del usuario actual
  const fetchCurrentUser = async () => {
    try {
      // Obtener datos básicos del usuario
      console.log("Fetching user data...");
      const response = await axios.get('/api/auth/user/');
      console.log("User data fetched:", response.data);
      
      if (!response.data || !response.data.pk) {
        console.error("Invalid user data response:", response.data);
        return;
      }
      
      // Obtener el perfil del usuario con su rol
      console.log(`Fetching user profile for user ID: ${response.data.pk}`);
      const profileResponse = await axios.get(`/api/user-profiles/${response.data.pk}/`);
      console.log("User profile fetched:", profileResponse.data);
      
      // Actualizar el estado con los datos del usuario y perfil
      setCurrentUser({
        email: response.data.email || '',
        username: response.data.username || '',
        role: profileResponse.data?.role || ''
      });
      
      console.log("Current user state updated:", {
        email: response.data.email,
        username: response.data.username,
        role: profileResponse.data?.role
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status:", error.response.status);
      }
    }
  };

  const handleLoginSuccess = (token) => {
    console.log("Login successful in App component.");
    setIsLoggedIn(true);
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    fetchCurrentUser();
  };

  const handleLogout = () => {
    console.log("Logging out.");
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setAuthToken(null);
    setProfileMenuOpen(false);
    setCurrentUser({ email: '', username: '', role: '' });
  };

  // Función corregida para controlar la sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Estilos inline para componentes principales
  const styles = {
    app: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    },
    sidebar: {
      width: sidebarOpen ? '250px' : '60px',
      backgroundColor: '#2A5A8C',
      color: 'white',
      transition: 'width 0.3s ease',
      overflow: 'hidden'
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
      display: 'flex',
      justifyContent: sidebarOpen ? 'space-between' : 'center',
      alignItems: 'center'
    },
    toggleButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '30px',
      height: '30px',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease'
    },
    toggleButtonHover: {
      backgroundColor: 'rgba(255,255,255,0.1)'
    },
    navItem: {
      padding: '15px 20px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    activeNavItem: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderLeft: '4px solid #F27405'
    },
    navIcon: {
      marginRight: !sidebarOpen ? '0' : '15px', // Ajuste según sidebarOpen
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '24px',
      height: '24px',
      color: 'white'
    },
    navText: {
      display: !sidebarOpen ? 'none' : 'block', // Ajuste según sidebarOpen
      whiteSpace: 'nowrap'
    },
    userSection: {
      marginTop: 'auto',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '15px 20px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    },
    main: {
      flex: 1,
      backgroundColor: '#F5F5F5',
      padding: '20px',
      overflowY: 'auto',
      paddingTop: '70px' // Espacio para la barra superior
    },
    topBar: {
      position: 'fixed',
      top: 0,
      right: 0,
      left: sidebarOpen ? '250px' : '60px',
      height: '60px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 20px',
      zIndex: 1000,
      transition: 'left 0.3s ease'
    },
    topBarButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      position: 'relative',
      transition: 'background-color 0.2s ease',
      color: '#2A5A8C'
    },
    notificationBadge: {
      position: 'absolute',
      top: '0',
      right: '0',
      backgroundColor: '#F27405',
      color: 'white',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '0 0 15px 0',
      borderBottom: '2px solid #E0E0E0'
    },
    title: {
      color: '#212121',
      margin: 0,
      fontWeight: 500,
      fontSize: '1.8rem'
    },
    content: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    tabContainer: {
      marginBottom: '20px'
    },
    tabList: {
      display: 'flex',
      borderBottom: '1px solid #E0E0E0',
      marginBottom: '20px'
    },
    tab: {
      padding: '10px 20px',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      transition: 'all 0.2s'
    },
    activeTab: {
      borderBottom: '2px solid #2A5A8C',
      color: '#2A5A8C',
      fontWeight: 'bold'
    }
  };

  // Componente de iconos con hover para la barra superior
  const TopBarIcon = ({ icon, onClick, badge }) => {
    const [isHovered, setIsHovered] = useState(false);

  return (
      <button
        style={{
          ...styles.iconButton,
          backgroundColor: isHovered ? 'rgba(0,0,0,0.05)' : 'transparent'
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {icon}
        {badge && badge > 0 && (
          <span style={styles.notificationBadge}>{badge > 9 ? '9+' : badge}</span>
        )}
      </button>
    );
  };

  // Componente para las pestañas de mantenimiento
  const MaintenanceTabs = () => (
    <div style={styles.tabContainer}>
      <div style={styles.tabList}>
        <div 
          style={{...styles.tab, ...(maintenanceTab === 'logs' ? styles.activeTab : {})}}
          onClick={() => setMaintenanceTab('logs')}
        >
          Registro de Mantenimiento
        </div>
        <div 
          style={{...styles.tab, ...(maintenanceTab === 'types' ? styles.activeTab : {})}}
          onClick={() => setMaintenanceTab('types')}
        >
          Tipos de Mantenimiento
        </div>
      </div>
    </div>
  );

  // Renderizado condicional del contenido principal
  const renderMainContent = () => {
    if (!isLoggedIn) {
      // Muestra Login si no está autenticado (ya no está dentro del switch)
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (activeSection) {
      case 'dashboard':
        if (isDashboardLoading) {
          return <p>Loading Dashboard...</p>; // Indicador de carga
        }
        if (dashboardError) {
          return <p style={{ color: 'red' }}>{dashboardError}</p>; // Mensaje de error
        }
        return (
          <>
            <div style={{...styles.content, padding: '0'}}>
              <div style={{padding: '20px'}}>
                <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Dashboard</h2>
                <p style={{fontSize: '16px', color: '#666', margin: '5px 0 25px 0'}}>Overview of your route planning system</p>
                
                {/* KPI Cards Row - Usando datos del estado */}
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px'}}>
                  {/* Active Routes Card */}
                  <div style={kpiCardStyle}>
                    <div>
                      <h3 style={kpiCardTitleStyle}>Active Routes</h3>
                      <div style={kpiCardValueStyle}>{dashboardData.activeRoutes ?? 'N/A'}</div>
                      {/* <div style={{fontSize: '14px', color: '#4CAF50'}}>+1 from yesterday</div> // Comparación eliminada por ahora */}
                    </div>
                    <div style={kpiCardIconContainerStyle('rgba(42, 90, 140, 0.1)')}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                         <line x1="8" y1="2" x2="8" y2="18" />
                         <line x1="16" y1="6" x2="16" y2="22" />
                      </svg>
                    </div>
                  </div>

                  {/* Available Vehicles Card */}
                  <div style={kpiCardStyle}>
                    <div>
                      <h3 style={kpiCardTitleStyle}>Available Vehicles</h3>
                      <div style={kpiCardValueStyle}>{dashboardData.availableVehicles ?? 'N/A'}</div>
                    </div>
                     <div style={kpiCardIconContainerStyle('rgba(242, 116, 5, 0.1)')}>
                       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27405" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-1h18v1a2 2 0 0 1-2 2M5 17l-2 4M19 17l2 4M6 7h12l2 5H4z" />
                         <circle cx="7.5" cy="14.5" r="1.5" />
                         <circle cx="16.5" cy="14.5" r="1.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Pending Tasks Card */}
                  <div style={kpiCardStyle}>
                    <div>
                      <h3 style={kpiCardTitleStyle}>Pending Tasks</h3>
                      <div style={kpiCardValueStyle}>{dashboardData.pendingTasks ?? 'N/A'}</div>
                    </div>
                     <div style={kpiCardIconContainerStyle('rgba(255, 193, 7, 0.1)')}>
                       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <circle cx="12" cy="12" r="10" />
                         <line x1="12" y1="6" x2="12" y2="12" />
                         <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  </div>

                  {/* Completed Today Card (usando placeholder) */}
                  <div style={kpiCardStyle}>
                    <div>
                      <h3 style={kpiCardTitleStyle}>Completed Routes</h3>
                      <div style={kpiCardValueStyle}>{dashboardData.completedToday ?? 'N/A'}</div>
                      <div style={{fontSize: '14px', color: '#666'}}>(Needs specific logic)</div>
                    </div>
                     <div style={kpiCardIconContainerStyle('rgba(76, 175, 80, 0.1)')}>
                       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                         <line x1="16" y1="2" x2="16" y2="6" />
                         <line x1="8" y1="2" x2="8" y2="6" />
                         <line x1="3" y1="10" x2="21" y2="10" />
                         <polyline points="9 16 11 18 15 14" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Section - Usando datos del estado */}
                <div style={recentActivityContainerStyle}>
                  <div style={recentActivityHeaderStyle}>
                    <h3 style={recentActivityTitleStyle}>Recent Activity</h3>
                    <a href="#" style={recentActivityLinkStyle}>View All</a> { /* Podría enlazar a una página de log */ }
                  </div>

                  {dashboardData.recentActivity.length === 0 ? (
                    <p>No recent activity.</p>
                  ) : (
                    dashboardData.recentActivity.map((activity, index) => (
                      <div key={index} style={activityItemStyle(index === dashboardData.recentActivity.length - 1)}>
                        <div style={activityIconContainerStyle}>
                          {/* Icono basado en tipo de actividad (simplificado) */}
                          {getActivityIcon(activity.type)} 
                        </div>
                        <div style={{flex: '1'}}>
                          <h4 style={activityTitleStyle}>{getActivityTitle(activity)}</h4>
                          <p style={activityDescriptionStyle}>{activity.description}</p>
                        </div>
                        <div style={activityTimestampStyle}>
                          {formatRelativeTime(activity.timestamp)} 
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 'routes':
        return (
          <>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              margin: '0 0 20px 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Planificación de Rutas</h2>
                  <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Crea y gestiona tus rutas de manera eficiente</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  {/* Botón Nueva Ruta con placeholder */}
                  <button 
                    onClick={() => console.log('Click en Nueva Ruta')} // Placeholder
                    style={{
                      backgroundColor: '#2A5A8C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nueva Ruta
                  </button>
                  {/* Botón Ver Plantillas con placeholder */}
                  <button 
                    onClick={() => console.log('Click en Ver Plantillas')} // Placeholder
                    style={{
                      backgroundColor: 'white',
                      color: '#2A5A8C',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease'
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    Ver Plantillas
                  </button>
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                <RoutePlanner />
              </div>
            </div>
            
            {/* Sección de rutas recientes - CON DATOS REALES */}
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Rutas Recientes</h3>
                {/* TODO: Añadir link funcional si es necesario */}
                <a href="#" style={{color: '#2A5A8C', textDecoration: 'none', fontSize: '14px'}}>Ver Todas</a>
              </div>
              
              {/* Indicador de carga y error */}
              {isRoutePlanningLoading && <p>Cargando rutas recientes...</p>}
              {routePlanningError && <p style={{color: 'red'}}>{routePlanningError}</p>}
              
              {!isRoutePlanningLoading && !routePlanningError && (
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  overflowX: 'auto', 
                  paddingBottom: '15px' 
                }}>
                  {recentRoutes.length === 0 ? (
                    <p>No hay rutas recientes.</p>
                  ) : (
                    recentRoutes.map(route => {
                      const { text: statusText, style: statusStyle } = formatRouteStatus(route.status);
                      const stopCount = route.tasks_count || route.tasks?.length || 0; // Ajustar según API
                      const vehicleIdentifier = route.vehicle?.license_plate || route.vehicle_id || 'N/A'; // Ajustar

                      return (
                        <div key={route.id} style={{ /* ... (estilos tarjeta ruta) */ }}>
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <h4 style={{margin: '0', color: '#2A5A8C', fontSize: '16px'}}>Ruta #{route.id}</h4>
                            <span style={{ /* ... (estilos base badge) */ ...statusStyle }}>
                              {statusText}
                            </span>
                          </div>
                          <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>
                            {stopCount} parada{stopCount !== 1 ? 's' : ''} · Vehículo {vehicleIdentifier}
                          </p>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{fontSize: '12px', color: '#666'}}>
                              Creada: {formatRelativeTime(route.created_at)}
                            </span>
                            <button 
                              onClick={() => console.log(`Ver detalles ruta ${route.id}`)} // Placeholder
                              style={{ /* ... (estilos botón ver detalles) */ }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        );
      case 'kanban':
        return (
          <>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              margin: '0 0 20px 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Estado de Rutas</h2>
                  <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Visualiza y gestiona el progreso de tus rutas</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  {!showArchivedRoutes && selectedKanbanRoutes.length > 0 && (
                    <button 
                      onClick={archiveSelectedRoutes}
                      disabled={isArchiving}
                      style={{
                        backgroundColor: '#2A5A8C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: isArchiving ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      {isArchiving ? 'Archivando...' : 'Archivar Seleccionadas'}
                    </button>
                  )}
                  <button 
                    onClick={() => setShowArchivedRoutes(!showArchivedRoutes)}
                    style={{
                      backgroundColor: showArchivedRoutes ? '#e0e0e0' : '#f8f9fa',
                      color: showArchivedRoutes ? '#333' : '#2A5A8C',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    {showArchivedRoutes ? 'Ver Activas' : 'Ver Archivadas'}
                  </button>
                </div>
              </div>
              
              {/* Pestañas de filtro - CON FUNCIONALIDAD */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <button 
                  onClick={() => setKanbanFilter('ALL')}
                  style={kanbanFilterButtonStyle('ALL', kanbanFilter)}
                >
                  Todas
                </button>
              </div>
              
              {selectedKanbanRoutes.length > 0 && !showArchivedRoutes && (
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '10px 15px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#2196F3' }}>
                    {selectedKanbanRoutes.length} ruta(s) seleccionada(s)
                  </span>
                  <button
                    onClick={() => setSelectedKanbanRoutes([])}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#2196F3',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    Limpiar selección
                  </button>
                </div>
              )}
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                {/* Pasar datos al componente KanbanBoard */}
                <KanbanBoard 
                  routes={kanbanRoutes} 
                  isLoading={isKanbanLoading} 
                  error={kanbanError}
                  onSelectRoutes={setSelectedKanbanRoutes}
                />
              </div>
            </div>
            
            {/* Sección de estadísticas - COMENTADA HASTA TENER ENDPOINT API */}
            {/* 
            <div style={{ ... (estilos contenedor estadísticas) }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Resumen de Actividad</h3>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px', 
                  padding: '5px 10px', 
                  fontSize: '14px', 
                  color: '#666'
                }}>
                  Últimos 7 días
                </div>
              </div>

              {isKanbanStatsLoading && <p>Cargando estadísticas...</p>}
              {kanbanStatsError && <p style={{color: 'red'}}>{kanbanStatsError}</p>}
              
              {!isKanbanStatsLoading && !kanbanStatsError && (
                <div style={{ ... (estilos grid/flex para tarjetas stats) }}>
                  <div style={statCardStyle}>
                    <h4 style={statCardTitleStyle}>Rutas Completadas</h4>
                    <div style={statCardValueContainerStyle}>
                      <span style={statCardValueStyle}>
                        {kanbanStats.completed.value ?? 'N/A'}
                      </span>
                      {renderStatChange(kanbanStats.completed.change)}
                    </div>
                  </div>
                  
                  <div style={statCardStyle}>
                    <h4 style={statCardTitleStyle}>Tiempo Promedio</h4>
                    <div style={statCardValueContainerStyle}>
                      <span style={statCardValueStyle}>
                        {kanbanStats.avgTime.value !== null ? `${kanbanStats.avgTime.value.toFixed(1)}h` : 'N/A'}
                      </span>
                       {renderStatChange(kanbanStats.avgTime.change)}
                    </div>
                  </div>
                  
                  <div style={statCardStyle}>
                    <h4 style={statCardTitleStyle}>Satisfacción</h4>
                    <div style={statCardValueContainerStyle}>
                      <span style={statCardValueStyle}>
                        {kanbanStats.satisfaction.value !== null ? `${kanbanStats.satisfaction.value.toFixed(0)}%` : 'N/A'}
                      </span>
                      {renderStatChange(kanbanStats.satisfaction.change)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            */}
          </>
        );
      case 'map':
        return (
          <>
            <div style={styles.header}>
              <h2 style={styles.title}>Mapa de Ubicaciones y Rutas</h2>
            </div>
            <div style={styles.content}>
              <MapDisplay />
            </div>
          </>
        );
      case 'vehicles':
        return (
          <>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              margin: '0 0 20px 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Gestión de Vehículos</h2>
                  <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Administra tu flota y monitorea su disponibilidad</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={exportVehiclesToCSV} 
                    disabled={isExporting}
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#2A5A8C',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      opacity: isExporting ? 0.7 : 1
                    }}>
                    {isExporting ? (
                      <span>Exportando...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Exportar
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Barra de búsqueda y filtros - CONECTADOS AL ESTADO */}
              <div style={{
                display: 'flex',
                marginBottom: '20px',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {/* Search Input */}
                <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                  }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Buscar vehículo (matrícula, marca...)" 
                    value={vehicleSearchTerm}
                    onChange={(e) => setVehicleSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        fontSize: '14px'
                    }}
                  />
                </div>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Type Filter - DINÁMICO */}
                  <select 
                    value={vehicleTypeFilter}
                    onChange={(e) => setVehicleTypeFilter(e.target.value)}
                    style={{
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #e0e0e0', 
                      backgroundColor: 'white', 
                      fontSize: '14px', 
                      cursor: 'pointer',
                      minWidth: '150px'
                    }}
                    disabled={isVehiclesLoading || vehicleTypesList.length === 0}
                  >
                    <option value="">Todos los tipos</option>
                    {vehicleTypesList.map(vt => (
                        <option key={vt.id} value={vt.id}>
                            {vt.name}
                        </option>
                    ))}
                  </select>
                  {/* Status Filter */}
                  <select 
                    value={vehicleStatusFilter}
                    onChange={(e) => setVehicleStatusFilter(e.target.value)}
                    style={{
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #e0e0e0', 
                      backgroundColor: 'white', 
                      fontSize: '14px', 
                      cursor: 'pointer',
                      minWidth: '150px'
                    }}
                    disabled={isVehiclesLoading}
                  >
                    <option value="">Todos los estados</option>
                    <option value="AVAILABLE">Disponible</option> 
                    <option value="INACTIVE">No Disponible</option> 
                  </select>
                </div>
              </div>
              
              {/* Lista de vehículos - PASANDO PROPS */}
              <div style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                padding: '15px',
                border: '1px solid #e9ecef'
              }}>
                <VehicleList 
                  vehicles={vehicles}
                  isLoading={isVehiclesLoading}
                  error={vehiclesError}
                  onDataChange={() => fetchVehicles(debouncedSearchTerm, vehicleTypeFilter, vehicleStatusFilter)} // Pasar la función de fetch
                />
              </div>
            </div>
          </>
        );
      case 'maintenance':
        return (
          <>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              margin: '0 0 20px 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Mantenimiento</h2>
                  <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Gestiona el mantenimiento preventivo y correctivo de tus vehículos</p>
                </div>
                {/* Botón "Nuevo Tipo" eliminado */}
              </div>
              
              {/* Barra de búsqueda y filtros */}
              <div style={{
                display: 'flex',
                marginBottom: '20px',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  flex: '1',
                  minWidth: '250px',
                  position: 'relative'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Buscar mantenimiento..." 
                    value={maintenanceSearchTerm}
                    onChange={(e) => setMaintenanceSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      fontSize: '14px'
                    }} 
                  />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <select 
                    value={maintenanceVehicleFilter}
                    onChange={(e) => setMaintenanceVehicleFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">Todos los vehículos</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.license_plate}</option>
                    ))}
                  </select>
                  <select 
                    value={maintenanceStatusFilter}
                    onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="SCHEDULED">Programado</option>
                    <option value="IN_PROGRESS">En progreso</option>
                    <option value="COMPLETED">Completado</option>
                  </select>
                </div>
              </div>
              
              {/* Pestañas mejoradas */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <button 
                  onClick={() => setMaintenanceTab('logs')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: maintenanceTab === 'logs' ? '2px solid #2A5A8C' : '2px solid transparent',
                    color: maintenanceTab === 'logs' ? '#2A5A8C' : '#666',
                    fontWeight: maintenanceTab === 'logs' ? '500' : 'normal',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Registro de Mantenimiento
                </button>
                <button 
                  onClick={() => setMaintenanceTab('types')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: maintenanceTab === 'types' ? '2px solid #2A5A8C' : '2px solid transparent',
                    color: maintenanceTab === 'types' ? '#2A5A8C' : '#666',
                    fontWeight: maintenanceTab === 'types' ? '500' : 'normal',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Tipos de Mantenimiento
                </button>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                {maintenanceTab === 'logs' ? 
                  <MaintenanceLogList 
                    searchTerm={debouncedMaintenanceSearchTerm}
                    vehicleFilter={maintenanceVehicleFilter}
                    statusFilter={maintenanceStatusFilter}
                  /> : 
                  <MaintenanceTypeList />
                }
              </div>
            </div>
            
            {/* Sección de estadísticas de mantenimiento */}
            <div style={{
              padding: '25px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              marginTop: '20px',
              position: 'relative'
            }}>
              {loadingMaintenanceStats && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      border: '3px solid #f3f3f3',
                      borderTop: '3px solid #2A5A8C',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ color: '#555', fontSize: '14px' }}>Cargando datos...</span>
                  </div>
                </div>
              )}
              
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '600', color: '#2A5A8C'}}>Resumen de Mantenimiento</h3>
                <select 
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#555',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  value={maintenanceStats.period}
                  onChange={(e) => fetchMaintenanceStats(e.target.value)}
                >
                  <option value="30d">Últimos 30 días</option>
                  <option value="3m">Últimos 3 meses</option>
                  <option value="6m">Últimos 6 meses</option>
                  <option value="1y">Último año</option>
                </select>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                {/* Estadística 1 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500'}}>
                        Mantenimientos Totales
                      </h4>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                        <span style={{fontSize: '28px', fontWeight: '600', color: '#2A5A8C'}}>{maintenanceStats.total_logs.count}</span>
                        {maintenanceStats.total_logs.change_percentage !== 0 && (
                          <span style={{
                            fontSize: '13px',
                            backgroundColor: maintenanceStats.total_logs.change_percentage > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            color: maintenanceStats.total_logs.change_percentage > 0 ? '#4CAF50' : '#F44336',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontWeight: '500'
                          }}>
                            {maintenanceStats.total_logs.change_percentage > 0 ? '+' : ''}{maintenanceStats.total_logs.change_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                  </div>
                  <p style={{margin: '15px 0 0 0', fontSize: '13px', color: '#666'}}>
                    Total de mantenimientos registrados
                  </p>
                </div>
                
                {/* Estadística 2 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500'}}>
                        Completados
                      </h4>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                        <span style={{fontSize: '28px', fontWeight: '600', color: '#2A5A8C'}}>{maintenanceStats.status_breakdown.completed.count}</span>
                        <span style={{fontSize: '14px', color: '#666', fontWeight: '500'}}>
                          ({maintenanceStats.status_breakdown.completed.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  </div>
                  <div style={{marginTop: '15px', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px'}}>
                    <div style={{
                      width: `${maintenanceStats.status_breakdown.completed.percentage}%`, 
                      height: '100%', 
                      backgroundColor: '#4CAF50', 
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
                
                {/* Estadística 3 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500'}}>
                        En Progreso
                      </h4>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                        <span style={{fontSize: '28px', fontWeight: '600', color: '#2A5A8C'}}>{maintenanceStats.status_breakdown.in_progress.count}</span>
                        <span style={{fontSize: '14px', color: '#666', fontWeight: '500'}}>
                          ({maintenanceStats.status_breakdown.in_progress.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                  </div>
                  <div style={{marginTop: '15px', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px'}}>
                    <div style={{
                      width: `${maintenanceStats.status_breakdown.in_progress.percentage}%`, 
                      height: '100%', 
                      backgroundColor: '#2196F3', 
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
                
                {/* Estadística 4 */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500'}}>
                        Pendientes
                      </h4>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                        <span style={{fontSize: '28px', fontWeight: '600', color: '#2A5A8C'}}>{maintenanceStats.status_breakdown.scheduled.count}</span>
                        <span style={{fontSize: '14px', color: '#666', fontWeight: '500'}}>
                          ({maintenanceStats.status_breakdown.scheduled.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  </div>
                  <div style={{marginTop: '15px', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px'}}>
                    <div style={{
                      width: `${maintenanceStats.status_breakdown.scheduled.percentage}%`, 
                      height: '100%', 
                      backgroundColor: '#FF9800', 
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
              </div>
              
              {/* Gráfico de tipos de mantenimiento */}
              <div style={{
                marginTop: '25px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h4 style={{margin: '0', fontSize: '16px', color: '#555', fontWeight: '500'}}>Distribución por Tipo</h4>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#2A5A8C',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Ver detalle
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
                
                {maintenanceStats.type_distribution.length > 0 ? (
                  <>
                    <div style={{display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden'}}>
                      {maintenanceStats.type_distribution.map((item, index) => {
                        // Array of colors for the bars
                        const colors = ['#2A5A8C', '#4CAF50', '#2196F3', '#FF9800', '#F27405', '#E91E63', '#9C27B0'];
                        return (
                          <div 
                            key={index}
                            style={{
                              width: `${item.percentage}%`, 
                              backgroundColor: colors[index % colors.length],
                            }} 
                            title={`${item.maintenance_type__name}: ${item.percentage}%`}
                          ></div>
                        );
                      })}
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px',
                      marginTop: '15px'
                    }}>
                      {maintenanceStats.type_distribution.map((item, index) => {
                        const colors = ['#2A5A8C', '#4CAF50', '#2196F3', '#FF9800', '#F27405', '#E91E63', '#9C27B0'];
                        return (
                          <div key={index} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <div style={{
                              width: '12px', 
                              height: '12px', 
                              backgroundColor: colors[index % colors.length], 
                              borderRadius: '3px'
                            }}></div>
                            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px'}}>
                              <span style={{color: '#555', fontWeight: '500'}}>
                                {item.maintenance_type__name}
                              </span>
                              <span style={{color: '#777'}}>{item.percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p style={{textAlign: 'center', color: '#666', fontSize: '14px', margin: '20px 0'}}>
                    No hay datos de tipos de mantenimiento disponibles
                  </p>
                )}
              </div>
              
              {/* Indicadores de costo y tiempo */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginTop: '25px'
              }}>
                {/* Costo promedio */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{margin: '0', fontSize: '15px', color: '#555', fontWeight: '500'}}>Costo Promedio</h4>
                    <div style={{
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                    <span style={{fontSize: '24px', fontWeight: '600', color: '#2A5A8C'}}>
                      ${maintenanceStats.average_cost.value.toFixed(2)}
                    </span>
                    {maintenanceStats.average_cost.change_percentage !== 0 && (
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: maintenanceStats.average_cost.change_percentage < 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        color: maintenanceStats.average_cost.change_percentage < 0 ? '#4CAF50' : '#F44336',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontWeight: '500'
                      }}>
                        {maintenanceStats.average_cost.change_percentage > 0 ? '+' : ''}
                        {maintenanceStats.average_cost.change_percentage}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Tiempo promedio */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{margin: '0', fontSize: '15px', color: '#555', fontWeight: '500'}}>Tiempo Promedio</h4>
                    <div style={{
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: '5px'}}>
                    <span style={{fontSize: '24px', fontWeight: '600', color: '#2A5A8C'}}>
                      {maintenanceStats.average_time.hours.toFixed(1)} horas
                    </span>
                    {maintenanceStats.average_time.change_percentage !== 0 && (
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: maintenanceStats.average_time.change_percentage < 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        color: maintenanceStats.average_time.change_percentage < 0 ? '#4CAF50' : '#F44336',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontWeight: '500'
                      }}>
                        {maintenanceStats.average_time.change_percentage > 0 ? '+' : ''}
                        {maintenanceStats.average_time.change_percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'locations':
        return (
          <>
            <LocationManager />
          </>
        );
      default:
        return <div>Selecciona una sección del menú lateral</div>;
    }
  };

  // NavItem component for sidebar
  const NavItem = ({ icon, text, section, active, onClick, sidebarOpen }) => { // Asegurar que sidebarOpen se pasa y usa
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div
        style={{
          padding: '10px 15px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: active ? 'rgba(255,255,255,0.1)' : (isHovered ? 'rgba(255,255,255,0.05)' : 'transparent'),
          borderLeft: active ? '4px solid #F27405' : '4px solid transparent',
          justifyContent: sidebarOpen ? 'flex-start' : 'center'
        }}
        onClick={() => onClick(section)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={!sidebarOpen ? text : ''} // Tooltip cuando está colapsado
      >
        <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
          {icon}
        </div>
        {sidebarOpen && (
          <span style={{
            marginLeft: '12px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.2s',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {text}
          </span>
        )}
      </div>
    );
  };

  // Manejadores para los iconos de la barra superior
  const handleNotificationClick = () => {
    alert('Notificaciones: ' + unreadNotifications + ' sin leer');
    setUnreadNotifications(0);
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // Estilos para KPI Cards (pueden moverse a `styles` object si se prefiere)
  const kpiCardStyle = {
    flex: '1', 
    minWidth: '220px', 
    backgroundColor: 'white', 
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  const kpiCardTitleStyle = { margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: '#666' };
  const kpiCardValueStyle = { fontSize: '36px', fontWeight: '500', color: '#2A5A8C', marginBottom: '5px' };
  const kpiCardIconContainerStyle = (bgColor) => ({
    width: '60px', 
    height: '60px', 
    borderRadius: '50%', 
    backgroundColor: bgColor, 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center'
  });

  // Estilos para Recent Activity
  const recentActivityContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };
  const recentActivityHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  };
  const recentActivityTitleStyle = { margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C' };
  const recentActivityLinkStyle = { color: '#2A5A8C', textDecoration: 'none', fontSize: '14px' };
  const activityItemStyle = (isLast) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: isLast ? '0' : '20px',
    paddingBottom: isLast ? '0' : '20px',
    borderBottom: isLast ? 'none' : '1px solid #f0f0f0'
  });
  const activityIconContainerStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(42, 90, 140, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '15px'
  };
  const activityTitleStyle = { margin: '0 0 5px 0', fontSize: '16px', fontWeight: '500', color: '#2A5A8C' };
  const activityDescriptionStyle = { margin: '0', fontSize: '14px', color: '#666' };
  const activityTimestampStyle = { fontSize: '14px', color: '#999', whiteSpace: 'nowrap', marginLeft: '15px' };

  // Helper para obtener icono según tipo de actividad (ejemplo simple)
  const getActivityIcon = (type) => {
    // Asume que `type` es una cadena como 'ROUTE_CREATED', 'TASK_ADDED', etc.
    let icon = ICONS.dashboard; // Icono por defecto
    if (type?.includes('ROUTE')) icon = ICONS.routes;
    if (type?.includes('TASK')) icon = ICONS.add; // O algún icono de tarea
    if (type?.includes('VEHICLE')) icon = ICONS.vehicles;
    if (type?.includes('MAINTENANCE')) icon = ICONS.maintenance;
    // Añadir más mapeos según sea necesario
    return React.cloneElement(icon, { width: 20, height: 20 }); // Clonar para ajustar tamaño
  };

  // Helper para obtener título (ejemplo)
  const getActivityTitle = (activity) => {
    // Podrías tener títulos predefinidos o extraerlos del activity.description
    if (activity.type === 'ROUTE_CREATED') return 'New Route Created';
    if (activity.type === 'TASK_ADDED') return 'Task Added';
    // ... otros tipos
    return activity.title || 'Activity'; // Fallback
  };

  // Helper para formatear tiempo relativo (ejemplo muy básico)
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString(); // O formato de fecha normal
  };

  // Helper para formatear estado de ruta
  const formatRouteStatus = (status) => {
    let text = status; // Texto por defecto
    let style = {
      fontSize: '12px',
      color: 'white',
      padding: '3px 8px',
      borderRadius: '20px',
      backgroundColor: '#9E9E9E' // Gris por defecto
    };

    // Normalizar status a mayúsculas para comparación robusta
    const normalizedStatus = status?.toUpperCase();

    if (normalizedStatus === 'PENDING') {
      text = 'Pendiente';
      style.backgroundColor = '#FFC107'; // Amarillo/Naranja
    } else if (normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'ACTIVE') {
      text = 'En Progreso';
      style.backgroundColor = '#2196F3'; // Azul
    } else if (normalizedStatus === 'COMPLETED') {
      text = 'Completada';
      style.backgroundColor = '#4CAF50'; // Verde
    } else if (normalizedStatus === 'CANCELLED') {
      text = 'Cancelada';
      style.backgroundColor = '#F44336'; // Rojo
    } 
    // Añadir más estados si es necesario (ej: PLANNED, FAILED)

    return { text, style };
  };

  // Estilo para los botones de filtro del Kanban
  const kanbanFilterButtonStyle = (buttonFilter, activeFilter) => ({
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: buttonFilter === activeFilter ? '2px solid #2A5A8C' : '2px solid transparent',
    color: buttonFilter === activeFilter ? '#2A5A8C' : '#666',
    fontWeight: buttonFilter === activeFilter ? '500' : 'normal',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });

  // Helper para renderizar el cambio porcentual en las stats
  const renderStatChange = (change) => {
    if (change === null || change === undefined) return null;
    
    const isPositive = change >= 0;
    const color = isPositive ? '#4CAF50' : '#FF9800'; // Verde para positivo, Naranja para negativo
    const sign = isPositive ? '+' : '';

    return (
      <span style={{
        fontSize: '12px',
        backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
        color: color,
        padding: '3px 8px',
        borderRadius: '20px',
        fontWeight: '500'
      }}>
        {sign}{change.toFixed(0)}%
      </span>
    );
  };

  // Estilos para las tarjetas de estadísticas (adaptar si es necesario)
  const statCardStyle = {
      flex: '1',
      minWidth: '200px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      padding: '15px',
      border: '1px solid #e9ecef'
  };
  const statCardTitleStyle = {
      margin: '0 0 10px 0',
      fontSize: '14px',
      color: '#666'
  };
  const statCardValueContainerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
  };
   const statCardValueStyle = {
      fontSize: '24px',
      fontWeight: '500',
      color: '#2A5A8C'
  };

  // Exportar vehículos a CSV
  const exportVehiclesToCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      // Obtener todos los vehículos sin aplicar filtros
      const res = await axios.get('/api/vehicles/');
      const vehiclesToExport = res.data?.results || res.data || [];
      
      if (vehiclesToExport.length === 0) {
        alert('No hay vehículos para exportar');
        return;
      }
      
      // Crear cabeceras CSV y filas desde los datos
      const headers = [
        'ID', 'Tipo', 'Matrícula', 'Marca', 'Modelo', 'VIN', 
        'Odómetro (km)', 'Vencimiento de Seguro', 'Disponible'
      ];
      
      const rows = vehiclesToExport.map(v => [
        v.id, 
        v.type_name || 'N/A', 
        v.license_plate, 
        v.make || 'N/A',
        v.model || 'N/A',
        v.vin || 'N/A',
        v.current_odometer_km || 0,
        v.insurance_expiry || 'N/A',
        v.is_available ? 'Sí' : 'No'
      ]);
      
      // Convertir a CSV y descargar
      let csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vehiculos_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al exportar vehículos:', err);
      alert('Error al exportar vehículos');
    } finally {
      setIsExporting(false);
    }
  };

  // Function to fetch maintenance statistics
  const fetchMaintenanceStats = async (period = '30d') => {
    setLoadingMaintenanceStats(true);
    try {
      const response = await axios.get(`/api/maintenance/stats/?period=${period}`);
      setMaintenanceStats(response.data);
    } catch (error) {
      console.error('Error fetching maintenance statistics:', error);
    } finally {
      setLoadingMaintenanceStats(false);
    }
  };

  // Add maintenance stats to the maintenance useEffect
  useEffect(() => {
    if (activeSection === 'maintenance') {
      fetchMaintenanceStats('30d');
    }
  }, [activeSection]);

  // Función para archivar rutas seleccionadas
  const archiveSelectedRoutes = async () => {
    if (selectedKanbanRoutes.length === 0) {
      alert('Por favor, seleccione al menos una ruta para archivar.');
      return;
    }

    setIsArchiving(true);
    try {
      // Podemos usar Promise.all para hacer múltiples peticiones en paralelo
      await Promise.all(
        selectedKanbanRoutes.map(routeId => 
          axios.patch(`/api/routes/${routeId}/`, { is_archived: true })
        )
      );
      
      // Éxito, actualizar UI
      alert(`${selectedKanbanRoutes.length} ruta(s) archivada(s) correctamente.`);
      // Limpiar selección
      setSelectedKanbanRoutes([]);
      // Refrescar los datos
      fetchKanbanData(kanbanFilter);
    } catch (err) {
      console.error('Error archiving routes:', err);
      alert('Error al archivar las rutas. Por favor, inténtelo de nuevo.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Efecto para debounce de la búsqueda de mantenimiento
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaintenanceSearchTerm(maintenanceSearchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [maintenanceSearchTerm]);

  // Efecto para aplicar filtros de mantenimiento cuando cambian
  useEffect(() => {
    if (activeSection === 'maintenance' && isLoggedIn && maintenanceTab === 'logs') {
      // El componente MaintenanceLogList manejará la búsqueda y filtros internamente
      console.log('Maintenance search/filters updated:', {
        search: debouncedMaintenanceSearchTerm,
        vehicle: maintenanceVehicleFilter,
        status: maintenanceStatusFilter
      });
    }
  }, [activeSection, isLoggedIn, maintenanceTab, debouncedMaintenanceSearchTerm, maintenanceVehicleFilter, maintenanceStatusFilter]);

  // --- Renderizado Principal ---
  return (
    <div className="App" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {isLoggedIn ? (
        <>
          {/* Sidebar */}
          <div style={{
            width: sidebarOpen ? '250px' : '70px',
            height: '100vh',
            backgroundColor: '#1a3c61',
            color: 'white',
            transition: 'width 0.3s ease',
            position: 'fixed',
            overflowY: 'auto',
            overflowX: 'hidden',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1000
          }}>
            <div style={{ 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: sidebarOpen ? 'space-between' : 'center' 
            }}>
              {sidebarOpen && (
                <img
                  src="/logo-white.png"
                  alt="Coconut Logo"
                  style={{
                    height: '30px',
                    transition: 'opacity 0.3s ease',
                  }}
                />
              )}
              <button
                onClick={toggleSidebar}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '5px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d={sidebarOpen ? "M6 10H14M3 5H17M3 15H17" : "M3 5H17M3 10H17M3 15H17"}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {/* Lista de navegación */}
            <nav style={{ marginTop: '20px' }}>
              <NavItem
                icon={ICONS.dashboard}
                text="Dashboard"
                section="dashboard"
                active={activeSection === 'dashboard'} // Usar activeSection
                onClick={setActiveSection} // Pasar la función directamente
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                icon={ICONS.routes} // Asumiendo que tienes ICONS.routePlanner
                text="Planeación de Rutas"
                section="routes" // Usar el ID correcto de la sección
                active={activeSection === 'routes'}
                onClick={setActiveSection}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                icon={ICONS.kanban}
                text="Estado de Rutas (Kanban)"
                section="kanban"
                active={activeSection === 'kanban'}
                onClick={setActiveSection}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                icon={ICONS.vehicles}
                text="Gestión de Vehículos"
                section="vehicles"
                active={activeSection === 'vehicles'}
                onClick={setActiveSection}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                icon={ICONS.maintenance}
                text="Mantenimiento"
                section="maintenance"
                active={activeSection === 'maintenance'}
                onClick={setActiveSection}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                icon={ICONS.locations}
                text="Gestión de Ubicaciones"
                section="locations"
                active={activeSection === 'locations'}
                onClick={setActiveSection}
                sidebarOpen={sidebarOpen}
              />
            </nav>
            
            {/* Restaurando la opción de Cerrar Sesión en el sidebar */}
            <div style={{
              padding: sidebarOpen ? '10px 15px' : '10px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '30px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '20px'
            }} 
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}>
              <div style={{
                minWidth: '24px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              {sidebarOpen && (
                <span style={{
                  marginLeft: '12px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  opacity: sidebarOpen ? 1 : 0,
                  transition: 'opacity 0.2s',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  Cerrar Sesión
                </span>
              )}
            </div>
          </div>
          
          {/* Contenido principal (Top Bar + Sección activa) */}
          <div style={{
            marginLeft: sidebarOpen ? '250px' : '70px',
            width: `calc(100% - ${sidebarOpen ? '250px' : '70px'})`,
            transition: 'margin-left 0.3s ease, width 0.3s ease',
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
          
          {/* Top bar */}
          <div style={{
            position: 'sticky',
            top: 0,
            height: '60px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 20px',
            zIndex: 100,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <TopBarIcon 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                } 
                onClick={handleNotificationClick}
                badge={unreadNotifications > 0 ? (unreadNotifications > 9 ? '9+' : unreadNotifications) : null}
              />
              <div style={{ position: 'relative' }}>
                <TopBarIcon 
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  } 
                  onClick={handleProfileClick}
                />
                
                {/* Menú desplegable de perfil */}
                {profileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '45px',
                    right: '0',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    width: '260px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontWeight: '500', color: '#2A5A8C', fontSize: '16px' }}>
                        {currentUser.username ? currentUser.username : 'Usuario sin autenticar'}
                      </div>
                      <div style={{ fontSize: '15px', color: '#666', marginTop: '8px' }}>
                        {currentUser.email ? currentUser.email : 'No hay usuario autenticado'}
                      </div>
                      {currentUser.role && (
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '6px', 
                          backgroundColor: '#f0f7ff', padding: '3px 8px', borderRadius: '10px', 
                          display: 'inline-block' }}>
                          {currentUser.role}
                        </div>
                      )}
                    </div>
                    <div onClick={handleLogout} style={{
                      padding: '15px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      color: '#333',
                      fontSize: '14px',
                      ':hover': { backgroundColor: '#f5f5f5' }
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Cerrar sesión
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Contenido de la sección */}
          <div style={{
            padding: '20px',
            overflow: 'auto',
            height: 'calc(100vh - 60px)',
            backgroundColor: '#f8f9fa'
          }}>
            {renderMainContent()}
          </div>
        </div>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;

