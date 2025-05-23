// src/components/LeftBar.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import '../assets/LeftBar.css';
import VideoWallMenu from './VideoWallMenu';
import AjustesMenu from './AjustesMenu';
import RegistrosMenu from './RegistrosMenu';
import MapaMenu from '../components/MapaMenu.jsx';

function LeftBar({
  setVideoLayout,
  setSelectedCameras,
  activeBoxIndex,
  setActiveBoxIndex,
  filters,
  setFilters
}) {
  const location = useLocation();

  return (
    <div className="leftbar-container">
      {location.pathname === '/' && (
        <VideoWallMenu
          setVideoLayout={setVideoLayout}
          setSelectedCameras={setSelectedCameras}
          activeBoxIndex={activeBoxIndex}
          setActiveBoxIndex={setActiveBoxIndex}
        />
      )}

      {location.pathname === '/mapa' && (
        <MapaMenu />
      )}

      {location.pathname === '/registros' && (
        <RegistrosMenu
          setFilters={setFilters}
        />
      )}

      {(location.pathname === '/ajustes' ||
        location.pathname === '/ajustes1') && (
          <AjustesMenu />
        )}
    </div>
  );
}

export default LeftBar;
