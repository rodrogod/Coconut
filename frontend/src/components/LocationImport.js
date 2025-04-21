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
            setUploadStatus({ message: 'Por favor, seleccione un archivo CSV primero.', success: false, details: null });
            return;
        }

        setIsLoading(true);
        setUploadStatus({ message: 'Subiendo...', success: null, details: null });

        const formData = new FormData();
        formData.append('file', selectedFile); // 'file' debe coincidir con la clave esperada por el backend

        try {
            const response = await axios.post('/api/locations/import/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Import response:', response.data);
            setUploadStatus({
                message: response.data.message || '¡Importación exitosa!',
                success: true,
                details: response.data // Almacenar detalles completos de la respuesta (creados, actualizados, fallos)
            });
            // setSelectedFile(null); // Desactivado temporalmente para permitir reimportar
        } catch (err) {
            console.error("Error importing locations:", err);
            let errorMsg = "Falló la importación.";
            let errorDetails = null;
            if (err.response && err.response.data) {
                // Usar error detallado del backend si está disponible
                errorMsg = err.response.data.error || errorMsg;
                errorDetails = err.response.data; // Almacenar detalles de error del backend
            } else if (err.request) {
                errorMsg = "Falló la importación: No hay respuesta del servidor.";
            } else {
                errorMsg = `Falló la importación: ${err.message}`;
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

    // Ejemplo de estructura CSV para descargar
    const csvExample = `name,address,latitude,longitude,type,opening_time,closing_time,average_service_time_mins
Sucursal Norte,"Calle 123, Colonia Norte",21.1234,-89.6123,SUCURSAL,08:00,18:00,30
Proveedor XYZ,"Av Principal 456, Zona Industrial",21.0345,-89.5678,PROVEEDOR,07:30,16:30,45
Centro Distribución,"Carretera Principal Km 5",20.9876,-89.3456,CEDIS,06:00,22:00,60`;

    const downloadExample = () => {
        const element = document.createElement("a");
        const file = new Blob([csvExample], {type: 'text/csv'});
        element.href = URL.createObjectURL(file);
        element.download = "ejemplo_ubicaciones.csv";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div style={{ padding: '15px', borderRadius: '6px' }}>
            <h3 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', fontWeight: '500' }}>Importar Ubicaciones (CSV)</h3>
            
            <div style={{ marginBottom: '15px' }}>
                <p style={{ marginBottom: '8px', fontSize: '14px', color: '#555' }}>
                    Sube un archivo CSV con las siguientes columnas:
                </p>
                <ul style={{ fontSize: '14px', marginLeft: '20px', color: '#555', paddingLeft: '0' }}>
                    <li><strong>name</strong>: Nombre de la ubicación</li>
                    <li><strong>address</strong>: Dirección (opcional)</li>
                    <li><strong>latitude</strong>: Latitud (número decimal)</li>
                    <li><strong>longitude</strong>: Longitud (número decimal)</li>
                    <li><strong>type</strong>: Tipo de ubicación (CEDIS, SUCURSAL, o PROVEEDOR)</li>
                    <li><strong>opening_time</strong>: Hora de apertura en formato HH:MM (opcional)</li>
                    <li><strong>closing_time</strong>: Hora de cierre en formato HH:MM (opcional)</li>
                    <li><strong>average_service_time_mins</strong>: Tiempo medio de servicio en minutos (opcional)</li>
                </ul>
                <button 
                    onClick={downloadExample}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#2A5A8C',
                        border: '1px solid #2A5A8C',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginTop: '5px'
                    }}
                >
                    Descargar ejemplo CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    style={{ 
                        border: '1px solid #ddd',
                        padding: '8px',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                    }}
                />
                <button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || isLoading}
                    style={{
                        backgroundColor: !selectedFile || isLoading ? '#e0e0e0' : '#2A5A8C',
                        color: !selectedFile || isLoading ? '#777' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: !selectedFile || isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        minWidth: '120px'
                    }}
                >
                    {isLoading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
            </div>

            {uploadStatus.message && (
                <div style={{ 
                    marginTop: '15px', 
                    padding: '10px 15px', 
                    backgroundColor: uploadStatus.success ? '#d4edda' : '#f8d7da',
                    color: uploadStatus.success ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    border: uploadStatus.success ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
                }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{uploadStatus.message}</p>
                    
                    {/* Mostrar detalles de resultados exitosos */}
                    {uploadStatus.success && uploadStatus.details && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                            Ubicaciones creadas: {uploadStatus.details.created || 0}, 
                            Ubicaciones actualizadas: {uploadStatus.details.updated || 0}
                        </p>
                    )}
                    
                    {/* Mostrar detalles de fallos si hay alguno */}
                    {uploadStatus.details && uploadStatus.details.failures && uploadStatus.details.failures.length > 0 && (
                        <div>
                            <p style={{ margin: '10px 0 5px 0', fontWeight: '500' }}>Filas con errores:</p>
                            <div style={{ 
                                maxHeight: '150px', 
                                overflowY: 'auto', 
                                backgroundColor: '#f8f9fa', 
                                padding: '8px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: 'monospace'
                            }}>
                                <pre style={{ margin: '0' }}>
                                    {JSON.stringify(uploadStatus.details.failures, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LocationImport;