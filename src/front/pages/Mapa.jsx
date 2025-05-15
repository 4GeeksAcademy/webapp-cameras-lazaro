// src/pages/Mapa.jsx
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

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Mapa() {
  const [camaras, setCamaras] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setCamaras(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          console.error('Error al cargar cámaras:', await res.text());
          setCamaras([]);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error('Error al cargar las cámaras:', err);
        setCamaras([]);
      });
  }, []);

  if (loading) {
    return <p style={{ padding: '1rem' }}>Cargando cámaras…</p>;
  }

  return (
    <div className="content-container">
      <MapContainer
        center={[41.38879, 2.15899]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <ResizeMap />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {camaras.length > 0
          ? camaras.map(cam => {
            const lat = parseFloat(cam.location?.lat);
            const lng = parseFloat(cam.location?.lng);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker key={cam.id} position={[lat, lng]}>
                <Popup minWidth={300} maxWidth={300} closeButton={true}>
                  <PopupContent camara={cam} />
                </Popup>
              </Marker>
            );
          })
          : <p style={{ padding: '1rem' }}>No hay cámaras disponibles o hubo un error.</p>}
      </MapContainer>
    </div>
  );
}

function PopupContent({ camara }) {
  const videoRef = useRef();
  const playerRef = useRef();
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!videoRef.current) return;
    const host = window.location.host;
    const wsHost = host.replace(/-3000(\.|$)/, '-9999$1');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${wsHost}/stream/${camara.id}`;

    const player = new JSMpeg.VideoElement(videoRef.current, wsUrl, {
      autoplay: true,
      loop: true,
      disableGl: true,
      progressive: true
    });
    playerRef.current = player;

    return () => {
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
  }, [camara.name]);

  const handleVerMas = () => {
    navigate('/registros', { state: { filterCamera: camara.name } });
  };

  return (
    <div className="popup-card">
      <h3 className="popup-title">{camara.name}</h3>
      <div ref={videoRef} className="popup-video" />
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
