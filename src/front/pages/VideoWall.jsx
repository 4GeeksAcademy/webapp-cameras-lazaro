// src/pages/VideoWall.jsx
import React, { useEffect, useRef } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import '../assets/VideoWall.css';

function VideoWall({
  layout,
  selectedCameras,
  activeBoxIndex,
  setActiveBoxIndex
}) {
  const containerRefs = useRef({});
  const playersRef = useRef({});
  const count = parseInt(layout, 10);

  useEffect(() => {
    // Solo cámaras definidas (evitamos huecos undefined)
    const camsToShow = selectedCameras.slice(0, count).filter(cam => cam);
    const activeIds = camsToShow.map(c => c.id);

    // Destruir reproductores que ya no están
    Object.keys(playersRef.current).forEach(id => {
      if (!activeIds.includes(Number(id))) {
        playersRef.current[id].destroy();
        delete playersRef.current[id];
      }
    });

    // Crear nuevos reproductores
    camsToShow.forEach(cam => {
      if (playersRef.current[cam.id]) return;
      const container = containerRefs.current[cam.id];
      if (!container) return;

      const host = window.location.host;
      const wsHost = host.replace(/-3000(\.|$)/, '-9999$1');
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${wsHost}/stream/${cam.id}`;

      const player = new JSMpeg.VideoElement(container, wsUrl, {
        autoplay: true,
        loop: true
      });
      playersRef.current[cam.id] = player;
    });

    return () => {
      // Limpieza al desmontar / cambiar cámara/layout
      Object.values(playersRef.current).forEach(p => p.destroy());
      playersRef.current = {};
    };
  }, [layout, selectedCameras]);

  // Clase CSS según el número de vídeos
  let boxClass = '';
  if (layout === '1') boxClass = 'videoBox1';
  else if (layout === '4') boxClass = 'videoBox4';
  else if (layout === '9') boxClass = 'videoBox9';

  return (
    <div className="content-container">
      {Array.from({ length: count }).map((_, i) => {
        const cam = selectedCameras[i];
        const isActive = i === activeBoxIndex;
        return (
          <div
            key={i}
            className={`${boxClass} ${isActive ? 'selected-box' : ''}`}
            onClick={() => setActiveBoxIndex(i)}
          >
            {cam ? (
              <div
                ref={el => {
                  if (el) containerRefs.current[cam.id] = el;
                }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                Sin cámara
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VideoWall;
