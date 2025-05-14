import React, { useEffect, useState } from 'react';
import '../assets/VideoWallMenu.css';

function VideoWallMenu({
  setVideoLayout,
  selectedCameras = [],
  setSelectedCameras,
  activeBoxIndex,
  setActiveBoxIndex
}) {
  const [cameras, setCameras] = useState([]);
  const [openMunicipalities, setOpenMunicipalities] = useState({});

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

  const camerasByMunicipio = cameras.reduce((acc, cam) => {
    const mun = cam.municipio || 'Sin municipio';
    if (!acc[mun]) acc[mun] = [];
    acc[mun].push(cam);
    return acc;
  }, {});

  const toggleMunicipio = mun => {
    setOpenMunicipalities(prev => ({ ...prev, [mun]: !prev[mun] }));
  };

  const handleCameraClick = cam => {
    if (activeBoxIndex != null) {
      setSelectedCameras(prev => {
        const next = [...prev];
        next[activeBoxIndex] = cam;
        return next;
      });
      setActiveBoxIndex(null);
    } else {
      setSelectedCameras(prev => {
        const exists = prev.some(c => c && c.id === cam.id);
        return exists
          ? prev.filter(c => c && c.id !== cam.id)
          : [...prev, cam];
      });
    }
  };

  const extractPrefixNumber = name => {
    const match = name.match(/^L(\d+)/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  };

  return (
    <div className="VideoWallMenu">
      <div className="menu-header">
        <h4 className="menu-title">Seleccionar Layout</h4>
        <div className="layout-buttons">
          {['1', '4', '9'].map(n => (
            <button key={n} className="layout-btn" onClick={() => setVideoLayout(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="municipality-list">
        {Object.entries(camerasByMunicipio).map(([mun, cams]) => {
          const sortedCams = cams.sort((a, b) =>
            extractPrefixNumber(a.name) - extractPrefixNumber(b.name)
          );
          const isOpen = openMunicipalities[mun];
          return (
            <div key={mun} className="municipality-section">
              <button className="municipality-header" onClick={() => toggleMunicipio(mun)}>
                <span>{mun}</span>
                <span className={`chevron ${isOpen ? 'down' : 'right'}`} />
              </button>
              {isOpen && (
                <ul className="camera-list">
                  {sortedCams.map(cam => (
                    <li
                      key={cam.id}
                      className={`camera-item ${selectedCameras.some(c => c && c.id === cam.id) ? 'selected' : ''
                        }`}
                      onClick={() => handleCameraClick(cam)}
                    >
                      {cam.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VideoWallMenu;
