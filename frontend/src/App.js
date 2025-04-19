import React, { useState, useEffect } from 'react'; // Add useState, useEffect
// Removed axios import
import './App.css';
import RoutePlanner from './components/RoutePlanner';
import LocationImport from './components/LocationImport';
import MapDisplay from './components/MapDisplay';
import KanbanBoard from './components/KanbanBoard';
import Login from './components/Login';
import MaintenanceTypeList from './components/MaintenanceTypeList';
import MaintenanceLogList from './components/MaintenanceLogList';
import VehicleList from './components/VehicleList'; // Import Vehicle List
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken')); // Check local storage initially

  // Effect to check token validity on load and set default headers
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("Found token in localStorage, setting defaults.");
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      // TODO: Optionally verify token with backend endpoint like /api/auth/user/
      // For now, assume token in localStorage means authenticated.
      setIsAuthenticated(true);
      setAuthToken(token);
    } else {
        // Ensure Authorization header is removed if no token
        delete axios.defaults.headers.common['Authorization'];
    }
  }, []); // Run only once on initial load

  const handleLoginSuccess = (token) => {
    console.log("Login successful in App component.");
    setIsAuthenticated(true);
    setAuthToken(token); // Store token state if needed elsewhere
    // Token and Axios header are set within Login component now
  };

  const handleLogout = () => {
    console.log("Logging out.");
    localStorage.removeItem('authToken'); // Remove token from storage
    delete axios.defaults.headers.common['Authorization']; // Remove auth header
    setIsAuthenticated(false);
    setAuthToken(null);
  };
  
  // Estilo para ocultar el H1 cuando no está autenticado
  const titleStyle = {
    display: isAuthenticated ? 'block' : 'none'
  };

  return (
    <div className="App">
      <h1 style={titleStyle}>VRP Application</h1>

      {/* Conditionally render Login or main app content */}
      {isAuthenticated ? (
        <>
          {/* Logout button appears only when logged in */}
          <button onClick={handleLogout} style={{ float: 'right', margin: '10px' }}>Logout</button>

          {/* Main application components */}
          <hr />
          <RoutePlanner />
          <hr />
          <LocationImport />
          <hr />
          <MapDisplay />
          <hr />
          <KanbanBoard />
          <hr />
          {/* Phase 4 Fleet Management UI */}
          <MaintenanceTypeList />
          <hr />
          <MaintenanceLogList />
          <hr />
          <VehicleList /> {/* Render the VehicleList component */}
          <hr />
        </>
      ) : (
        // Render Login component if not authenticated
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div> // This closes the main <div className="App">
  );
}

export default App;
