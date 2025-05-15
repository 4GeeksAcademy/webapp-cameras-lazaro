import React, { useState, useEffect } from 'react';
import { getAuthHeader } from '../utils/auth';
import { useColumnModal } from '../components/ColumnModalContext.jsx'; // ✅ importamos el contexto
import '../assets/RegistrosMenu.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function RegistrosMenu({ setFilters }) {
  const [camaras, setCamaras] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    cameraId: '',
    municipio: '',
    plate: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: ''
  });

  const { setShowColumnModal } = useColumnModal(); // ✅ accedemos al setter desde el contexto

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
      .then(data => setCamaras(Array.isArray(data) ? data : []))
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

  const municipiosUnicos = [...new Set(camaras.map(c => c.municipio).filter(Boolean))];

  return (
    <div className="registros-menu">
      <h3 className="menu-title">Filtros</h3>
      <form onSubmit={handleSubmit}>
        <div className="filter-row">
          <label>
            Fecha inicio
            <input className="filter-input" type="date" name="startDate" value={localFilters.startDate} onChange={handleChange} />
          </label>
          <label>
            Hora inicio
            <input className="filter-input" type="time" name="startTime" value={localFilters.startTime} onChange={handleChange} />
          </label>
        </div>

        <div className="filter-row">
          <label>
            Fecha fin
            <input className="filter-input" type="date" name="endDate" value={localFilters.endDate} onChange={handleChange} />
          </label>
          <label>
            Hora fin
            <input className="filter-input" type="time" name="endTime" value={localFilters.endTime} onChange={handleChange} />
          </label>
        </div>

        <div className="filter-row">
          <label>
            Cámara
            <select className="filter-input" name="cameraId" value={localFilters.cameraId} onChange={handleChange}>
              <option value="">Todas</option>
              {camaras.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Municipio
            <select className="filter-input" name="municipio" value={localFilters.municipio} onChange={handleChange}>
              <option value="">Todos</option>
              {municipiosUnicos.map((m, i) => (
                <option key={i} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-row">
          <label>
            Matrícula
            <input className="filter-input" type="text" name="plate" placeholder="Ej: 1234ABC" value={localFilters.plate} onChange={handleChange} />
          </label>
          <label>
            Tipo de vehículo
            <input className="filter-input" type="text" name="vehicleType" placeholder="Ej: Car" value={localFilters.vehicleType} onChange={handleChange} />
          </label>
        </div>

        <div className="filter-row">
          <label>
            Marca
            <input className="filter-input" type="text" name="vehicleMake" placeholder="Ej: Mercedes" value={localFilters.vehicleMake} onChange={handleChange} />
          </label>
          <label>
            Modelo
            <input className="filter-input" type="text" name="vehicleModel" placeholder="Ej: A Class" value={localFilters.vehicleModel} onChange={handleChange} />
          </label>
        </div>

        <button type="submit" className="search-btn">Buscar</button>
      </form>

      <div className="column-toggle">
        <button className="search-btn" onClick={() => setShowColumnModal(true)}>
          Mostrar columnas
        </button>
      </div>
    </div>
  );
}
