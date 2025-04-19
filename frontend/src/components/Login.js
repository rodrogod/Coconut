import React, { useState } from 'react';
import axios from 'axios';

// Simple component for now. State management (Context API or Redux/Zustand)
// would be better for managing auth state across the app.
function Login({ onLoginSuccess }) { // Pass a callback for successful login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/auth/login/', {
                username: username,
                password: password,
            });

            console.log("Login successful:", response.data);
            const token = response.data.key; // dj-rest-auth returns the token in 'key'

            // Store the token (e.g., localStorage - simple but consider security implications)
            localStorage.setItem('authToken', token);

            // Set the token for future Axios requests
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;

            // Call the callback function passed from the parent (App.js)
            if (onLoginSuccess) {
                onLoginSuccess(token); // Pass token or user data if needed
            }

        } catch (err) {
            console.error("Login failed:", err);
            let errorMsg = "Login failed.";
            if (err.response) {
                console.error("Response data:", err.response.data);
                console.error("Response status:", err.response.status);
                // Extract specific error messages if backend provides them
                if (err.response.data.non_field_errors) {
                    errorMsg = err.response.data.non_field_errors.join(' ');
                } else {
                    // Combine other field errors if necessary
                     const fieldErrors = Object.entries(err.response.data)
                        // Check if errors is an array before joining
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('; ');
                     if (fieldErrors) errorMsg = fieldErrors;
                }
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos para el cuerpo de la página - prevenir scroll
    const bodyStyle = {
        height: '100%',
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0
    };

    // Estilos para el contenedor principal - centrado vertical y horizontal sin scroll
    const containerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Usar height en lugar de minHeight
        padding: '0',
        margin: '0',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#f5f7fa' // Color de fondo suave
    };

    // Estilos para la tarjeta de login
    const cardStyle = {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden'
    };

    // Estilos para el encabezado
    const headerStyle = {
        background: 'linear-gradient(135deg, #3498db, #2c3e50)',
        color: 'white',
        padding: '25px',
        textAlign: 'center'
    };

    // Estilos para el formulario
    const formStyle = {
        padding: '25px'
    };

    // Estilos para grupos de formulario
    const formGroupStyle = {
        marginBottom: '20px'
    };

    // Estilos para etiquetas
    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '500',
        color: '#4a4a4a'
    };

    // Estilos para inputs
    const inputStyle = {
        width: '100%',
        padding: '12px 15px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box'
    };

    // Estilos para el botón
    const buttonStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: isLoading ? '#b3d7ed' : '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        marginTop: '10px',
        opacity: isLoading ? 0.7 : 1
    };

    // Estilos para mensaje de error
    const errorStyle = {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
        marginBottom: '20px',
        borderLeft: '4px solid #d32f2f'
    };

    // Aplicar estilos al body para prevenir scroll
    React.useEffect(() => {
        // Guardar los estilos originales
        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height,
            top: document.body.style.top,
            left: document.body.style.left
        };

        // Aplicar estilos para prevenir scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = '0';
        document.body.style.left = '0';

        // Restaurar estilos originales al desmontar el componente
        return () => {
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.position = originalStyle.position;
            document.body.style.width = originalStyle.width;
            document.body.style.height = originalStyle.height;
            document.body.style.top = originalStyle.top;
            document.body.style.left = originalStyle.left;
        };
    }, []);

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <h2 style={{margin: 0, fontSize: '24px', fontWeight: '500'}}>VRP System Login</h2>
                    <p style={{margin: '10px 0 0', opacity: 0.8, fontSize: '14px'}}>Enter your credentials to access the application</p>
                </div>
                
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={formGroupStyle}>
                        <label htmlFor="username" style={labelStyle}>Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            placeholder="Enter your username"
                            style={inputStyle}
                        />
                    </div>
                    <div style={formGroupStyle}>
                        <label htmlFor="password" style={labelStyle}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            placeholder="Enter your password"
                            style={inputStyle}
                        />
                    </div>
                    
                    {error && <div style={errorStyle}>{error}</div>}
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={buttonStyle}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;