// src/pages/Registros.jsx
import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '../utils/auth';
import '../assets/Registros.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Registros({ filters }) {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.plate) params.append('plate', filters.plate);
      if (filters.cameraId) params.append('camera', filters.cameraId);
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.vehicleMake) params.append('vehicleMake', filters.vehicleMake);
      if (filters.vehicleModel) params.append('vehicleModel', filters.vehicleModel);
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
        if (filters.startTime) params.append('startTime', filters.startTime);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
        if (filters.endTime) params.append('endTime', filters.endTime);
      }
    }
    const url = `${API_URL}/api/alpr-records${params.toString() ? `?${params}` : ''}`;

    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })
      .then(async res => {
        if (res.status === 401) {
          alert('Sesión caducada. Redirigiendo al login.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        if (res.status === 502) {
          throw new Error('Servidor temporalmente no disponible (502).');
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Error ${res.status}: ${txt}`);
        }
        return res.json();
      })
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error al cargar registros:', err);
        alert(`No se pudieron cargar los registros:\n${err.message}`);
      });
  }, [filters]);

  const handleRowClick = record => {
    fetch(`${API_URL}/api/alpr-records/${record.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setSelectedRecord(data))
      .catch(err => console.error('Error al cargar detalle:', err));
  };

  return (
    <div className="content-container">
      <h2>Registros ALPR</h2>

      <div className="table-container">
        <table className="registros-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cámara</th>
              <th>Matrícula</th>
              <th>Fecha</th>
              <th>Confianza</th>
              <th>Color</th>
              <th>Tipo</th>
              <th>Modelo</th>
              <th>Marca</th>
              <th>Dirección</th>
              <th>Imagen</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr
                key={r.id}
                className="clickable-row"
                onClick={() => handleRowClick(r)}
              >
                <td>{r.id}</td>
                <td>{r.camera_name}</td>
                <td>{r.plate_number}</td>
                <td>{r.detected_at}</td>
                <td>{r.confidence}%</td>
                <td>{r.vehicle_color}</td>
                <td>{r.vehicle_type}</td>
                <td>{r.vehicle_model}</td>
                <td>{r.vehicle_make}</td>
                <td>{r.direction}</td>
                <td>
                  {r.image_url ? (
                    <img
                      src={`data:image/jpeg;base64,${r.image_url}`}
                      alt="captura"
                      className="thumb"
                    />
                  ) : (
                    'Sin imagen'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRecord(null)}>×</button>
            <div className="modal-body">
              <div className="modal-image">
                {selectedRecord.image_url ? (
                  <img
                    src={`data:image/jpeg;base64,${selectedRecord.image_url}`}
                    alt="captura"
                  />
                ) : (
                  <div className="no-image">Sin imagen</div>
                )}
              </div>
              <div className="modal-details">
                <h3>Detalle Registro</h3>
                {[
                  ['ID', selectedRecord.id],
                  ['Cámara', selectedRecord.camera_name],
                  ['Matrícula', selectedRecord.plate_number],
                  ['Fecha', selectedRecord.detected_at],
                  ['Confianza', `${selectedRecord.confidence}%`],
                  ['Color', selectedRecord.vehicle_color],
                  ['Tipo', selectedRecord.vehicle_type],
                  ['Modelo', selectedRecord.vehicle_model],
                  ['Marca', selectedRecord.vehicle_make],
                  ['Dirección', selectedRecord.direction],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
