import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../assets/Map.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import { useNavigate } from 'react-router-dom';
import { useMapaContext } from '../components/MapaContext.jsx';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [map]);
  return null;
}

function AutoCenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Mapa() {
  const [allCamaras, setAllCamaras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([41.38879, 2.15899]);

  const markerRefs = useRef({});

  const {
    municipioSeleccionado,
    setMunicipiosDisponibles,
    setCentroMunicipio,
    camarasFiltradas,
    setCamarasFiltradas,
    camaraSeleccionada
  } = useMapaContext();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    fetch(`${API_URL}/api/cameras`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    })
      .then(async res => {
        setLoading(false);
        if (res.ok) {
          const data = await res.json();
          const camarasValidas = Array.isArray(data)
            ? data.filter(c => c.location?.lat && c.location?.lng)
            : [];

          setAllCamaras(camarasValidas);
          setMunicipiosDisponibles([
            ...new Set(camarasValidas.map(c => c.municipio).filter(Boolean))
          ]);

          const municipios = camarasValidas.reduce((acc, cam) => {
            acc[cam.municipio] = acc[cam.municipio] || [];
            acc[cam.municipio].push(cam);
            return acc;
          }, {});

          let topMunicipio = null;
          let maxCount = 0;
          for (const [mun, cams] of Object.entries(municipios)) {
            if (cams.length > maxCount) {
              maxCount = cams.length;
              topMunicipio = cams;
            }
          }

          if (topMunicipio && topMunicipio.length > 0) {
            const firstCam = topMunicipio[0];
            setMapCenter([
              parseFloat(firstCam.location.lat),
              parseFloat(firstCam.location.lng)
            ]);
          }
        } else if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          console.error('Error al cargar cámaras:', await res.text());
          setAllCamaras([]);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error('Error al cargar las cámaras:', err);
        setAllCamaras([]);
      });
  }, []);

  useEffect(() => {
    if (!municipioSeleccionado) {
      setCamarasFiltradas(allCamaras);
      return;
    }

    const filtradas = allCamaras.filter(
      c =>
        c.municipio === municipioSeleccionado &&
        c.location?.lat &&
        c.location?.lng
    );
    setCamarasFiltradas(filtradas);

    if (filtradas.length > 0) {
      const cam = filtradas[0];
      const lat = parseFloat(cam.location.lat);
      const lng = parseFloat(cam.location.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCentroMunicipio([lat, lng]);
        setMapCenter([lat, lng]);
      }
    }
  }, [municipioSeleccionado, allCamaras]);

  useEffect(() => {
    if (camaraSeleccionada?.location?.lat && camaraSeleccionada?.location?.lng) {
      const lat = parseFloat(camaraSeleccionada.location.lat);
      const lng = parseFloat(camaraSeleccionada.location.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setTimeout(() => {
          const ref = markerRefs.current[camaraSeleccionada.id];
          if (ref && ref.openPopup) {
            ref.openPopup();
          }
        }, 400);
      }
    }
  }, [camaraSeleccionada]);

  if (loading) return <p style={{ padding: '1rem' }}>Cargando cámaras…</p>;

  return (
    <div className="content-container-m">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <ResizeMap />
        <AutoCenterMap center={mapCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {(camarasFiltradas.length > 0 ? camarasFiltradas : allCamaras).map(cam => {
          const lat = parseFloat(cam.location?.lat);
          const lng = parseFloat(cam.location?.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={cam.id}
              position={[lat, lng]}
              ref={(ref) => {
                if (ref) markerRefs.current[cam.id] = ref;
              }}
            >
              <Popup minWidth={300} maxWidth={300} closeButton={true}>
                <PopupContent camara={cam} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function PopupContent({ camara }) {
  const videoRef = useRef();
  const playerRef = useRef();
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const container = videoRef.current;
    if (!container) return;

    const host = window.location.host;
    const wsHost = host.replace(/-3000(\.|$)/, '-9999$1');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${wsHost}/stream/${camara.id}`;

    setLoading(true);
    setError(false);

    const player = new JSMpeg.VideoElement(container, wsUrl, {
      autoplay: true,
      loop: true,
      disableGl: true
    });

    playerRef.current = player;

    const socket = player?.source?.socket;
    if (socket) {
      socket.addEventListener('message', event => {
        try {
          const data = JSON.parse(event.data);
          if (data.error && data.cameraId === camara.id) {
            console.error(`[Streaming Error] ${data.error}`);
            setLoading(false);
            setError(true);
          }
        } catch (_) {
          // Mensajes binarios
        }
      });

      socket.addEventListener('close', event => {
        if (event.code !== 1000) {
          console.error(`[Socket Close] Código ${event.code} para la cámara ${camara.id}`);
          setLoading(false);
          setError(true);
        }
      });
    }

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(timeout);
      try {
        playerRef.current?.destroy();
      } catch (e) {
        console.warn('Error destruyendo JSMpeg player:', e);
      }
      playerRef.current = null;
    };
  }, [camara.id]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;

    const fetchUltimoRegistro = () => {
      fetch(`${API_URL}/api/alpr-records?camera=${encodeURIComponent(camara.name)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setUltimoRegistro(data[0]);
          }
        })
        .catch(err => console.error('Error obteniendo último registro:', err));
    };

    fetchUltimoRegistro();
    const interval = setInterval(fetchUltimoRegistro, 5000);

    return () => clearInterval(interval);
  }, [camara.name]);

  const handleVerMas = () => {
    navigate('/registros', { state: { filterCamera: camara.name } });
  };

  return (
    <div className="popup-card">
      <h3 className="popup-title">{camara.name}</h3>
      <div className="popup-video">
        {loading && (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        )}
        {error && (
          <div className="error-message">
            Error al cargar el streaming.
          </div>
        )}
        <div ref={videoRef} className="video-feed" />
      </div>
      {ultimoRegistro ? (
        <div className="popup-latest">
          <div><strong>Matrícula:</strong> {ultimoRegistro.plate_number}</div>
          <div><strong>Marca:</strong> {ultimoRegistro.vehicle_make}</div>
          <div><strong>Modelo:</strong> {ultimoRegistro.vehicle_model}</div>
        </div>
      ) : (
        <div className="popup-latest">No hay registros disponibles</div>
      )}
      <button className="popup-button" onClick={handleVerMas}>Ver más registros</button>
    </div>
  );
}
