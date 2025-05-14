// src/components/CameraModal.jsx

import React, { useState } from 'react';
import '../assets/CameraModal.css';

function CameraModal({ onClose, addCameraToList }) {
    const [formData, setFormData] = useState({
        name: '',
        municipio: '',           // Nuevo campo
        ip_address: '',
        username: '',
        password: '',
        connection_method: 'mjpeg',
        location_lat: '',
        location_lng: ''
    });

    const handleChange = e => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async e => {
        e.preventDefault();

        const API_URL = import.meta.env.VITE_BACKEND_URL;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/cameras`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.status === 201) {
                const result = await response.json();
                // El backend devuelve: { message: "...", camera: { ... } }
                const newCam = result.camera ?? result;
                alert('Cámara añadida correctamente');
                addCameraToList && addCameraToList(newCam);
                onClose();
            } else {
                let msg = `Error ${response.status}`;
                try {
                    const err = await response.json();
                    msg = err.error || err.msg || msg;
                } catch {
                    msg = await response.text() || msg;
                }
                alert('Error al añadir la cámara: ' + msg);
            }
        } catch (err) {
            console.error('Error de conexión:', err);
            alert('Error de conexión con el servidor');
        }
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="municipio"
                    placeholder="Municipio"
                    value={formData.municipio}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="ip_address"
                    placeholder="IP"
                    value={formData.ip_address}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="username"
                    placeholder="Usuario"
                    value={formData.username}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                />
                <select
                    name="connection_method"
                    value={formData.connection_method}
                    onChange={handleChange}
                >
                    <option value="mjpeg">MJPEG</option>
                    <option value="rtsp">RTSP</option>
                </select>
                <input
                    type="text"
                    name="location_lat"
                    placeholder="Latitud"
                    value={formData.location_lat}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="location_lng"
                    placeholder="Longitud"
                    value={formData.location_lng}
                    onChange={handleChange}
                />
                <button type="submit">Añadir Cámara</button>
                <button type="button" onClick={onClose}>
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default CameraModal;
