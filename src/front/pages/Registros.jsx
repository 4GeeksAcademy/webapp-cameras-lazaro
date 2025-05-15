import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '../utils/auth';
import { useLocation } from 'react-router-dom';
import { useColumnModal } from '../components/ColumnModalContext.jsx';
import '../assets/Registros.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Registros({ filters }) {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const {
    showColumnModal,
    setShowColumnModal,
    columnVisibility,
    setColumnVisibility
  } = useColumnModal();

  const location = useLocation();
  const queryCamera = location.state?.filterCamera;

  useEffect(() => {
    const params = new URLSearchParams();
    const activeFilters = filters || {};
    const effectiveCamera = activeFilters.cameraId || queryCamera;

    if (activeFilters.plate) params.append('plate', activeFilters.plate);
    if (effectiveCamera) params.append('camera', effectiveCamera);
    if (activeFilters.vehicleType) params.append('vehicleType', activeFilters.vehicleType);
    if (activeFilters.vehicleMake) params.append('vehicleMake', activeFilters.vehicleMake);
    if (activeFilters.vehicleModel) params.append('vehicleModel', activeFilters.vehicleModel);
    if (activeFilters.startDate) {
      params.append('startDate', activeFilters.startDate);
      if (activeFilters.startTime) params.append('startTime', activeFilters.startTime);
    }
    if (activeFilters.endDate) {
      params.append('endDate', activeFilters.endDate);
      if (activeFilters.endTime) params.append('endTime', activeFilters.endTime);
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
        if (res.status === 502) throw new Error('Servidor temporalmente no disponible (502).');
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
        return res.json();
      })
      .then(async data => {
        if (!Array.isArray(data)) return setRecords([]);
        const allCamerasRes = await fetch(`${API_URL}/api/cameras`, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        const allCameras = await allCamerasRes.json();

        const enriched = data.map(r => {
          const matchedCamera = allCameras.find(cam => cam.id === r.camera_id);
          return { ...r, municipio: matchedCamera?.municipio || '-' };
        });

        setRecords(enriched);
      })
      .catch(err => {
        console.error('Error al cargar registros:', err);
        alert(`No se pudieron cargar los registros:\n${err.message}`);
      });
  }, [filters, queryCamera]);

  const handleRowClick = record => {
    fetch(`${API_URL}/api/alpr-records/${record.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setSelectedRecord({ ...data, municipio: record.municipio }))
      .catch(err => console.error('Error al cargar detalle:', err));
  };

  return (
    <div className="content-container">
      <h2>Registros ALPR</h2>

      <div className="table-container">
        <table className="registros-table">
          <thead>
            <tr>
              {columnVisibility.id && <th>ID</th>}
              {columnVisibility.plate_number && <th>Matrícula</th>}
              {columnVisibility.municipio && <th>Municipio</th>}
              {columnVisibility.camera_name && <th>Cámara</th>}
              {columnVisibility.vehicle_make && <th>Marca</th>}
              {columnVisibility.vehicle_model && <th>Modelo</th>}
              {columnVisibility.vehicle_color && <th>Color</th>}
              {columnVisibility.direction && <th>Dirección</th>}
              {columnVisibility.detected_at && <th>Fecha</th>}
              {columnVisibility.confidence && <th>Confianza</th>}
              {columnVisibility.image_url && <th>Imagen</th>}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="clickable-row" onClick={() => handleRowClick(r)}>
                {columnVisibility.id && <td>{r.id}</td>}
                {columnVisibility.plate_number && <td>{r.plate_number}</td>}
                {columnVisibility.municipio && <td>{r.municipio}</td>}
                {columnVisibility.camera_name && <td>{r.camera_name}</td>}
                {columnVisibility.vehicle_make && <td>{r.vehicle_make}</td>}
                {columnVisibility.vehicle_model && <td>{r.vehicle_model}</td>}
                {columnVisibility.vehicle_color && <td>{r.vehicle_color}</td>}
                {columnVisibility.direction && (
                  <td>
                    {r.direction === 1
                      ? 'Acercándose'
                      : r.direction === 2
                        ? 'Alejándose'
                        : 'Desconocido'}
                  </td>
                )}
                {columnVisibility.detected_at && <td>{r.detected_at}</td>}
                {columnVisibility.confidence && <td>{r.confidence}%</td>}
                {columnVisibility.image_url && (
                  <td>
                    {r.image_url ? (
                      <img
                        src={`data:image/jpeg;base64,${r.image_url}`}
                        alt="captura"
                        className="thumb"
                      />
                    ) : 'Sin imagen'}
                  </td>
                )}
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
                {[['ID', selectedRecord.id],
                ['Cámara', selectedRecord.camera_name],
                ['Municipio', selectedRecord.municipio || '-'],
                ['Matrícula', selectedRecord.plate_number],
                ['Fecha', selectedRecord.detected_at],
                ['Confianza', `${selectedRecord.confidence}%`],
                ['Color', selectedRecord.vehicle_color],
                ['Tipo', selectedRecord.vehicle_type],
                ['Modelo', selectedRecord.vehicle_model],
                ['Marca', selectedRecord.vehicle_make],
                ['Dirección', selectedRecord.direction === 1 ? 'Acercándose' : selectedRecord.direction === 2 ? 'Alejándose' : 'Desconocido'],
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

      {showColumnModal && (
        <div className="modal-backdrop" onClick={() => setShowColumnModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Mostrar/Ocultar Columnas</h3>
            <div className="modal-columns-container">
              {Object.keys(columnVisibility).map(col => (
                <label key={col}>
                  <input
                    type="checkbox"
                    checked={columnVisibility[col]}
                    onChange={() =>
                      setColumnVisibility(prev => ({
                        ...prev,
                        [col]: !prev[col]
                      }))
                    }
                  />
                  {col
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              ))}
            </div>
            <button className="search-btn" onClick={() => setShowColumnModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
