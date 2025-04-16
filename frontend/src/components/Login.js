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

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>Login</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                <button type="submit" disabled={isLoading} style={{ marginTop: '15px' }}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default Login;