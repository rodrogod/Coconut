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
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Estado principal para la sidebar
  const [maintenanceTab, setMaintenanceTab] = useState('logs');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Efecto para verificar token en carga
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("Found token in localStorage, setting defaults.");
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setIsLoggedIn(true);
      setAuthToken(token);
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  const handleLoginSuccess = (token) => {
    console.log("Login successful in App component.");
    setIsLoggedIn(true);
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
  };

  const handleLogout = () => {
    console.log("Logging out.");
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setAuthToken(null);
    setProfileMenuOpen(false);
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
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <div style={{...styles.content, padding: '0'}}>
              <div style={{padding: '20px'}}>
                <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Dashboard</h2>
                <p style={{fontSize: '16px', color: '#666', margin: '5px 0 25px 0'}}>Overview of your route planning system</p>
                
                {/* KPI Cards Row */}
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px'}}>
                  {/* Active Routes Card */}
                  <div style={{
                    flex: '1', 
                    minWidth: '220px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: '#666'}}>Active Routes</h3>
                      <div style={{fontSize: '36px', fontWeight: '500', color: '#2A5A8C', marginBottom: '5px'}}>2</div>
                      <div style={{fontSize: '14px', color: '#4CAF50'}}>+1 from yesterday</div>
                    </div>
                    <div style={{
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(42, 90, 140, 0.1)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="6" x2="16" y2="22" />
                      </svg>
                    </div>
                  </div>

                  {/* Available Vehicles Card */}
                  <div style={{
                    flex: '1', 
                    minWidth: '220px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: '#666'}}>Available Vehicles</h3>
                      <div style={{fontSize: '36px', fontWeight: '500', color: '#2A5A8C', marginBottom: '5px'}}>1</div>
                      <div style={{fontSize: '14px', color: '#666'}}>Same as yesterday</div>
                    </div>
                    <div style={{
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(242, 116, 5, 0.1)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27405" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-1h18v1a2 2 0 0 1-2 2M5 17l-2 4M19 17l2 4M6 7h12l2 5H4z" />
                        <circle cx="7.5" cy="14.5" r="1.5" />
                        <circle cx="16.5" cy="14.5" r="1.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Pending Tasks Card */}
                  <div style={{
                    flex: '1', 
                    minWidth: '220px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: '#666'}}>Pending Tasks</h3>
                      <div style={{fontSize: '36px', fontWeight: '500', color: '#2A5A8C', marginBottom: '5px'}}>1</div>
                      <div style={{fontSize: '14px', color: '#D32F2F'}}>-2 from yesterday</div>
                    </div>
                    <div style={{
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="6" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  </div>

                  {/* Completed Today Card */}
                  <div style={{
                    flex: '1', 
                    minWidth: '220px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: '#666'}}>Completed Today</h3>
                      <div style={{fontSize: '36px', fontWeight: '500', color: '#2A5A8C', marginBottom: '5px'}}>0</div>
                      <div style={{fontSize: '14px', color: '#666'}}>Same as yesterday</div>
                    </div>
                    <div style={{
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
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

                {/* Recent Activity Section */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Recent Activity</h3>
                    <a href="#" style={{color: '#2A5A8C', textDecoration: 'none', fontSize: '14px'}}>View All</a>
                  </div>

                  {/* Activity Item 1 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '15px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div style={{flex: '1'}}>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '16px', fontWeight: '500', color: '#2A5A8C'}}>Route 3 created</h4>
                      <p style={{margin: '0', fontSize: '14px', color: '#666'}}>Route with 4 stops was created for vehicle 2312131321</p>
                    </div>
                    <div style={{fontSize: '14px', color: '#999', whiteSpace: 'nowrap'}}>2 hours ago</div>
                  </div>

                  {/* Activity Item 2 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '15px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div style={{flex: '1'}}>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '16px', fontWeight: '500', color: '#2A5A8C'}}>Task added</h4>
                      <p style={{margin: '0', fontSize: '14px', color: '#666'}}>New delivery task from AUTOMOTRIZ MONTECRISTO to Chuburna</p>
                    </div>
                    <div style={{fontSize: '14px', color: '#999', whiteSpace: 'nowrap'}}>3 hours ago</div>
                  </div>

                  {/* Activity Item 3 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '10px 0',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(42, 90, 140, 0.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '15px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    </div>
                    <div style={{flex: '1'}}>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '16px', fontWeight: '500', color: '#2A5A8C'}}>Vehicle maintenance</h4>
                      <p style={{margin: '0', fontSize: '14px', color: '#666'}}>Vehicle 2312131321 oil change scheduled</p>
                    </div>
                    <div style={{fontSize: '14px', color: '#999', whiteSpace: 'nowrap'}}>Yesterday</div>
                  </div>
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
                  <button style={{
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
                  <button style={{
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
            
            {/* Sección de rutas recientes */}
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
                <a href="#" style={{color: '#2A5A8C', textDecoration: 'none', fontSize: '14px'}}>Ver Todas</a>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                overflowX: 'auto',
                paddingBottom: '15px'
              }}>
                {/* Tarjeta de ruta reciente 1 */}
                <div style={{
                  minWidth: '280px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <h4 style={{margin: '0', color: '#2A5A8C', fontSize: '16px'}}>Ruta #103</h4>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>Activa</span>
                  </div>
                  <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>4 paradas · Vehículo #342</p>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '12px', color: '#666'}}>Creada: Hoy, 10:30 AM</span>
                    <button style={{
                      backgroundColor: 'transparent',
                      color: '#2A5A8C',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Tarjeta de ruta reciente 2 */}
                <div style={{
                  minWidth: '280px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <h4 style={{margin: '0', color: '#2A5A8C', fontSize: '16px'}}>Ruta #102</h4>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#F27405',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>En progreso</span>
                  </div>
                  <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>6 paradas · Vehículo #567</p>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '12px', color: '#666'}}>Creada: Ayer, 16:45 PM</span>
                    <button style={{
                      backgroundColor: 'transparent',
                      color: '#2A5A8C',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Tarjeta de ruta reciente 3 */}
                <div style={{
                  minWidth: '280px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <h4 style={{margin: '0', color: '#2A5A8C', fontSize: '16px'}}>Ruta #101</h4>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#9E9E9E',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>Completada</span>
                  </div>
                  <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>3 paradas · Vehículo #901</p>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '12px', color: '#666'}}>Creada: 2 días atrás</span>
                    <button style={{
                      backgroundColor: 'transparent',
                      color: '#2A5A8C',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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
                {/* Botón Ver Archivadas (se mantiene) */}
                <div style={{display: 'flex', gap: '10px'}}>
                  <button style={{
                    backgroundColor: '#f8f9fa',
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
                    Ver Archivadas
                  </button>
                  {/* Botón Nueva Ruta eliminado */}
                </div>
              </div>
              
              {/* Pestañas de filtro */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #2A5A8C',
                  color: '#2A5A8C',
                  fontWeight: '500',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Todas
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: '#666',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Pendientes
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: '#666',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  En Progreso
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: '#666',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Completadas
                </button>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
          <KanbanBoard />
              </div>
            </div>
            
            {/* Sección de estadísticas */}
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
              
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {/* Tarjeta de estadística 1 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Rutas Completadas</h4>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>24</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>+12%</span>
                  </div>
                </div>
                
                {/* Tarjeta de estadística 2 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Tiempo Promedio</h4>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>1.5h</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      color: '#FF9800',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>-5%</span>
                  </div>
                </div>
                
                {/* Tarjeta de estadística 3 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Satisfacción</h4>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>94%</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>+2%</span>
                  </div>
                </div>
              </div>
            </div>
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
                  <button style={{
                    backgroundColor: '#f8f9fa',
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Exportar
                  </button>
                  <button style={{
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
                    Añadir Vehículo
                  </button>
                </div>
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
                  <input type="text" placeholder="Buscar vehículo..." style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px'
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Todos los tipos</option>
                    <option value="sedan">Sedán</option>
                    <option value="suv">SUV</option>
                    <option value="pickup">Pickup</option>
                    <option value="camion">Camión</option>
                  </select>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Estado</option>
                    <option value="active">Activo</option>
                    <option value="maintenance">En mantenimiento</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              
              {/* Selector de vista */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <button style={{
                    border: 'none',
                    backgroundColor: '#2A5A8C',
                    color: 'white',
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button style={{
                    border: 'none',
                    backgroundColor: '#f8f9fa',
                    color: '#666',
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                <VehicleList />
              </div>
            </div>
            
            {/* Sección de resumen de flota */}
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
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Resumen de Flota</h3>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {/* Estadística 1 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Total de Vehículos</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-1h18v1a2 2 0 0 1-2 2M5 17l-2 4M19 17l2 4M6 7h12l2 5H4z" />
                      <circle cx="7.5" cy="14.5" r="1.5" />
                      <circle cx="16.5" cy="14.5" r="1.5" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>32</span>
                  </div>
                </div>
                
                {/* Estadística 2 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Disponibles</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>26</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(81%)</span>
                  </div>
                </div>
                
                {/* Estadística 3 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>En Mantenimiento</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>6</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(19%)</span>
                  </div>
                </div>
                
                {/* Estadística 4 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Eficiencia de Flota</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>87%</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>+3%</span>
                  </div>
                </div>
              </div>
              
              {/* Gráfico básico de uso por tipo */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>Distribución por Tipo</h4>
                <div style={{display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: '45%', backgroundColor: '#2A5A8C'}} title="Sedán: 45%"></div>
                  <div style={{width: '25%', backgroundColor: '#4CAF50'}} title="SUV: 25%"></div>
                  <div style={{width: '20%', backgroundColor: '#FF9800'}} title="Pickup: 20%"></div>
                  <div style={{width: '10%', backgroundColor: '#F27405'}} title="Camión: 10%"></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#2A5A8C', borderRadius: '2px'}}></div>
                    <span>Sedán (45%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#4CAF50', borderRadius: '2px'}}></div>
                    <span>SUV (25%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#FF9800', borderRadius: '2px'}}></div>
                    <span>Pickup (20%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#F27405', borderRadius: '2px'}}></div>
                    <span>Camión (10%)</span>
                  </div>
                </div>
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
                <div style={{display: 'flex', gap: '10px'}}>
                  <button style={{
                    backgroundColor: '#f8f9fa',
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
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Nuevo Tipo
                  </button>
                  <button style={{
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <path d="M8 14l2 2 4-4" />
                    </svg>
                    Programar Mantenimiento
                  </button>
                </div>
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
                  <input type="text" placeholder="Buscar mantenimiento..." style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px'
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Todos los vehículos</option>
                    <option value="car1">Vehículo ABC-123</option>
                    <option value="car2">Vehículo DEF-456</option>
                    <option value="car3">Vehículo GHI-789</option>
                  </select>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Estado</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
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
                {maintenanceTab === 'logs' ? <MaintenanceLogList /> : <MaintenanceTypeList />}
              </div>
            </div>
            
            {/* Sección de estadísticas de mantenimiento */}
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
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Resumen de Mantenimiento</h3>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  Últimos 30 días
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {/* Estadística 1 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Mantenimientos Totales</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>18</span>
                  </div>
                </div>
                
                {/* Estadística 2 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Completados</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>12</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(67%)</span>
                  </div>
                </div>
                
                {/* Estadística 3 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Pendientes</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>6</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(33%)</span>
                  </div>
                </div>
                
                {/* Estadística 4 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Tiempo Promedio</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>3.2h</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50',
                      padding: '3px 8px',
                      borderRadius: '20px'
                    }}>-15%</span>
                  </div>
                </div>
              </div>
              
              {/* Gráfico básico de tipos de mantenimiento */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>Distribución por Tipo</h4>
                <div style={{display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: '40%', backgroundColor: '#2A5A8C'}} title="Revisión periódica: 40%"></div>
                  <div style={{width: '25%', backgroundColor: '#4CAF50'}} title="Cambio de aceite: 25%"></div>
                  <div style={{width: '20%', backgroundColor: '#FF9800'}} title="Frenos: 20%"></div>
                  <div style={{width: '15%', backgroundColor: '#F27405'}} title="Otros: 15%"></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#2A5A8C', borderRadius: '2px'}}></div>
                    <span>Revisión (40%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#4CAF50', borderRadius: '2px'}}></div>
                    <span>Aceite (25%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#FF9800', borderRadius: '2px'}}></div>
                    <span>Frenos (20%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#F27405', borderRadius: '2px'}}></div>
                    <span>Otros (15%)</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'locations':
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
                  <h2 style={{fontSize: '24px', margin: '0', fontWeight: '500', color: '#2A5A8C'}}>Gestión de Ubicaciones</h2>
                  <p style={{fontSize: '16px', color: '#666', margin: '5px 0 0 0'}}>Administra las ubicaciones para planificación de rutas</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button style={{
                    backgroundColor: '#f8f9fa',
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Exportar CSV
                  </button>
                  <button style={{
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
                    Nueva Ubicación
                  </button>
                </div>
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
                  <input type="text" placeholder="Buscar ubicación..." style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px'
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Todos los tipos</option>
                    <option value="cedis">CEDIS</option>
                    <option value="cliente">Cliente</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                  <select style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <option value="">Todos los estados</option>
                    <option value="yucatan">Yucatán</option>
                    <option value="campeche">Campeche</option>
                    <option value="quintana_roo">Quintana Roo</option>
                  </select>
                </div>
              </div>
              
              {/* Pestañas */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #2A5A8C',
                  color: '#2A5A8C',
                  fontWeight: '500',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Lista
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: '#666',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Mapa
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: '#666',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Importar
                </button>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '20px',
                border: '1px solid #e9ecef'
              }}>
                <LocationImport />
              </div>
            </div>
            
            {/* Sección de estadísticas de ubicaciones */}
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
                <h3 style={{margin: '0', fontSize: '18px', fontWeight: '500', color: '#2A5A8C'}}>Resumen de Ubicaciones</h3>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                {/* Estadística 1 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Total de Ubicaciones</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>124</span>
                  </div>
                </div>
                
                {/* Estadística 2 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>CEDIS</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>5</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(4%)</span>
                  </div>
                </div>
                
                {/* Estadística 3 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Clientes</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>98</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(79%)</span>
                  </div>
                </div>
                
                {/* Estadística 4 */}
                <div style={{
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>Proveedores</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#2A5A8C'}}>21</span>
                    <span style={{fontSize: '14px', color: '#666'}}>(17%)</span>
                  </div>
                </div>
              </div>
              
              {/* Mapa simplificado */}
              <div style={{
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                height: '250px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A5A8C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '15px', opacity: '0.5'}}>
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <h4 style={{margin: '0 0 5px 0', fontSize: '16px', color: '#2A5A8C'}}>Vista de mapa disponible</h4>
                <p style={{margin: '0', fontSize: '14px', color: '#666', textAlign: 'center'}}>Visualiza todas tus ubicaciones en el mapa<br />para una mejor planificación de rutas</p>
                <button style={{
                  backgroundColor: '#2A5A8C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  marginTop: '15px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Ver en Mapa
                </button>
              </div>
              
              {/* Distribución geográfica */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>Distribución por Estado</h4>
                <div style={{display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: '60%', backgroundColor: '#2A5A8C'}} title="Yucatán: 60%"></div>
                  <div style={{width: '25%', backgroundColor: '#4CAF50'}} title="Quintana Roo: 25%"></div>
                  <div style={{width: '15%', backgroundColor: '#FF9800'}} title="Campeche: 15%"></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#2A5A8C', borderRadius: '2px'}}></div>
                    <span>Yucatán (60%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#4CAF50', borderRadius: '2px'}}></div>
                    <span>Quintana Roo (25%)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px'}}>
                    <div style={{width: '10px', height: '10px', backgroundColor: '#FF9800', borderRadius: '2px'}}></div>
                    <span>Campeche (15%)</span>
                  </div>
                </div>
              </div>
            </div>
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

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {isLoggedIn ? (
        <>
          <div
            style={{
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
            }}
          >
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
          
          {/* Contenido principal */}
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
                    width: '200px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontWeight: '500', color: '#2A5A8C' }}>Usuario Actual</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>usuario@ejemplo.com</div>
                    </div>
                    <div onClick={handleLogout} style={{
                      padding: '12px 15px',
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
