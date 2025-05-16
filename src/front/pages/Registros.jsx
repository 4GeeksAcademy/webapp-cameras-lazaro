import React, { useEffect, useState, useRef } from 'react';
import { getAuthHeader } from '../utils/auth';
import { useLocation } from 'react-router-dom';
import { useColumnModal } from '../components/ColumnModalContext.jsx';
import '../assets/Registros.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Registros({ filters }) {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const imageCache = useRef({});

  const {
    showColumnModal,
    setShowColumnModal,
    columnVisibility,
    setColumnVisibility
  } = useColumnModal();

  const location = useLocation();
  const queryCamera = location.state?.filterCamera;

  useEffect(() => {
    const fetchRecords = async () => {
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

      params.append('page', currentPage);
      params.append('limit', recordsPerPage);

      const url = `${API_URL}/api/alpr-records?${params.toString()}`;

      try {
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });

        if (res.status === 401) {
          alert('Sesión caducada. Redirigiendo al login.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        if (res.status === 502) throw new Error('Servidor temporalmente no disponible (502).');
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

        const data = await res.json();
        const allCamerasRes = await fetch(`${API_URL}/api/cameras`, {
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        const allCameras = await allCamerasRes.json();

        const enriched = data.records.map(r => {
          const matchedCamera = allCameras.find(cam => cam.id === r.camera_id);
          return {
            ...r,
            direction: parseInt(r.direction),
            municipio: matchedCamera?.municipio || '-'
          };
        });

        setRecords(enriched);
        setTotalRecords(data.total);
      } catch (err) {
        console.error('Error al cargar registros:', err);
        alert(`No se pudieron cargar los registros:\n${err.message}`);
      }
    };

    fetchRecords();
  }, [filters, queryCamera, currentPage, recordsPerPage]);

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const handleRowClick = record => {
    if (imageCache.current[record.id]) {
      setSelectedRecord({ ...record, image_url: imageCache.current[record.id] });
      return;
    }

    fetch(`${API_URL}/api/alpr-records/${record.id}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        imageCache.current[record.id] = data.image_url;
        setSelectedRecord({ ...data, municipio: record.municipio });
      })
      .catch(err => console.error('Error al cargar detalle:', err));
  };

  return (
    <div className="content-container-r">
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
                {columnVisibility.image_url && <td>(ver)</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="pagination-left">
          <label>
            Registros por página:{' '}
            <select
              value={recordsPerPage}
              onChange={e => {
                setRecordsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 50, 100].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="pagination-right">
          {currentPage > 1 && (
            <button onClick={() => setCurrentPage(prev => prev - 1)}>Anterior</button>
          )}
          <span>
            <input
              type="number"
              value={currentPage}
              min={1}
              max={totalPages}
              onChange={e => {
                const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                setCurrentPage(val);
              }}
              style={{ width: '50px', textAlign: 'center' }}
            /> / {totalPages}
          </span>
          {currentPage < totalPages && (
            <button onClick={() => setCurrentPage(prev => prev + 1)}>Siguiente</button>
          )}
        </div>
      </div>

      {selectedRecord && (
        <div className="regmodal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="regmodal-content regmodal-large" onClick={e => e.stopPropagation()}>
            <button className="regmodal-close" onClick={() => setSelectedRecord(null)}>×</button>
            <h3 className="regmodal-title centered">Detalles del Registro</h3>
            <div className="regmodal-body-horizontal">
              <div className="regmodal-image-large">
                {selectedRecord.image_url ? (
                  <img
                    src={`data:image/jpeg;base64,${selectedRecord.image_url}`}
                    alt="captura"
                  />
                ) : (
                  <div className="regmodal-no-image">Sin imagen</div>
                )}
              </div>
              <div className="regmodal-details reorganized">
                <div className="regmodal-plate">{selectedRecord.plate_number}</div>
                <div className="regmodal-row">
                  <div><strong>Municipio:</strong> {selectedRecord.municipio || '-'}</div>
                  <div><strong>Cámara:</strong> {selectedRecord.camera_name}</div>
                </div>
                <div className="regmodal-row">
                  <div><strong>Fecha:</strong> {selectedRecord.detected_at}</div>
                  <div><strong>ID:</strong> {selectedRecord.id}</div>
                </div>
                <div className="regmodal-row">
                  <div><strong>Marca:</strong> {selectedRecord.vehicle_make}</div>
                  <div><strong>Modelo:</strong> {selectedRecord.vehicle_model}</div>
                </div>
                <div className="regmodal-row">
                  <div><strong>Color:</strong> {selectedRecord.vehicle_color}</div>
                  <div><strong>Tipo:</strong> {selectedRecord.vehicle_type}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showColumnModal && (
        <div className="regmodal-backdrop" onClick={() => setShowColumnModal(false)}>
          <div className="regmodal-content" onClick={e => e.stopPropagation()}>
            <h3>Mostrar/Ocultar Columnas</h3>
            <div className="regmodal-columns-container">
              {Object.keys(columnVisibility).map(col => {
                const traducciones = {
                  id: 'ID',
                  plate_number: 'Matrícula',
                  municipio: 'Municipio',
                  camera_name: 'Cámara',
                  vehicle_make: 'Marca',
                  vehicle_model: 'Modelo',
                  vehicle_color: 'Color',
                  direction: 'Dirección',
                  detected_at: 'Fecha',
                  confidence: 'Confianza',
                  image_url: 'Imagen'
                };
                return (
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
                    {traducciones[col] || col}
                  </label>
                );
              })}
            </div>
            <button className="search-btn" onClick={() => setShowColumnModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
