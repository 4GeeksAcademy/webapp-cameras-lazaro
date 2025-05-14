// src/components/VideoWallMenu.jsx
import React, { useEffect, useState } from 'react';
import CameraModal from './CameraModal';
import '../assets/VideoWallMenu.css';

function VideoWallMenu({
  setVideoLayout,
  selectedCameras,
  setSelectedCameras,
  activeBoxIndex,
  setActiveBoxIndex
}) {
  const [cameras, setCameras] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    fetch(`${API_URL}/api/cameras`)
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          setCameras(Array.isArray(data) ? data : []);
        } else {
          console.error('Error al cargar cámaras:', await res.text());
        }
      })
      .catch(err => console.error('Error al cargar cámaras:', err));
  }, []);

  const handleCameraClick = cam => {
    if (activeBoxIndex !== null) {
      setSelectedCameras(prev => {
        const next = [...prev];
        next[activeBoxIndex] = cam;
        return next;
      });
      setActiveBoxIndex(null);
    } else {
      setSelectedCameras(prev => {
        const exists = prev.some(c => c.id === cam.id);
        return exists
          ? prev.filter(c => c.id !== cam.id)
          : [...prev, cam];
      });
    }
  };

  const handleDeleteCamera = camId => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    fetch(`${API_URL}/api/cameras/${camId}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setCameras(prev => prev.filter(x => x.id !== camId));
        setSelectedCameras(prev => prev.filter(x => x.id !== camId));
      })
      .catch(err => console.error('Error al eliminar cámara:', err));
  };

  return (
    <>
      {showModal && (
        <CameraModal
          onClose={() => setShowModal(false)}
          addCameraToList={newCam => setCameras(prev => [...prev, newCam])}
        />
      )}
      <div className="video-wall-menu">
        <div className="layout-select">
          <button onClick={() => setVideoLayout('1')}>1</button>
          <button onClick={() => setVideoLayout('4')}>4</button>
          <button onClick={() => setVideoLayout('9')}>9</button>
        </div>
        <div className="camera-list">
          <ul>
            {cameras.length > 0 ? (
              cameras.map(cam => (
                <li
                  key={cam.id}
                  className="camera-item"
                  onClick={() => handleCameraClick(cam)}
                >
                  <span>{cam.name}</span>
                  <button
                    className="delete-btn"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCamera(cam.id);
                    }}
                  >
                    ×
                  </button>
                </li>
              ))
            ) : (
              <li style={{ padding: '0.5rem', listStyle: 'none' }}>
                No hay cámaras o error al cargarlas
              </li>
            )}
          </ul>
        </div>
        <button
          className="add-camera-btn"
          onClick={() => setShowModal(true)}
        >
          + Añadir cámara
        </button>
      </div>
    </>
  );
}

export default VideoWallMenu;
