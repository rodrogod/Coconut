import React, { useState } from 'react';
import axios from 'axios';

function LocationImport() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ message: '', success: null, details: null });

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadStatus({ message: '', success: null, details: null }); // Reset status on new file selection
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus({ message: 'Please select a CSV file first.', success: false, details: null });
            return;
        }

        setIsLoading(true);
        setUploadStatus({ message: 'Uploading...', success: null, details: null });

        const formData = new FormData();
        formData.append('file', selectedFile); // 'file' must match the key expected by the backend view

        try {
            const response = await axios.post('/api/locations/import/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Import response:', response.data);
            setUploadStatus({
                message: response.data.message || 'Import successful!',
                success: true,
                details: response.data // Store full response details (created, updated, failures)
            });
            // setSelectedFile(null); // Temporarily disable clearing file input
            // TODO: Optionally trigger a refresh of location data elsewhere in the app
        } catch (err) {
            console.error("Error importing locations:", err);
            let errorMsg = "Import failed.";
            let errorDetails = null;
            if (err.response && err.response.data) {
                // Use detailed error from backend if available
                errorMsg = err.response.data.error || errorMsg;
                errorDetails = err.response.data; // Store backend error details
            } else if (err.request) {
                errorMsg = "Import failed: No response from server.";
            } else {
                errorMsg = `Import failed: ${err.message}`;
            }
            setUploadStatus({ message: errorMsg, success: false, details: errorDetails });
            if (err.response) {
                console.error("Response data:", err.response.data);
                console.error("Response status:", err.response.status);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h3>Import Locations (CSV)</h3>
            <p>Upload a CSV file with columns: name, address, latitude, longitude, type, opening_time (HH:MM), closing_time (HH:MM), average_service_time_mins</p>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
                {isLoading ? 'Uploading...' : 'Upload File'}
            </button>

            {uploadStatus.message && (
                <div style={{ marginTop: '10px', color: uploadStatus.success ? 'green' : 'red' }}>
                    <p>{uploadStatus.message}</p>
                    {/* Optionally display more details, especially failures */}
                    {uploadStatus.details && uploadStatus.details.failures && uploadStatus.details.failures.length > 0 && (
                        <div>
                            <strong>Failed Rows:</strong>
                            <pre style={{ maxHeight: '150px', overflowY: 'auto', background: '#f0f0f0', padding: '5px' }}>
                                {JSON.stringify(uploadStatus.details.failures, null, 2)}
                            </pre>
                        </div>
                    )}
                     {uploadStatus.details && (uploadStatus.details.created !== undefined || uploadStatus.details.updated !== undefined) && !uploadStatus.details.failures?.length > 0 && (
                         <p>Created: {uploadStatus.details.created}, Updated: {uploadStatus.details.updated}</p>
                     )}
                </div>
            )}
        </div>
    );
}

export default LocationImport;