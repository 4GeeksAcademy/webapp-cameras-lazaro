import React, { useEffect, useRef, useState } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import '../assets/VideoWall.css';

function VideoWall({
  layout,
  selectedCameras,
  setSelectedCameras,
  activeBoxIndex,
  setActiveBoxIndex
}) {
  const containerRefs = useRef({});
  const playersRef = useRef({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const count = parseInt(layout, 10);

  useEffect(() => {
    const camsToShow = selectedCameras.slice(0, count).filter(cam => cam);
    const activeIds = camsToShow.map(c => c.id);

    Object.keys(playersRef.current).forEach(id => {
      if (!activeIds.includes(Number(id))) {
        playersRef.current[id].destroy();
        delete playersRef.current[id];
        setLoading(prev => ({ ...prev, [id]: false }));
        setError(prev => ({ ...prev, [id]: false }));
      }
    });

    camsToShow.forEach(cam => {
      if (playersRef.current[cam.id]) return;
      const container = containerRefs.current[cam.id];
      if (!container) return;

      const isCodespaces = window.location.hostname.includes('app.github.dev');
      const wsHost = isCodespaces
        ? window.location.hostname.replace('-3000.', '-9999.')
        : `https://ubiquitous-engine-wrgj6rv55g762gp6w.github.dev:9999`;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${wsHost}/stream/${cam.id}`;

      console.log(`[WebSocket] Intentando conectar a: ${wsUrl}`);
      setLoading(prev => ({ ...prev, [cam.id]: true }));
      setError(prev => ({ ...prev, [cam.id]: false }));

      const player = new JSMpeg.VideoElement(container, wsUrl, {
        autoplay: true,
        loop: true
      });

      playersRef.current[cam.id] = player;

      if (player?.source?.socket) {
        const socket = player.source.socket;
        // Escuchar mensajes para detectar errores emitidos desde el servidor
        socket.addEventListener('message', event => {
          try {
            const data = JSON.parse(event.data);
            if (data.error && data.cameraId === cam.id) {
              console.error(`[Streaming Error] ${data.error}`);
              setLoading(prev => ({ ...prev, [cam.id]: false }));
              setError(prev => ({ ...prev, [cam.id]: true }));
            }
          } catch (_) {
            // Ignorar mensajes no JSON (probablemente datos binarios)
          }
        });
        // Escuchar el cierre del socket y detectar un cierre anormal
        socket.addEventListener('close', event => {
          if (event.code !== 1000) {
            console.error(`[Socket Close] Código ${event.code} para la cámara ${cam.id}`);
            setLoading(prev => ({ ...prev, [cam.id]: false }));
            setError(prev => ({ ...prev, [cam.id]: true }));
          }
        });
      }

      // Timeout preventivo para detener el spinner
      setTimeout(() => {
        setLoading(prev => ({ ...prev, [cam.id]: false }));
      }, 5000);
    });
  }, [layout, selectedCameras]);

  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach(p => p.destroy());
      playersRef.current = {};
    };
  }, []);

  const handleRemoveCam = index => {
    const updated = [...selectedCameras];
    updated.splice(index, 1, null);
    setSelectedCameras(updated);
  };

  let boxClass = '';
  if (layout === '1') boxClass = 'videoBox1';
  else if (layout === '4') boxClass = 'videoBox4';
  else if (layout === '9') boxClass = 'videoBox9';

  return (
    <div className="content-container-videowall">
      {Array.from({ length: count }).map((_, i) => {
        const cam = selectedCameras[i];
        const isActive = i === activeBoxIndex;

        return (
          <div
            key={i}
            className={`video-wrapper ${boxClass} ${isActive ? 'selected-box' : ''}`}
            onClick={() => setActiveBoxIndex(i)}
          >
            {cam ? (
              <div className="video-container">
                <div
                  className="video-overlay"
                  onClick={e => {
                    e.stopPropagation();
                    handleRemoveCam(i);
                  }}
                >
                  <span className="cam-name">{cam.name || `Cam #${cam.id}`}</span>
                  <span className="close-btn">✖</span>
                </div>

                {loading[cam.id] && (
                  <div className="spinner-container">
                    <div className="spinner" />
                  </div>
                )}

                {error[cam.id] && (
                  <div className="error-message">
                    Error al cargar el streaming.
                  </div>
                )}

                <div
                  ref={el => {
                    if (el) containerRefs.current[cam.id] = el;
                  }}
                  className="video-feed"
                />
              </div>
            ) : (
              <div className="no-camera">Sin cámara</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VideoWall;
