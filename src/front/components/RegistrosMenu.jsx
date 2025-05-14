// src/components/RegistrosMenu.jsx
import React, { useState, useEffect } from 'react';
import { getAuthHeader } from '../utils/auth';
// import '../assets/RegistrosMenu.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function RegistrosMenu({ setFilters }) {
  const [camaras, setCamaras] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    cameraId: '',
    plate: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: ''
  });

  const handleAuthError = () => {
    alert('Sesión caducada. Te redirigimos al login.');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    fetch(`${API_URL}/api/cameras`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    })
      .then(async res => {
        if (res.status === 401) {
          handleAuthError();
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setCamaras(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('❌ Error al cargar cámaras:', err);
        alert('Error al cargar cámaras. Revisa la consola.');
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setFilters(localFilters);
  };

  return (
    <div className="registros-menu">
      <h3>Filtros</h3>
      <form onSubmit={handleSubmit}>
        <div className="filter-row">
          <label>
            Fecha inicio:
            <input
              type="date"
              name="startDate"
              value={localFilters.startDate}
              onChange={handleChange}
            />
          </label>
          <label>
            Hora inicio:
            <input
              type="time"
              name="startTime"
              value={localFilters.startTime}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            Fecha fin:
            <input
              type="date"
              name="endDate"
              value={localFilters.endDate}
              onChange={handleChange}
            />
          </label>
          <label>
            Hora fin:
            <input
              type="time"
              name="endTime"
              value={localFilters.endTime}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            Cámara:
            <select
              name="cameraId"
              value={localFilters.cameraId}
              onChange={handleChange}
            >
              <option value="">Todas</option>
              {camaras.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label>
            Matrícula:
            <input
              type="text"
              name="plate"
              placeholder="Ej: 1234ABC"
              value={localFilters.plate}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            Tipo de vehículo:
            <input
              type="text"
              name="vehicleType"
              placeholder="Ej: Car"
              value={localFilters.vehicleType}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            Marca:
            <input
              type="text"
              name="vehicleMake"
              placeholder="Ej: Mercedes"
              value={localFilters.vehicleMake}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="filter-row">
          <label>
            Modelo:
            <input
              type="text"
              name="vehicleModel"
              placeholder="Ej: A Class"
              value={localFilters.vehicleModel}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit" className="button-search">
          Buscar
        </button>
      </form>
    </div>
  );
}
